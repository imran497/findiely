import { NextRequest, NextResponse } from 'next/server'
import client, { INDEX_NAME } from '@/lib/config/opensearch'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const from = (page - 1) * limit

    // Get products from OpenSearch with pagination
    const response = await client.search({
      index: INDEX_NAME,
      body: {
        from: from,
        size: limit,
        query: {
          match_all: {}
        },
        _source: ['name', 'url', 'tags', 'description', 'twitter_creator', 'twitter_site', 'indexed_by'],
        sort: [
          { _id: 'asc' }
        ]
      }
    })

    const products = response.body.hits.hits.map((hit: any) => ({
      id: hit._id,
      name: hit._source.name,
      url: hit._source.url,
      tags: hit._source.tags || [],
      description: hit._source.description || '',
      twitter_creator: hit._source.twitter_creator || null,
      twitter_site: hit._source.twitter_site || null,
      indexed_by: hit._source.indexed_by || null
    }))

    const total = typeof response.body.hits.total === 'object'
      ? response.body.hits.total.value
      : response.body.hits.total || 0
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      total: total,
      products: products,
      page: page,
      limit: limit,
      totalPages: totalPages
    })
  } catch (error: any) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
