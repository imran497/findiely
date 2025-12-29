import { NextRequest, NextResponse } from 'next/server'
import searchService from '@/lib/services/searchService'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      )
    }

    const results = await searchService.vectorSearch({ query, limit })

    return NextResponse.json(results)
  } catch (error: any) {
    console.error('Vector search error:', error)
    return NextResponse.json(
      { error: error.message || 'Search failed' },
      { status: 500 }
    )
  }
}
