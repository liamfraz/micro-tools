import type { Metadata } from "next";
import Link from "next/link";
import manifest from "@/lib/tools-manifest.json";
import JsonLd from "@/components/JsonLd";

const SITE_URL = "https://devtools.page";

const categories = manifest.categories as Record<
  string,
  { label: string; color: string }
>;
const allTools = manifest.tools.filter((t) => t.status === "live");
const categoryOrder = Object.keys(categories);

export const metadata: Metadata = {
  title: "All Tools — DevTools Hub",
  description:
    "Browse all free online developer tools, text utilities, converters, and calculators at DevTools Hub. Grouped by category for easy navigation.",
  alternates: {
    canonical: "/tools",
  },
  openGraph: {
    title: "All Tools — DevTools Hub",
    description:
      "Browse all free online developer tools, text utilities, converters, and calculators at DevTools Hub.",
    url: `${SITE_URL}/tools`,
    siteName: "DevTools Hub",
    type: "website",
  },
};

export default function ToolsPage() {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "All Tools",
        item: `${SITE_URL}/tools`,
      },
    ],
  };

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "All Free Online Developer Tools",
    description: `Browse ${allTools.length} free online tools at DevTools Hub.`,
    url: `${SITE_URL}/tools`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: allTools.length,
      itemListElement: allTools.map((tool, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: tool.name,
        url: `${SITE_URL}/tools/${tool.slug}`,
      })),
    },
  };

  return (
    <>
      <JsonLd data={[breadcrumbSchema, collectionSchema]} />

      <section className="border-b border-slate-800 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-900/50">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <nav className="text-sm text-slate-400 mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
              <li>
                <Link
                  href="/"
                  className="hover:text-white transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <span className="mx-1">/</span>
              </li>
              <li className="text-slate-300">All Tools</li>
            </ol>
          </nav>

          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            All Free Online Tools
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-slate-400">
            {allTools.length} free browser-based tools &mdash; grouped by
            category. No sign-up, no uploads, all processing happens in your
            browser.
          </p>

          {/* Jump links */}
          <nav className="mt-6 flex flex-wrap gap-2" aria-label="Categories">
            {categoryOrder.map((cat) => (
              <a
                key={cat}
                href={`#${cat}`}
                className="inline-flex items-center rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1 text-xs font-medium text-slate-300 hover:border-slate-600 hover:text-white transition-colors"
              >
                {categories[cat].label}
              </a>
            ))}
          </nav>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {categoryOrder.map((cat) => {
          const tools = allTools.filter((t) => t.category === cat);
          if (tools.length === 0) return null;

          return (
            <div key={cat} id={cat} className="mb-12 scroll-mt-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  {categories[cat].label}
                </h2>
                <Link
                  href={`/tools/category/${cat}`}
                  className="text-xs text-slate-400 hover:text-white transition-colors"
                >
                  View all &rarr;
                </Link>
              </div>

              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {tools.map((tool) => (
                  <li key={tool.slug}>
                    <Link
                      href={`/tools/${tool.slug}`}
                      className="group block rounded-lg border border-slate-800 bg-slate-800/40 p-4 transition-colors hover:border-slate-700 hover:bg-slate-800/70"
                    >
                      <h3 className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                        {tool.name}
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500">
                        {tool.description}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}

        <div className="mt-4 border-t border-slate-800 pt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
            Back to home
          </Link>
        </div>
      </section>
    </>
  );
}
