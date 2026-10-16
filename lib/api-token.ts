import { createHmac, randomUUID } from "node:crypto";

/**
 * Server-side minter for the ADR-017 purpose-issued API access token.
 *
 * Must only ever run on the server (RSC / server action / route handler). The
 * `API_TOKEN_SECRET` is a server-only variable — it is never `NEXT_PUBLIC_*`,
 * and the token never reaches the browser bundle. The token is the *only*
 * credential the Nest API accepts (authorization: `Bearer <token>`).
 *
 * Mirrors `api/src/modules/auth/token.service.ts`; the claim contract is
 * ADR-017: HS256, `iss` = site URL (no trailing slash), `aud` = `truth-pill-api`,
 * `sub` = Postgres `users.id`, `exp` = `iat + 300`, and a `jti`. No role claim.
 */

const AUDIENCE = "truth-pill-api";
const TTL_SECONDS = 300;

export interface MintedApiToken {
  token: string;
  expiresIn: number;
  jti: string;
}

function base64Url(input: Buffer | string): string {
  const buffer = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buffer
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thetruthpill.org";
  return raw.replace(/\/+$/, "");
}

/**
 * Mint an API access token for `sub`. Throws if `API_TOKEN_SECRET` is unset —
 * there is no unsigned fallback (ADR-017: fail closed).
 */
export function mintApiToken(sub: string): MintedApiToken {
  const secret = process.env.API_TOKEN_SECRET;
  if (typeof secret !== "string" || secret.length === 0) {
    throw new Error("API_TOKEN_SECRET is not configured");
  }

  const now = Math.floor(Date.now() / 1000);
  const jti = randomUUID();
  const signingInput = `${base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }))}.${base64Url(
    JSON.stringify({
      iss: siteUrl(),
      aud: AUDIENCE,
      sub,
      jti,
      iat: now,
      exp: now + TTL_SECONDS,
    }),
  )}`;
  const signature = base64Url(
    createHmac("sha256", secret).update(signingInput).digest(),
  );

  return { token: `${signingInput}.${signature}`, expiresIn: TTL_SECONDS, jti };
}

/** The server-only base URL of the Nest API. */
export function nestApiBaseUrl(): string {
  const raw = process.env.NEST_API_URL ?? "http://localhost:3001";
  // The calls made through this base carry site-wide credentials: the ADR-017
  // bearer, and `x-internal-secret`, which mints a password-reset token for any
  // address. Plain HTTP to a non-loopback host would put both on the wire, so a
  // non-TLS remote is refused rather than trusted.
  const url = new URL(raw);
  const loopback = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  if (url.protocol !== "https:" && !loopback) {
    throw new Error("NEST_API_URL must use https for a non-loopback host");
  }
  return raw.replace(/\/+$/, "");
}
