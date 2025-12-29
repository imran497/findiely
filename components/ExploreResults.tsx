'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2, Search, RefreshCw } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import IndexProductDialog from './IndexProductDialog'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  description: string
  url: string
  tags: string[]
}

const CATEGORIES = [
  { label: 'All', value: null },
  { label: 'SaaS', value: 'saas' },
  { label: 'Payments', value: 'payments' },
  { label: 'Productivity', value: 'productivity' },
  { label: 'Analytics', value: 'analytics' },
  { label: 'AI', value: 'ai' },
  { label: 'Design', value: 'design' },
  { label: 'Development', value: 'development' },
  { label: 'Marketing', value: 'marketing' },
  { label: 'Finance', value: 'finance' },
]

export default function ExploreResults() {
  const router = useRouter()
  const [results, setResults] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [metadata, setMetadata] = useState({ total: 0, took: 0 })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  useEffect(() => {
    fetchRandomProducts()
  }, [selectedCategory])

  const fetchRandomProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '20' })
      if (selectedCategory) {
        params.append('category', selectedCategory)
      }

      const response = await fetch(`/api/explore?${params.toString()}`)
      const data = await response.json()

      setResults(data.results || [])
      setMetadata({ total: data.total || 0, took: data.took || 0 })
    } catch (error) {
      console.error('Explore error:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

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
            <span className="text-muted-foreground text-sm hidden sm:inline">/ Explore</span>
          </button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchRandomProducts}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
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
          {/* Header Text */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">Explore Random Products</h1>
            <p className="text-sm text-muted-foreground mb-4">
              Discover random indie products from our collection
            </p>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((category) => (
                <button
                  key={category.label}
                  onClick={() => setSelectedCategory(category.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === category.value
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Results List */}
          {!loading && results.length > 0 && (
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
                      <h3 className="text-xl font-semibold text-primary group-hover:underline">
                        {product.name}
                      </h3>
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

              {/* Load More Button */}
              <div className="flex items-center justify-center mt-8 pt-8 border-t">
                <Button
                  variant="outline"
                  onClick={fetchRandomProducts}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Load More Random Products
                </Button>
              </div>
            </div>
          )}

          {/* No Results */}
          {!loading && results.length === 0 && (
            <div className="text-center py-12">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground">
                Try indexing some products first.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setIsDialogOpen(true)}
              >
                Index a Product
              </Button>
            </div>
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
