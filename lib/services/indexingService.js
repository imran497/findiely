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
   * @param {string[]} params.tags - Optional tags
   * @param {string} params.description - Optional manual description override
   * @returns {Promise<Object>} - Indexed product document
   */
  async indexProduct({ url, tags = [], description = null }) {
    try {
      console.log('Indexing product from URL:', url);

      // Step 1: Validate URL
      const validatedUrl = scraperService.validateUrl(url);

      // Step 2: Fetch page content (includes auto-generated tags)
      const pageContent = await scraperService.fetchPageContent(validatedUrl);

      // Step 3: Merge auto-generated tags with manual tags
      const autoTags = pageContent.tags || [];
      const manualTags = Array.isArray(tags) ? tags : [];

      // Combine and deduplicate tags
      const combinedTags = [...new Set([...autoTags, ...manualTags])];

      // Expand tags using AI-powered semantic similarity
      const allTags = await tagExpander.expandTags(combinedTags);

      console.log('Auto-generated tags:', autoTags);
      if (manualTags.length > 0) {
        console.log('Manual tags:', manualTags);
      }
      console.log('Combined tags:', combinedTags);
      console.log('Final expanded tags:', allTags);

      // Step 4: Prepare product data
      const product = {
        id: randomUUID(),
        name: pageContent.name,
        description: description || pageContent.description || pageContent.fullText,
        tags: allTags,
        url: validatedUrl,
        created_at: new Date().toISOString()
      };

      // Step 5: Generate embedding from combined text
      const searchableText = embeddingService.createSearchableText(product);
      console.log('Generating embedding for:', searchableText.substring(0, 100) + '...');

      const embedding = await embeddingService.generateEmbedding(searchableText);

      // Step 6: Add embedding to product
      product.embedding = embedding;

      // Step 7: Index in OpenSearch
      const response = await client.index({
        index: INDEX_NAME,
        id: product.id,
        body: product,
        refresh: true // Make immediately searchable (use 'wait_for' in production)
      });

      console.log('Product indexed successfully:', product.id);

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
