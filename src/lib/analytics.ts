/**
 * Google Analytics 4 helpers.
 * GA only loads when NEXT_PUBLIC_GA_ID is set (production).
 */

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";

/** Send a custom GA4 event. No-op if gtag isn't loaded. */
export function trackEvent(
  action: string,
  params?: Record<string, string | number | boolean>
) {
  if (typeof window === "undefined") return;
  const w = window as unknown as {
    gtag?: (...args: unknown[]) => void;
  };
  w.gtag?.("event", action, params);
}

/** Track a page view with optional tool name dimension. */
export function trackPageView(url: string, toolName?: string) {
  if (typeof window === "undefined") return;
  const w = window as unknown as {
    gtag?: (...args: unknown[]) => void;
  };
  w.gtag?.("event", "page_view", {
    page_path: url,
    ...(toolName ? { tool_name: toolName } : {}),
  });
}

/** Track copy/download engagement on a tool. */
export function trackToolEngagement(
  toolSlug: string,
  action: "copy_result" | "download_result"
) {
  trackEvent("tool_engagement", {
    tool_slug: toolSlug,
    engagement_type: action,
  });
}
