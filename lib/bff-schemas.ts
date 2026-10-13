/**
 * Zod mirrors of the Nest request DTOs the BFF accepts.
 *
 * Every schema is a **strict** object so an unknown field is a 400 rather than a
 * silently stripped value — that is what makes the identity selectors deleted
 * rather than ignored on this surface (Hard Rule 1, DEV-029/030/031). A body
 * carrying `userId`, `userEmail`, `adminEmail`, or `role` is rejected here
 * before anything is forwarded, mirroring the API's `forbidNonWhitelisted`.
 *
 * The field names, enums, and bounds are transcribed from
 * Transcribed from Nest DTOs.
 * `tests/bff-upstream-contract.test.ts` fails if a path here is not a real
 * operation in `api/openapi.yaml`, so a renamed endpoint cannot drift silently.
 */

import { z } from "zod";

/** `PaginationQueryDto` — the D5 shared pagination convention. */
export const paginationQuery = {
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
} as const;

/** A route that takes no query at all: any `?key` is a 400. */
export const noQuery = z.strictObject({});

/** `ListArticlesQueryDto extends PaginationQueryDto`. */
export const listArticlesQuery = z.strictObject({
  ...paginationQuery,
  categoryId: z.string().uuid().optional(),
  pillar: z.string().max(255).optional(),
  type: z.enum(["pillar", "cluster", "micro", "insight", "observant"]).optional(),
});

/** `BySlugQueryDto` — the public single-article read. */
export const bySlugQuery = z.strictObject({
  slug: z.string().min(1).max(255),
});

/** `ArticleIdQueryDto` — engagement read and write. */
export const articleIdQuery = z.strictObject({
  articleId: z.string().uuid(),
});

/** `PaginationQueryDto` on its own — the admin user list. */
export const adminUsersQuery = z.strictObject({ ...paginationQuery });

/** `ToggleReactionDto`. */
export const toggleReactionBody = z.strictObject({
  articleId: z.string().uuid(),
  type: z.enum(["like", "love", "insightful"]),
});

/** `ToggleBookmarkDto`. */
export const toggleBookmarkBody = z.strictObject({
  articleId: z.string().uuid(),
});

/** `AddCommentDto` — the length bound is enforced by the API as a 422. */
export const addCommentBody = z.strictObject({
  articleId: z.string().uuid(),
  content: z.string(),
  parentId: z.string().uuid().optional(),
});

/** `UpdateUserRoleDto`. */
export const updateUserRoleBody = z.strictObject({
  role: z.enum(["user", "admin"]),
});

/** `LogPageVisitDto` — analytics data only, never identity, never an IP. */
export const logPageVisitBody = z.strictObject({
  visitorId: z.string().uuid(),
  url: z.string().min(1).max(2048),
  device: z.string().max(100),
  browser: z.string().max(100),
  os: z.string().max(100),
  referrer: z.string().max(2048).optional(),
  geoLocation: z
    .strictObject({
      country: z.string().max(100).optional(),
      city: z.string().max(100).optional(),
    })
    .optional(),
});

/**
 * `LogArticleViewDto` (`api/.../analytics.dto.ts:106-114`). Analytics data only
 * — never identity, never an IP. Consumed by the public `trackArticleView`
 * server action (`app/actions/analytics.ts`), not by a BFF route: the action
 * calls `lib/api.ts` directly, so the DTO mirror lives here alongside the rest
 * and is parsed with the same `parseStrictBody` (P10-SEC-002).
 */
export const logArticleViewBody = z.strictObject({
  articleId: z.string().uuid(),
  visitorId: z.string().uuid(),
});

/**
 * `LogHeartbeatDto` (`api/.../analytics.dto.ts:117-131`). `seconds` mirrors the
 * API's `@IsInt` / `@Min(0)` / `@Max(3600)`; unknown keys are a 400 so a caller
 * cannot smuggle `userId`/`userEmail`/`role` past the action (Hard Rule 1/7).
 */
export const logHeartbeatBody = z.strictObject({
  articleId: z.string().uuid(),
  visitorId: z.string().uuid(),
  seconds: z.number().int().min(0).max(3600),
});

/** `CreateTicketDto` — `topics` is the only accepted key. */
export const createTicketBody = z.strictObject({
  topics: z.array(z.string().min(1)).min(1),
});

