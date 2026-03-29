const DAILY_LIMIT = 5;

function getStorageKey(toolSlug: string): string {
  return `ai_usage_${toolSlug}`;
}

function getTodayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export function getRemainingUses(toolSlug: string): number {
  if (typeof window === "undefined") return DAILY_LIMIT;
  try {
    const raw = localStorage.getItem(getStorageKey(toolSlug));
    if (!raw) return DAILY_LIMIT;
    const data = JSON.parse(raw) as { date: string; count: number };
    if (data.date !== getTodayStr()) return DAILY_LIMIT;
    return Math.max(0, DAILY_LIMIT - data.count);
  } catch {
    return DAILY_LIMIT;
  }
}

export function recordUsage(toolSlug: string): boolean {
  const remaining = getRemainingUses(toolSlug);
  if (remaining <= 0) return false;
  try {
    const key = getStorageKey(toolSlug);
    const today = getTodayStr();
    const raw = localStorage.getItem(key);
    let count = 0;
    if (raw) {
      const data = JSON.parse(raw) as { date: string; count: number };
      if (data.date === today) count = data.count;
    }
    localStorage.setItem(key, JSON.stringify({ date: today, count: count + 1 }));
    return true;
  } catch {
    return true;
  }
}

export async function callAI(
  tool: string,
  input: Record<string, string>
): Promise<{ result?: unknown; error?: string }> {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tool, input }),
  });
  return res.json();
}
