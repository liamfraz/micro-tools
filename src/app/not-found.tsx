import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found | DevTools Hub",
  description:
    "The page you are looking for does not exist or has been moved. Browse our collection of free online developer tools.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="text-6xl font-bold text-slate-300">404</h1>
      <p className="mt-4 text-lg text-slate-400">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <a
        href="/"
        className="mt-8 inline-block rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-500"
      >
        Browse All Tools
      </a>
    </div>
  );
}