/** `UpdateProfileDto` — self-service profile edit. */
export const updateProfileBody = z.strictObject({
  name: z.string().min(1).max(120).optional(),
  profileImage: z.string().max(2048).optional(),
  newsletterSubscribed: z.boolean().optional(),
});

/** `CompleteTourDto`. */
export const completeTourBody = z.strictObject({
  tourId: z.string().min(1).max(64),
});

/** `ConfirmNewsletterDto` — a signed, single-use token. */
export const confirmNewsletterBody = z.strictObject({
  token: z.string().min(1).max(2048),
});

/** `UnsubscribeDto` — a signed, single-use token (DEV-035). */
export const unsubscribeBody = z.strictObject({
  token: z.string().min(1).max(2048),
});

/** `UpdateAdsSettingsDto` — admin ad-network config. */
export const updateAdsSettingsBody = z.strictObject({
  adsEnabled: z.boolean(),
  adsenseAdUnitCode: z.string(),
  adsenseScriptCode: z.string(),
  showAdBottomOfArticle: z.boolean(),
  showAdMiddleOfArticle: z.boolean(),
  showAdSidebar: z.boolean(),
  showAdTopOfArticle: z.boolean(),
});

/** `RecentActivityQueryDto`. */
export const recentActivityQuery = z.strictObject({
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

/** `TrafficStatsQueryDto`. */
export const trafficStatsQuery = z.strictObject({
  days: z.coerce.number().int().min(1).max(365).optional(),
});

/** `UpdateCommentStatusDto`. */
export const updateCommentStatusBody = z.strictObject({
  id: z.string().uuid(),
  status: z.enum(["pending", "approved", "spam", "removed"]),
});

/** The `id` query for admin comment deletion. */
export const deleteCommentQuery = z.strictObject({
  id: z.string().uuid(),
});

/** `EmailLogsQueryDto`. */
export const emailLogsQuery = z.strictObject({
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

/** `EmailIdDto` — the retry target. */
export const emailIdBody = z.strictObject({
  id: z.string().uuid(),
});

/** The `id` query for email deletion. */
export const emailIdQuery = z.strictObject({
  id: z.string().uuid(),
});

/**
 * `SearchArticlesQueryDto` — `query` is the only accepted key.
 *
 * The bound is Nest's own `@MaxLength(200)`, transcribed so an oversized term
 * is a local 400 rather than a wasted round trip. Optional, because the navbar
 * sends `query: ""` until the reader types three characters and an absent term
 * is contractually `[]` — not an error.
 */
export const searchArticlesQuery = z.strictObject({
  query: z.string().max(200).optional(),
});

/**
 * `TopPostTagsQueryDto` — `limit` is the only accepted key, bounded by Nest's own
 * `@Min(1)` / `@Max(50)`. `z.coerce` matches the upstream `@Type(() => Number)`
 * transform, so `?limit=5` behaves identically here and there.
 */
export const topPostTagsQuery = z.strictObject({
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

/**
 * `SubscribeNewsletterDto` — `email` is the only accepted key.
 *
 * ⚠️ **This `email` is a recipient, not a caller identity.** It names the
 * address to be added to the list and is compared by the API against its own
 * `users` row to decide the double-opt-in branch. Nothing in this route reads it
 * as an identity, and there is no second field through which a caller could
 * nominate one — `userId`, `userEmail`, `adminEmail`, and `role` are all unknown
 * keys here and therefore a 400 (Hard Rule 1).
 *
 * The bounds are Nest's own: `@IsEmail()` and `@MaxLength(320)`.
 */
export const subscribeNewsletterBody = z.strictObject({
  email: z.email().max(320),
});

/* ------------------------------------------------------------------ *
 * Phase 10 domain 7 (admin): AI · site settings · analytics · taxonomy
 * ------------------------------------------------------------------ */

/** `UpdateSettingsDto` — AI config; the key is write-only (DEV-048/DEV-015). */
export const updateAiSettingsBody = z.strictObject({
  provider: z.string().max(50),
  apiKey: z.string().max(256).optional(),
  model: z.string().max(200),
  promptTemplate: z.string().max(20000).optional(),
  isActive: z.boolean(),
});

/** `FetchModelsDto` — a transient key is accepted, never echoed (DEV-053). */
export const aiFetchModelsBody = z.strictObject({
  provider: z.string().max(50),
  apiKey: z.string().max(256).optional(),
});

/** `TestConnectionDto` — transient key accepted, never echoed (DEV-053). */
export const aiTestConnectionBody = z.strictObject({
  provider: z.string().max(50),
  apiKey: z.string().max(256).optional(),
  model: z.string().max(200),
});

/**
 * `LearnAuthorStyleDto` / `ShuffleTopicsDto` — the key is read server-side from
 * `aiSettings`, so `apiKey` is not an accepted field (DEV-053).
 */
export const aiProviderModelBody = z.strictObject({
  provider: z.string().max(50),
  model: z.string().max(200),
});

/** `RunSingleResearchDto` — key read server-side (DEV-053). */
export const aiRunResearchBody = z.strictObject({
  topic: z.string().max(500),
});

/** `AddResearchTopicDto`. An unresolvable `categoryId` is Nest's 422. */
export const aiAddResearchTopicBody = z.strictObject({
  topic: z.string().max(500),
  categoryId: z.string().uuid().optional(),
});

/** `UpdateScheduleV2Dto` — an absent `id` inserts (DEV-051). */
export const aiScheduleBody = z.strictObject({
  id: z.string().uuid().optional(),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).max(7),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  timezone: z.string().max(100),
  isActive: z.boolean(),
  topicsToResearch: z.array(z.string().max(500)),
});

/** The `id` query for the AI delete routes (frozen `id` argument). */
export const aiIdQuery = z.strictObject({ id: z.string().uuid() });

/**
 * `UpdateSiteSettingsDto`. `socials` mirrors the 7 stored keys as strict optional
 * strings — the frozen mutation accepted any object, so whitelisting here is a
 * deliberate tightening (Hard Rule 7), not a shape the client uses.
 *
 * `email` mirrors the API DTO's DEV-064 rule exactly
 * (`api/.../site-settings.dto.ts:79-82`): `@ValidateIf((o) => o.email !==
 * undefined && o.email !== '')` + `@IsEmail()` + `@MaxLength(320)`.
 *
 * - omitted   → the API leaves the address unchanged (`.optional()`)
 * - `""`      → the admin is clearing the public contact address; accepted
 * - non-empty → must be a valid email, max 320 (`@IsEmail`/`@MaxLength`)
 * - `null`    → rejected: `@ValidateIf` does not skip it, and it would reach
 *               Prisma as a `NOT NULL` write
 *
 * P10-SEC-001: the earlier Phase-05 shape `z.email().max(320)` was required and
 * non-empty, so the admin settings page's clear-the-field PATCH (`email: ""`)
 * was a 400 **here**, before the DEV-064-fixed API was ever reached. A union
 * (not bare `z.optional()`) lets `""` through while still rejecting a malformed
 * non-empty value locally.
 */
export const updateSiteSettingsBody = z.strictObject({
  siteName: z.string().max(255),
  siteDescription: z.string().max(2000),
  email: z.union([z.literal(""), z.email().max(320)]).optional(),
  phone: z.string().max(64).optional(),
  address: z.string().max(500).optional(),
  socials: z.strictObject({
    facebook: z.string().max(500).optional(),
    twitter: z.string().max(500).optional(),
    instagram: z.string().max(500).optional(),
    youtube: z.string().max(500).optional(),
    tiktok: z.string().max(500).optional(),
    linkedin: z.string().max(500).optional(),
    github: z.string().max(500).optional(),
  }),
  footerText: z.string().max(500).optional(),
});

/** `CreateCategoryDto`. */
export const createCategoryBody = z.strictObject({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  coverImage: z.string().max(2048).optional(),
  pexelsImages: z.array(z.string()).optional(),
});

/** `UpdateCategoryDto`. */
export const updateCategoryBody = z.strictObject({
  id: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).optional(),
  coverImage: z.string().max(2048).optional(),
  pexelsImages: z.array(z.string()).optional(),
});

/** `RemoveCategoryDto`. */
export const removeCategoryBody = z.strictObject({ id: z.string().uuid() });

/** `CreatePillarDto`. */
export const createPillarBody = z.strictObject({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  categoryId: z.string().uuid(),
  description: z.string().max(5000).optional(),
  coverImage: z.string().max(2048).optional(),
  pexelsImages: z.array(z.string()).optional(),
});

/** `UpdatePillarDto`. */
export const updatePillarBody = z.strictObject({
  id: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(255).optional(),
  categoryId: z.string().uuid().optional(),
  description: z.string().max(5000).optional(),
  coverImage: z.string().max(2048).optional(),
  pexelsImages: z.array(z.string()).optional(),
});

/** `RemovePillarDto`. */
export const removePillarBody = z.strictObject({ id: z.string().uuid() });

/* ------------------------------------------------------------------ *
 * Phase 10 domain 7 (admin): articles CRUD
 * ------------------------------------------------------------------ */

/**
 * `ListAdminArticlesQueryDto` — admin article browse + full-text search.
 *
 * `status`/`source` are optional (absent → no filter on the API); the page
 * omits them entirely for its `all` selection rather than sending the literal
 * `"all"`, matching the Nest DTO's own "or `all`" acceptance.
 */
export const adminArticlesQuery = z.strictObject({
  ...paginationQuery,
  categoryId: z.string().uuid().optional(),
  status: z.enum(["draft", "scheduled", "published", "all"]).optional(),
  source: z.enum(["human", "ai", "all"]).optional(),
  search: z.string().max(200).optional(),
  isArchived: z.enum(["true", "false"]).optional(),
});

/**
 * `CreateArticleDto`. Identity (`adminEmail`) and attribution (`authorId`) are
 * **deleted from the contract** (DEV-029/030): a body carrying either is a 400
 * here and at the API. The publish rules (≥4 tags, ≤1 topic, excerpt/content,
 * meta fields) are enforced by Nest, not transcribed here.
 */
export const createArticleBody = z.strictObject({
  title: z.string().min(1).max(500),
  slug: z.string().min(1).max(255),
  excerpt: z.string().max(5000).optional(),
  content: z.string().optional(),
  coverImage: z.string().max(2048).optional(),
  coverImageAlt: z.string().max(500).optional(),
  categoryId: z.string().uuid().optional(),
  pillar: z.string().max(255).optional(),
  topics: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  type: z.enum(["pillar", "cluster", "micro", "insight", "observant"]).optional(),
  status: z.enum(["draft", "scheduled", "published"]),
  source: z.enum(["human", "ai"]),
  scheduledFor: z.string().datetime().optional(),
  isFeatured: z.boolean().optional(),
  metaTitle: z.string().max(500).optional(),
  metaDescription: z.string().max(1000).optional(),
  focusKeyword: z.string().max(255).optional(),
});

/** `UpdateArticleDto` — every create field optional, plus required `id`. */
export const updateArticleBody = z.strictObject({
  id: z.string().uuid(),
  title: z.string().min(1).max(500).optional(),
  slug: z.string().min(1).max(255).optional(),
  excerpt: z.string().max(5000).optional(),
  content: z.string().optional(),
  coverImage: z.string().max(2048).optional(),
  coverImageAlt: z.string().max(500).optional(),
  categoryId: z.string().uuid().optional(),
  pillar: z.string().max(255).optional(),
  topics: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  type: z.enum(["pillar", "cluster", "micro", "insight", "observant"]).optional(),
  status: z.enum(["draft", "scheduled", "published"]).optional(),
  source: z.enum(["human", "ai"]).optional(),
  scheduledFor: z.string().datetime().optional(),
  isFeatured: z.boolean().optional(),
  metaTitle: z.string().max(500).optional(),
  metaDescription: z.string().max(1000).optional(),
  focusKeyword: z.string().max(255).optional(),
});

/** The `id` query for the admin single-article read and hard delete. */
export const articleByIdQuery = z.strictObject({ id: z.string().uuid() });

/** `BulkArticleIdsDto` — archive/restore/delete-forever many. */
export const bulkArticleIdsBody = z.strictObject({
  ids: z.array(z.string().uuid()),
});

/** `DaysQueryDto` for the admin referrer read. */
export const referrerStatsQuery = z.strictObject({
  days: z.coerce.number().int().min(1).optional(),
});

/** `RawVisitsQueryDto` — keyset cursor; an invalid cursor resets to page 1. */
export const rawVisitsQuery = z.strictObject({
  type: z.enum(["all", "visit", "article", "reaction"]).optional(),
  days: z.coerce.number().int().min(1).optional(),
  search: z.string().max(200).optional(),
  cursor: z.string().max(512).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});