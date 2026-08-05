/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as ads from "../ads.js";
import type * as ai from "../ai.js";
import type * as ai_actions from "../ai_actions.js";
import type * as ai_prompts from "../ai_prompts.js";
import type * as analytics from "../analytics.js";
import type * as analytics_cleanup from "../analytics_cleanup.js";
import type * as articles from "../articles.js";
import type * as categories from "../categories.js";
import type * as crons from "../crons.js";
import type * as email_actions from "../email_actions.js";
import type * as emails from "../emails.js";
import type * as engagement from "../engagement.js";
import type * as migrations from "../migrations.js";
import type * as otp from "../otp.js";
import type * as pillars from "../pillars.js";
import type * as quotes from "../quotes.js";
import type * as rollup from "../rollup.js";
import type * as seed from "../seed.js";
import type * as site_settings from "../site_settings.js";
import type * as stats from "../stats.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  ads: typeof ads;
  ai: typeof ai;
  ai_actions: typeof ai_actions;
  ai_prompts: typeof ai_prompts;
  analytics: typeof analytics;
  analytics_cleanup: typeof analytics_cleanup;
  articles: typeof articles;
  categories: typeof categories;
  crons: typeof crons;
  email_actions: typeof email_actions;
  emails: typeof emails;
  engagement: typeof engagement;
  migrations: typeof migrations;
  otp: typeof otp;
  pillars: typeof pillars;
  quotes: typeof quotes;
  rollup: typeof rollup;
  seed: typeof seed;
  site_settings: typeof site_settings;
  stats: typeof stats;
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
