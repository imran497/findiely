import { NextRequest, NextResponse } from 'next/server'
import client, { INDEX_NAME } from '@/lib/config/opensearch'
import tagNormalizer from '@/lib/services/tagNormalizer'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '20')
    const category = searchParams.get('category')

    // Build query based on category filter
    let baseQuery: any = { match_all: {} }

    if (category) {
      // Get all tags that match this category (includes synonyms)
      const categoryTags = tagNormalizer.getCategoryTags(category.toLowerCase())

      baseQuery = {
        bool: {
          should: categoryTags.map(tag => ({ term: { tags: tag } })),
          minimum_should_match: 1
        }
      }
    }

    // Get random products using random_score function
    const response = await client.search({
      index: INDEX_NAME,
      body: {
        size: limit,
        query: {
          function_score: {
            query: baseQuery,
            random_score: {
              seed: Date.now(),
              field: '_seq_no'
            }
          }
        },
        _source: {
          excludes: ['embedding']
        }
      }
    } as any)

    const results = response.body.hits.hits.map((hit: any) => ({
      id: hit._id,
      ...hit._source
    }))

    const total = typeof response.body.hits.total === 'object'
      ? response.body.hits.total.value
      : response.body.hits.total || 0

    return NextResponse.json({
      total: total,
      results: results,
      took: response.body.took
    })
  } catch (error: any) {
    console.error('Explore error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch random products' },
      { status: 500 }
    )
  }
}
