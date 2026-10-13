"use server";

import { headers } from "next/headers";
import { auth } from "@/auth";
import { api as nestApi } from "@/lib/api";
import { parseStrictBody } from "@/lib/bff";
import { logArticleViewBody, logHeartbeatBody } from "@/lib/bff-schemas";
import {
  enforceRateLimit,
  parseClientIp,
  RateLimiter,
} from "@/lib/server-action-guards";

/**
 * Article-view + heartbeat writes — the article-page analytics half of Phase 10
 * domain 5, plus the Phase 10 page-visit beacon (now emitted by
 * `components/analytics-tracker.tsx` through the BFF).
 *
 * The Nest routes are `@Public()` + `@OptionalAuth()` (DEV-058), so the session
 * `sub` is forwarded when present and the call is anonymous otherwise. Identity
 * is the verified session — never a body field. The API validates the UUIDs and
 * the 0–3600 s bound.
 *
 * P10-SEC-002 (Hard Rule 7 / DoD #19): a server action is a public HTTP
 * endpoint. These two forward a caller-chosen `{articleId, visitorId, seconds}`
 * with no local validation and no local throttle, so a client could inflate
 * `uniqueViewCount` with distinct `visitorId`s and drive unthrottled DB writes.
 * They now parse a strict schema (unknown field → 400) and consume a per-client-IP
 * budget before `auth()` or the outbound call. Nest's `(articleId, visitorId)`
 * dedup and 24 h view cooldown remain the second line of defence — untouched.
 */
const ANALYTICS_WINDOW_MS = 60_000;

/**
 * 60/min per client IP — the same budget as the guarded BFF `ingest:analytics`
 * route, which is the closest surface these actions mirror. Each action gets its
 * own bucket, so a view burst cannot exhaust the heartbeat budget (or vice
 * versa). Per-instance on Vercel, like every limiter in this project; a shared
 * store is a Phase 11 item.
 */
const VIEW_LIMIT = new RateLimiter(60, ANALYTICS_WINDOW_MS);
const HEARTBEAT_LIMIT = new RateLimiter(60, ANALYTICS_WINDOW_MS);

/**
 * Rate-limit key: the validated client IP (Hard Rule 1 — never a body value).
 *
 * `rateLimitRoute` in `lib/bff.ts` is not usable here because it takes a
 * `Request`, which a server action does not have. This is the minimal
 * equivalent over `headers()`, reusing the same `RateLimiter` / `parseClientIp`
 * primitives — the `app/actions/pexels.ts` pattern. An absent or malformed
 * `x-forwarded-for` yields the shared `"unknown"` bucket, the stricter default.
 */
async function callerKey(): Promise<string> {
  const headerList = await headers();
  return parseClientIp(headerList.get("x-forwarded-for")) ?? "unknown";
}

export async function trackArticleView(data: {
  articleId: string;
  visitorId: string;
}): Promise<void> {
  enforceRateLimit(VIEW_LIMIT, await callerKey());
  const body = parseStrictBody(logArticleViewBody, data);
  const session = await auth();
  try {
    await nestApi.post("/analytics/log-article-view", body, {
      sub: session?.user?.id ?? null,
    });
  } catch (error) {
    console.error("Failed to log article view:", error);
  }
}

export async function trackHeartbeat(data: {
  articleId: string;
  visitorId: string;
  seconds: number;
}): Promise<void> {
  enforceRateLimit(HEARTBEAT_LIMIT, await callerKey());
  const body = parseStrictBody(logHeartbeatBody, data);
  const session = await auth();
  try {
    await nestApi.post("/analytics/log-heartbeat", body, {
      sub: session?.user?.id ?? null,
    });
  } catch (error) {
    console.error("Failed to log heartbeat:", error);
  }
}
