import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import manifest from "@/lib/tools-manifest.json";
import ToolCard from "@/components/ToolCard";
import JsonLd from "@/components/JsonLd";

const categories = manifest.categories as Record<
  string,
  { label: string; color: string }
>;
const allTools = manifest.tools.filter((t) => t.status === "live");
const validCategories = Object.keys(categories);

interface PageProps {
  params: Promise<{ category: string }>;
}

export function generateStaticParams() {
  return validCategories.map((category) => ({ category }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  const cat = categories[category];
  if (!cat) return {};

  const tools = allTools.filter((t) => t.category === category);
  const title = `Free Online ${cat.label} — ${tools.length} Tools`;
  const description = `Browse ${tools.length} free online ${cat.label.toLowerCase()} at DevTools Hub. Fast, private, browser-based utilities with zero sign-up.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/tools/category/${category}`,
    },
    openGraph: {
      title: `${title} | DevTools Hub`,
      description,
      url: `https://devtools.page/tools/category/${category}`,
      siteName: "DevTools Hub",
      type: "website",
    },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { category } = await params;
  const cat = categories[category];
  if (!cat) notFound();

  const tools = allTools.filter((t) => t.category === category);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://devtools.page",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: cat.label,
        item: `https://devtools.page/tools/category/${category}`,
      },
    ],
  };

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Free Online ${cat.label}`,
    description: `Browse ${tools.length} free online ${cat.label.toLowerCase()} at DevTools Hub.`,
    url: `https://devtools.page/tools/category/${category}`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: tools.length,
      itemListElement: tools.map((tool, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: tool.name,
        url: `https://devtools.page/tools/${tool.slug}`,
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
                <Link href="/" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <span className="mx-1">/</span>
              </li>
              <li className="text-slate-300">{cat.label}</li>
            </ol>
          </nav>

          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Free Online {cat.label}
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-slate-400">
            {tools.length} free browser-based {cat.label.toLowerCase()} &mdash;
            no sign-up, no server uploads, all processing happens in your
            browser.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <ToolCard
              key={tool.slug}
              name={tool.name}
              description={tool.description}
              href={`/tools/${tool.slug}`}
              category={tool.category}
              categoryLabel={cat.label}
            />
          ))}
        </div>

        <div className="mt-12 border-t border-slate-800 pt-6">
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
            Back to all tools
          </Link>
        </div>
      </section>
    </>
  );
}
