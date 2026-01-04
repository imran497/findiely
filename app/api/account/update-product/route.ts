import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import indexingService from '@/lib/services/indexingService'

export async function PUT(request: NextRequest) {
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
        { error: 'No Twitter account connected' },
        { status: 400 }
      )
    }

    const twitterUsername = twitterAccount.username

    const body = await request.json()
    const { productId, name, description, tags, categories } = body

    if (!productId || !name || !description) {
      return NextResponse.json(
        { error: 'Product ID, name, and description are required' },
        { status: 400 }
      )
    }

    // Get the product to verify ownership
    const product = await indexingService.getProduct(productId)

    // Verify the user owns this product
    if (product.twitter_creator?.toLowerCase() !== twitterUsername.toLowerCase()) {
      return NextResponse.json(
        { error: 'You can only edit products that belong to you' },
        { status: 403 }
      )
    }

    // Update the product
    const updateData: any = {
      name,
      description,
      updated_at: new Date().toISOString()
    }

    // Add tags if provided
    if (tags && Array.isArray(tags) && tags.length > 0) {
      updateData.tags = tags
    }

    // Add categories if provided
    if (categories && Array.isArray(categories)) {
      updateData.categories = categories.slice(0, 5)
    }

    await indexingService.updateProduct(productId, updateData)

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully'
    })

  } catch (error: any) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update product' },
      { status: 500 }
    )
  }
}
