import { NextRequest, NextResponse } from 'next/server'
import scraperService from '@/lib/services/scraperService'
import indexingService from '@/lib/services/indexingService'
import searchService from '@/lib/services/searchService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    let { url, customTags, manualData } = body

    if (!url) {
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
    try {
      const urlObj = new URL(url)

      // Check if URL has a path (other than just /)
      if (urlObj.pathname !== '/' && urlObj.pathname !== '') {
        return NextResponse.json(
          { error: 'Only root domain URLs are allowed (e.g., https://example.com). Please remove any paths.' },
          { status: 400 }
        )
      }

      // Check if URL has query parameters
      if (urlObj.search) {
        return NextResponse.json(
          { error: 'Only root domain URLs are allowed. Please remove query parameters.' },
          { status: 400 }
        )
      }

      // Normalize URL: remove trailing slash and use lowercase
      url = `${urlObj.protocol}//${urlObj.hostname.toLowerCase()}`
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Check for duplicate URL
    console.log('Checking for duplicate URL:', url)
    const existingProducts = await searchService.searchByUrl(url)
    console.log('Existing products found:', existingProducts?.length || 0)

    if (existingProducts && existingProducts.length > 0) {
      console.log('Duplicate detected:', url)
      return NextResponse.json(
        { error: 'This product URL is already indexed' },
        { status: 409 }
      )
    }

    let productData: any

    // If manual data is provided, use it instead of scraping
    if (manualData) {
      console.log('Using manual data for:', url)

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
      const scrapedData = await scraperService.fetchPageContent(url)
      const pricingData = await scraperService.fetchPricingInfo(url)

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
    const result = await indexingService.indexProduct(productData)

    return NextResponse.json({
      success: true,
      product: result,
    })
  } catch (error: any) {
    console.error('Error indexing product:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to index product' },
      { status: 500 }
    )
  }
}
