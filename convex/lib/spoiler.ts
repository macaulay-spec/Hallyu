// Spoiler policy — PURE FUNCTION (D-10, Spec §9).
//
// The single decision point for whether a post/comment body may leave the
// server for a given viewer. Inputs are plain values, so the full matrix is
// unit-tested in tests/spoiler.test.ts and exercised by CI on every push.
//
// The matrix (viewer preference × watch progress × content tagging):
//   none      → never guarded.
//   explicit  → guarded for everyone except "relaxed" viewers (creator's own
//               "major spoilers" tag outranks progress; §9 explicit rule).
//   episode   → "strict" viewers: guarded even when fully caught up (they opt
//               out of unwatched-episode reveal entirely).
//               "balanced" viewers: guarded while progress < episodeNumber.
//               "relaxed" viewers: never guarded.
// Content without a drama context cannot be progress-compared, so it behaves
// like "explicit" (guarded unless relaxed) — fail closed, never open.

export type SpoilerLevel = "none" | "episode" | "explicit";
export type SpoilerPreference = "strict" | "balanced" | "relaxed";

export type SpoilerDecision = {
  guarded: boolean;
  reason: "none" | "explicit_tag" | "beyond_progress" | "strict_preference" | "no_progress_context";
};

export function spoilerGuard(input: {
  spoilerLevel: SpoilerLevel;
  /** Episode the content is about; null when the post has no episode context. */
  contentEpisode: number | null;
  /** Viewer's "watched through Ep X" for the content's drama; null = unknown. */
  viewerWatchedThrough: number | null;
  viewerPreference: SpoilerPreference;
}): SpoilerDecision {
  const { spoilerLevel, contentEpisode, viewerWatchedThrough, viewerPreference } = input;

  if (spoilerLevel === "none") {
    return { guarded: false, reason: "none" };
  }

  if (viewerPreference === "relaxed") {
    return { guarded: false, reason: "none" };
  }

  if (spoilerLevel === "explicit") {
    return { guarded: true, reason: "explicit_tag" };
  }

  // spoilerLevel === "episode" from here.
  if (viewerWatchedThrough == null) {
    // No progress on record for this drama: fail closed.
    return { guarded: true, reason: "no_progress_context" };
  }

  if (contentEpisode == null) {
    // Tagged but not tied to a specific episode: treat as beyond-progress.
    return { guarded: true, reason: "beyond_progress" };
  }

  if (contentEpisode > viewerWatchedThrough) {
    return { guarded: true, reason: "beyond_progress" };
  }

  if (viewerPreference === "strict") {
    return { guarded: true, reason: "strict_preference" };
  }

  return { guarded: false, reason: "none" };
}

// Human boundary line for the episode page banner (Spec §9 presentation):
// "Beyond here: Ep 8 — you've watched through Ep 6".
export function boundaryLine(contentEpisode: number, watchedThrough: number | null): string {
  if (watchedThrough == null) {
    return `Beyond here: Ep ${contentEpisode} — no watch progress recorded for this drama yet`;
  }
  if (contentEpisode > watchedThrough) {
    return `Beyond here: Ep ${contentEpisode} — you've watched through Ep ${watchedThrough}`;
  }
  return `You're past this point (Ep ${contentEpisode} of your ${watchedThrough}-episode watch)`;
}
