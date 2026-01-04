'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useClerk } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trash2, LogOut, Sparkles, Loader2, ChevronLeft, ChevronRight, RefreshCw, Plus, Download, Settings2, AlertTriangle } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'
import { TagInput } from '@/components/ui/tag-input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

// X (Twitter) Logo Component
const XLogo = ({ className = "h-3 w-3" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

interface Product {
  id: string
  name: string
  url: string
  tags: string[]
  description: string
  twitter_creator?: string
  twitter_site?: string
  indexed_by?: string
  created_at?: string
  updated_at?: string
}

export default function AdminPage() {
  const router = useRouter()
  const { signOut } = useClerk()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [stats, setStats] = useState({
    total: 0,
    products: [] as Product[],
    page: 1,
    totalPages: 1,
    limit: 20
  })
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [reindexing, setReindexing] = useState<string | null>(null)
  const [resettingIndex, setResettingIndex] = useState(false)
  const [migrating, setMigrating] = useState(false)
  const [isIndexDialogOpen, setIsIndexDialogOpen] = useState(false)
  const [indexing, setIndexing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // Index product form state
  const [indexUrl, setIndexUrl] = useState('')
  const [indexTags, setIndexTags] = useState<string[]>([])
  const [indexMessage, setIndexMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Confirmation dialogs state
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [resetConfirmText, setResetConfirmText] = useState('')
  const [showMigrateDialog, setShowMigrateDialog] = useState(false)
  const [migrateConfirmText, setMigrateConfirmText] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [productToDelete, setProductToDelete] = useState<string | null>(null)

  useEffect(() => {
    // Check if already authenticated
    const authToken = localStorage.getItem('adminAuth')
    if (authToken === 'authenticated') {
      setIsAuthenticated(true)
      fetchStats(1, pageSize)
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')

    if (username === 'admin' && password === 'searchBlox@123searchBlox') {
      // Sign out any Clerk user before logging in as admin
      try {
        await signOut()
        console.log('[Admin] Logged out Clerk user because admin is logging in')
      } catch (error) {
        // User might not be signed in, that's ok
        console.log('[Admin] No Clerk user to log out')
      }

      localStorage.setItem('adminAuth', 'authenticated')
      setIsAuthenticated(true)
      fetchStats(1, pageSize)
    } else {
      setLoginError('Invalid username or password')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminAuth')
    setIsAuthenticated(false)
    setUsername('')
    setPassword('')
  }

  const fetchStats = async (page: number = 1, limit: number = pageSize) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/stats?page=${page}&limit=${limit}`)
      const data = await response.json()
      setStats(data)
      setCurrentPage(page)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setCurrentPage(1)
    fetchStats(1, newSize)
  }

  const handleDelete = async (productId: string) => {
    setProductToDelete(productId)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!productToDelete) return

    setDeleting(productToDelete)
    setShowDeleteDialog(false)
    try {
      const response = await fetch('/api/admin/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId: productToDelete }),
      })

      if (response.ok) {
        toast.success('Product deleted successfully')
        // Refresh stats after deletion, stay on current page
        await fetchStats(currentPage, pageSize)
      } else {
        toast.error('Failed to delete product')
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('Error deleting product')
    } finally {
      setDeleting(null)
      setProductToDelete(null)
    }
  }

  const handleReindex = async (productId: string) => {
    setReindexing(productId)
    try {
      const response = await fetch('/api/admin/reindex', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
        toast.success(`Product re-indexed successfully! Updated: ${changes.join(', ')}`)
      } else {
        toast.success('Product re-indexed (no changes detected)')
      }

      // Refresh the list
      await fetchStats(currentPage, pageSize)
    } catch (error: any) {
      console.error('Error re-indexing product:', error)
      toast.error(`Failed to re-index: ${error.message}`)
    } finally {
      setReindexing(null)
    }
  }

  const handleResetIndex = async () => {
    if (resetConfirmText !== 'RESET INDEX') {
      toast.error('Please type "RESET INDEX" to confirm')
      return
    }

    setResettingIndex(true)
    setShowResetDialog(false)
    setResetConfirmText('')

    try {
      const response = await fetch('/api/admin/reset-index', {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to reset index')
      }

      const result = await response.json()
      toast.success('Index reset successfully! You can now re-index your products.')

      // Refresh the list (should be empty now)
      await fetchStats(1, pageSize)
    } catch (error: any) {
      console.error('Error resetting index:', error)
      toast.error(`Failed to reset index: ${error.message}`)
    } finally {
      setResettingIndex(false)
    }
  }

  const handleMigrate = async () => {
    if (migrateConfirmText !== 'MIGRATE') {
      toast.error('Please type "MIGRATE" to confirm')
      return
    }

    setMigrating(true)
    setShowMigrateDialog(false)
    setMigrateConfirmText('')

    try {
      const response = await fetch('/api/admin/migrate', {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to run migration')
      }

      const result = await response.json()
      toast.success(`Migration completed! Updated: ${result.stats.updated}, Skipped: ${result.stats.skipped}, Errors: ${result.stats.errors}`)

      // Refresh the list
      await fetchStats(currentPage, pageSize)
    } catch (error: any) {
      console.error('Error running migration:', error)
      toast.error(`Failed to run migration: ${error.message}`)
    } finally {
      setMigrating(false)
    }
  }

  const handleIndexProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setIndexing(true)
    setIndexMessage(null)

    try {
      const response = await fetch('/api/admin/index-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: indexUrl.trim(),
          customTags: indexTags,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to index product')
      }

      setIndexMessage({
        type: 'success',
        text: '✓ Product indexed successfully as admin!',
      })

      // Reset form
      setIndexUrl('')
      setIndexTags([])

      // Close dialog and refresh after 1.5 seconds
      setTimeout(() => {
        setIsIndexDialogOpen(false)
        setIndexMessage(null)
        fetchStats(currentPage, pageSize)
      }, 1500)
    } catch (error: any) {
      setIndexMessage({
        type: 'error',
        text: error.message || 'Failed to index product',
      })
    } finally {
      setIndexing(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const response = await fetch('/api/admin/export')
      if (!response.ok) {
        throw new Error('Failed to export products')
      }

      // Get the blob and download it
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `findiely-products-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Products exported successfully!')
    } catch (error: any) {
      console.error('Error exporting:', error)
      toast.error(`Failed to export: ${error.message}`)
    } finally {
      setExporting(false)
    }
  }

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-6 w-6" />
              <CardTitle>Admin Login</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                />
              </div>

              {loginError && (
                <div className="p-3 rounded-md text-sm bg-red-50 dark:bg-red-950 text-red-900 dark:text-red-100 border border-red-200 dark:border-red-800">
                  {loginError}
                </div>
              )}

              <Button type="submit" className="w-full">
                Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6" />
            <h1 className="text-xl font-semibold">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <div className="text-sm font-medium text-muted-foreground">Total Products</div>
                <div className="text-3xl font-bold mt-2">{stats.total}</div>
              </CardContent>
            </Card>
          </div>

          {/* Admin Actions Dropdown */}
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings2 className="mr-2 h-4 w-4" />
                  Admin Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => setIsIndexDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Index Product
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExport} disabled={exporting}>
                  {exporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Export CSV
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowMigrateDialog(true)}
                  disabled={migrating}
                  className="text-blue-600 focus:text-blue-700"
                >
                  {migrating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Migrating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Run Migration
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowResetDialog(true)}
                  disabled={resettingIndex}
                  className="text-orange-600 focus:text-orange-700"
                >
                  {resettingIndex ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      Reset Index
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Products List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle>Indexed Products</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Showing {stats.products.length} of {stats.total} products
                    {stats.totalPages > 1 && ` • Page ${stats.page} of ${stats.totalPages}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="pageSize" className="text-sm whitespace-nowrap">Per page:</Label>
                    <select
                      id="pageSize"
                      value={pageSize}
                      onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                      className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                      disabled={loading}
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => fetchStats(currentPage, pageSize)} disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : stats.products.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No products indexed yet
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold text-sm">URL</th>
                        <th className="text-left p-3 font-semibold text-sm">Owner</th>
                        <th className="text-left p-3 font-semibold text-sm">Indexed By</th>
                        <th className="text-right p-3 font-semibold text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.products.map((product) => {
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
                          <tr key={product.id} className="border-b hover:bg-accent/50 transition-colors">
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <img
                                  src={getFaviconUrl(product.url)}
                                  alt=""
                                  className="w-4 h-4 shrink-0"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none'
                                  }}
                                />
                                <a
                                  href={product.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-primary hover:underline truncate max-w-md"
                                  title={product.url}
                                >
                                  {product.url}
                                </a>
                              </div>
                            </td>
                            <td className="p-3">
                              {product.twitter_creator ? (
                                <a
                                  href={`https://twitter.com/${product.twitter_creator}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title={`View @${product.twitter_creator} on X/Twitter`}
                                >
                                  <Badge className="inline-flex items-center gap-1.5 bg-black dark:bg-white text-white dark:text-black hover:bg-black/80 dark:hover:bg-white/80 transition-colors cursor-pointer border-0">
                                    <XLogo className="h-3 w-3" />
                                    <span>@{product.twitter_creator}</span>
                                  </Badge>
                                </a>
                              ) : (
                                <span className="text-sm text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="p-3">
                              {product.indexed_by && (
                                <Badge
                                  variant={
                                    product.indexed_by === 'admin'
                                      ? 'default'
                                      : product.indexed_by === 'guest'
                                      ? 'secondary'
                                      : 'outline'
                                  }
                                  className="text-xs"
                                >
                                  {product.indexed_by === 'admin' && '👨‍💼 Admin'}
                                  {product.indexed_by === 'guest' && '👤 Guest'}
                                  {product.indexed_by !== 'admin' && product.indexed_by !== 'guest' && `👤 ${product.indexed_by}`}
                                </Badge>
                              )}
                            </td>
                            <td className="p-3">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleReindex(product.id)}
                                  disabled={reindexing === product.id || deleting === product.id}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 w-8"
                                  title="Re-index product"
                                >
                                  {reindexing === product.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <RefreshCw className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(product.id)}
                                  disabled={deleting === product.id || reindexing === product.id}
                                  className="text-destructive hover:text-destructive h-8 w-8"
                                  title="Delete product"
                                >
                                  {deleting === product.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {stats.totalPages > 1 && !loading && (
                <div className="flex items-center justify-center gap-2 mt-6 pt-6 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchStats(currentPage - 1, pageSize)}
                    disabled={currentPage === 1 || loading}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>

                  <div className="flex items-center gap-2">
                    {Array.from({ length: Math.min(5, stats.totalPages) }, (_, i) => {
                      // Show first 2, current page with neighbors, and last 2 pages
                      let pageNum: number
                      if (stats.totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= stats.totalPages - 2) {
                        pageNum = stats.totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => fetchStats(pageNum, pageSize)}
                          disabled={loading}
                          className="w-10"
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchStats(currentPage + 1, pageSize)}
                    disabled={currentPage === stats.totalPages || loading}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Index Product Dialog */}
      <Dialog open={isIndexDialogOpen} onOpenChange={setIsIndexDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Index a Product (Admin)</DialogTitle>
            <DialogDescription>
              Add a new product to the search index. This will be marked as indexed by admin.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleIndexProduct} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="indexUrl">Product URL (root domain only)</Label>
              <Input
                id="indexUrl"
                type="url"
                value={indexUrl}
                onChange={(e) => setIndexUrl(e.target.value)}
                placeholder="https://example.com"
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter only the root domain (e.g., https://example.com)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="indexTags">Tags (optional)</Label>
              <TagInput
                tags={indexTags}
                onChange={setIndexTags}
                placeholder="Type tag and press comma or enter..."
                maxTags={15}
              />
              <p className="text-xs text-muted-foreground">
                Add tags by typing and pressing comma or enter. AI will automatically expand these to include related terms.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={indexing}>
              {indexing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Indexing...
                </>
              ) : (
                'Index Product'
              )}
            </Button>
          </form>

          {indexMessage && (
            <div
              className={`p-3 rounded-md text-sm whitespace-pre-line ${
                indexMessage.type === 'success'
                  ? 'bg-green-50 dark:bg-green-950 text-green-900 dark:text-green-100 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-950 text-red-900 dark:text-red-100 border border-red-200 dark:border-red-800'
              }`}
            >
              {indexMessage.text}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Index Dialog */}
      <Dialog open={showResetDialog} onOpenChange={(open) => {
        setShowResetDialog(open)
        if (!open) setResetConfirmText('')
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Reset Index
            </DialogTitle>
            <DialogDescription className="space-y-2 pt-2">
              <p className="font-semibold text-destructive">⚠️ WARNING: This is a destructive operation!</p>
              <p>This will DELETE the entire index and recreate it with updated mapping.</p>
              <p>All products will be removed and you&apos;ll need to re-index them.</p>
              <p className="text-xs text-muted-foreground">This enables partial tag matching (e.g., &quot;custom&quot; will match &quot;this is a custom tag&quot;).</p>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="resetConfirm">Type &quot;RESET INDEX&quot; to confirm</Label>
              <Input
                id="resetConfirm"
                type="text"
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                placeholder="RESET INDEX"
                autoComplete="off"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowResetDialog(false)
                setResetConfirmText('')
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleResetIndex}
              disabled={resetConfirmText !== 'RESET INDEX' || resettingIndex}
            >
              {resettingIndex ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                'Reset Index'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Migrate Dialog */}
      <Dialog open={showMigrateDialog} onOpenChange={(open) => {
        setShowMigrateDialog(open)
        if (!open) setMigrateConfirmText('')
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600">
              <Sparkles className="h-5 w-5" />
              Run Migration
            </DialogTitle>
            <DialogDescription className="space-y-2 pt-2">
              <p>This will add the &quot;indexed_by&quot; field to all products that don&apos;t have it.</p>
              <p className="text-xs text-muted-foreground">This is safe and won&apos;t delete any data. The migration will infer the value from twitter_creator if available, otherwise set it to &apos;guest&apos;.</p>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="migrateConfirm">Type &quot;MIGRATE&quot; to confirm</Label>
              <Input
                id="migrateConfirm"
                type="text"
                value={migrateConfirmText}
                onChange={(e) => setMigrateConfirmText(e.target.value)}
                placeholder="MIGRATE"
                autoComplete="off"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowMigrateDialog(false)
                setMigrateConfirmText('')
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMigrate}
              disabled={migrateConfirmText !== 'MIGRATE' || migrating}
            >
              {migrating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Migrating...
                </>
              ) : (
                'Run Migration'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
