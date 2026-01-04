import { NextRequest, NextResponse } from 'next/server'
import indexingService from '@/lib/services/indexingService'

export async function POST(request: NextRequest) {
  try {
    console.log('==================== API /admin/reindex CALLED ====================')
    const body = await request.json()
    const { productId } = body

    console.log('[API /admin/reindex] Product ID:', productId)

    if (!productId) {
      console.log('[API /admin/reindex] ✗ Missing productId')
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Re-index the product
    console.log('[API /admin/reindex] Calling indexingService.reindexProduct...')
    const result = await indexingService.reindexProduct(productId)

    console.log('[API /admin/reindex] ✓ Re-indexing completed successfully')
    console.log('[API /admin/reindex] Changes detected:', result.changes)

    return NextResponse.json({
      success: true,
      product: result.product,
      changes: result.changes,
      message: 'Product re-indexed successfully'
    })

  } catch (error: any) {
    console.error('[API /admin/reindex] ✗ Error:', error)
    console.error('[API /admin/reindex] Error stack:', error.stack)

    return NextResponse.json(
      {
        error: error.message || 'Failed to re-index product',
        details: error.stack
      },
      { status: 500 }
    )
  }
}
