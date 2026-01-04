'use client'

import { useState, useEffect } from 'react'
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
import { TagInput } from '@/components/ui/tag-input'
import { CategorySelect } from '@/components/ui/category-select'

interface Product {
  id: string
  name: string
  url: string
  description: string
  tags: string[]
  categories?: string[]
}

interface EditProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  onSuccess: () => void
}

export default function EditProductDialog({
  open,
  onOpenChange,
  product,
  onSuccess,
}: EditProductDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Update form when product changes
  useEffect(() => {
    if (product) {
      setName(product.name)
      setDescription(product.description)
      setTags(product.tags || [])
      setCategories(product.categories || [])
    }
  }, [product])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) return

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/account/update-product', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
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

      setMessage({
        type: 'success',
        text: '✓ Product updated successfully!',
      })

      // Close dialog after 1.5 seconds and trigger refresh
      setTimeout(() => {
        onOpenChange(false)
        setMessage(null)
        onSuccess()
      }, 1500)
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to update product',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>
            Update your product information. Tags will be automatically expanded using AI.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">Product URL</Label>
            <Input
              id="url"
              type="url"
              value={product?.url || ''}
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
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your product..."
              rows={4}
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

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Product'
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
