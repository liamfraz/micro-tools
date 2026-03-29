import manifest from "@/lib/tools-manifest.json";

const categories = manifest.categories as Record<
  string,
  { label: string; color: string }
>;

interface ToolBreadcrumbProps {
  slug: string;
}

export default function ToolBreadcrumb({ slug }: ToolBreadcrumbProps) {
  const tool = manifest.tools.find(
    (t) => t.slug === slug && t.status === "live"
  );
  if (!tool) return null;

  const categoryLabel = categories[tool.category]?.label ?? tool.category;

  return (
    <nav className="text-sm text-slate-400 mb-6" aria-label="Breadcrumb">
      <ol className="flex items-center gap-2">
        <li>
          <a href="/" className="hover:text-white transition-colors">
            Home
          </a>
        </li>
        <li>
          <span className="mx-1">/</span>
        </li>
        <li>
          <a
            href={`/tools/category/${tool.category}`}
            className="hover:text-white transition-colors"
          >
            {categoryLabel}
          </a>
        </li>
        <li>
          <span className="mx-1">/</span>
        </li>
        <li className="text-slate-300">{tool.name}</li>
      </ol>
    </nav>
  );
}
