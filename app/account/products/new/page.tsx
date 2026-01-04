'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, ArrowLeft, Info, AlertCircle, Search } from 'lucide-react'
import { TagInput } from '@/components/ui/tag-input'
import { CategorySelect } from '@/components/ui/category-select'
import { ThemeToggle } from '@/components/ThemeToggle'
import CustomUserButton from '@/components/CustomUserButton'
import { toast } from 'sonner'
import Link from 'next/link'

export default function NewProductPage() {
  const router = useRouter()
  const { user } = useUser()
  const [url, setUrl] = useState('')
  const [customTags, setCustomTags] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  // Manual mode state
  const [manualMode, setManualMode] = useState(false)
  const [manualName, setManualName] = useState('')
  const [manualDescription, setManualDescription] = useState('')

  // Get user's Twitter username
  const twitterAccount = user?.externalAccounts?.find(
    (account) =>
      account.provider === 'oauth_twitter' ||
      account.provider === 'twitter' ||
      account.provider === 'oauth_x' ||
      account.provider === 'x'
  )
  const twitterUsername = twitterAccount?.username

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    // If manual mode, validate manual fields
    if (manualMode && (!manualName.trim() || !manualDescription.trim())) {
      toast.error('Please fill in product name and description')
      return
    }

    setLoading(true)

    try {
      const requestBody: any = {
        url: url.trim(),
        customTags: customTags.length > 0 ? customTags : undefined,
        categories: categories.length > 0 ? categories : undefined,
      }

      // If manual mode, include manual data
      if (manualMode) {
        requestBody.manualData = {
          name: manualName.trim(),
          description: manualDescription.trim(),
        }
      }

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        let errorMessage = 'Failed to index product'
        let errorDetails = ''
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
          errorDetails = errorData.details || ''

          // Check if ownership validation failed
          if (response.status === 403 && errorMessage.includes('Ownership validation')) {
            toast.error(errorMessage, {
              description: errorDetails,
              duration: 5000,
            })
            setLoading(false)
            return
          }

          // Check if scraping was blocked - switch to manual mode
          if (errorMessage.includes('forbidden') ||
              errorMessage.includes('blocking') ||
              errorMessage.includes('Access denied') ||
              errorMessage.includes('Failed to fetch page')) {
            setManualMode(true)
            toast.error('Website blocked auto-scraping', {
              description: 'Please enter product details manually below.',
            })
            setLoading(false)
            return
          }
        } catch {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      const product = data.product.product || data.product

      toast.success(`Product "${product.name}" indexed successfully!`, {
        description: `Tagged with: ${product.tags?.slice(0, 3).join(', ')}${product.tags?.length > 3 ? '...' : ''}`,
        duration: 3000,
      })

      // Redirect to account page after success
      setTimeout(() => {
        router.push('/account')
      }, 1500)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to index product')
    } finally {
      setLoading(false)
    }
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
            <CardTitle>{manualMode ? 'Enter Product Details' : 'Add New Product'}</CardTitle>
            <CardDescription>
              {manualMode
                ? 'The website blocked auto-scraping. Please enter product details manually.'
                : "Add a new indie product to the search index. We'll automatically extract all information including pricing."}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Ownership requirement alert for authenticated Twitter users */}
            {twitterUsername && (
              <Alert className="mb-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Ownership Verification:</strong> To index your product, ensure your website includes the following meta tag in the &lt;head&gt; section:
                  <code className="block mt-2 p-2 bg-blue-100 dark:bg-blue-900 rounded text-xs">
                    &lt;meta name="twitter:creator" content="@{twitterUsername}"&gt;
                  </code>
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="url">Product URL (Root Domain Only)</Label>
                <Input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://yourproduct.com"
                  required
                  autoFocus={!manualMode}
                  disabled={manualMode}
                />
                {!manualMode && (
                  <p className="text-xs text-muted-foreground">
                    • Only root domains allowed (no paths or parameters)<br />
                    • We'll extract title, description, and auto-generate tags<br />
                    • Duplicate URLs are prevented
                  </p>
                )}
              </div>

              {/* Manual entry fields - shown only when auto-scraping fails */}
              {manualMode && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Title *</Label>
                    <Input
                      id="name"
                      type="text"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      placeholder="Your Product Title"
                      required
                      autoFocus
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={manualDescription}
                      onChange={(e) => setManualDescription(e.target.value)}
                      placeholder="Describe your product..."
                      rows={4}
                      required
                      className="resize-none"
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="categories">Categories (Optional)</Label>
                <CategorySelect
                  selectedCategories={categories}
                  onChange={setCategories}
                  maxCategories={5}
                />
                <p className="text-xs text-muted-foreground">
                  Select up to 5 categories that best describe your product. This helps users discover your product through category filters.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Custom Tags (Optional)</Label>
                <TagInput
                  tags={customTags}
                  onChange={setCustomTags}
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
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Indexing...
                    </>
                  ) : (
                    'Index Product'
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
