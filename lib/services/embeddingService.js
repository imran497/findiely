// Use HuggingFace Inference API for serverless compatibility
const HUGGINGFACE_API_URL = 'https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction';

class EmbeddingService {
  constructor() {
    this.modelName = 'sentence-transformers/all-MiniLM-L6-v2'; // 384-dimensional embeddings
  }

  /**
   * Generate embedding for a single text using HuggingFace API
   * @param {string} text - Text to embed
   * @returns {Promise<number[]>} - 384-dimensional embedding vector
   */
  async generateEmbedding(text) {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid text input for embedding generation');
    }

    try {
      const headers = {
        'Content-Type': 'application/json',
      };

      // Add auth token if available
      if (process.env.HUGGINGFACE_TOKEN) {
        headers['Authorization'] = `Bearer ${process.env.HUGGINGFACE_TOKEN}`;
      }

      const response = await fetch(HUGGINGFACE_API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          inputs: text,
          options: {
            wait_for_model: true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HuggingFace API error: ${response.statusText}`);
      }

      const embedding = await response.json();

      // HF API returns the embedding directly as an array
      return embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
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
