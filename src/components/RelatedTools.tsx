import Link from "next/link";
import { getRelatedTools } from "@/lib/related-tools";

interface RelatedToolsProps {
  currentSlug: string;
}

export default function RelatedTools({ currentSlug }: RelatedToolsProps) {
  const tools = getRelatedTools(currentSlug, 6);

  if (tools.length === 0) return null;

  return (
    <nav aria-label="Related tools" className="mt-8 mb-6">
      <div className="rounded-lg border border-slate-800 bg-slate-800/40 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          Related Tools You Might Like
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tools.map((tool) => (
            <Link
              key={tool.slug}
              href={`/tools/${tool.slug}`}
              className="group rounded-lg border border-slate-700/50 bg-slate-700/30 p-4 transition-colors hover:border-slate-600 hover:bg-slate-700/60 block"
            >
              <span className="font-medium text-blue-400 text-sm group-hover:text-blue-300 transition-colors">
                {tool.name}
              </span>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-2">
                {tool.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
