import Link from "next/link";
import manifest from "@/lib/tools-manifest.json";
import AdUnit from "@/components/AdUnit";
import { getRelatedTools } from "@/lib/related-tools";

const categories = manifest.categories as Record<
  string,
  { label: string; color: string }
>;

interface ToolLayoutProps {
  title: string;
  description: string;
  category: string;
  children: React.ReactNode;
}

export default function ToolLayout({
  title,
  description,
  category,
  children,
}: ToolLayoutProps) {
  const categoryInfo = categories[category] ?? {
    label: category,
    color: "blue",
  };

  const relatedTools = manifest.tools.filter(
    (t) => t.category === category && t.name !== title && t.status === "live"
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
        <Link href="/" className="hover:text-white transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link
          href={`/tools/category/${category}`}
          className="text-slate-400 hover:text-white transition-colors"
        >
          {categoryInfo.label}
        </Link>
        <span>/</span>
        <span className="text-slate-300">{title}</span>
      </nav>

      {/* Tool header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          {title}
        </h1>
        <p className="mt-2 text-base text-slate-400">{description}</p>
      </div>

      {/* AdSense top unit */}
      <AdUnit slot="TOP_SLOT" format="horizontal" className="mb-6" />

      {/* Tool content */}
      <div className="mb-12">{children}</div>

      {/* AdSense bottom unit */}
      <AdUnit slot="BOTTOM_SLOT" format="auto" className="mb-12" />

      {/* Related tools */}
      {relatedTools.length > 0 && (
        <section className="border-t border-slate-800 pt-8">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Related {categoryInfo.label} Tools
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {relatedTools.map((tool) => (
              <Link
                key={tool.slug}
                href={`/tools/${tool.slug}`}
                className="group rounded-lg border border-slate-800 bg-slate-800/40 p-4 transition-colors hover:border-slate-700 hover:bg-slate-800/70"
              >
                <h3 className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                  {tool.name}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {tool.description}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Back link */}
      <div className="mt-8 border-t border-slate-800 pt-6">
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
    </div>
  );
}
