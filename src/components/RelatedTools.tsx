import { getRelatedTools } from "@/lib/related-tools";

interface RelatedToolsProps {
  currentSlug: string;
}

export default function RelatedTools({ currentSlug }: RelatedToolsProps) {
  const tools = getRelatedTools(currentSlug, 4);

  if (tools.length === 0) return null;

  return (
    <div className="bg-slate-800 rounded-lg p-6 mt-8 mb-6">
      <h2 className="text-xl font-semibold mb-4">Related Tools</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {tools.map((tool) => (
          <a
            key={tool.slug}
            href={`/tools/${tool.slug}`}
            className="bg-slate-700/50 hover:bg-slate-700 rounded p-3 transition-colors block"
          >
            <div className="font-medium text-blue-400 text-sm">
              {tool.name}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {tool.description}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
