'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, ArrowLeft, Search } from 'lucide-react'
import { TagInput } from '@/components/ui/tag-input'
import { CategorySelect } from '@/components/ui/category-select'
import { ThemeToggle } from '@/components/ThemeToggle'
import CustomUserButton from '@/components/CustomUserButton'
import { toast } from 'sonner'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  url: string
  description: string
  tags: string[]
  categories?: string[]
}

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useUser()
  const productId = params.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Get user's Twitter username
  const twitterAccount = user?.externalAccounts?.find(
    (account) =>
      account.provider === 'oauth_twitter' ||
      account.provider === 'twitter' ||
      account.provider === 'oauth_x' ||
      account.provider === 'x'
  )
  const twitterUsername = twitterAccount?.username

  useEffect(() => {
    fetchProduct()
  }, [productId])

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/account/products/${productId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch product')
      }
      const data = await response.json()
      setProduct(data.product)
      setName(data.product.name)
      setDescription(data.product.description)
      setTags(data.product.tags || [])
      setCategories(data.product.categories || [])
    } catch (error) {
      toast.error('Failed to load product')
      router.push('/account')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setSaving(true)
    try {
      const response = await fetch('/api/account/update-product', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: productId,
          name: name.trim(),
          description: description.trim(),
          tags: tags,
          categories: categories,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update product')
      }

      toast.success('Product updated successfully!')

      // Redirect to account page after success
      setTimeout(() => {
        router.push('/account')
      }, 1000)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update product')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!product) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
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
      <main className="container max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Edit Product</CardTitle>
            <CardDescription>
              Update your product information. Tags will be automatically expanded using AI.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="url">Product URL</Label>
                <Input
                  id="url"
                  type="url"
                  value={product.url}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  URL cannot be changed
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Product Name"
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your product..."
                  rows={6}
                  required
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="categories">Categories (Optional)</Label>
                <CategorySelect
                  selectedCategories={categories}
                  onChange={setCategories}
                  maxCategories={5}
                />
                <p className="text-xs text-muted-foreground">
                  Select up to 5 categories that best describe your product.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <TagInput
                  tags={tags}
                  onChange={setTags}
                  placeholder="Type tag and press comma or enter..."
                  maxTags={15}
                />
                <p className="text-xs text-muted-foreground">
                  Add tags by typing and pressing comma or enter. AI will automatically expand these to include related terms.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/account')}
                  disabled={saving}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Product'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
