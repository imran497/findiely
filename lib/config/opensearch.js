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
    }
  },
  mappings: {
    properties: {
      id: {
        type: 'keyword'
      },
      name: {
        type: 'text',
        analyzer: 'standard',
        fields: {
          keyword: {
            type: 'keyword'
          }
        }
      },
      description: {
        type: 'text',
        analyzer: 'standard'
      },
      tags: {
        type: 'keyword'
      },
      url: {
        type: 'keyword'
      },
      created_at: {
        type: 'date'
      },
      embedding: {
        type: 'knn_vector',
        dimension: 384, // MiniLM embedding size
        method: {
          name: 'hnsw',
          space_type: 'cosinesimil',
          engine: 'nmslib',
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
