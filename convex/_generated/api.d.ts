/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actors from "../actors.js";
import type * as auth from "../auth.js";
import type * as comments from "../comments.js";
import type * as communities from "../communities.js";
import type * as crons from "../crons.js";
import type * as discovery from "../discovery.js";
import type * as dramas from "../dramas.js";
import type * as engagement from "../engagement.js";
import type * as episodes from "../episodes.js";
import type * as feeds from "../feeds.js";
import type * as health from "../health.js";
import type * as http from "../http.js";
import type * as lib_guards from "../lib/guards.js";
import type * as lib_notify from "../lib/notify.js";
import type * as lib_policy from "../lib/policy.js";
import type * as lib_rateLimit from "../lib/rateLimit.js";
import type * as lib_spoiler from "../lib/spoiler.js";
import type * as moderation from "../moderation.js";
import type * as notifications from "../notifications.js";
import type * as onboarding from "../onboarding.js";
import type * as posts from "../posts.js";
import type * as search from "../search.js";
import type * as seed from "../seed.js";
import type * as seedSocial from "../seedSocial.js";
import type * as social from "../social.js";
import type * as tmdb from "../tmdb.js";
import type * as tmdbData from "../tmdbData.js";
import type * as trending from "../trending.js";
import type * as users from "../users.js";
import type * as watching from "../watching.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  actors: typeof actors;
  auth: typeof auth;
  comments: typeof comments;
  communities: typeof communities;
  crons: typeof crons;
  discovery: typeof discovery;
  dramas: typeof dramas;
  engagement: typeof engagement;
  episodes: typeof episodes;
  feeds: typeof feeds;
  health: typeof health;
  http: typeof http;
  "lib/guards": typeof lib_guards;
  "lib/notify": typeof lib_notify;
  "lib/policy": typeof lib_policy;
  "lib/rateLimit": typeof lib_rateLimit;
  "lib/spoiler": typeof lib_spoiler;
  moderation: typeof moderation;
  notifications: typeof notifications;
  onboarding: typeof onboarding;
  posts: typeof posts;
  search: typeof search;
  seed: typeof seed;
  seedSocial: typeof seedSocial;
  social: typeof social;
  tmdb: typeof tmdb;
  tmdbData: typeof tmdbData;
  trending: typeof trending;
  users: typeof users;
  watching: typeof watching;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
