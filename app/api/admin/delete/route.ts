import { NextRequest, NextResponse } from 'next/server'
import client, { INDEX_NAME } from '@/lib/config/opensearch'

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId } = body

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Delete the product from OpenSearch
    await client.delete({
      index: INDEX_NAME,
      id: productId
    })

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete product' },
      { status: 500 }
    )
  }
}
