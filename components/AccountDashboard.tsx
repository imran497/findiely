'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import CustomUserButton from './CustomUserButton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, RefreshCw, Edit2, Save, X, Search, AlertCircle, MoreVertical, Trash2, Plus } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ThemeToggle } from './ThemeToggle'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useIndexDialog } from '@/contexts/IndexDialogContext'
import { toast } from 'sonner'

interface Product {
  id: string
  name: string
  url: string
  description: string
  tags: string[]
  categories?: string[]
  twitter_creator?: string
  twitter_site?: string
  updated_at?: string
}

export default function AccountDashboard() {
  const router = useRouter()
  const { user, isLoaded, isSignedIn } = useUser()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [reindexing, setReindexing] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null)
  const [reindexConfirm, setReindexConfirm] = useState<{ id: string; name: string; updated_at?: string } | null>(null)

  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/')
    }
  }, [isLoaded, isSignedIn, router])

  // Get user's Twitter username from Clerk
  // Check multiple possible provider names for Twitter/X
  const twitterAccount = user?.externalAccounts?.find(
    (account) =>
      account.provider === 'oauth_twitter' ||
      account.provider === 'twitter' ||
      account.provider === 'oauth_x' ||
      account.provider === 'x'
  )
  const twitterUsername = twitterAccount?.username

  // Debug: Log user info
  useEffect(() => {
    if (user) {
      console.log('[AccountDashboard] User data:', {
        userId: user.id,
        primaryEmail: user.primaryEmailAddress?.emailAddress,
        externalAccounts: user.externalAccounts?.map(acc => ({
          provider: acc.provider,
          username: acc.username
        }))
      })
    }
  }, [user])

  useEffect(() => {
    if (isLoaded) {
      if (twitterUsername) {
        fetchUserProducts()
      } else {
        setLoading(false)
      }
    }
  }, [isLoaded, twitterUsername])

  const fetchUserProducts = async () => {
    if (!twitterUsername) return

    setLoading(true)
    try {
      const response = await fetch(`/api/account/products?twitter_creator=${twitterUsername}`)
      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReindex = async () => {
    if (!reindexConfirm) return

    const { id: productId, updated_at: lastUpdated } = reindexConfirm

    // Check 24-hour rate limit
    if (lastUpdated) {
      const lastUpdateTime = new Date(lastUpdated).getTime()
      const now = Date.now()
      const hoursSinceUpdate = (now - lastUpdateTime) / (1000 * 60 * 60)

      if (hoursSinceUpdate < 24) {
        const hoursRemaining = Math.ceil(24 - hoursSinceUpdate)
        toast.error(`Rate limited`, {
          description: `You can re-index this product in ${hoursRemaining} hours. Products can only be re-indexed once every 24 hours.`
        })
        setReindexConfirm(null)
        return
      }
    }

    setReindexing(productId)
    setReindexConfirm(null)

    try {
      const response = await fetch('/api/account/reindex-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to re-index product')
      }

      const result = await response.json()

      // Show what changed
      const changes = []
      if (result.changes.name) changes.push('name')
      if (result.changes.tags) changes.push('tags')
      if (result.changes.description) changes.push('description')
      if (result.changes.twitter_creator) changes.push('twitter creator')

      if (changes.length > 0) {
        toast.success('Product re-indexed successfully!', {
          description: `Updated: ${changes.join(', ')}`
        })
      } else {
        toast.success('Product re-indexed', {
          description: 'No changes detected'
        })
      }

      // Refresh products
      await fetchUserProducts()
    } catch (error: any) {
      console.error('Error re-indexing product:', error)
      toast.error('Failed to re-index product', {
        description: error.message
      })
    } finally {
      setReindexing(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return

    const { id: productId } = deleteConfirm

    setDeleting(productId)
    setDeleteConfirm(null)

    try {
      const response = await fetch('/api/account/delete-product', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete product')
      }

      toast.success('Product deleted successfully')

      // Refresh products
      await fetchUserProducts()
    } catch (error: any) {
      console.error('Error deleting product:', error)
      toast.error('Failed to delete product', {
        description: error.message
      })
    } finally {
      setDeleting(null)
    }
  }

  const getTimeSinceUpdate = (updated_at?: string) => {
    if (!updated_at) return null

    const now = Date.now()
    const updateTime = new Date(updated_at).getTime()
    const hoursSince = (now - updateTime) / (1000 * 60 * 60)

    if (hoursSince < 1) return 'Updated less than 1 hour ago'
    if (hoursSince < 24) return `Updated ${Math.floor(hoursSince)} hours ago`
    const daysSince = Math.floor(hoursSince / 24)
    return `Updated ${daysSince} day${daysSince > 1 ? 's' : ''} ago`
  }

  const canReindex = (updated_at?: string) => {
    if (!updated_at) return true

    const now = Date.now()
    const updateTime = new Date(updated_at).getTime()
    const hoursSince = (now - updateTime) / (1000 * 60 * 60)

    return hoursSince >= 24
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

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-4">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Search className="h-5 w-5" />
            <span className="font-semibold font-patua text-xl">Findiely</span>
          </button>
          <div className="flex items-center gap-2">
            {twitterUsername && <Badge variant="secondary">@{twitterUsername}</Badge>}
            <ThemeToggle />
            <CustomUserButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container max-w-6xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold">My Products</h1>
              <p className="text-muted-foreground mt-2">
                {twitterUsername
                  ? `Manage products indexed under @${twitterUsername}`
                  : 'Manage your indexed products'}
              </p>
            </div>
            {twitterUsername && (
              <Link href="/account/products/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Index Product
                </Button>
              </Link>
            )}
          </div>

          {/* Info Alert */}
          {twitterUsername ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Note:</strong> You can only edit or re-index products that have your Twitter username (@{twitterUsername}) in their twitter:creator meta tag. Re-indexing is limited to once every 24 hours per product.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-900 dark:text-blue-100">
                <strong>Connect Twitter to manage products:</strong> Sign in with Twitter/X to view and manage products that have your Twitter handle in their twitter:creator meta tag.
              </AlertDescription>
            </Alert>
          )}

          {/* Products List */}
          <div className="space-y-4">
            {products.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No products found</h3>
                  <p className="text-muted-foreground mb-4">
                    {twitterUsername
                      ? `No products indexed under @${twitterUsername} yet. Index your first product to get started!`
                      : 'Connect your Twitter account to view and manage your indexed products.'}
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={() => router.push('/account/products/new')}>
                      <Plus className="mr-2 h-4 w-4" />
                      Index Product
                    </Button>
                    <Button variant="outline" onClick={() => router.push('/')}>
                      Back to Home
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {products.map((product) => (
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
                      {/* Title with actions menu */}
                      <div className="flex items-center gap-2">
                        <a
                          href={product.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block group flex-1"
                        >
                          <h3 className="text-xl font-semibold text-primary group-hover:underline">
                            {product.name}
                          </h3>
                        </a>

                        {/* Actions Dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/account/products/${product.id}/edit`)}>
                              <Edit2 className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setReindexConfirm({ id: product.id, name: product.name, updated_at: product.updated_at })}
                              disabled={reindexing === product.id || !canReindex(product.updated_at)}
                            >
                              {reindexing === product.id ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4 mr-2" />
                              )}
                              {canReindex(product.updated_at) ? 'Re-index' : 'Re-index (locked)'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteConfirm({ id: product.id, name: product.name })}
                              disabled={deleting === product.id}
                              className="text-destructive focus:text-destructive"
                            >
                              {deleting === product.id ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4 mr-2" />
                              )}
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

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
                        {product.description}
                      </p>

                      {/* Tags */}
                      {product.tags && product.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {product.tags.slice(0, 8).map((tag, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {product.tags.length > 8 && (
                            <Badge variant="secondary" className="text-xs">
                              +{product.tags.length - 8} more
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Meta info */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {product.twitter_creator && (
                          <a
                            href={`https://twitter.com/${product.twitter_creator}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`View @${product.twitter_creator} on X/Twitter`}
                          >
                            <Badge className="inline-flex items-center gap-1.5 bg-black dark:bg-white text-white dark:text-black hover:bg-black/80 dark:hover:bg-white/80 transition-colors cursor-pointer border-0">
                              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                              </svg>
                              <span>@{product.twitter_creator}</span>
                            </Badge>
                          </a>
                        )}
                        {product.updated_at && (
                          <>
                            <Badge variant={canReindex(product.updated_at) ? 'secondary' : 'outline'} className="text-xs">
                              {getTimeSinceUpdate(product.updated_at)}
                            </Badge>
                            {!canReindex(product.updated_at) && (
                              <span className="text-xs text-amber-600 dark:text-amber-400">
                                Re-index in {Math.ceil(24 - (Date.now() - new Date(product.updated_at).getTime()) / (1000 * 60 * 60))}h
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteConfirm?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Re-index Confirmation Dialog */}
      <AlertDialog open={!!reindexConfirm} onOpenChange={(open) => !open && setReindexConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Re-index Product</AlertDialogTitle>
            <AlertDialogDescription>
              Re-index "{reindexConfirm?.name}"? This will refresh all data from the website.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReindex}>
              Re-index
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
