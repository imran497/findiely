import { NextRequest, NextResponse } from 'next/server'
import client, { INDEX_NAME, INDEX_MAPPING } from '@/lib/config/opensearch'

export async function POST(request: NextRequest) {
  try {
    console.log('[ADMIN] Resetting OpenSearch index...')
    console.log('[ADMIN] Index name:', INDEX_NAME)

    // Step 1: Check if index exists
    const indexExists = await client.indices.exists({
      index: INDEX_NAME
    })

    // Step 2: Delete index if it exists
    if (indexExists.body) {
      console.log('[ADMIN] Deleting existing index...')
      await client.indices.delete({
        index: INDEX_NAME
      })
      console.log('[ADMIN] Index deleted')
    } else {
      console.log('[ADMIN] Index does not exist, creating new one...')
    }

    // Step 3: Create new index with updated mapping
    console.log('[ADMIN] Creating new index with updated mapping...')
    await client.indices.create({
      index: INDEX_NAME,
      body: INDEX_MAPPING
    })

    console.log('[ADMIN] Index created successfully!')

    return NextResponse.json({
      success: true,
      message: 'Index reset successfully',
      details: {
        indexName: INDEX_NAME,
        tagsMapping: INDEX_MAPPING.mappings.properties.tags,
        note: 'Tags now support partial matching on meaningful words (stop words are removed)'
      }
    })

  } catch (error: any) {
    console.error('[ADMIN] Error resetting index:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to reset index',
        details: error.meta?.body || error.stack
      },
      { status: 500 }
    )
  }
}
