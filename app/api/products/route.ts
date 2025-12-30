import { NextRequest, NextResponse } from 'next/server'
import scraperService from '@/lib/services/scraperService'
import indexingService from '@/lib/services/indexingService'
import searchService from '@/lib/services/searchService'

export async function POST(request: NextRequest) {
  try {
    console.log('==================== API /products POST CALLED ====================')
    const body = await request.json()
    let { url, customTags, manualData } = body

    console.log('[API /products] Request body:', {
      url,
      customTags,
      hasManualData: !!manualData
    })

    if (!url) {
      console.log('[API /products] ✗ Missing URL')
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Validate manual data if provided
    if (manualData && (!manualData.name || !manualData.description)) {
      return NextResponse.json(
        { error: 'Manual data must include name and description' },
        { status: 400 }
      )
    }

    // Validate and normalize URL to root domain only
    console.log('[API /products] Validating and normalizing URL...')
    try {
      const urlObj = new URL(url)

      // Check if URL has a path (other than just /)
      if (urlObj.pathname !== '/' && urlObj.pathname !== '') {
        console.log('[API /products] ✗ URL has path:', urlObj.pathname)
        return NextResponse.json(
          { error: 'Only root domain URLs are allowed (e.g., https://example.com). Please remove any paths.' },
          { status: 400 }
        )
      }

      // Check if URL has query parameters
      if (urlObj.search) {
        console.log('[API /products] ✗ URL has query parameters:', urlObj.search)
        return NextResponse.json(
          { error: 'Only root domain URLs are allowed. Please remove query parameters.' },
          { status: 400 }
        )
      }

      // Normalize URL: remove trailing slash and use lowercase
      url = `${urlObj.protocol}//${urlObj.hostname.toLowerCase()}`
      console.log('[API /products] Normalized URL:', url)
    } catch (error) {
      console.log('[API /products] ✗ Invalid URL format:', error)
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Check for duplicate URL
    console.log('[API /products] Checking for duplicate URL:', url)
    const existingProducts = await searchService.searchByUrl(url)
    console.log('[API /products] Existing products found:', existingProducts?.length || 0)

    if (existingProducts && existingProducts.length > 0) {
      console.log('[API /products] ✗ Duplicate detected:', url)
      return NextResponse.json(
        { error: 'This product URL is already indexed' },
        { status: 409 }
      )
    }

    // Prepare indexing parameters
    let indexingParams: any = { url }

    // If manual data is provided, skip scraping in indexing service
    if (manualData) {
      console.log('[API /products] Using manual data for:', url)
      console.log('[API /products] Manual data:', {
        name: manualData.name,
        descriptionLength: manualData.description?.length || 0
      })

      // Use manual data - indexing service will skip scraping
      indexingParams = {
        url,
        name: manualData.name,
        description: manualData.description,
        tags: customTags && Array.isArray(customTags) ? customTags.slice(0, 15) : []
      }
    } else {
      // Auto-scraping mode - just pass url and custom tags
      console.log('[API /products] Auto-scraping mode')
      indexingParams = {
        url,
        tags: customTags && Array.isArray(customTags) ? customTags.slice(0, 15) : []
      }
    }

    // Index the product
    console.log('[API /products] Indexing product in OpenSearch...')
    console.log('[API /products] Indexing params:', {
      url: indexingParams.url,
      hasManualName: !!indexingParams.name,
      tagsCount: indexingParams.tags?.length || 0
    })

    const result = await indexingService.indexProduct(indexingParams)

    console.log('[API /products] ✓ Product indexed successfully!')
    console.log('[API /products] Result:', {
      productId: result.product.id,
      productName: result.product.name
    })

    return NextResponse.json({
      success: true,
      product: result,
    })
  } catch (error: any) {
    console.error('[API /products] ✗ Error indexing product:', error)
    console.error('[API /products] Error stack:', error.stack)
    return NextResponse.json(
      { error: error.message || 'Failed to index product' },
      { status: 500 }
    )
  }
}
