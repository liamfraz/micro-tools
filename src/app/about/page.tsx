import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About DevTools Hub",
  description:
    "DevTools Hub provides free, privacy-first online developer tools. Learn about our mission to make web development faster and more accessible.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-200">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-extrabold text-white mb-8">
          About DevTools Hub
        </h1>

        <div className="prose prose-invert prose-slate max-w-none space-y-6 text-slate-300 leading-relaxed">
          <p className="text-lg">
            DevTools Hub is a collection of free, fast, and privacy-focused
            online tools built for developers, designers, and anyone who works
            with data on the web.
          </p>

          <h2 className="text-2xl font-bold text-white mt-10">Our Mission</h2>
          <p>
            We believe essential developer tools should be free, fast, and
            respect your privacy. Too many online tools are bloated with ads,
            require sign-ups, or send your data to remote servers. DevTools Hub
            takes a different approach: every tool runs entirely in your browser.
            Your data never leaves your device.
          </p>

          <h2 className="text-2xl font-bold text-white mt-10">
            What We Offer
          </h2>
          <p>
            DevTools Hub provides over 100 tools across several categories:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong className="text-white">Developer Tools</strong> — JSON
              formatter, regex tester, diff checker, SQL formatter, cron
              builder, and more.
            </li>
            <li>
              <strong className="text-white">Text Utilities</strong> — Word
              counter, case converter, slug generator, Lorem Ipsum generator,
              and text comparison tools.
            </li>
            <li>
              <strong className="text-white">Converters & Encoders</strong> —
              Base64 encoder, URL encoder, CSV to JSON, Markdown to HTML, and
              format converters for everyday workflows.
            </li>
            <li>
              <strong className="text-white">Calculators</strong> — Compound
              interest, BMI, tip calculator, concrete calculator, and
              specialised tools for Australian tax and super.
            </li>
            <li>
              <strong className="text-white">Design & CSS</strong> — Color
              picker, gradient generator, box shadow builder, glassmorphism
              generator, and more visual tools.
            </li>
            <li>
              <strong className="text-white">AI-Powered Tools</strong> — Regex
              generator, email writer, commit message generator, and meta
              description writer powered by Claude AI.
            </li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-10">
            Privacy First
          </h2>
          <p>
            Privacy is not a feature — it is a core design principle. The vast
            majority of our tools process data entirely in your browser using
            client-side JavaScript. No data is sent to any server, stored in any
            database, or shared with any third party. The only exceptions are our
            AI-powered tools, which send your input to an AI model to generate a
            response — and even then, we do not store your data.
          </p>

          <h2 className="text-2xl font-bold text-white mt-10">
            Built With Modern Technology
          </h2>
          <p>
            DevTools Hub is built with Next.js, React, and Tailwind CSS. We use
            server-side rendering and static generation for fast page loads,
            semantic HTML for accessibility, and structured data (JSON-LD) for
            rich search engine results. The entire site is open, fast, and
            designed to get out of your way so you can focus on what matters:
            building great software.
          </p>

          <h2 className="text-2xl font-bold text-white mt-10">Contact</h2>
          <p>
            Have a suggestion for a new tool, found a bug, or just want to say
            hello? Reach out at{" "}
            <a
              href="mailto:hello@devtools.page"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              hello@devtools.page
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
