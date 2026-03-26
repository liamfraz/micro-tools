import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "404 - Page Not Found | DevTools.page",
  description:
    "The page you are looking for does not exist or has been moved. Browse our collection of 50+ free online developer tools at DevTools.page.",
  robots: {
    index: false,
    follow: true,
  },
};

const popularTools = [
  { slug: "json-formatter", name: "JSON Formatter" },
  { slug: "base64-encoder", name: "Base64 Encoder" },
  { slug: "regex-tester", name: "Regex Tester" },
  { slug: "jwt-decoder", name: "JWT Decoder" },
  { slug: "uuid-generator", name: "UUID Generator" },
  { slug: "diff-checker", name: "Diff Checker" },
];

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="text-6xl font-bold text-slate-300">404</h1>
      <p className="mt-4 text-lg text-slate-400">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-500"
      >
        Browse All Tools
      </Link>
      <div className="mt-12 w-full max-w-md">
        <p className="text-sm font-medium text-slate-500">Popular tools</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {popularTools.map((tool) => (
            <Link
              key={tool.slug}
              href={`/${tool.slug}`}
              className="rounded-md bg-slate-800 px-3 py-1.5 text-sm text-slate-300 transition-colors hover:bg-slate-700"
            >
              {tool.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
