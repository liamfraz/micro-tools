import manifest from "@/lib/tools-manifest.json";

const SITE_URL = "https://devtools.page";

const categories = manifest.categories as Record<
  string,
  { label: string; color: string }
>;

interface FAQ {
  question: string;
  answer: string;
}

interface ToolMeta {
  slug: string;
  name: string;
  description: string;
  category: string;
}

export function generateFAQSchema(faqs: FAQ[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function generateWebAppSchema(tool: ToolMeta) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.name,
    description: tool.description,
    url: `${SITE_URL}/tools/${tool.slug}`,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
}

export function generateBreadcrumbSchema(tool: ToolMeta) {
  const categoryLabel = categories[tool.category]?.label ?? tool.category;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: categoryLabel,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: tool.name,
        item: `${SITE_URL}/tools/${tool.slug}`,
      },
    ],
  };
}

export function generateOrgSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "DevTools Hub",
    url: SITE_URL,
    description: "Free online developer tools",
  };
}

export function generateWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "DevTools Hub",
    url: SITE_URL,
    description:
      "Free online developer tools, text utilities, and converters.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}
