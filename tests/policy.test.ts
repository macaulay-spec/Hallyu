import { describe, expect, it } from "vitest";
import {
  autoActionFor,
  classifyReport,
  freshnessDecay,
  isQuietWindow,
  spamSignalCount,
} from "@/convex/lib/policy";

// Spec §44: "moderation thresholds, ranking rules" are unit-tested against the
// real policy functions. If the pipeline's severity routing or the one allowed
// auto-action drifts, these fail.

describe("classifyReport", () => {
  it("routes abuse and rights reports to high severity", () => {
    expect(classifyReport("hate")).toEqual({ severity: "high", aiClass: "abuse" });
    expect(classifyReport("harassment")).toEqual({ severity: "high", aiClass: "abuse" });
    expect(classifyReport("copyright")).toEqual({ severity: "high", aiClass: "rights" });
  });

  it("treats a plain spam report as low severity suspicion", () => {
    expect(classifyReport("spam", "this is annoying")).toEqual({
      severity: "low",
      aiClass: "spam_suspected",
    });
  });

  it("escalates spam to medium only at the documented signal threshold", () => {
    const oneSignal = classifyReport("spam", "click here for fun");
    expect(oneSignal.aiClass).toBe("spam_suspected");

    const twoSignals = classifyReport("spam", "click here — buy now");
    expect(twoSignals).toEqual({ severity: "medium", aiClass: "spam_flood" });
  });

  it("flags spoiler misuse as medium", () => {
    expect(classifyReport("spoiler_misuse").severity).toBe("medium");
  });

  it("defaults unknown reasons to community_report", () => {
    expect(classifyReport("other", "whatever").aiClass).toBe("community_report");
    expect(classifyReport("off_topic").severity).toBe("low");
  });
});

describe("spamSignalCount", () => {
  it("counts distinct signals and ignores case", () => {
    expect(spamSignalCount("BUY NOW and Crypto")).toBe(2);
    expect(spamSignalCount("nothing fishy")).toBe(0);
    expect(spamSignalCount(undefined)).toBe(0);
  });
});

describe("autoActionFor — the only self-acting enforcement", () => {
  it("auto-hides spam floods on posts and comments", () => {
    expect(autoActionFor("spam_flood", "post")).toBe("auto_hidden_pending_review");
    expect(autoActionFor("spam_flood", "comment")).toBe("auto_hidden_pending_review");
  });

  it("never auto-acts on abuse, rights, users or communities", () => {
    expect(autoActionFor("abuse", "post")).toBeNull();
    expect(autoActionFor("rights", "post")).toBeNull();
    expect(autoActionFor("spam_flood", "user")).toBeNull();
    expect(autoActionFor("spam_flood", "community")).toBeNull();
  });
});

describe("isQuietWindow", () => {
  const at = (hour: number, minute = 0) =>
    new Date(2026, 0, 15, hour, minute, 0, 0).getTime();

  it("returns false when quiet hours are unset or zero-length", () => {
    expect(isQuietWindow(null, null, at(23))).toBe(false);
    expect(isQuietWindow(0, 0, at(3))).toBe(false);
  });

  it("handles a wrap-around window (22:00 → 07:00)", () => {
    const start = 22 * 60;
    const end = 7 * 60;
    expect(isQuietWindow(start, end, at(23))).toBe(true);
    expect(isQuietWindow(start, end, at(2))).toBe(true);
    expect(isQuietWindow(start, end, at(6, 59))).toBe(true);
    expect(isQuietWindow(start, end, at(7, 0))).toBe(false);
    expect(isQuietWindow(start, end, at(12))).toBe(false);
    expect(isQuietWindow(start, end, at(21, 59))).toBe(false);
  });

  it("handles a same-day window (09:00 → 17:00)", () => {
    expect(isQuietWindow(9 * 60, 17 * 60, at(12))).toBe(true);
    expect(isQuietWindow(9 * 60, 17 * 60, at(8, 59))).toBe(false);
    expect(isQuietWindow(9 * 60, 17 * 60, at(17))).toBe(false);
  });
});

describe("freshnessDecay — the ranking curve", () => {
  const hour = 3_600_000;

  it("is 1 at publish time and halves each half-life", () => {
    expect(freshnessDecay(0, 12)).toBe(1);
    expect(freshnessDecay(12 * hour, 12)).toBeCloseTo(0.5, 5);
    expect(freshnessDecay(24 * hour, 12)).toBeCloseTo(0.25, 5);
  });

  it("never goes negative for future timestamps", () => {
    expect(freshnessDecay(-hour, 12)).toBe(1);
  });
});
