// Pure policy functions (Spec §27 classification, §18 quiet hours).
//
// Deliberately free of database access so the whole policy surface can be
// unit-tested directly (Spec §44: "moderation thresholds, ranking rules") and
// so the same rule can be reasoned about without a Convex context.

export const REPORT_REASONS = [
  "spam",
  "harassment",
  "hate",
  "spoiler_misuse",
  "copyright",
  "misinformation",
  "off_topic",
  "other",
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];
export type ReportSeverity = "low" | "medium" | "high";

/** Signals that strongly indicate a promotional/spam flood. */
export const SPAM_SIGNALS = [
  "buy now",
  "free followers",
  "click here",
  "promo code",
  "crypto",
  "http://",
  "https://",
];

export function spamSignalCount(details?: string): number {
  const text = (details ?? "").toLowerCase();
  return SPAM_SIGNALS.filter((signal) => text.includes(signal)).length;
}

/**
 * Rule-based classification → severity + class. AI/rule classification never
 * decides enforcement alone (§39 rule 13): it routes the report and may trigger
 * one documented, reversible auto-action (spam flood → pending review).
 */
export function classifyReport(
  reason: ReportReason,
  details?: string
): { severity: ReportSeverity; aiClass: string } {
  switch (reason) {
    case "hate":
    case "harassment":
      return { severity: "high", aiClass: "abuse" };
    case "copyright":
      return { severity: "high", aiClass: "rights" };
    case "spam":
      return spamSignalCount(details) >= 2
        ? { severity: "medium", aiClass: "spam_flood" }
        : { severity: "low", aiClass: "spam_suspected" };
    case "spoiler_misuse":
      return { severity: "medium", aiClass: "spoiler_tag_missing" };
    default:
      return { severity: "low", aiClass: "community_report" };
  }
}

/** The single automated action the pipeline is allowed to take on its own. */
export function autoActionFor(aiClass: string, targetType: string): string | null {
  if (aiClass !== "spam_flood") return null;
  if (targetType !== "post" && targetType !== "comment") return null;
  return "auto_hidden_pending_review";
}

/**
 * Quiet hours, stored as minutes-from-midnight. Handles the wrap-around case
 * (22:00 → 07:00) and treats an empty/zero-length window as "no quiet hours".
 */
export function isQuietWindow(
  startMinutes: number | null | undefined,
  endMinutes: number | null | undefined,
  now: number
): boolean {
  if (startMinutes == null || endMinutes == null) return false;
  if (startMinutes === endMinutes) return false;
  const date = new Date(now);
  const minutes = date.getHours() * 60 + date.getMinutes();
  return startMinutes < endMinutes
    ? minutes >= startMinutes && minutes < endMinutes
    : minutes >= startMinutes || minutes < endMinutes;
}

/**
 * Freshness decay used by the ranking/trending rules: score halves every
 * `halfLifeHours`. Exported so the curve itself is testable.
 */
export function freshnessDecay(ageMs: number, halfLifeHours: number): number {
  const hours = Math.max(0, ageMs / 3_600_000);
  return Math.pow(0.5, hours / halfLifeHours);
}
