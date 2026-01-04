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
   * @param {string} params.indexed_by - Who indexed this product: 'guest', 'admin', or '@twitter_username'
   * @param {string[]} params.categories - Optional categories
   * @returns {Promise<Object>} - Indexed product document
   */
  async indexProduct({ url, name = null, tags = [], description = null, indexed_by = 'guest', categories = [] }) {
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
        created_at: new Date().toISOString(),
        indexed_by: indexed_by,
        ...(categories && categories.length > 0 && { categories: categories }),
        ...(pageContent.twitter_creator && { twitter_creator: pageContent.twitter_creator }),
        ...(pageContent.twitter_site && { twitter_site: pageContent.twitter_site })
      };

      console.log('[INDEXING] Product data prepared:', {
        id: product.id,
        name: product.name,
        descriptionLength: product.description?.length || 0,
        tagsCount: product.tags.length,
        tags: product.tags,
        url: product.url,
        twitter_creator: product.twitter_creator || 'None',
        twitter_site: product.twitter_site || 'None',
        indexed_by: product.indexed_by
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

  /**
   * Re-index/refresh a product by re-scraping its URL
   * @param {string} id - Product ID to reindex
   * @returns {Promise<Object>} - Updated product document
   */
  async reindexProduct(id) {
    try {
      console.log('==================== RE-INDEXING STARTED ====================');
      console.log('[REINDEX] Product ID:', id);

      // Step 1: Get existing product
      const currentProduct = await this.getProduct(id);
      console.log('[REINDEX] Current product:', {
        name: currentProduct.name,
        url: currentProduct.url,
        tagsCount: currentProduct.tags?.length || 0
      });

      const url = currentProduct.url;

      // Step 2: Validate URL
      const validatedUrl = scraperService.validateUrl(url);
      console.log('[REINDEX] Validated URL:', validatedUrl);

      // Step 3: Re-scrape page content
      console.log('[REINDEX] Re-scraping page content...');
      const pageContent = await scraperService.fetchPageContent(validatedUrl);
      console.log('[REINDEX] Fresh content scraped:', {
        name: pageContent.name,
        descriptionLength: pageContent.description?.length || 0,
        autoTags: pageContent.tags || [],
        twitter_creator: pageContent.twitter_creator || 'None'
      });

      // Step 4: Use scraped tags (don't keep old manual tags on reindex)
      const autoTags = pageContent.tags || [];

      // Step 5: Expand tags using AI
      console.log('[REINDEX] Expanding fresh tags...');
      const expandedTags = await tagExpander.expandTags(autoTags);
      console.log('[REINDEX] Expanded tags:', expandedTags);

      // Step 6: Prepare updated product data
      const updatedProduct = {
        id: currentProduct.id,  // Keep same ID
        name: pageContent.name,
        description: pageContent.description || pageContent.fullText,
        tags: expandedTags,
        url: validatedUrl,
        created_at: currentProduct.created_at,  // Keep original created date
        updated_at: new Date().toISOString(),   // Add update timestamp
        ...(pageContent.twitter_creator && { twitter_creator: pageContent.twitter_creator }),
        ...(pageContent.twitter_site && { twitter_site: pageContent.twitter_site })
      };

      console.log('[REINDEX] Updated product data:', {
        name: updatedProduct.name,
        tagsCount: updatedProduct.tags.length,
        tags: updatedProduct.tags,
        twitter_creator: updatedProduct.twitter_creator || 'None'
      });

      // Step 7: Generate fresh embedding
      const searchableText = embeddingService.createSearchableText(updatedProduct);
      console.log('[REINDEX] Generating fresh embedding...');
      const embedding = await embeddingService.generateEmbedding(searchableText);
      console.log('[REINDEX] Embedding generated, dimension:', embedding.length);

      updatedProduct.embedding = embedding;

      // Step 8: Update in OpenSearch
      console.log('[REINDEX] Updating in OpenSearch...');
      const response = await client.index({
        index: INDEX_NAME,
        id: id,
        body: updatedProduct,
        refresh: true
      });

      console.log('[REINDEX] ✓ Product re-indexed successfully!');
      console.log('[REINDEX] Changes:', {
        oldName: currentProduct.name,
        newName: updatedProduct.name,
        oldTagsCount: currentProduct.tags?.length || 0,
        newTagsCount: updatedProduct.tags.length
      });
      console.log('==================== RE-INDEXING COMPLETED ====================');

      // Return product without embedding
      const { embedding: _, ...productWithoutEmbedding } = updatedProduct;

      return {
        success: true,
        product: productWithoutEmbedding,
        changes: {
          name: currentProduct.name !== updatedProduct.name,
          tags: JSON.stringify(currentProduct.tags) !== JSON.stringify(updatedProduct.tags),
          description: currentProduct.description !== updatedProduct.description,
          twitter_creator: currentProduct.twitter_creator !== updatedProduct.twitter_creator
        },
        opensearchResponse: response.body
      };

    } catch (error) {
      console.error('[REINDEX] ✗ Error re-indexing product:', error.message);
      console.error('[REINDEX] Stack trace:', error.stack);
      throw error;
    }
  }
}

const indexingService = new IndexingService();

export default indexingService;
