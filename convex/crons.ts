import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

// Scheduled sweeps (D-11 / D-04 / §18).
//   trending-recompute     — every 15 min: trendScores from real activity (§6)
//   episode-release-sweep  — every 15 min: notify drama followers when an
//                            episode has just aired (§18 critical)
//   tmdb-metadata-refresh  — hourly, config-gated; reports "not configured"
//                            honestly when TMDB_API_KEY is absent (D-04/§54)
const crons = cronJobs();

crons.interval("trending-recompute", { minutes: 15 }, internal.trending.recompute, {});
crons.interval("episode-release-sweep", { minutes: 15 }, internal.notifications.episodeReleaseSweep, {});
crons.hourly("tmdb-metadata-refresh", { minuteUTC: 40 }, internal.tmdb.sync, {});

export default crons;
