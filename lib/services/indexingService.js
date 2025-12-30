import client, { INDEX_NAME } from '../config/opensearch.js';
import embeddingService from './embeddingService.js';
import scraperService from './scraperService.js';
import tagExpander from './tagExpander.js';
import { randomUUID } from 'crypto';

class IndexingService {
  /**
   * Index a product from URL with optional metadata
   * @param {Object} params - Indexing parameters
   * @param {string} params.url - Product URL (required)
   * @param {string} params.name - Optional manual product name (skips scraping if provided)
   * @param {string[]} params.tags - Optional tags
   * @param {string} params.description - Optional manual description override
   * @returns {Promise<Object>} - Indexed product document
   */
  async indexProduct({ url, name = null, tags = [], description = null }) {
    try {
      console.log('==================== INDEXING STARTED ====================');
      console.log('[INDEXING] URL:', url);
      console.log('[INDEXING] Manual name:', name ? 'Yes' : 'No');
      console.log('[INDEXING] Input tags:', tags);
      console.log('[INDEXING] Custom description:', description ? 'Yes' : 'No');

      // Step 1: Validate URL
      const validatedUrl = scraperService.validateUrl(url);
      console.log('[INDEXING] Validated URL:', validatedUrl);

      let pageContent;
      let autoTags = [];

      // Step 2: Fetch page content (skip if manual name provided)
      if (name && description) {
        console.log('[INDEXING] Using manual data, skipping scraping');
        pageContent = {
          name: name,
          description: description,
          tags: []
        };
      } else {
        console.log('[INDEXING] Fetching page content...');
        pageContent = await scraperService.fetchPageContent(validatedUrl);
        console.log('[INDEXING] Page content fetched:', {
          name: pageContent.name,
          descriptionLength: pageContent.description?.length || 0,
          autoTags: pageContent.tags || []
        });
        autoTags = pageContent.tags || [];
      }

      // Step 3: Merge auto-generated tags with manual tags
      const manualTags = Array.isArray(tags) ? tags : [];

      // Combine and deduplicate tags
      const combinedTags = [...new Set([...autoTags, ...manualTags])];

      console.log('[INDEXING] Tag merging:');
      console.log('  - Auto-generated tags:', autoTags);
      console.log('  - Manual tags:', manualTags);
      console.log('  - Combined tags (before expansion):', combinedTags);

      // Expand tags using AI-powered semantic similarity
      console.log('[INDEXING] Expanding tags with AI...');
      const allTags = await tagExpander.expandTags(combinedTags);
      console.log('[INDEXING] Final expanded tags:', allTags);

      // Step 4: Prepare product data
      const product = {
        id: randomUUID(),
        name: pageContent.name,
        description: description || pageContent.description || pageContent.fullText,
        tags: allTags,
        url: validatedUrl,
        created_at: new Date().toISOString()
      };

      console.log('[INDEXING] Product data prepared:', {
        id: product.id,
        name: product.name,
        descriptionLength: product.description?.length || 0,
        tagsCount: product.tags.length,
        tags: product.tags,
        url: product.url
      });

      // Step 5: Generate embedding from combined text
      const searchableText = embeddingService.createSearchableText(product);
      console.log('[INDEXING] Searchable text (first 200 chars):', searchableText.substring(0, 200) + '...');
      console.log('[INDEXING] Generating embedding...');

      const embedding = await embeddingService.generateEmbedding(searchableText);
      console.log('[INDEXING] Embedding generated, dimension:', embedding.length);

      // Step 6: Add embedding to product
      product.embedding = embedding;

      // Step 7: Index in OpenSearch
      console.log('[INDEXING] Indexing in OpenSearch...');
      const response = await client.index({
        index: INDEX_NAME,
        id: product.id,
        body: product,
        refresh: true // Make immediately searchable (use 'wait_for' in production)
      });

      console.log('[INDEXING] ✓ Product indexed successfully!');
      console.log('[INDEXING] Product ID:', product.id);
      console.log('[INDEXING] OpenSearch response:', response.body);
      console.log('==================== INDEXING COMPLETED ====================');

      // Return product without embedding (too large for response)
      const { embedding: _, ...productWithoutEmbedding } = product;

      return {
        success: true,
        product: productWithoutEmbedding,
        opensearchResponse: response.body
      };

    } catch (error) {
      console.error('Error indexing product:', error.message);
      throw error;
    }
  }

  /**
   * Bulk index multiple products
   * @param {Array} products - Array of product objects with url, tags, description
   * @returns {Promise<Object>} - Bulk indexing results
   */
  async bulkIndexProducts(products) {
    const results = {
      success: [],
      failed: []
    };

    for (const product of products) {
      try {
        const result = await this.indexProduct(product);
        results.success.push(result.product);
      } catch (error) {
        results.failed.push({
          url: product.url,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Update an existing product
   * @param {string} id - Product ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} - Update result
   */
  async updateProduct(id, updates) {
    try {
      // If updating text fields, regenerate embedding
      let updateDoc = { ...updates };

      // Expand tags if tags are being updated
      if (updates.tags) {
        updateDoc.tags = await tagExpander.expandTags(updates.tags);
        console.log('Tags expanded:', updates.tags, '→', updateDoc.tags);
      }

      if (updates.name || updates.description || updates.tags) {
        // Fetch current document
        const current = await client.get({
          index: INDEX_NAME,
          id: id
        });

        const merged = {
          ...current.body._source,
          ...updateDoc
        };

        const searchableText = embeddingService.createSearchableText(merged);
        const embedding = await embeddingService.generateEmbedding(searchableText);

        updateDoc.embedding = embedding;
      }

      const response = await client.update({
        index: INDEX_NAME,
        id: id,
        body: {
          doc: updateDoc
        },
        refresh: true
      });

      return {
        success: true,
        opensearchResponse: response.body
      };

    } catch (error) {
      console.error('Error updating product:', error.message);
      throw error;
    }
  }

  /**
   * Delete a product by ID
   * @param {string} id - Product ID
   * @returns {Promise<Object>} - Delete result
   */
  async deleteProduct(id) {
    try {
      const response = await client.delete({
        index: INDEX_NAME,
        id: id,
        refresh: true
      });

      return {
        success: true,
        opensearchResponse: response.body
      };

    } catch (error) {
      console.error('Error deleting product:', error.message);
      throw error;
    }
  }

  /**
   * Get a product by ID
   * @param {string} id - Product ID
   * @returns {Promise<Object>} - Product document
   */
  async getProduct(id) {
    try {
      const response = await client.get({
        index: INDEX_NAME,
        id: id
      });

      const product = response.body._source;
      const { embedding: _, ...productWithoutEmbedding } = product;

      return productWithoutEmbedding;

    } catch (error) {
      if (error.meta?.statusCode === 404) {
        throw new Error('Product not found');
      }
      throw error;
    }
  }
}

const indexingService = new IndexingService();

export default indexingService;
