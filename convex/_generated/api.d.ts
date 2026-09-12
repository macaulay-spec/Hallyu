/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as comments from "../comments.js";
import type * as engagement from "../engagement.js";
import type * as health from "../health.js";
import type * as http from "../http.js";
import type * as lib_guards from "../lib/guards.js";
import type * as lib_rateLimit from "../lib/rateLimit.js";
import type * as onboarding from "../onboarding.js";
import type * as posts from "../posts.js";
import type * as seed from "../seed.js";
import type * as social from "../social.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  comments: typeof comments;
  engagement: typeof engagement;
  health: typeof health;
  http: typeof http;
  "lib/guards": typeof lib_guards;
  "lib/rateLimit": typeof lib_rateLimit;
  onboarding: typeof onboarding;
  posts: typeof posts;
  seed: typeof seed;
  social: typeof social;
  users: typeof users;
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
