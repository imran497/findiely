import client, { INDEX_NAME, INDEX_MAPPING } from '../config/opensearch.js';

async function setupIndex() {
  try {
    console.log(`Setting up OpenSearch index: ${INDEX_NAME}`);

    // Check if index exists
    const indexExists = await client.indices.exists({ index: INDEX_NAME });

    if (indexExists.body) {
      console.log(`Index ${INDEX_NAME} already exists. Deleting...`);
      await client.indices.delete({ index: INDEX_NAME });
      console.log(`Index ${INDEX_NAME} deleted.`);
    }

    // Create index with mapping
    const response = await client.indices.create({
      index: INDEX_NAME,
      body: INDEX_MAPPING
    });

    console.log(`Index ${INDEX_NAME} created successfully:`, response.body);

    // Verify index creation
    const health = await client.cluster.health({ index: INDEX_NAME });
    console.log('Index health:', health.body);

    process.exit(0);
  } catch (error) {
    console.error('Error setting up index:', error.message);
    if (error.meta) {
      console.error('Error details:', JSON.stringify(error.meta, null, 2));
    }
    process.exit(1);
  }
}

setupIndex();
