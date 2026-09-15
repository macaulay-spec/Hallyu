import { internalAction, query } from "./_generated/server";
import { internal } from "./_generated/api";

// TMDB adapter (D-03/D-04): metadata sync only — no likeness rights questions,
// no video pipeline. Config-gated: when TMDB_API_KEY is absent the status
// query reports exactly that and nothing pretends to be synced (§39, §54).
//
// The sync action is a Convex Action (Node runtime) so fetch is available.
// It enriches existing rows by tmdbRef where set; rows without a tmdbRef are
// untouched — we never overwrite curated fictional data (D-05) with live data
// the owner hasn't reconciled. Data access lives in tmdbData.ts.

type TmdbShow = {
  id: number;
  name: string;
  original_name?: string;
  overview?: string;
  first_air_date?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
};

export const syncStatus = query({
  args: {},
  handler: async () => {
    const hasKey = !!process.env.TMDB_API_KEY;
    return {
      tmdbConfigured: hasKey,
      note: hasKey
        ? "TMDB sync is configured and available."
        : "TMDB_API_KEY not set — running on the fictional dataset. Add the key to enable metadata sync.",
    };
  },
});

type SyncResult =
  | { synced: false; reason: "TMDB_API_KEY_MISSING" }
  | { synced: true; dramasChecked: number; dramasUpdated: number };

// Sync trigger is called by the cron sweep (crons.ts); internal-only until
// the M5 platform-roles table provides an operator gate.
export const sync = internalAction({
  args: {},
  handler: async (ctx): Promise<SyncResult> => {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
      return { synced: false, reason: "TMDB_API_KEY_MISSING" };
    }

    const enrichable = await ctx.runQuery(internal.tmdbData.listEnrichable, {});

    let updated = 0;
    for (const d of enrichable) {
      const res = await fetch(
        `https://api.themoviedb.org/3/tv/${encodeURIComponent(d.tmdbRef)}?language=en-US`,
        { headers: { Authorization: `Bearer ${apiKey}` } }
      );
      if (!res.ok) continue;
      const show = (await res.json()) as TmdbShow;
      await ctx.runMutation(internal.tmdbData.applyDrama, {
        dramaId: d._id,
        overview: show.overview ?? null,
        year: show.first_air_date ? Number(show.first_air_date.slice(0, 4)) : null,
        posterPath: show.poster_path ?? null,
        backdropPath: show.backdrop_path ?? null,
      });
      updated += 1;
    }

    return {
      synced: true,
      dramasChecked: enrichable.length,
      dramasUpdated: updated,
    };
  },
});
