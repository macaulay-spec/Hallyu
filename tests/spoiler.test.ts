import { describe, expect, it } from "vitest";
import { boundaryLine, spoilerGuard } from "@/convex/lib/spoiler";

// Full matrix test for the spoiler engine (D-10): every viewer preference ×
// watch progress × content tagging combination. The engine is the product's
// heart (Spec §1) — if this file drifts from the policy, tests must fail.

type Case = {
  name: string;
  spoilerLevel: "none" | "episode" | "explicit";
  contentEpisode: number | null;
  watchedThrough: number | null;
  preference: "strict" | "balanced" | "relaxed";
  guarded: boolean;
  reason: string;
};

const CASES: Case[] = [
  // ---- spoilerLevel none: never guarded, for anyone ----
  { name: "no tag, no progress, strict", spoilerLevel: "none", contentEpisode: 8, watchedThrough: 2, preference: "strict", guarded: false, reason: "none" },
  { name: "no tag, no progress, relaxed", spoilerLevel: "none", contentEpisode: null, watchedThrough: null, preference: "relaxed", guarded: false, reason: "none" },

  // ---- relaxed viewers: opted out entirely (except none → nothing to relax) ----
  { name: "relaxed sees explicit spoilers", spoilerLevel: "explicit", contentEpisode: 12, watchedThrough: 1, preference: "relaxed", guarded: false, reason: "none" },
  { name: "relaxed sees episode spoilers", spoilerLevel: "episode", contentEpisode: 12, watchedThrough: 1, preference: "relaxed", guarded: false, reason: "none" },

  // ---- explicit: guarded for strict and balanced regardless of progress ----
  { name: "explicit blocks balanced who is caught up", spoilerLevel: "explicit", contentEpisode: 3, watchedThrough: 10, preference: "balanced", guarded: true, reason: "explicit_tag" },
  { name: "explicit blocks strict who is fully watched", spoilerLevel: "explicit", contentEpisode: 5, watchedThrough: 16, preference: "strict", guarded: true, reason: "explicit_tag" },
  { name: "explicit blocks viewer with no progress", spoilerLevel: "explicit", contentEpisode: 4, watchedThrough: null, preference: "balanced", guarded: true, reason: "explicit_tag" },

  // ---- episode tag: strict viewers always guarded (opted out of reveals) ----
  { name: "strict blocked even when fully caught up", spoilerLevel: "episode", contentEpisode: 3, watchedThrough: 10, preference: "strict", guarded: true, reason: "strict_preference" },
  { name: "strict blocked with no progress", spoilerLevel: "episode", contentEpisode: 3, watchedThrough: null, preference: "strict", guarded: true, reason: "no_progress_context" },

  // ---- episode tag: balanced guarded exactly beyond progress ----
  { name: "balanced blocked beyond progress", spoilerLevel: "episode", contentEpisode: 8, watchedThrough: 6, preference: "balanced", guarded: true, reason: "beyond_progress" },
  { name: "balanced sees watched episode", spoilerLevel: "episode", contentEpisode: 6, watchedThrough: 6, preference: "balanced", guarded: false, reason: "none" },
  { name: "balanced sees watched episode below progress", spoilerLevel: "episode", contentEpisode: 2, watchedThrough: 9, preference: "balanced", guarded: false, reason: "none" },
  { name: "balanced blocked at boundary +1", spoilerLevel: "episode", contentEpisode: 7, watchedThrough: 6, preference: "balanced", guarded: true, reason: "beyond_progress" },

  // ---- fail-closed corners ----
  { name: "episode tag with no progress context, balanced", spoilerLevel: "episode", contentEpisode: 3, watchedThrough: null, preference: "balanced", guarded: true, reason: "no_progress_context" },
  { name: "episode tag without episode number, balanced", spoilerLevel: "episode", contentEpisode: null, watchedThrough: 8, preference: "balanced", guarded: true, reason: "beyond_progress" },
  { name: "episode tag without episode number, strict", spoilerLevel: "episode", contentEpisode: null, watchedThrough: 8, preference: "strict", guarded: true, reason: "beyond_progress" },
];

describe("spoilerGuard matrix", () => {
  for (const c of CASES) {
    it(`${c.name} → ${c.guarded ? "guarded" : "open"} (${c.reason})`, () => {
      expect(
        spoilerGuard({
          spoilerLevel: c.spoilerLevel,
          contentEpisode: c.contentEpisode,
          viewerWatchedThrough: c.watchedThrough,
          viewerPreference: c.preference,
        })
      ).toEqual({ guarded: c.guarded, reason: c.reason });
    });
  }
});

describe("boundaryLine", () => {
  it("formats beyond-progress line", () => {
    expect(boundaryLine(8, 6)).toBe("Beyond here: Ep 8 — you've watched through Ep 6");
  });

  it("formats no-progress line", () => {
    expect(boundaryLine(8, null)).toBe(
      "Beyond here: Ep 8 — no watch progress recorded for this drama yet"
    );
  });

  it("formats caught-up line", () => {
    expect(boundaryLine(6, 9)).toBe("You're past this point (Ep 6 of your 9-episode watch)");
  });
});
