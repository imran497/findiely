import { NextRequest, NextResponse } from 'next/server'
import indexingService from '@/lib/services/indexingService'
import searchService from '@/lib/services/searchService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    let { url, customTags, categories } = body

    console.log('[ADMIN INDEX] Request:', { url, customTags, categories })

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Validate and normalize URL to root domain only
    try {
      const urlObj = new URL(url)

      if (urlObj.pathname !== '/' && urlObj.pathname !== '') {
        return NextResponse.json(
          { error: 'Only root domain URLs are allowed (e.g., https://example.com)' },
          { status: 400 }
        )
      }

      if (urlObj.search) {
        return NextResponse.json(
          { error: 'Only root domain URLs are allowed. Please remove query parameters.' },
          { status: 400 }
        )
      }

      url = `${urlObj.protocol}//${urlObj.hostname.toLowerCase()}`
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Check for duplicate URL
    const existingProducts = await searchService.searchByUrl(url)
    if (existingProducts && existingProducts.length > 0) {
      return NextResponse.json(
        { error: 'This product URL is already indexed' },
        { status: 409 }
      )
    }

    // Index the product with indexed_by set to 'admin'
    const indexingParams = {
      url,
      tags: customTags && Array.isArray(customTags) ? customTags.slice(0, 15) : [],
      categories: categories && Array.isArray(categories) ? categories.slice(0, 5) : [],
      indexed_by: 'admin'
    }

    console.log('[ADMIN INDEX] Indexing product as admin...')
    const result = await indexingService.indexProduct(indexingParams)

    console.log('[ADMIN INDEX] Product indexed successfully:', result.product.id)

    return NextResponse.json({
      success: true,
      product: result,
    })
  } catch (error: any) {
    console.error('[ADMIN INDEX] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to index product' },
      { status: 500 }
    )
  }
}
