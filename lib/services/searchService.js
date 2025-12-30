import client, { INDEX_NAME } from '../config/opensearch.js';
import embeddingService from './embeddingService.js';

class SearchService {
  /**
   * Perform hybrid search (vector + keyword)
   * @param {Object} params - Search parameters
   * @param {string} params.query - Search query text
   * @param {number} params.limit - Number of results to return (default: 20)
   * @param {number} params.offset - Number of results to skip (default: 0)
   * @param {string[]} params.tags - Filter by tags (optional)
   * @param {number} params.vectorWeight - Weight for vector search (0-1, default: 0.7)
   * @returns {Promise<Object>} - Search results
   */
  async hybridSearch({ query, limit = 20, offset = 0, tags = null, vectorWeight = 0.7 }) {
    try {
      console.log('==================== SEARCH STARTED ====================');
      console.log('[SEARCH] Query:', query);
      console.log('[SEARCH] Limit:', limit, 'Offset:', offset);
      console.log('[SEARCH] Tag filters:', tags);
      console.log('[SEARCH] Vector weight:', vectorWeight);

      // Step 1: Generate embedding for query
      console.log('[SEARCH] Generating query embedding...');
      const queryEmbedding = await embeddingService.generateEmbedding(query);
      console.log('[SEARCH] Query embedding generated, dimension:', queryEmbedding.length);

      // Step 2: Calculate weights
      const keywordWeight = 1.2; // Increased keyword weight for better multi-field matching
      console.log('[SEARCH] Keyword weight:', keywordWeight);

      // Step 3: Build hybrid search query
      const searchBody = {
        from: offset,
        size: limit,
        min_score: 1, // Filter out low-relevance results (balanced for quality and recall)
        query: {
          bool: {
            should: [
              // Vector similarity search (k-NN)
              {
                script_score: {
                  query: { match_all: {} },
                  script: {
                    source: "knn_score",
                    lang: "knn",
                    params: {
                      field: "embedding",
                      query_value: queryEmbedding,
                      space_type: "cosinesimil"
                    }
                  },
                  boost: vectorWeight
                }
              },
              // Keyword search (BM25)
              {
                multi_match: {
                  query: query,
                  fields: ['name^1.2', 'description^2.5', 'tags^1.5'], // Heavily favor description richness
                  type: 'most_fields', // Most_fields sums scores across all matching fields
                  boost: keywordWeight,
                  fuzziness: 'AUTO'
                }
              }
            ],
            minimum_should_match: 1,
            // Optional tag filter
            ...(tags && tags.length > 0 ? {
              filter: [
                {
                  terms: {
                    tags: tags
                  }
                }
              ]
            } : {})
          }
        },
        // Don't return embedding vector in results
        _source: {
          excludes: ['embedding']
        }
      };

      console.log('[SEARCH] Search query body:', JSON.stringify(searchBody, null, 2));

      // Step 4: Execute search
      console.log('[SEARCH] Executing OpenSearch query...');
      const response = await client.search({
        index: INDEX_NAME,
        body: searchBody
      });

      console.log('[SEARCH] OpenSearch response:', {
        took: response.body.took,
        totalHits: response.body.hits.total.value,
        maxScore: response.body.hits.max_score,
        hitsCount: response.body.hits.hits.length
      });

      // Step 5: Format results
      const results = response.body.hits.hits.map(hit => ({
        id: hit._id,
        score: hit._score,
        ...hit._source
      }));

      console.log('[SEARCH] Results formatted:', results.length, 'products');
      if (results.length > 0) {
        console.log('[SEARCH] Top result:', {
          id: results[0].id,
          name: results[0].name,
          score: results[0].score,
          tags: results[0].tags
        });
      }
      console.log('==================== SEARCH COMPLETED ====================');

      return {
        query: query,
        total: response.body.hits.total.value,
        results: results,
        took: response.body.took
      };

    } catch (error) {
      console.error('Error performing hybrid search:', error.message);
      throw error;
    }
  }

