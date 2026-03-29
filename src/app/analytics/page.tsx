import { Metadata } from "next";
import toolsManifest from "@/lib/tools-manifest.json";

export const metadata: Metadata = {
  title: "Analytics Dashboard",
  robots: { index: false, follow: false },
};

const { tools, categories } = toolsManifest;

export default function AnalyticsPage() {
  const grouped = tools.reduce<Record<string, typeof tools>>(
    (acc, tool) => {
      const cat = tool.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(tool);
      return acc;
    },
    {}
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-white mb-2">
        Analytics Dashboard
      </h1>
      <p className="text-slate-400 mb-8">
        Internal overview of all tools on devtools.page
      </p>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-10">
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
          <p className="text-3xl font-bold text-white">{tools.length}</p>
          <p className="text-sm text-slate-400">Total Tools</p>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
          <p className="text-3xl font-bold text-white">
            {Object.keys(categories).length}
          </p>
          <p className="text-sm text-slate-400">Categories</p>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
          <p className="text-3xl font-bold text-white">
            {tools.filter((t) => t.status === "live").length}
          </p>
          <p className="text-sm text-slate-400">Live</p>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
          <p className="text-3xl font-bold text-white">
            {toolsManifest.meta.lastUpdated}
          </p>
          <p className="text-sm text-slate-400">Last Updated</p>
        </div>
      </div>

      {/* GA Dashboard embed placeholder */}
      <div className="rounded-lg border border-dashed border-slate-600 bg-slate-800/30 p-8 mb-10 text-center">
        <p className="text-slate-500 text-sm">
          Add your GA4 Looker Studio embed here
        </p>
        <p className="text-slate-600 text-xs mt-1">
          Replace this section with an iframe pointing to your Looker Studio
          dashboard
        </p>
      </div>

      {/* Tools by category */}
      {Object.entries(grouped).map(([cat, catTools]) => {
        const label =
          (categories as Record<string, { label: string }>)[cat]?.label ?? cat;
        return (
          <div key={cat} className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-3">{label}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400">
                    <th className="py-2 pr-4 font-medium">Tool</th>
                    <th className="py-2 pr-4 font-medium">Path</th>
                    <th className="py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {catTools.map((tool) => (
                    <tr
                      key={tool.slug}
                      className="border-b border-slate-800 hover:bg-slate-800/40"
                    >
                      <td className="py-2 pr-4 text-white">{tool.name}</td>
                      <td className="py-2 pr-4">
                        <a
                          href={`/tools/${tool.slug}`}
                          className="text-blue-400 hover:underline"
                        >
                          /tools/{tool.slug}
                        </a>
                      </td>
                      <td className="py-2">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            tool.status === "live"
                              ? "bg-green-900/50 text-green-400"
                              : "bg-yellow-900/50 text-yellow-400"
                          }`}
                        >
                          {tool.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
