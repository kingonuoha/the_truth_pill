import "server-only";

import { mintApiToken, nestApiBaseUrl } from "./api-token";
import type * as Api from "@/types/api";
import type {
  ArticleDetail,
  CategoryListItem,
  FeaturedListItem,
  PaginatedArticles,
  PillarListItem,
  PublicAuthorCard,
  TagListItem,
} from "./content-types";

export type { Api };

/**
 * The `sub` every call must carry.
 *
 * A **verified session user id**, i.e. the Postgres `users.id` the ADR-017 token
 * carries (ADR-007). Never a value from a request body, query, or form field —
 * that is the frozen `updateUserRole` / `addComment` defect (Hard Rule 1).
 *
 * `null` means an **anonymous** caller and sends **no** `Authorization` header.
 * It is valid only for a `@Public()` Nest operation — 41 of the 129 exist — and a
 * caller that uses it against a bearer route gets a clean 401 rather than
 * anything weaker. There is no anonymous principal and no anonymous scope; that
 * would be a new authentication mode and needs its own ADR.
 */
export type ApiSub = string | null;

function assertServer(): void {
  if (typeof window !== "undefined") {
    throw new Error("web/lib/api.ts must only run on the server (RSC, server action, or route handler). Do not import it from a 'use client' module.");
  }
}

async function apiFetch<T>(
  path: string,
  init: RequestInit & { sub: ApiSub },
): Promise<T> {
  assertServer();
  const { sub, headers: headersIn, ...rest } = init;
  const url = `${nestApiBaseUrl()}/api/v1${path.startsWith("/") ? path : `/${path}`}`;

  const headers = new Headers(headersIn);
  // Minted per call and confined to this outbound header. When `API_TOKEN_SECRET`
  // is unset `mintApiToken` throws — fail closed, never an unsigned fallback.
  if (sub !== null) {
    headers.set("Authorization", `Bearer ${mintApiToken(sub).token}`);
  }
  headers.set("Accept", "application/json");
  if (!headers.has("Content-Type") && rest.body) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(url, {
    ...rest,
    headers,
    cache: "no-store",
  });

  const contentType = res.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json")
    ? await res.json().catch(() => null)
    : await res.text().catch(() => null);

  if (!res.ok) {
    const message =
      body && typeof body === "object" && "message" in body
        ? String((body as Record<string, unknown>).message)
        : typeof body === "string"
          ? body
          : `Request failed with status ${res.status}`;
    const error = new Error(message) as Error & {
      status?: number;
      body?: unknown;
    };
    error.status = res.status;
    error.body = body;
    throw error;
  }

  return body as T;
}

export const api = {
  get: <T>(path: string, opts: Omit<RequestInit, "body" | "method"> & { sub: ApiSub }) =>
    apiFetch<T>(path, { ...opts, method: "GET" }),
  post: <T>(path: string, body: unknown, opts: Omit<RequestInit, "body" | "method"> & { sub: ApiSub }) =>
    apiFetch<T>(path, { ...opts, method: "POST", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown, opts: Omit<RequestInit, "body" | "method"> & { sub: ApiSub }) =>
    apiFetch<T>(path, { ...opts, method: "PATCH", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown, opts: Omit<RequestInit, "body" | "method"> & { sub: ApiSub }) =>
    apiFetch<T>(path, { ...opts, method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string, opts: Omit<RequestInit, "body" | "method"> & { sub: ApiSub }) =>
    apiFetch<T>(path, { ...opts, method: "DELETE" }),
};

/**
 * A `@Public()` GET that yields `null` on **404** instead of throwing.
 *
 * The frozen `fetchQuery` sites returned `null` for an unknown slug and the RSC
 * pages branch to `notFound()`; the HTTP client throws a typed 404, so the
 * single-detail reads call this to preserve that contract. Any other status
 * still throws.
 */
async function getOrNull<T>(path: string): Promise<T | null> {
  try {
    return await api.get<T>(path, { sub: null });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      (error as { status?: number }).status === 404
    ) {
      return null;
    }
    throw error;
  }
}

function query(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    search.set(key, String(value));
  }
  const s = search.toString();
  return s === "" ? "" : `?${s}`;
}

export interface ListArticlesParams {
  page?: number;
  pageSize?: number;
  categoryId?: string;
  pillar?: string;
  type?: string;
}

/**
 * Typed server-side reads for React Server Components (SEO-critical pages).
 * Every call is anonymous (`@Public()`); identity-bearing writes go through the
 * BFF or a server action, never here.
 */
export const nest = {
  articleBySlug: (slug: string) =>
    getOrNull<ArticleDetail>(`/articles/by-slug${query({ slug })}`),
  listArticles: (params: ListArticlesParams = {}) =>
    api.get<PaginatedArticles>(`/articles${query({ ...params })}`, { sub: null }),
  featured: (limit: number) =>
    api.get<FeaturedListItem[]>(`/articles/featured${query({ limit })}`, { sub: null }),
  byAuthor: (authorId: string, limit?: number) =>
    api.get<ArticleDetail[]>(`/articles/by-author${query({ authorId, limit })}`, { sub: null }),
  byTag: (tag: string) =>
    api.get<TagListItem[]>(`/articles/by-tag${query({ tag })}`, { sub: null }),
  categories: () =>
    api.get<CategoryListItem[]>("/categories/all", { sub: null }),
  categoryBySlug: (slug: string) =>
    getOrNull<CategoryListItem>(`/categories/by-slug${query({ slug })}`),
  pillars: () =>
    api.get<PillarListItem[]>("/pillars/all", { sub: null }),
  pillarBySlug: (slug: string) =>
    getOrNull<PillarListItem>(`/pillars/by-slug${query({ slug })}`),
  publicAuthor: (id: string) =>
    getOrNull<PublicAuthorCard>(`/users/${encodeURIComponent(id)}`),
};
