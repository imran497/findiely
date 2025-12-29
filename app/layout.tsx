import type { Metadata } from "next";
import { Space_Grotesk, Patua_One } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const patuaOne = Patua_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-patua-one",
});

export const metadata: Metadata = {
  title: "Findiely - Google for Indie Products | Discover Indie SaaS & Tools",
  description: "The search engine for indie products. Discover, explore and find the best indie SaaS, tools, and products built by indie makers. Powered by semantic AI search.",
  keywords: [
    "indie products",
    "indie makers",
    "indie hackers",
    "SaaS discovery",
    "indie tools",
    "product hunt alternative",
    "indie software",
    "startup tools",
    "indie SaaS",
    "semantic search",
    "AI search",
    "discover indie products"
  ],
  authors: [{ name: "Findiely" }],
  creator: "Findiely",
  publisher: "Findiely",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://findiely.com",
    siteName: "Findiely",
    title: "Findiely - Google for Indie Products",
    description: "Discover the best indie products, SaaS tools, and software built by indie makers. Search, explore, and find your next favorite indie tool.",
    images: [
      {
        url: "/ogimage.png",
        width: 1200,
        height: 630,
        alt: "Findiely - Google for Indie Products",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Findiely - Google for Indie Products",
    description: "Discover the best indie products, SaaS tools, and software built by indie makers.",
    images: ["/ogimage.png"],
    creator: "@findiely",
  },
  alternates: {
    canonical: "https://findiely.com",
  },
  verification: {
    google: "your-google-verification-code", // Add your actual Google Search Console verification code
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google Analytics - Production only */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (window.location.hostname === 'findiely.com' || window.location.hostname === 'www.findiely.com') {
                var script = document.createElement('script');
                script.async = true;
                script.src = 'https://www.googletagmanager.com/gtag/js?id=G-61CMEKRSVY';
                document.head.appendChild(script);

                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'G-61CMEKRSVY');
              }
            `
          }}
        />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Findiely",
              "alternateName": "Google for Indie Products",
              "url": "https://findiely.com",
              "description": "Discover the best indie products, SaaS tools, and software built by indie makers",
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": "https://findiely.com/results?q={search_term_string}"
                },
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
      </head>
      <body className={`${spaceGrotesk.variable} ${patuaOne.variable} font-sans antialiased`}>
        <ThemeProvider defaultTheme="system">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
