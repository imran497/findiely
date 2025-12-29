import { Button } from '@/components/ui/button'
import { ArrowLeft, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'

export const metadata = {
  title: 'Privacy Policy - Findiely',
  description: 'Privacy policy for Findiely',
}

export default function PrivacyPage() {
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
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <div className="prose dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">
            <strong>Last updated:</strong> {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">1. Information We Collect</h2>
            <p>
              Findiely collects minimal information to provide our search services:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Search Queries:</strong> We temporarily store search queries to improve our search algorithm and provide relevant results.</li>
              <li><strong>Product URLs:</strong> When you index a product, we store the URL and metadata scraped from the website.</li>
              <li><strong>Usage Data:</strong> We collect basic analytics data such as page views and user interactions to improve our service.</li>
              <li><strong>Cookies:</strong> We use essential cookies for theme preferences and basic functionality.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">2. How We Use Your Information</h2>
            <p>We use the collected information to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide and maintain our search service</li>
              <li>Improve search relevance and accuracy</li>
              <li>Build and maintain our product database</li>
              <li>Analyze usage patterns to enhance user experience</li>
              <li>Detect and prevent abuse or misuse of our service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">3. Data Storage and Security</h2>
            <p>
              Your data is stored securely using industry-standard practices. We use OpenSearch for our database,
              which is hosted on secure servers. We do not sell, trade, or transfer your personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">4. Third-Party Services</h2>
            <p>
              Findiely may use third-party services for:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Analytics (to understand usage patterns)</li>
              <li>Favicon display (Google's favicon service)</li>
              <li>Web scraping (to collect public product information)</li>
            </ul>
            <p className="mt-2">
              These services may have their own privacy policies. We do not share personal information with these services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">5. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Request deletion of products you've indexed</li>
              <li>Opt out of analytics tracking (via browser settings)</li>
              <li>Request information about data we store</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">6. Children's Privacy</h2>
            <p>
              Findiely does not knowingly collect information from children under 13. If you believe we have
              inadvertently collected such information, please contact us to have it removed.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">7. Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. Changes will be posted on this page with
              an updated revision date. Continued use of Findiely after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">8. Contact Us</h2>
            <p>
              If you have questions about this privacy policy, please contact us at:{' '}
              <a href="mailto:privacy@findiely.com" className="text-primary hover:underline">
                privacy@findiely.com
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
