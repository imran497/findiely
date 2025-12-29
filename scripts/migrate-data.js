import { Client } from '@opensearch-project/opensearch';
import dotenv from 'dotenv';

dotenv.config();

const INDEX_NAME = process.env.OPENSEARCH_INDEX || 'indiesearch_products';

// Local OpenSearch
const localClient = new Client({
  node: 'http://localhost:9200',
  auth: {
    username: 'admin',
    password: 'admin'
  },
  ssl: {
    rejectUnauthorized: false
  }
});

// Production OpenSearch
const prodClient = new Client({
  node: process.env.OPENSEARCH_NODE,
  auth: {
    username: process.env.OPENSEARCH_USERNAME,
    password: process.env.OPENSEARCH_PASSWORD
  },
  ssl: {
    rejectUnauthorized: false
  }
});

async function migrateData() {
  try {
    console.log('📤 Exporting data from local OpenSearch...');

    // Get all documents from local
    const response = await localClient.search({
      index: INDEX_NAME,
      body: {
        size: 10000,
        query: {
          match_all: {}
        }
      }
    });

    const documents = response.body.hits.hits;
    console.log(`Found ${documents.length} products to migrate`);

    if (documents.length === 0) {
      console.log('No data to migrate!');
      return;
    }

    console.log('📥 Importing data to production OpenSearch...');

    // Bulk import to production
    const bulkBody = [];
    for (const doc of documents) {
      bulkBody.push({
        index: {
          _index: INDEX_NAME,
          _id: doc._id
        }
      });
      bulkBody.push(doc._source);
    }

    const bulkResponse = await prodClient.bulk({
      body: bulkBody
    });

    if (bulkResponse.body.errors) {
      console.error('❌ Some documents failed to import');
      const errors = bulkResponse.body.items
        .filter(item => item.index?.error)
        .map(item => item.index.error);
      console.error('Errors:', errors);
    } else {
      console.log(`✅ Successfully migrated ${documents.length} products!`);
    }

    // Verify count in production
    const countResponse = await prodClient.count({
      index: INDEX_NAME
    });
    console.log(`\n📊 Total products in production: ${countResponse.body.count}`);

  } catch (error) {
    console.error('❌ Migration error:', error.message);
    if (error.meta?.body) {
      console.error('Details:', JSON.stringify(error.meta.body, null, 2));
    }
  } finally {
    process.exit(0);
  }
}

migrateData();
