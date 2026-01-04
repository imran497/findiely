import { NextRequest, NextResponse } from 'next/server'
import client, { INDEX_NAME } from '@/lib/config/opensearch.js'

export async function POST(request: NextRequest) {
  try {
    console.log('[MIGRATION] Starting migration to add indexed_by field...')

    // Get all documents
    const response = await client.search({
      index: INDEX_NAME,
      body: {
        size: 10000, // Adjust based on your needs
        query: {
          match_all: {}
        }
      }
    })

    const products = response.body.hits.hits
    console.log(`[MIGRATION] Found ${products.length} products to migrate`)

    let updated = 0
    let skipped = 0
    const errors = []

    // Update each product that doesn't have indexed_by field or has it empty/null
    for (const hit of products) {
      const product = hit._source
      const productId = hit._id

      console.log(`[MIGRATION] Checking product ${productId}:`, {
        name: product.name,
        url: product.url,
        hasIndexedBy: 'indexed_by' in product,
        indexedByValue: product.indexed_by,
        twitterCreator: product.twitter_creator
      })

      // Skip if already has a valid indexed_by field (not null, not empty)
      if (product.indexed_by && product.indexed_by.trim() !== '') {
        console.log(`[MIGRATION] Skipping ${productId} - already has indexed_by: ${product.indexed_by}`)
        skipped++
        continue
      }

      try {
        // Set indexed_by to 'guest' for existing products without this field
        // Infer from twitter_creator if available
        const indexed_by = product.twitter_creator ? `@${product.twitter_creator}` : 'guest'

        await client.update({
          index: INDEX_NAME,
          id: productId,
          body: {
            doc: {
              indexed_by: indexed_by
            }
          },
          refresh: true
        })

        updated++
        console.log(`[MIGRATION] ✓ Updated product ${productId} with indexed_by: ${indexed_by}`)
      } catch (error) {
        console.error(`[MIGRATION] ✗ Error updating product ${productId}:`, error)
        errors.push({ productId, error: error.message })
      }
    }

    console.log('[MIGRATION] Migration completed!')
    console.log(`[MIGRATION] Updated: ${updated}, Skipped: ${skipped}, Errors: ${errors.length}`)

    return NextResponse.json({
      success: true,
      message: 'Migration completed',
      stats: {
        total: products.length,
        updated,
        skipped,
        errors: errors.length
      },
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error: any) {
    console.error('[MIGRATION] Migration failed:', error)
    return NextResponse.json(
      {
        error: error.message || 'Migration failed',
        details: error.stack
      },
      { status: 500 }
    )
  }
}
