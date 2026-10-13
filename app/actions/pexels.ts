"use server";

import { headers } from "next/headers";
import { getDynamicImages } from "@/lib/pexels";
import {
  clampPexelsParams,
  enforceRateLimit,
  parseClientIp,
  RateLimiter,
  TtlCache,
} from "@/lib/server-action-guards";

// DEV-038 (S-025): public category imagery.
//
// Category pages are a public, projection-constrained group (Phase 00 §10(b)),
// so this action must NOT require a session — a signed-out visitor has to see
// category imagery. Authentication was the wrong control: the action neither
// exposes the key nor writes anything. The real S-025 defect is the unclamped
// third-party consumption primitive, fixed by clamping `limit`/`page`, a per-IP
// rate limit, and a short server-side TTL cache so repeated public renders do
// not hammer Pexels.
//
// Unit: web/tests/s-025-pexels.test.ts.
const PEXELS_WINDOW_MS = 60_000;
const PEXELS_CACHE_TTL_MS = 60_000;
const pexelsLimiter = new RateLimiter(30, PEXELS_WINDOW_MS);
const pexelsCache = new TtlCache<string[]>(PEXELS_CACHE_TTL_MS);

/**
 * Rate-limit key: the validated client IP (Hard Rule 1 — never a body value).
 * An absent or malformed `x-forwarded-for` yields a shared "unknown" bucket.
 */
async function callerKey(): Promise<string> {
  const headerList = await headers();
  return parseClientIp(headerList.get("x-forwarded-for")) ?? "unknown";
}

export async function fetchCategoryImages(
  categoryName: string,
  limit: number = 5,
  page: number = 1,
): Promise<string[]> {
  const params = clampPexelsParams(limit, page);
  enforceRateLimit(pexelsLimiter, await callerKey());

  const cacheKey = `${categoryName}\u0000${params.limit}\u0000${params.page}`;
  const cached = pexelsCache.get(cacheKey);
  if (cached) return cached;

  const urls = await getDynamicImages(categoryName, params.limit, params.page);
  pexelsCache.set(cacheKey, urls);
  return urls;
}

export async function fetchCategoryImage(categoryName: string): Promise<string> {
  const urls = await fetchCategoryImages(categoryName, 5, 1);
  if (urls.length === 0) return "";
  const randomIndex = Math.floor(Math.random() * urls.length);
  return urls[randomIndex];
}
