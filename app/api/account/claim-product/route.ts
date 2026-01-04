import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import indexingService from '@/lib/services/indexingService'
import scraperService from '@/lib/services/scraperService'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

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

    if (!twitterAccount?.username) {
      return NextResponse.json(
        { error: 'No Twitter account connected. Please connect your Twitter account to claim products.' },
        { status: 400 }
      )
    }

    const twitterUsername = twitterAccount.username
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Validate and normalize URL using the same method as indexing
    let normalizedUrl: string
    try {
      normalizedUrl = scraperService.validateUrl(url)
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Invalid URL format', details: error.message },
        { status: 400 }
      )
    }

    // Check if product exists
    console.log('[CLAIM] Looking for product with URL:', normalizedUrl)
    const existingProduct = await indexingService.findProductByUrl(normalizedUrl)

    if (!existingProduct) {
      console.log('[CLAIM] Product not found for URL:', normalizedUrl)
      return NextResponse.json(
        {
          error: 'Product not found in index',
          details: `This product has not been indexed yet. Please use "Index Product" to add it first. (Searched for: ${normalizedUrl})`
        },
        { status: 404 }
      )
    }

    console.log('[CLAIM] Found existing product:', existingProduct.id, existingProduct.name)

    // Fetch fresh data from the website
    let freshData
    try {
      freshData = await indexingService.scrapeWebsite(normalizedUrl)
    } catch (error: any) {
      return NextResponse.json(
        {
          error: 'Failed to fetch website data',
          details: error.message || 'Could not access the website to verify ownership.'
        },
        { status: 400 }
      )
    }

    // Verify ownership - check if twitter:creator matches user's Twitter
    const websiteTwitterCreator = freshData.twitter_creator?.replace('@', '').toLowerCase()
    const userTwitter = twitterUsername.toLowerCase()

    if (!websiteTwitterCreator || websiteTwitterCreator !== userTwitter) {
      return NextResponse.json(
        {
          error: 'Ownership verification failed',
          details: `The website's twitter:creator meta tag (${freshData.twitter_creator || 'not found'}) does not match your Twitter account (@${twitterUsername}). Please add this meta tag to your website: <meta name="twitter:creator" content="@${twitterUsername}">`
        },
        { status: 403 }
      )
    }

    // Ownership verified! Update the product
    const updateData: any = {
      twitter_creator: freshData.twitter_creator,
      twitter_site: freshData.twitter_site,
      indexed_by: `@${twitterUsername}`, // Update ownership
      updated_at: new Date().toISOString()
    }

    // Optionally update name and description if they changed
    if (freshData.name && freshData.name !== existingProduct.name) {
      updateData.name = freshData.name
    }
    if (freshData.description && freshData.description !== existingProduct.description) {
      updateData.description = freshData.description
    }

    await indexingService.updateProduct(existingProduct.id, updateData)

    return NextResponse.json({
      success: true,
      message: 'Product claimed successfully!',
      product: {
        ...existingProduct,
        ...updateData
      }
    })

  } catch (error: any) {
    console.error('Error claiming product:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to claim product' },
      { status: 500 }
    )
  }
}
