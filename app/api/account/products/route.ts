import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import client, { INDEX_NAME } from '@/lib/config/opensearch'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's Twitter account
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

    const twitter_creator = twitterAccount.username

    // Search for products owned by this Twitter user
    const response = await client.search({
      index: INDEX_NAME,
      body: {
        query: {
          term: {
            'twitter_creator': twitter_creator.toLowerCase()
          }
        },
        sort: [
          { updated_at: { order: 'desc', missing: '_last' } },
          { created_at: { order: 'desc' } }
        ],
        _source: {
          excludes: ['embedding']
        },
        size: 100 // Max 100 products per user
      }
    })

    const products = response.body.hits.hits.map((hit: any) => ({
      id: hit._id,
      ...hit._source
    }))

    return NextResponse.json({
      products: products,
      total: products.length
    })

  } catch (error: any) {
    console.error('Error fetching user products:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch products' },
      { status: 500 }
    )
  }
}
