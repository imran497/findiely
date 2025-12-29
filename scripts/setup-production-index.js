import { Client } from '@opensearch-project/opensearch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local from parent directory
dotenv.config({ path: join(__dirname, '..', '.env.local') });

// Use production OpenSearch credentials
const client = new Client({
  node: process.env.OPENSEARCH_NODE,
  auth: {
    username: process.env.OPENSEARCH_USERNAME,
    password: process.env.OPENSEARCH_PASSWORD
  },
  ssl: {
    rejectUnauthorized: false
  }
});

const INDEX_NAME = process.env.OPENSEARCH_INDEX || 'indiesearch_products';

const INDEX_MAPPING = {
  settings: {
    index: {
      number_of_shards: 1,
      number_of_replicas: 0,
      "knn": true,
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
        dimension: 384,
        method: {
          name: 'hnsw',
          space_type: 'cosinesimil',
          engine: 'lucene',
          parameters: {
            ef_construction: 128,
            m: 24
          }
        }
      }
    }
  }
};

async function setupIndex() {
  try {
    console.log('Connecting to OpenSearch...');

    // Check if index already exists
    const indexExists = await client.indices.exists({ index: INDEX_NAME });

    if (indexExists.body) {
      console.log(`Index '${INDEX_NAME}' already exists!`);
      const answer = await new Promise((resolve) => {
        process.stdout.write('Do you want to delete and recreate it? (yes/no): ');
        process.stdin.once('data', (data) => resolve(data.toString().trim()));
      });

      if (answer.toLowerCase() === 'yes') {
        console.log('Deleting existing index...');
        await client.indices.delete({ index: INDEX_NAME });
        console.log('Index deleted.');
      } else {
        console.log('Keeping existing index. Exiting...');
        process.exit(0);
      }
    }

    console.log(`Creating index '${INDEX_NAME}'...`);
    await client.indices.create({
      index: INDEX_NAME,
      body: INDEX_MAPPING
    });

    console.log('✅ Index created successfully!');
    console.log('\nNext steps:');
    console.log('1. Export data from local OpenSearch');
    console.log('2. Import data to production');
    console.log('3. Deploy your Next.js app');

  } catch (error) {
    console.error('❌ Error setting up index:', error.message);
    if (error.meta?.body) {
      console.error('Details:', JSON.stringify(error.meta.body, null, 2));
    }
  } finally {
    process.exit(0);
  }
}

setupIndex();
