// Art URL resolution shared by Convex read models (D-03).
//
// The client's ArtImage component accepts an optional `uri` and falls back to
// the deterministic brand gradient when absent — so read models simply pass
// posterUrl: artUrl(row.tmdbPosterPath) and the UI stays honest both before
// (null → gradient) and after (URL → real art) the TMDB sync runs.

export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w780";

export function artUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}${path}`;
}
