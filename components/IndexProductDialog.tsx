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
import { Textarea } from '@/components/ui/textarea'
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

  // Manual mode state
  const [manualMode, setManualMode] = useState(false)
  const [manualName, setManualName] = useState('')
  const [manualDescription, setManualDescription] = useState('')

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
      // Parse custom tags from comma-separated string
      const tagsArray = customTags
        .split(',')
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0)

      const requestBody: any = {
        url: url.trim(),
        customTags: tagsArray.length > 0 ? tagsArray : undefined,
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
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage

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

      const tagsList = product.tags?.join(', ') || 'none'
      const pricingInfo = product.hasPricing ? ' Pricing information found!' : ''

      setMessage({
        type: 'success',
        text: `✓ Success! "${product.name}" has been indexed.${pricingInfo}\n\nTags: ${tagsList}`,
      })

      // Reset form
      setUrl('')
      setCustomTags('')
      setManualName('')
      setManualDescription('')
      setManualMode(false)

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
          <DialogTitle>{manualMode ? 'Enter Product Details' : 'Index Product'}</DialogTitle>
          <DialogDescription>
            {manualMode
              ? 'The website blocked auto-scraping. Please enter product details manually.'
              : "Add a new indie product to the search index. We'll automatically extract all information including pricing."}
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
            <Label htmlFor="tags">Custom Tags (Optional)</Label>
            <Input
              id="tags"
              type="text"
              value={customTags}
              onChange={(e) => setCustomTags(e.target.value)}
              placeholder="saas, productivity, analytics"
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated tags to help users find your product.
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
