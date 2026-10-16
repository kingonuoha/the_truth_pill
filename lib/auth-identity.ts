/**
 * Identity parsing for the Google sign-in handshake.
 *
 * `POST /api/v1/internal/users/store` upserts the OAuth profile and returns the
 * **Postgres** row id. That id — not anything the OAuth layer invented — is the
 * subject every downstream layer keys on: Auth.js stores it on `token.sub`, the
 * session exposes it as `user.id`, and the BFF mints the ADR-017 bearer from it
 * (`lib/bff.ts` → `requireCallerSub`). Nest resolves the caller by `users.id`.
 *
 * ⚠️ Why this exists. `@auth/core` does not use the provider's subject as the
 * user id — `getUserAndAccount` assigns `crypto.randomUUID()` instead
 * (`@auth/core/lib/actions/callback/oauth/callback.js`), and the upsert response
 * was previously discarded (`return response.ok`). So `token.sub` became a fresh
 * random UUID on every Google sign-in, no `users` row matched it, and Nest
 * answered `401 Unknown subject` to every call the session made — the dashboard,
 * the profile, all engagement. Google sign-in produced a session that could not
 * read its own data. Assigning the upserted id to `user.id` is what makes the
 * session resolvable; `handleLoginOrRegister` returns the `user` object by
 * reference when no adapter is configured, so the assignment reaches the `jwt`
 * callback.
 */

/**
 * Runtime-validate the store response and extract the row id.
 *
 * Returns `null` — never a throw, never a cast — so the caller can fail the
 * sign-in closed (Hard Rule 4: no internal detail escapes). The `id` must be a
 * non-empty string; a blank id is as unusable as a missing one and must not be
 * allowed to become an empty `token.sub`.
 */
export function parseStoredUserId(value: unknown): string | null {
  if (typeof value !== "object" || value === null || !("id" in value)) {
    return null;
  }
  const id: unknown = value.id;
  if (typeof id !== "string") return null;
  const trimmed = id.trim();
  return trimmed === "" ? null : trimmed;
}
