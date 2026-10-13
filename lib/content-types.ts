/**
 * Shared, import-safe aliases to the **generated** API contract
 * (`docs/types/api.ts`, ADR-009). No shape is hand-written here — each name is a
 * direct alias, so a contract change flows through by regeneration alone (G4).
 *
 * Client components import from this module; server components may too. It has
 * no runtime code and no `server-only` marker, so it is safe in both graphs.
 */

import type * as Api from "@/types/api";

type Schemas = Api.components["schemas"];

export type ArticleListItem = Schemas["ArticleListItemDto"];
export type ArticleDetail = Schemas["ArticleDetailDto"];
export type FeaturedListItem = Schemas["FeaturedListItemDto"];
export type TagListItem = Schemas["TagListItemDto"];
export type PaginatedArticles = Schemas["PaginatedArticleListItemDto"];
export type CategoryListItem = Schemas["CategoryListItemDto"];
export type CategoryResponse = Schemas["CategoryResponseDto"];
export type PillarListItem = Schemas["PillarListItemDto"];
export type PaginatedArticleDetail = Schemas["PaginatedArticleDetailDto"];
export type ArticleRecord = Schemas["ArticleRecordDto"];
export type SuccessResult = Schemas["SuccessDto"];
export type PublicAuthorCard = Schemas["AuthorCardResponseDto"];
export type Engagement = Schemas["EngagementDto"];
export type Comment = Schemas["CommentDto"];
export type SiteSettings = Schemas["SiteSettingsResponseDto"];
export type AdsSettings = Schemas["AdsSettingsResponseDto"];
export type DashboardStats = Schemas["DashboardStatsDto"];
export type ActivityItemDto = Schemas["ActivityItemDto"];
export type TrafficStats = Schemas["TrafficStatsDto"];
export type AdminComment = Schemas["AdminCommentDto"];
export type AdminUser = Schemas["AdminUserProjectionDto"];
export type PaginatedAdminUsers = Schemas["PaginatedAdminUserDto"];
export type EmailLog = Schemas["EmailLogDto"];

/** Admin AI surface (`docs/endpoints/ai.md`). */
export type AiSettings = Schemas["AiSettingsDto"];
export type AiSchedule = Schemas["ScheduleDto"];
export type AiResearchTopic = Schemas["ResearchTopicDto"];
export type ConnectionResult = Schemas["ConnectionResultDto"];
export type ShuffleSuggestion = Schemas["ShuffleSuggestionDto"];

/** Admin analytics reads (`docs/endpoints/analytics.md`). */
export type AnalyticsNameValue = Schemas["NameValueDto"];
export type AnalyticsReferrer = Schemas["ReferrerStatDto"];
export type AnalyticsGeographicStat = Schemas["GeographicStatDto"];
export type AnalyticsDeviceStats = Schemas["DeviceStatsDto"];
export type AnalyticsTopContent = Schemas["TopContentDto"];
export type AnalyticsPageVisit = Schemas["PageVisitDto"];
export type AnalyticsRawVisitRow = Schemas["RawVisitRowDto"];
export type AnalyticsRawVisitsPage = Schemas["RawVisitsPageDto"];

/** The caller's own projection (`GET /users/me`). */
export type SelfUser = Schemas["SelfUserResponseDto"];

/** `GET /users/me/full` — the self projection plus `stats` (D10-24). */
export type SelfFull = Schemas["SelfUserFullResponseDto"];

/** The `article.counters` SSE frame's `data` (docs/endpoints/realtime.md §3). */
export interface ArticleCounters {
  articleId: string;
  viewCount: number;
  uniqueViewCount: number;
  actualReadingTime?: number;
}