  /**
   * Perform pure vector search (semantic only)
   * @param {Object} params - Search parameters
   * @param {string} params.query - Search query text
   * @param {number} params.limit - Number of results
   * @returns {Promise<Object>} - Search results
   */
  async vectorSearch({ query, limit = 20 }) {
    try {
      const queryEmbedding = await embeddingService.generateEmbedding(query);

      const searchBody = {
        size: limit,
        query: {
          script_score: {
            query: { match_all: {} },
            script: {
              source: "knn_score",
              lang: "knn",
              params: {
                field: "embedding",
                query_value: queryEmbedding,
                space_type: "cosinesimil"
              }
            }
          }
        },
        _source: {
          excludes: ['embedding']
        }
      };

      const response = await client.search({
        index: INDEX_NAME,
        body: searchBody
      });

      const results = response.body.hits.hits.map(hit => ({
        id: hit._id,
        score: hit._score,
        ...hit._source
      }));

      return {
        query: query,
        total: response.body.hits.total.value,
        results: results,
        took: response.body.took
      };

    } catch (error) {
      console.error('Error performing vector search:', error.message);
      throw error;
    }
  }

  /**
   * Perform keyword-only search (BM25)
   * @param {Object} params - Search parameters
   * @param {string} params.query - Search query text
   * @param {number} params.limit - Number of results
   * @returns {Promise<Object>} - Search results
   */
  async keywordSearch({ query, limit = 20 }) {
    try {
      const searchBody = {
        size: limit,
        query: {
          multi_match: {
            query: query,
            fields: ['name^3', 'description^2', 'tags^1.5'],
            type: 'best_fields',
            fuzziness: 'AUTO'
          }
        },
        _source: {
          excludes: ['embedding']
        }
      };

      const response = await client.search({
        index: INDEX_NAME,
        body: searchBody
      });

      const results = response.body.hits.hits.map(hit => ({
        id: hit._id,
        score: hit._score,
        ...hit._source
      }));

      return {
        query: query,
        total: response.body.hits.total.value,
        results: results,
        took: response.body.took
      };

    } catch (error) {
      console.error('Error performing keyword search:', error.message);
      throw error;
    }
  }

  /**
   * Get similar products to a given product ID
   * @param {string} productId - Product ID
   * @param {number} limit - Number of similar products to return
   * @returns {Promise<Object>} - Similar products
   */
  async findSimilar(productId, limit = 10) {
    try {
      // Get the product's embedding
      const product = await client.get({
        index: INDEX_NAME,
        id: productId,
        _source: ['embedding']
      });

      const embedding = product.body._source.embedding;

      const searchBody = {
        size: limit + 1, // +1 to exclude the source product
        query: {
          script_score: {
            query: { match_all: {} },
            script: {
              source: "knn_score",
              lang: "knn",
              params: {
                field: "embedding",
                query_value: embedding,
                space_type: "cosinesimil"
              }
            }
          }
        },
        _source: {
          excludes: ['embedding']
        }
      };

      const response = await client.search({
        index: INDEX_NAME,
        body: searchBody
      });

      // Filter out the source product itself
      const results = response.body.hits.hits
        .filter(hit => hit._id !== productId)
        .slice(0, limit)
        .map(hit => ({
          id: hit._id,
          score: hit._score,
          ...hit._source
        }));

      return {
        productId: productId,
        total: results.length,
        results: results
      };

    } catch (error) {
      console.error('Error finding similar products:', error.message);
      throw error;
    }
  }

  /**
   * Search for products by exact URL
   * @param {string} url - URL to search for
   * @returns {Promise<Array>} - Array of matching products
   */

  /**
   * Search for products by exact URL
   * @param {string} url - URL to search for
   * @returns {Promise<Array>} - Array of matching products
   */
  async searchByUrl(url) {
    try {
      // Search for both with and without trailing slash
      const urlWithSlash = url.endsWith('/') ? url : url + '/';
      const urlWithoutSlash = url.endsWith('/') ? url.slice(0, -1) : url;

      const response = await client.search({
        index: INDEX_NAME,
        body: {
          query: {
            bool: {
              should: [
                { term: { 'url': url } },
                { term: { 'url': urlWithSlash } },
                { term: { 'url': urlWithoutSlash } }
              ],
              minimum_should_match: 1
            }
          }
        }
      });

      return response.body.hits.hits.map(hit => ({
        id: hit._id,
        ...hit._source,
      }));
    } catch (error) {
      console.error('Error searching by URL:', error);
      return [];
    }
  }
}
const searchService = new SearchService();

export default searchService;
