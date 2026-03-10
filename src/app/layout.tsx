import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
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
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Online Tools - DevTools Hub",
    description:
      "Free online developer tools, text utilities, and converters. JSON formatter, regex tester, base64 encoder, and more.",
  },
  robots: {
    index: true,
    follow: true,
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
        {/* Google Analytics — add tracking script here */}
      </head>
      <body
        className={`${inter.className} min-h-screen bg-slate-900 text-white antialiased`}
      >
        <div className="flex min-h-screen flex-col">
          {/* Header */}
          <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
              <a href="/" className="group flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 font-bold text-sm">
                  DH
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight text-white group-hover:text-blue-400 transition-colors">
                    DevTools Hub
                  </h1>
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
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-600 text-xs font-bold">
                    DH
                  </div>
                  <span>DevTools Hub</span>
                </div>
                <p className="text-xs text-slate-500">
                  &copy; {new Date().getFullYear()} DevTools Hub. All rights
                  reserved. Free tools for developers.
                </p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
