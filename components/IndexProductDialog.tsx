'use client'

import { useState } from 'react'
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
import { Loader2 } from 'lucide-react'

interface IndexProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function IndexProductDialog({ open, onOpenChange }: IndexProductDialogProps) {
  const [url, setUrl] = useState('')
  const [customTags, setCustomTags] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    setLoading(true)
    setMessage(null)

    try {
      // Parse custom tags from comma-separated string
      const tagsArray = customTags
        .split(',')
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0)

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url.trim(),
          customTags: tagsArray.length > 0 ? tagsArray : undefined,
        }),
      })

      if (!response.ok) {
        let errorMessage = 'Failed to index product'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      const product = data.product.product || data.product

      const tagsList = product.tags?.join(', ') || 'none'
      const pricingInfo = product.hasPricing ? ' Pricing information found!' : ''

      setMessage({
        type: 'success',
        text: `✓ Success! "${product.name}" has been indexed.${pricingInfo}\n\nTags: ${tagsList}`,
      })

      // Reset form
      setUrl('')
      setCustomTags('')

      // Close dialog after 3 seconds
      setTimeout(() => {
        onOpenChange(false)
        setMessage(null)
      }, 3000)
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
          <DialogTitle>Index Product</DialogTitle>
          <DialogDescription>
            Add a new indie product to the search index. We'll automatically extract all information including pricing.
          </DialogDescription>
        </DialogHeader>

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
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              • Only root domains allowed (no paths or parameters)<br />
              • We'll extract title, description, and auto-generate tags<br />
              • Duplicate URLs are prevented
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Custom Tags (Optional)</Label>
            <Input
              id="tags"
              type="text"
              value={customTags}
              onChange={(e) => setCustomTags(e.target.value)}
              placeholder="saas, productivity, analytics"
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated tags to help users find your product. These will be merged with auto-generated tags.
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
