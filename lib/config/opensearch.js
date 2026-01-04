import { Client } from '@opensearch-project/opensearch';
import dotenv from 'dotenv';

dotenv.config();

// OpenSearch client configuration
const client = new Client({
  node: process.env.OPENSEARCH_NODE || 'http://localhost:9200',
  auth: {
    username: process.env.OPENSEARCH_USERNAME || 'admin',
    password: process.env.OPENSEARCH_PASSWORD || 'admin'
  },
  ssl: {
    rejectUnauthorized: false // For development only - use proper certificates in production
  }
});

export const INDEX_NAME = process.env.OPENSEARCH_INDEX || 'indiesearch_products';

// Index mapping with vector field for semantic search
export const INDEX_MAPPING = {
  settings: {
    index: {
      number_of_shards: 1,
      number_of_replicas: 0, // Single node setup for MVP
      "knn": true, // Enable k-NN plugin
      "knn.algo_param.ef_search": 100
    },
    analysis: {
      analyzer: {
        custom_text_analyzer: {
          type: 'custom',
          tokenizer: 'standard',
          filter: ['lowercase', 'english_stop', 'english_stemmer']
        }
      },
      filter: {
        english_stop: {
          type: 'stop',
          stopwords: '_english_'
        },
        english_stemmer: {
          type: 'stemmer',
          language: 'english'
        }
      }
    }
  },
  mappings: {
    properties: {
      id: {
        type: 'keyword'
      },
      name: {
        type: 'text',
        analyzer: 'custom_text_analyzer',
        fields: {
          keyword: {
            type: 'keyword'
          }
        }
      },
      description: {
        type: 'text',
        analyzer: 'custom_text_analyzer'
      },
      tags: {
        type: 'text',
        analyzer: 'custom_text_analyzer',  // Tokenizes, lowercases, removes stop words, applies stemming
        fields: {
          keyword: {
            type: 'keyword'     // Keep exact matching capability
          }
        }
      },
      categories: {
        type: 'text',
        fields: {
          keyword: {
            type: 'keyword'     // For exact category filtering
          }
        }
      },
      url: {
        type: 'keyword'
      },
      created_at: {
        type: 'date'
      },
      twitter_creator: {
        type: 'keyword'
      },
      twitter_site: {
        type: 'keyword'
      },
      indexed_by: {
        type: 'keyword'  // Values: 'guest', 'admin', or '@twitter_username'
      },
      updated_at: {
        type: 'date'
      },
      embedding: {
        type: 'knn_vector',
        dimension: 384, // MiniLM embedding size
        method: {
          name: 'hnsw',
          space_type: 'cosinesimil',
          engine: 'lucene', // Using lucene for OpenSearch 3.x compatibility
          parameters: {
            ef_construction: 128,
            m: 24
          }
        }
      }
    }
  }
};

export default client;
