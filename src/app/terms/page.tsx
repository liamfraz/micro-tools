import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of Service for DevTools Hub — usage terms, disclaimers, and limitations of liability.",
  robots: { index: true, follow: true },
};

export default function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-white">Terms of Service</h1>
      <p className="mb-6 text-sm text-slate-400">
        Last updated: March 26, 2026
      </p>

      <div className="space-y-8 text-slate-300 leading-relaxed">
        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">
            Acceptance of Terms
          </h2>
          <p>
            By accessing and using DevTools Hub (devtools.page), you accept and
            agree to be bound by these Terms of Service. If you do not agree to
            these terms, please do not use our services.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">
            Description of Service
          </h2>
          <p>
            DevTools Hub provides free, browser-based developer tools including
            formatters, converters, generators, and utilities. All tools run
            entirely in your browser &mdash; no data is sent to our servers for
            processing.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">
            Use of Service
          </h2>
          <p className="mb-3">You agree to use DevTools Hub only for lawful purposes. You must not:</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>Use the service for any illegal or unauthorized purpose</li>
            <li>Attempt to interfere with or disrupt the service</li>
            <li>
              Attempt to gain unauthorized access to any part of the service
            </li>
            <li>Use automated tools to scrape or overload the service</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">
            Intellectual Property
          </h2>
          <p>
            The DevTools Hub website, including its design, code, and content, is
            owned by us. The tools are provided for your free use, but you may
            not copy, modify, or redistribute the website itself without
            permission.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">
            Disclaimer of Warranties
          </h2>
          <p>
            DevTools Hub is provided &ldquo;as is&rdquo; and &ldquo;as
            available&rdquo; without warranties of any kind, either express or
            implied. We do not warrant that the service will be uninterrupted,
            error-free, or free of harmful components. The tools are provided for
            convenience and should not be relied upon as the sole means of
            validating critical data.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">
            Limitation of Liability
          </h2>
          <p>
            To the fullest extent permitted by law, DevTools Hub and its
            operators shall not be liable for any indirect, incidental, special,
            consequential, or punitive damages, or any loss of profits or data,
            arising from your use of or inability to use the service.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">
            Third-Party Services
          </h2>
          <p>
            Our site may include third-party advertising (Google AdSense) and
            analytics (Google Analytics). These services are governed by their
            own terms and privacy policies. We are not responsible for the
            practices of these third parties.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">
            Changes to Terms
          </h2>
          <p>
            We reserve the right to modify these Terms of Service at any time.
            Changes will be posted on this page with an updated revision date.
            Continued use of the service after changes constitutes acceptance of
            the new terms.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">Contact</h2>
          <p>
            If you have questions about these Terms of Service, please open an
            issue on our{" "}
            <a
              href="https://github.com/liamfrazer/micro-tools"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline hover:text-blue-300"
            >
              GitHub repository
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
