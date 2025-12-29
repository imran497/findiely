import client, { INDEX_NAME } from '../lib/config/opensearch.js';
import scraperService from '../lib/services/scraperService.js';
import embeddingService from '../lib/services/embeddingService.js';

async function updateProductDescriptions() {
  console.log('Fetching all products...\n');

  // Get all products
  const response = await client.search({
    index: INDEX_NAME,
    body: {
      size: 1000,
      query: { match_all: {} },
      _source: ['name', 'url', 'description', 'tags']
    }
  });

  const products = response.body.hits.hits;
  console.log(`Found ${products.length} products\n`);

  let updated = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const currentDescLength = product._source.description?.length || 0;

    // Skip if description is already long enough (probably already scraped)
    if (currentDescLength > 100) {
      skipped++;
      console.log(`[${i + 1}/${products.length}] ✓ Skipping ${product._source.name} (already has good description)`);
      continue;
    }

    console.log(`[${i + 1}/${products.length}] Updating: ${product._source.name}`);
    console.log(`  Current desc: "${product._source.description?.substring(0, 50)}..."`);

    try {
      // Scrape fresh data
      const scrapedData = await scraperService.fetchPageContent(product._source.url);

      console.log(`  New desc: "${scrapedData.description.substring(0, 50)}..."`);
      console.log(`  Length: ${currentDescLength} → ${scrapedData.description.length}`);

      // Generate new embedding with updated description
      const embeddingText = `${scrapedData.name} ${scrapedData.description}`;
      const embedding = await embeddingService.generateEmbedding(embeddingText);

      // Update the product
      await client.update({
        index: INDEX_NAME,
        id: product._id,
        body: {
          doc: {
            name: scrapedData.name,
            description: scrapedData.description,
            tags: scrapedData.tags,
            embedding: embedding
          }
        }
      });

      updated++;
      console.log(`  ✓ Updated successfully\n`);

      // Small delay to avoid overwhelming websites
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      failed++;
      console.error(`  ✗ Error: ${error.message}\n`);
    }
  }

  console.log('\n=== Update Complete ===');
  console.log(`Updated: ${updated} products`);
  console.log(`Skipped: ${skipped} products (already good)`);
  console.log(`Failed: ${failed} products`);
  console.log(`Total: ${products.length} products`);
}

// Run the update
updateProductDescriptions()
  .then(() => {
    console.log('\nAll done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
