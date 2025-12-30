'use client'
import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Loader2, ChevronLeft, ChevronRight, Compass } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import IndexProductDialog from './IndexProductDialog'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  description: string
  url: string
  tags: string[]
  score: number
}

export default function SearchResults() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get('q') || ''
  const page = parseInt(searchParams.get('page') || '1', 10)
  const showRelevance = searchParams.get('showRelevance') === '1'

  const [searchQuery, setSearchQuery] = useState(query)
  const [results, setResults] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [metadata, setMetadata] = useState({ total: 0, took: 0 })
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const RESULTS_PER_PAGE = 20

  useEffect(() => {
    if (query) {
      setSearchQuery(query)
      performSearch(query, page)
    }
  }, [query, page])

  const performSearch = async (q: string, currentPage: number = 1) => {
    if (!q.trim()) return

    setLoading(true)
    try {
      const offset = (currentPage - 1) * RESULTS_PER_PAGE
      const response = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=${RESULTS_PER_PAGE}&offset=${offset}`)
      const data = await response.json()

      setResults(data.results || [])
      setMetadata({ total: data.total || 0, took: data.took || 0 })
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/results?q=${encodeURIComponent(searchQuery.trim())}&page=1`)
    }
  }

  const handlePageChange = (newPage: number) => {
    router.push(`/results?q=${encodeURIComponent(query)}&page=${newPage}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const totalPages = Math.ceil(metadata.total / RESULTS_PER_PAGE)
  const hasNextPage = page < totalPages
  const hasPrevPage = page > 1

  const getDomain = (url: string) => {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname.replace('www.', '')
    } catch {
      return ''
    }
  }

  const getFaviconUrl = (url: string) => {
    const domain = getDomain(url)
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-7xl mx-auto flex h-16 items-center gap-4 px-4">
          {/* Left: Logo */}
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity"
          >
            <Search className="h-5 w-5" />
            <span className="font-semibold font-patua text-xl">Findiely</span>
          </button>

          {/* Center: Search */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for indie products..."
                className="pl-10 h-10"
              />
            </div>
          </form>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/explore')}
              className="hidden sm:flex"
            >
              <Compass className="h-4 w-4 mr-2" />
              Explore
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDialogOpen(true)}
            >
              Index Product
            </Button>

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Results */}
      <main className="flex-1 container px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Metadata */}
          {!loading && results.length > 0 && (
            <p className="text-sm text-muted-foreground mb-6">
              About {metadata.total.toLocaleString()} results ({(metadata.took / 1000).toFixed(2)} seconds)
            </p>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Results List */}
          {!loading && results.length > 0 && (
            <>
              <div className="space-y-6">
                {results.map((product) => (
                  <div key={product.id} className="flex gap-3">
                    {/* Favicon */}
                    <div className="shrink-0 mt-1">
                      <img
                        src={getFaviconUrl(product.url)}
                        alt=""
                        className="w-5 h-5"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-2">
                      {/* Title */}
                      <a
                        href={product.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block group"
                      >
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-semibold text-primary group-hover:underline">
                            {product.name}
                          </h3>
                          {showRelevance && (
                            <Badge variant="secondary" className="text-xs font-mono">
                              {product.score.toFixed(2)}
                            </Badge>
                          )}
                        </div>
                      </a>

                      {/* URL */}
                      <a
                        href={product.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-green-700 dark:text-green-400 hover:underline"
                      >
                        {product.url}
                      </a>

                      {/* Description */}
                      <p className="text-sm text-foreground line-clamp-2">
                        {product.description || 'No description available'}
                      </p>

                      {/* Tags */}
                      {product.tags && product.tags.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {product.tags.map((tag, i) => (
                            <span
                              key={i}
                              className="text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8 pt-8 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={!hasPrevPage}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Page {page} of {totalPages}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={!hasNextPage}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}

          {/* No Results */}
          {!loading && results.length === 0 && query && (
            <Card className="mt-8">
              <CardContent className="p-12 text-center">
                <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No results found</h3>
                <p className="text-muted-foreground">
                  Your search for <strong>{query}</strong> did not match any products.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setIsDialogOpen(true)}
                >
                  Index a Product
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 mt-auto">
        <div className="container max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Powered by semantic search with vector embeddings
          </p>
          <div className="flex items-center gap-3">
            <Link href="/privacy" className="text-sm text-muted-foreground hover:underline">
              Privacy Policy
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link href="/terms" className="text-sm text-muted-foreground hover:underline">
              Terms & Conditions
            </Link>
          </div>
        </div>
      </footer>

      <IndexProductDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  )
}
