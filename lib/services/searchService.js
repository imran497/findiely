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
      console.log('Performing hybrid search for:', query, 'offset:', offset);

      // Step 1: Generate embedding for query
      const queryEmbedding = await embeddingService.generateEmbedding(query);

      // Step 2: Calculate weights
      const keywordWeight = 1.2; // Increased keyword weight for better multi-field matching

      // Step 3: Build hybrid search query
      const searchBody = {
        from: offset,
        size: limit,
        min_score: 1.5, // Filter out low-relevance results
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

      // Step 4: Execute search
      const response = await client.search({
        index: INDEX_NAME,
        body: searchBody
      });

      // Step 5: Format results
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
