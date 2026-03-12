import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy Policy for DevTools Hub — how we handle your data, cookies, and third-party services.",
  robots: { index: true, follow: true },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-white">Privacy Policy</h1>
      <p className="mb-6 text-sm text-slate-400">
        Last updated: March 12, 2026
      </p>

      <div className="space-y-8 text-slate-300 leading-relaxed">
        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">Overview</h2>
          <p>
            DevTools Hub (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;)
            operates the website at micro-tools-lilac.vercel.app. This Privacy
            Policy explains how we collect, use, and protect information when you
            use our free online developer tools.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">
            Information We Collect
          </h2>
          <h3 className="mb-2 text-lg font-medium text-slate-200">
            Data You Provide
          </h3>
          <p className="mb-3">
            All tools on DevTools Hub run entirely in your browser. Text, code,
            images, and other data you enter into our tools are processed
            locally on your device and are <strong>never sent to our servers</strong>.
            We do not store, log, or have access to any content you input into
            our tools.
          </p>
          <h3 className="mb-2 text-lg font-medium text-slate-200">
            Automatically Collected Information
          </h3>
          <p>We may collect the following non-personal information:</p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>
              <strong>Usage data:</strong> Pages visited, time spent, referral
              source, browser type, device type, and operating system via
              analytics services.
            </li>
            <li>
              <strong>IP address:</strong> Collected automatically by our
              hosting provider (Vercel) and analytics services. Used for
              security, abuse prevention, and aggregate geographic reporting.
            </li>
            <li>
              <strong>Cookies:</strong> We may use cookies and similar
              technologies for analytics and advertising purposes. See the
              Cookies section below.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">
            Third-Party Services
          </h2>
          <p className="mb-3">We may use the following third-party services:</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              <strong>Google Analytics:</strong> To understand how visitors use
              our site. Google Analytics collects anonymous usage data and may
              use cookies. See{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 underline hover:text-blue-300"
              >
                Google&apos;s Privacy Policy
              </a>
              .
            </li>
            <li>
              <strong>Google AdSense:</strong> To display advertisements.
              AdSense may use cookies and web beacons to serve ads based on your
              prior visits to this or other websites. You can opt out of
              personalized advertising by visiting{" "}
              <a
                href="https://www.google.com/settings/ads"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 underline hover:text-blue-300"
              >
                Google Ads Settings
              </a>
              .
            </li>
            <li>
              <strong>Vercel:</strong> Our hosting provider. See{" "}
              <a
                href="https://vercel.com/legal/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 underline hover:text-blue-300"
              >
                Vercel&apos;s Privacy Policy
              </a>
              .
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">Cookies</h2>
          <p className="mb-3">
            Cookies are small text files stored on your device. We use cookies
            for:
          </p>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              <strong>Analytics cookies:</strong> To measure site usage and
              improve our services.
            </li>
            <li>
              <strong>Advertising cookies:</strong> To serve relevant
              advertisements through Google AdSense.
            </li>
          </ul>
          <p className="mt-3">
            You can control cookies through your browser settings. Disabling
            cookies may affect some functionality.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">
            Data Retention
          </h2>
          <p>
            Since we do not collect personal data through our tools, there is no
            user data to retain. Analytics data is retained according to the
            respective third-party service&apos;s retention policies.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">
            Children&apos;s Privacy
          </h2>
          <p>
            Our services are not directed to children under 13. We do not
            knowingly collect personal information from children under 13.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">
            Your Rights
          </h2>
          <p>Depending on your location, you may have the right to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>Access the personal data we hold about you</li>
            <li>Request deletion of your personal data</li>
            <li>Opt out of personalized advertising</li>
            <li>Opt out of analytics tracking</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">
            Changes to This Policy
          </h2>
          <p>
            We may update this Privacy Policy from time to time. Changes will be
            posted on this page with an updated revision date.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">Contact</h2>
          <p>
            If you have questions about this Privacy Policy, please open an
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
