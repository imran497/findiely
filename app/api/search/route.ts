import { NextRequest, NextResponse } from 'next/server'
import searchService from '@/lib/services/searchService'

export async function GET(request: NextRequest) {
  try {
    console.log('==================== API /search CALLED ====================')
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    console.log('[API /search] Request parameters:', { query, limit, offset })

    if (!query) {
      console.log('[API /search] ✗ Missing query parameter')
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      )
    }

    console.log('[API /search] Calling searchService.hybridSearch...')
    const results = await searchService.hybridSearch({ query, limit, offset })

    console.log('[API /search] ✓ Search completed successfully')
    console.log('[API /search] Results summary:', {
      total: results.total,
      returned: results.results.length,
      took: results.took
    })

    return NextResponse.json(results)
  } catch (error: any) {
    console.error('[API /search] ✗ Error:', error)
    console.error('[API /search] Error stack:', error.stack)
    return NextResponse.json(
      { error: error.message || 'Search failed' },
      { status: 500 }
    )
  }
}
