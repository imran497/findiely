import { NextRequest, NextResponse } from 'next/server'
import client, { INDEX_NAME } from '@/lib/config/opensearch'

export async function GET(request: NextRequest) {
  try {
    console.log('[ADMIN EXPORT] Fetching all products for export...')

    // Fetch all products (up to 10,000)
    const response = await client.search({
      index: INDEX_NAME,
      body: {
        query: {
          match_all: {}
        },
        sort: [
          { created_at: { order: 'desc' } }
        ],
        _source: {
          excludes: ['embedding']
        },
        size: 10000
      }
    })

    const products = response.body.hits.hits.map((hit: any) => ({
      id: hit._id,
      ...hit._source
    }))

    console.log('[ADMIN EXPORT] Exporting', products.length, 'products')

    // Generate CSV
    const headers = [
      'ID',
      'Name',
      'URL',
      'Description',
      'Tags',
      'Twitter Creator',
      'Twitter Site',
      'Indexed By',
      'Created At',
      'Updated At'
    ]

    const csvRows = [
      headers.join(','),
      ...products.map((product: any) => {
        const row = [
          `"${product.id || ''}"`,
          `"${(product.name || '').replace(/"/g, '""')}"`,
          `"${product.url || ''}"`,
          `"${(product.description || '').replace(/"/g, '""')}"`,
          `"${(product.tags || []).join('; ')}"`,
          `"${product.twitter_creator || ''}"`,
          `"${product.twitter_site || ''}"`,
          `"${product.indexed_by || 'unknown'}"`,
          `"${product.created_at || ''}"`,
          `"${product.updated_at || ''}"`,
        ]
        return row.join(',')
      })
    ]

    const csv = csvRows.join('\n')

    // Return CSV with proper headers
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="findiely-products-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })

  } catch (error: any) {
    console.error('[ADMIN EXPORT] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to export products' },
      { status: 500 }
    )
  }
}
