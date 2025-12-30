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

    let productData: any

    // If manual data is provided, use it instead of scraping
    if (manualData) {
      console.log('[API /products] Using manual data for:', url)
      console.log('[API /products] Manual data:', {
        name: manualData.name,
        descriptionLength: manualData.description?.length || 0
      })

      // Use manual data
      const tags = customTags && Array.isArray(customTags) ? customTags.slice(0, 15) : []

      productData = {
        name: manualData.name,
        description: manualData.description,
        tags,
        url,
        hasPricing: false, // Manual submissions don't have pricing info
      }
    } else {
      // Scrape the page and pricing
      console.log('[API /products] Scraping page content and pricing...')
      const scrapedData = await scraperService.fetchPageContent(url)
      const pricingData = await scraperService.fetchPricingInfo(url)
      console.log('[API /products] Scraped data:', {
        name: scrapedData.name,
        descriptionLength: scrapedData.description?.length || 0,
        autoTags: scrapedData.tags || [],
        hasPricing: pricingData.hasPricing
      })

      // Merge custom tags with auto-generated tags
      let finalTags = scrapedData.tags || []
      if (customTags && Array.isArray(customTags) && customTags.length > 0) {
        // Combine and deduplicate tags
        const combinedTags = [...new Set([...customTags, ...finalTags])]
        // Limit to 15 tags total
        finalTags = combinedTags.slice(0, 15)
      }

      // Merge scraped data with pricing and custom tags
      productData = {
        ...scrapedData,
        ...pricingData,
        tags: finalTags,
        url,
      }
    }

    // Index the product
    console.log('[API /products] Indexing product in OpenSearch...')
    console.log('[API /products] Product data to index:', {
      name: productData.name,
      url: productData.url,
      tags: productData.tags,
      descriptionLength: productData.description?.length || 0
    })

    const result = await indexingService.indexProduct(productData)

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
