import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Image from "next/image";
import "./globals.css";
import { generateOrgSchema, generateWebSiteSchema } from "@/lib/jsonld";
import GoogleAnalytics from "@/components/GoogleAnalytics";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://devtools.page"),
  alternates: {
    canonical: "/",
  },
  title: {
    default: "Free Online Tools - DevTools Hub",
    template: "%s | DevTools Hub",
  },
  description:
    "Free online developer tools, text utilities, and converters. JSON formatter, regex tester, base64 encoder, and more.",
  openGraph: {
    title: "Free Online Tools - DevTools Hub",
    description:
      "Free online developer tools, text utilities, and converters. JSON formatter, regex tester, base64 encoder, and more.",
    type: "website",
    locale: "en_US",
    siteName: "DevTools Hub",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "DevTools Hub - Free Online Developer Tools",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Online Tools - DevTools Hub",
    description:
      "Free online developer tools, text utilities, and converters. JSON formatter, regex tester, base64 encoder, and more.",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "6IQzjMi4CJbMgDMuMo3dJHxD_WBwxNCM6mA-n7eMQKY",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://pagead2.googlesyndication.com" />
        <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
        {process.env.NEXT_PUBLIC_ADSENSE_ID && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_ID}`}
            crossOrigin="anonymous"
          />
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateOrgSchema()),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateWebSiteSchema()),
          }}
        />
      </head>
      <body
        className={`${inter.className} min-h-screen bg-slate-900 text-white antialiased`}
      >
        <GoogleAnalytics />
        <div className="flex min-h-screen flex-col">
          {/* Header */}
          <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
              <a href="/" className="group flex items-center gap-3">
                <Image src="/icon.svg" alt="DevTools Hub" width={36} height={36} className="h-9 w-9 rounded-lg" priority unoptimized />
                <div>
                  <span className="text-lg font-bold tracking-tight text-white group-hover:text-blue-400 transition-colors">
                    DevTools Hub
                  </span>
                  <p className="hidden text-xs text-slate-400 sm:block">
                    Free online developer tools
                  </p>
                </div>
              </a>
              <nav className="flex items-center gap-6 text-sm text-slate-400">
                <a
                  href="/"
                  className="hover:text-white transition-colors"
                >
                  Tools
                </a>
                <a
                  href="/blog"
                  className="hover:text-white transition-colors"
                >
                  Blog
                </a>
                <a
                  href="/about"
                  className="hover:text-white transition-colors"
                >
                  About
                </a>
              </nav>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1">{children}</main>

          {/* Footer */}
          <footer className="border-t border-slate-800 bg-slate-950">
            <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
              <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Image src="/icon.svg" alt="DevTools Hub" width={24} height={24} className="h-6 w-6 rounded" unoptimized />
                  <span>DevTools Hub</span>
                </div>
                <div className="flex items-center gap-4">
                  <a
                    href="/blog"
                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    Blog
                  </a>
                  <a
                    href="/about"
                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    About
                  </a>
                  <a
                    href="/privacy"
                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    Privacy Policy
                  </a>
                  <a
                    href="/terms"
                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    Terms of Service
                  </a>
                  <p className="text-xs text-slate-500">
                    &copy; {new Date().getFullYear()} DevTools Hub. All rights
                    reserved.
                  </p>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
