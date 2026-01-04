'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ClaimProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export default function ClaimProductDialog({ open, onOpenChange, onSuccess }: ClaimProductDialogProps) {
  const { user, isLoaded } = useUser()
  const [url, setUrl] = useState('')
  const [claiming, setClaiming] = useState(false)

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
    if (!url.trim() || claiming) return

    setClaiming(true)
    try {
      const response = await fetch('/api/account/claim-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() })
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Failed to claim product', {
          description: data.details
        })
        return
      }

      toast.success('Product claimed successfully!', {
        description: `${data.product.name} is now linked to your account.`
      })

      setUrl('')
      onOpenChange(false)

      // Call onSuccess callback to refresh products list
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      toast.error('Failed to claim product')
    } finally {
      setClaiming(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!claiming) {
      onOpenChange(newOpen)
      if (!newOpen) {
        setUrl('')
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Claim Your Product</DialogTitle>
          <DialogDescription>
            Already added your product to the index? Claim ownership by verifying your website has the correct twitter:creator meta tag.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
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
              disabled={claiming}
            />
            {isLoaded && twitterUsername && (
              <p className="text-xs text-muted-foreground mt-2">
                We'll verify your website has: <code className="bg-muted px-1 py-0.5 rounded text-xs">{'<meta name="twitter:creator" content="@' + twitterUsername + '">'}</code>
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={claiming}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={claiming} className="flex-1">
              {claiming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Claim Product'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
