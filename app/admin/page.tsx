'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trash2, LogOut, Sparkles, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'

interface Product {
  id: string
  name: string
  url: string
  tags: string[]
  description: string
}

export default function AdminPage() {
  const router = useRouter()
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
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  useEffect(() => {
    // Check if already authenticated
    const authToken = localStorage.getItem('adminAuth')
    if (authToken === 'authenticated') {
      setIsAuthenticated(true)
      fetchStats(1, pageSize)
    }
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')

    if (username === 'admin' && password === 'admin') {
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
    if (!confirm('Are you sure you want to delete this product?')) {
      return
    }

    setDeleting(productId)
    try {
      const response = await fetch('/api/admin/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId }),
      })

      if (response.ok) {
        // Refresh stats after deletion, stay on current page
        await fetchStats(currentPage, pageSize)
      } else {
        alert('Failed to delete product')
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Error deleting product')
    } finally {
      setDeleting(null)
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
                  placeholder="admin"
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
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.push('/')}>
              Back to Home
            </Button>
            <Button variant="ghost" onClick={handleLogout}>
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
                <div className="space-y-4">
                  {stats.products.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold truncate">{product.name}</h3>
                          <Badge variant="outline" className="text-xs shrink-0">
                            ID: {product.id.substring(0, 8)}...
                          </Badge>
                        </div>
                        <a
                          href={product.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline block mb-2"
                        >
                          {product.url}
                        </a>
                        {product.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {product.description}
                          </p>
                        )}
                        {product.tags && product.tags.length > 0 && (
                          <div className="flex gap-2 flex-wrap">
                            {product.tags.map((tag, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(product.id)}
                        disabled={deleting === product.id}
                        className="shrink-0 ml-4 text-destructive hover:text-destructive"
                      >
                        {deleting === product.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
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
    </div>
  )
}
