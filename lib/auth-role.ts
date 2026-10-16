/**
 * Display-only role normalisation for the Auth.js session.
 *
 * **This value is never an authorization input.** Per DEV-032 / ADR-007 the role
 * that decides whether a request may do admin work is read from the Postgres
 * `users` row by the Nest `RolesGuard` on every request, keyed on the verified
 * token `sub`. The copy carried on the session exists for one reason: so the
 * navbar and the post-sign-in redirect know which shell to send a person to.
 *
 * Fails closed — anything that is not exactly `"admin"` becomes `"user"`, so a
 * missing, malformed, or forged value can only ever hide navigation, never
 * reveal it.
 */
export type SessionRole = "admin" | "user";

export function toSessionRole(value: unknown): SessionRole {
  return value === "admin" ? "admin" : "user";
}
