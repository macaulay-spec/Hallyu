import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

// Scheduled sweeps (D-11 / D-04). M3 registers the config-gated TMDB refresh;
// the trending recompute cron (trendScores, every 15 min) registers in M4.
// Without TMDB_API_KEY the sync action returns early and nothing pretends to
// have synced — the tmdb.syncStatus query reports config state honestly.
const crons = cronJobs();

crons.hourly("tmdb-metadata-refresh", { minuteUTC: 40 }, internal.tmdb.sync, {});

export default crons;
