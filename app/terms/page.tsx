import { Button } from '@/components/ui/button'
import { ArrowLeft, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'

export const metadata = {
  title: 'Terms & Conditions - Findiely',
  description: 'Terms and conditions for Findiely',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6" />
              <span className="text-xl font-semibold">Findiely</span>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 container max-w-4xl px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Terms & Conditions</h1>
        <div className="prose dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">
            <strong>Last updated:</strong> {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using Findiely, you accept and agree to be bound by the terms and provisions
              of this agreement. If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">2. Description of Service</h2>
            <p>
              Findiely is a search engine for discovering indie products. We provide:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Semantic search capabilities using vector embeddings</li>
              <li>A platform for indexing and discovering indie products</li>
              <li>Product information aggregated from publicly available sources</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">3. User Responsibilities</h2>
            <p>When using Findiely, you agree to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide accurate information when indexing products</li>
              <li>Only index products you have the right to promote</li>
              <li>Not use the service for any illegal or unauthorized purpose</li>
              <li>Not attempt to abuse, harm, or exploit our service</li>
              <li>Not scrape or automatically collect data from Findiely without permission</li>
              <li>Not submit spam, malicious links, or harmful content</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">4. Indexed Content</h2>
            <p>
              When you index a product on Findiely:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You grant us the right to display, store, and share the product information</li>
              <li>You confirm that you have the right to share this information</li>
              <li>We reserve the right to remove any indexed product at our discretion</li>
              <li>We are not responsible for the accuracy of product information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">5. Intellectual Property</h2>
            <p>
              All content on Findiely, including but not limited to text, graphics, logos, and software,
              is the property of Findiely or its content suppliers and is protected by intellectual property laws.
            </p>
            <p className="mt-2">
              Product names, logos, and descriptions belong to their respective owners. Findiely aggregates
              this information from public sources for discovery purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">6. Disclaimer of Warranties</h2>
            <p>
              Findiely is provided "as is" and "as available" without any warranties, expressed or implied.
              We do not guarantee:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>The accuracy, completeness, or reliability of product information</li>
              <li>Uninterrupted or error-free service</li>
              <li>The security of data transmitted through our service</li>
              <li>That search results will meet your specific requirements</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">7. Limitation of Liability</h2>
            <p>
              Findiely and its operators shall not be liable for any direct, indirect, incidental, special,
              consequential, or punitive damages resulting from:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your use or inability to use the service</li>
              <li>Unauthorized access to or alteration of your data</li>
              <li>Any third-party content or conduct on the service</li>
              <li>Any other matter relating to the service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">8. Third-Party Links</h2>
            <p>
              Findiely contains links to third-party websites. We are not responsible for the content,
              accuracy, or practices of these websites. Accessing third-party links is at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">9. Modifications to Service</h2>
            <p>
              We reserve the right to modify, suspend, or discontinue any aspect of Findiely at any time
              without notice. We will not be liable to you or any third party for any modification, suspension,
              or discontinuation of the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">10. Termination</h2>
            <p>
              We reserve the right to terminate or suspend access to our service immediately, without prior
              notice, for any reason, including breach of these terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">11. Governing Law</h2>
            <p>
              These terms shall be governed by and construed in accordance with applicable laws, without
              regard to conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">12. Changes to Terms</h2>
            <p>
              We reserve the right to update these terms at any time. Changes will be effective immediately
              upon posting. Your continued use of Findiely after changes constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">13. Contact Information</h2>
            <p>
              If you have questions about these terms, please contact us at:{' '}
              <a href="mailto:legal@findiely.com" className="text-primary hover:underline">
                legal@findiely.com
              </a>
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 mt-auto">
        <div className="container flex flex-col sm:flex-row items-center justify-center gap-4 px-4">
          <Link href="/privacy" className="text-sm text-muted-foreground hover:underline">
            Privacy Policy
          </Link>
          <span className="text-muted-foreground hidden sm:inline">•</span>
          <Link href="/terms" className="text-sm text-muted-foreground hover:underline">
            Terms & Conditions
          </Link>
        </div>
      </footer>
    </div>
  )
}
