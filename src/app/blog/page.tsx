import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog — Developer Guides & Tutorials",
  description:
    "Practical guides, tutorials, and explanations for web developers. Learn about encoding, data formats, CSS techniques, and more.",
  alternates: { canonical: "/blog" },
};

const posts = [
  {
    slug: "what-is-base64-encoding",
    title: "What Is Base64 Encoding and How Does It Work?",
    excerpt:
      "A practical guide to Base64 encoding — what it is, why it exists, how it works under the hood, and when you should (and shouldn't) use it in your projects.",
    date: "2026-04-07",
    readTime: "8 min read",
    category: "Encoding",
  },
  {
    slug: "json-guide-for-developers",
    title: "Understanding JSON: A Complete Guide for Developers",
    excerpt:
      "Everything you need to know about JSON — syntax rules, data types, common pitfalls, and best practices for working with JSON in web applications.",
    date: "2026-04-07",
    readTime: "10 min read",
    category: "Data Formats",
  },
  {
    slug: "css-tools-every-developer-should-know",
    title: "CSS Tools Every Developer Should Know in 2026",
    excerpt:
      "From gradient generators to box shadow builders — a roundup of essential CSS tools that save time and help you write better styles.",
    date: "2026-04-07",
    readTime: "7 min read",
    category: "CSS",
  },
  {
    slug: "regular-expressions-practical-guide",
    title: "How to Use Regular Expressions: A Practical Guide",
    excerpt:
      "Regular expressions don't have to be scary. This guide covers the most useful patterns, common use cases, and tips for writing readable regex.",
    date: "2026-04-07",
    readTime: "9 min read",
    category: "Developer Tools",
  },
  {
    slug: "url-encoding-explained",
    title: "URL Encoding Explained: When and Why You Need It",
    excerpt:
      "Why do URLs replace spaces with %20? Learn how URL encoding works, when it's required, and how to avoid common encoding bugs in your applications.",
    date: "2026-04-07",
    readTime: "6 min read",
    category: "Web Fundamentals",
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-200">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-extrabold text-white mb-4">Blog</h1>
        <p className="text-lg text-slate-400 mb-12">
          Practical guides, tutorials, and deep dives for web developers.
        </p>

        <div className="space-y-10">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="group border-b border-slate-800 pb-10"
            >
              <div className="flex items-center gap-3 text-sm text-slate-500 mb-3">
                <span className="bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full text-xs font-medium">
                  {post.category}
                </span>
                <time dateTime={post.date}>
                  {new Date(post.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
                <span>{post.readTime}</span>
              </div>
              <Link href={`/blog/${post.slug}`} className="block">
                <h2 className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors mb-3">
                  {post.title}
                </h2>
                <p className="text-slate-400 leading-relaxed">
                  {post.excerpt}
                </p>
              </Link>
              <Link
                href={`/blog/${post.slug}`}
                className="inline-block mt-4 text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Read more &rarr;
              </Link>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
