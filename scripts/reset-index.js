import client, { INDEX_NAME, INDEX_MAPPING } from '../lib/config/opensearch.js';

async function resetIndex() {
  try {
    console.log('🔄 Resetting OpenSearch index...');
    console.log('Index name:', INDEX_NAME);

    // Step 1: Check if index exists
    const indexExists = await client.indices.exists({
      index: INDEX_NAME
    });

    // Step 2: Delete index if it exists
    if (indexExists.body) {
      console.log('🗑️  Deleting existing index...');
      await client.indices.delete({
        index: INDEX_NAME
      });
      console.log('✅ Index deleted');
    } else {
      console.log('ℹ️  Index does not exist, creating new one...');
    }

    // Step 3: Create new index with updated mapping
    console.log('🏗️  Creating new index with updated mapping...');
    await client.indices.create({
      index: INDEX_NAME,
      body: INDEX_MAPPING
    });

    console.log('✅ Index created successfully!');
    console.log('');
    console.log('📋 Index mapping:');
    console.log(JSON.stringify(INDEX_MAPPING.mappings.properties.tags, null, 2));
    console.log('');
    console.log('✨ You can now re-index your products using the admin panel.');
    console.log('   Tags will now support partial matching on meaningful words.');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting index:', error.message);
    process.exit(1);
  }
}

resetIndex();
