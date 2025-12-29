import { pipeline } from '@xenova/transformers';

class EmbeddingService {
  constructor() {
    this.model = null;
    this.modelName = 'Xenova/all-MiniLM-L6-v2'; // 384-dimensional embeddings
    this.initPromise = null;
  }

  /**
   * Initialize the embedding model (lazy loading)
   */
  async initialize() {
    if (this.model) {
      return this.model;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    console.log('Loading embedding model:', this.modelName);
    this.initPromise = pipeline('feature-extraction', this.modelName);

    try {
      this.model = await this.initPromise;
      console.log('Embedding model loaded successfully');
      return this.model;
    } catch (error) {
      console.error('Error loading embedding model:', error);
      this.initPromise = null;
      throw error;
    }
  }

  /**
   * Generate embedding for a single text
   * @param {string} text - Text to embed
   * @returns {Promise<number[]>} - 384-dimensional embedding vector
   */
  async generateEmbedding(text) {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid text input for embedding generation');
    }

    await this.initialize();

    // Generate embedding
    const output = await this.model(text, { pooling: 'mean', normalize: true });

    // Convert to regular array
    const embedding = Array.from(output.data);

    return embedding;
  }

  /**
   * Generate embeddings for multiple texts (batch processing)
   * @param {string[]} texts - Array of texts to embed
   * @returns {Promise<number[][]>} - Array of embedding vectors
   */
  async generateEmbeddings(texts) {
    if (!Array.isArray(texts)) {
      throw new Error('Input must be an array of texts');
    }

    const embeddings = await Promise.all(
      texts.map(text => this.generateEmbedding(text))
    );

    return embeddings;
  }

  /**
   * Create a searchable text from product data
   * @param {Object} product - Product object with name, description, tags
   * @returns {string} - Combined searchable text
   */
  createSearchableText(product) {
    const parts = [];

    if (product.name) {
      parts.push(product.name);
    }

    if (product.description) {
      parts.push(product.description);
    }

    if (product.tags && Array.isArray(product.tags)) {
      parts.push(product.tags.join(' '));
    }

    return parts.join(' ').trim();
  }
}

// Singleton instance
const embeddingService = new EmbeddingService();

export default embeddingService;
