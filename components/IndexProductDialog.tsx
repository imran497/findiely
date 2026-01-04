'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, Info } from 'lucide-react'
import { TagInput } from '@/components/ui/tag-input'
import { CategorySelect } from '@/components/ui/category-select'
import { toast } from 'sonner'

interface IndexProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export default function IndexProductDialog({ open, onOpenChange, onSuccess }: IndexProductDialogProps) {
  const { user } = useUser()
  const [url, setUrl] = useState('')
  const [customTags, setCustomTags] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null)

  // Manual mode state
  const [manualMode, setManualMode] = useState(false)
  const [manualName, setManualName] = useState('')
  const [manualDescription, setManualDescription] = useState('')

  // Get user's Twitter username
  const twitterUsername = user?.externalAccounts?.find(
    (account) => account.provider === 'oauth_twitter'
  )?.username

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    // If manual mode, validate manual fields
    if (manualMode && (!manualName.trim() || !manualDescription.trim())) {
      setMessage({
        type: 'error',
        text: 'Please fill in product name and description',
      })
      return
    }

    setLoading(true)
    setMessage(null)

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
            setMessage({
              type: 'error',
              text: `⚠️ ${errorMessage}\n\n${errorDetails}`,
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
            setMessage({
              type: 'error',
              text: '⚠️ Website blocked auto-scraping. Please enter product details manually below.',
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

      const pricingInfo = product.hasPricing ? ' Pricing information found!' : ''

      // Show success toast with tags in green
      const tagBadges = product.tags?.map((tag: string) =>
        `<span style="display: inline-block; background-color: #22c55e; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin: 2px;">${tag}</span>`
      ).join(' ') || '<span>No tags</span>'

      toast.success(`Product "${product.name}" indexed successfully!`, {
        description: (
          <div>
            {pricingInfo && <p className="mb-2">{pricingInfo}</p>}
            <div className="mt-2">
              <strong>Tags:</strong>
              <div className="mt-1" dangerouslySetInnerHTML={{ __html: tagBadges }} />
            </div>
          </div>
        ),
        duration: 5000,
      })

      // Call onSuccess callback to refresh parent list
      onSuccess?.()

      // Reset form
      setUrl('')
      setCustomTags([])
      setCategories([])
      setManualName('')
      setManualDescription('')
      setManualMode(false)

      // Close dialog after 2 seconds
      setTimeout(() => {
        onOpenChange(false)
        setMessage(null)
      }, 2000)
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to index product',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{manualMode ? 'Enter Product Details' : 'Index Product'}</DialogTitle>
          <DialogDescription>
            {manualMode
              ? 'The website blocked auto-scraping. Please enter product details manually.'
              : "Add a new indie product to the search index. We'll automatically extract all information including pricing."}
          </DialogDescription>
        </DialogHeader>

        {/* Ownership requirement alert for authenticated Twitter users */}
        {twitterUsername && (
          <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Ownership Verification:</strong> To index your product, ensure your website includes the following meta tag in the &lt;head&gt; section:
              <code className="block mt-2 p-2 bg-blue-100 dark:bg-blue-900 rounded text-xs">
                &lt;meta name="twitter:creator" content="@{twitterUsername}"&gt;
              </code>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Indexing...
              </>
            ) : (
              'Index Product'
            )}
          </Button>
        </form>

        {message && (
          <div
            className={`p-3 rounded-md text-sm whitespace-pre-line ${
              message.type === 'success'
                ? 'bg-green-50 dark:bg-green-950 text-green-900 dark:text-green-100 border border-green-200 dark:border-green-800'
                : message.type === 'warning'
                ? 'bg-amber-50 dark:bg-amber-950 text-amber-900 dark:text-amber-100 border border-amber-200 dark:border-amber-800'
                : 'bg-red-50 dark:bg-red-950 text-red-900 dark:text-red-100 border border-red-200 dark:border-red-800'
            }`}
          >
            {message.text}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
