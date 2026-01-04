'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Compass } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import IndexProductDialog from './IndexProductDialog'
import Link from 'next/link'
import { SignInButton, SignedIn, SignedOut } from '@clerk/nextjs'
import CustomUserButton from './CustomUserButton'
import { useIndexDialog } from '@/contexts/IndexDialogContext'

export default function Homepage() {
  const [query, setQuery] = useState('')
  const router = useRouter()
  const { isOpen, openDialog, closeDialog } = useIndexDialog()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/results?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Search className="h-6 w-6" />
            <span className="text-2xl font-semibold font-patua">Findiely</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />

            {/* Authentication */}
            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="default" size="sm">
                  Sign In
                </Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <CustomUserButton />
            </SignedIn>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-3xl space-y-8 text-center">
          {/* Hero Section */}
          <div>
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Products by <span className="relative inline-block indie-highlight">
                <span className="relative z-10">indie</span>
                <span className="absolute bottom-0 left-0 w-full h-4 bg-gradient-to-r from-violet-500/40 via-fuchsia-500/40 to-pink-500/40 dark:from-violet-400/50 dark:via-fuchsia-400/50 dark:to-pink-400/50 -z-0 rounded-sm transform origin-left"></span>
              </span> makers
            </h1>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for indie products..."
                className="pl-12 h-14 text-base shadow-sm"
                autoFocus
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button type="submit" size="lg" className="w-full sm:w-auto">
                <Search className="mr-2 h-4 w-4" />
                Search Products
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
                onClick={() => router.push('/explore')}
              >
                <Compass className="mr-2 h-4 w-4" />
                Explore Random
              </Button>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="container max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Powered by semantic search with vector embeddings
          </p>
          <div className="flex items-center gap-3">
            <Link href="/privacy" className="text-sm text-muted-foreground hover:underline">
              Privacy Policy
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link href="/terms" className="text-sm text-muted-foreground hover:underline">
              Terms & Conditions
            </Link>
          </div>
        </div>
      </footer>

      <IndexProductDialog
        open={isOpen}
        onOpenChange={closeDialog}
      />
    </div>
  )
}
