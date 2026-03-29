"use client";

import { useState, useMemo } from "react";
import ToolCard from "@/components/ToolCard";
import manifest from "@/lib/tools-manifest.json";
import Link from "next/link";

const allTools = manifest.tools.filter((t) => t.status === "live");
const categories = manifest.categories as Record<
  string,
  { label: string; color: string }
>;
const categoryOrder = Object.keys(categories);

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredTools = useMemo(() => {
    return allTools.filter((tool) => {
      const matchesSearch =
        !search ||
        tool.name.toLowerCase().includes(search.toLowerCase()) ||
        tool.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        !activeCategory || tool.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory]);

  const isFiltering = !!search || !!activeCategory;

  const groupedTools = useMemo(() => {
    if (isFiltering) return null;
    return categoryOrder.map((key) => ({
      key,
      label: categories[key].label,
      tools: allTools.filter((t) => t.category === key),
    }));
  }, [isFiltering]);

  return (
    <>
      {/* Hero */}
      <section className="border-b border-slate-800 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-900/50">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              Free Online Developer Tools
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">
              Fast, free, and private. {allTools.length} tools for formatting,
              converting, generating, and designing &mdash; all in your browser
              with zero sign-up.
            </p>

            {/* Search */}
            <div className="mx-auto mt-8 max-w-md">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search tools..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Category filters */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => setActiveCategory(null)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeCategory === null
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                }`}
              >
                All
              </button>
              {categoryOrder.map((key) => (
                <button
                  key={key}
                  onClick={() =>
                    setActiveCategory(activeCategory === key ? null : key)
                  }
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    activeCategory === key
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  {categories[key].label}
                </button>
              ))}
            </div>

            {/* Category quick-jump anchors */}
            {!isFiltering && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-500">
                <span>Jump to:</span>
                {categoryOrder.map((key) => (
                  <a
                    key={key}
                    href={`#${key}`}
                    className="hover:text-white transition-colors underline underline-offset-2"
                  >
                    {categories[key].label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Tools */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {isFiltering ? (
          /* Flat filtered grid */
          filteredTools.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-slate-500">
                No tools match your search. Try a different query.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTools.map((tool) => (
                <ToolCard
                  key={tool.slug}
                  name={tool.name}
                  description={tool.description}
                  href={`/tools/${tool.slug}`}
                  category={tool.category}
                  categoryLabel={
                    categories[tool.category]?.label ?? tool.category
                  }
                />
              ))}
            </div>
          )
        ) : (
          /* Grouped by category */
          <div className="space-y-16">
            {groupedTools?.map((group) => (
              <div key={group.key} id={group.key}>
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">
                    {group.label}
                  </h2>
                  <Link
                    href={`/tools/category/${group.key}`}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    View all {group.tools.length} &rarr;
                  </Link>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.tools.map((tool) => (
                    <ToolCard
                      key={tool.slug}
                      name={tool.name}
                      description={tool.description}
                      href={`/tools/${tool.slug}`}
                      category={tool.category}
                      categoryLabel={group.label}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
