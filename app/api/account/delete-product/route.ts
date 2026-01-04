import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import indexingService from '@/lib/services/indexingService'

export async function DELETE(request: NextRequest) {
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
    const { productId } = body

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Get the product to verify ownership
    const product = await indexingService.getProduct(productId)

    // Verify the user owns this product
    if (product.twitter_creator?.toLowerCase() !== twitterUsername.toLowerCase()) {
      return NextResponse.json(
        { error: 'You can only delete products that belong to you' },
        { status: 403 }
      )
    }

    // Delete the product
    await indexingService.deleteProduct(productId)

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
