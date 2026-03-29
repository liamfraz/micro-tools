import Link from "next/link";

const categoryStyles: Record<string, { badge: string; accent: string }> = {
  developer: {
    badge: "bg-blue-500/10 text-blue-400 ring-blue-500/20",
    accent: "group-hover:border-blue-500/40",
  },
  text: {
    badge: "bg-green-500/10 text-green-400 ring-green-500/20",
    accent: "group-hover:border-green-500/40",
  },
  json: {
    badge: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
    accent: "group-hover:border-amber-500/40",
  },
  image: {
    badge: "bg-purple-500/10 text-purple-400 ring-purple-500/20",
    accent: "group-hover:border-purple-500/40",
  },
  encoding: {
    badge: "bg-orange-500/10 text-orange-400 ring-orange-500/20",
    accent: "group-hover:border-orange-500/40",
  },
  generator: {
    badge: "bg-pink-500/10 text-pink-400 ring-pink-500/20",
    accent: "group-hover:border-pink-500/40",
  },
  css: {
    badge: "bg-cyan-500/10 text-cyan-400 ring-cyan-500/20",
    accent: "group-hover:border-cyan-500/40",
  },
  finance: {
    badge: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
    accent: "group-hover:border-emerald-500/40",
  },
};

interface ToolCardProps {
  name: string;
  description: string;
  href: string;
  category: string;
  categoryLabel: string;
}

export default function ToolCard({
  name,
  description,
  href,
  category,
  categoryLabel,
}: ToolCardProps) {
  const styles = categoryStyles[category] ?? categoryStyles.developer;

  return (
    <Link href={href} className="group block">
      <div
        className={`relative h-full rounded-xl border border-slate-800 bg-slate-800/50 p-6 transition-all duration-200 hover:scale-[1.02] hover:bg-slate-800/80 hover:shadow-lg hover:shadow-slate-900/50 ${styles.accent}`}
      >
        <div className="mb-3">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${styles.badge}`}
          >
            {categoryLabel}
          </span>
        </div>
        <h3 className="mb-2 text-base font-semibold text-white group-hover:text-blue-400 transition-colors">
          {name}
        </h3>
        <p className="text-sm leading-relaxed text-slate-400">
          {description}
        </p>
        <div className="mt-4 flex items-center text-xs font-medium text-slate-500 group-hover:text-blue-400 transition-colors">
          Use tool
          <svg
            className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
            />
          </svg>
        </div>
      </div>
    </Link>
  );
}
