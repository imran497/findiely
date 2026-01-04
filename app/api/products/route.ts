import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import scraperService from '@/lib/services/scraperService'
import indexingService from '@/lib/services/indexingService'
import searchService from '@/lib/services/searchService'

export async function POST(request: NextRequest) {
  try {
    console.log('==================== API /products POST CALLED ====================')
    const body = await request.json()
    let { url, customTags, categories, manualData, skipOwnershipCheck } = body

    console.log('[API /products] Request body:', {
      url,
      customTags,
      categories,
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

    // Get authentication info and determine who is indexing
    const { userId } = await auth()
    let indexedBy = 'guest' // Default to guest
    let userTwitterHandle = null

    if (userId && !skipOwnershipCheck) {
      console.log('[API /products] Validating ownership for authenticated user...')

      try {
        // Get user's Twitter username from Clerk
        const clerk = await clerkClient()
        const user = await clerk.users.getUser(userId)
        const twitterAccount = user.externalAccounts.find(
          (account) =>
            account.provider === 'oauth_twitter' ||
            account.provider === 'twitter' ||
            account.provider === 'oauth_x' ||
            account.provider === 'x'
        )

        if (twitterAccount?.username) {
          userTwitterHandle = twitterAccount.username.toLowerCase()
          indexedBy = `@${userTwitterHandle}` // Set indexed_by to twitter handle
          console.log('[API /products] User Twitter handle:', userTwitterHandle)

          // Scrape the URL to check twitter:creator meta tag
          let scrapedTwitterCreator = null

          try {
            const pageContent = await scraperService.fetchPageContent(url)
            scrapedTwitterCreator = pageContent.twitter_creator?.toLowerCase()
            console.log('[API /products] Scraped twitter:creator:', scrapedTwitterCreator || 'not found')
          } catch (scrapeError) {
            console.log('[API /products] Could not scrape URL for ownership check:', scrapeError)
            // If we can't scrape, we'll check manual data or reject
          }

          // Check ownership
          const expectedTwitterCreator = scrapedTwitterCreator || manualData?.twitter_creator?.toLowerCase()

          if (!expectedTwitterCreator) {
            console.log('[API /products] ✗ No twitter:creator meta tag found')
            return NextResponse.json(
              {
                error: 'Ownership validation failed',
                details: `No twitter:creator meta tag found on ${url}. To index this product, you need to add <meta name="twitter:creator" content="@${userTwitterHandle}"> to your website's <head> section.`
              },
              { status: 403 }
            )
          }

          if (expectedTwitterCreator !== userTwitterHandle) {
            console.log('[API /products] ✗ Twitter creator mismatch')
            return NextResponse.json(
              {
                error: 'Ownership validation failed',
                details: `The twitter:creator meta tag on ${url} is set to "@${expectedTwitterCreator}" but you're signed in as "@${userTwitterHandle}". Only the owner can index this product.`
              },
              { status: 403 }
            )
          }

          console.log('[API /products] ✓ Ownership validated')
        }
      } catch (authError) {
        console.log('[API /products] Auth error during ownership check:', authError)
        // Continue without ownership validation if auth check fails
      }
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
        tags: customTags && Array.isArray(customTags) ? customTags.slice(0, 15) : [],
        categories: categories && Array.isArray(categories) ? categories.slice(0, 5) : [],
        indexed_by: indexedBy
      }
    } else {
      // Auto-scraping mode - just pass url and custom tags
      console.log('[API /products] Auto-scraping mode')
      indexingParams = {
        url,
        tags: customTags && Array.isArray(customTags) ? customTags.slice(0, 15) : [],
        categories: categories && Array.isArray(categories) ? categories.slice(0, 5) : [],
        indexed_by: indexedBy
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
