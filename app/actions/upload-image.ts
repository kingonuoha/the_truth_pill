"use server";

import { v2 as cloudinary } from "cloudinary";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { api as nestApi } from "@/lib/api";
import {
  ActionError,
  assertAdminRole,
  assertUploadAllowed,
  enforceRateLimit,
  parseClientIp,
  RateLimiter,
} from "@/lib/server-action-guards";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// DEV-004: the upload endpoint is public and expensive (a Convex read plus a
// Cloudinary round-trip), so it is throttled by client IP before the session is
// even read. Best-effort per-instance — see RateLimiter's note.
const uploadLimiter = new RateLimiter(10, 60_000);

async function requireAdmin() {
  const session = await auth();
  const sub = session?.user?.id ?? null;

  // The role is re-read from the API for the **verified token `sub`**
  // (`GET /users/me`), never from `session.user.role` — the token claim can be
  // stale after a demotion (DEV-032) — and never from a body email (DEV-029).
  // A failed or anonymous lookup denies (role stays undefined).
  let role: string | undefined;
  try {
    if (sub) {
      const me = await nestApi.get<{ role: string }>("/users/me", { sub });
      role = me.role;
    }
  } catch (error) {
    console.error(
      "Upload authorization lookup failed:",
      error instanceof Error ? error.message : "unknown error",
    );
  }

  assertAdminRole(role);
}

// The returned URL is written straight into article records and rendered as an
// <img> source, so only this account's own Cloudinary delivery host is
// accepted. Fails closed: a missing CLOUDINARY_CLOUD_NAME rejects rather than
// skipping the check, so a misconfigured environment cannot widen the result.
function assertTrustedUrl(url: string) {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new ActionError(422, "Upload failed");
  }

  if (parsed.protocol !== "https:" || parsed.hostname !== "res.cloudinary.com") {
    throw new ActionError(422, "Upload failed");
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName || !parsed.pathname.startsWith(`/${cloudName}/`)) {
    throw new ActionError(422, "Upload failed");
  }

  return url;
}

async function uploadToCloudinary(buffer: Buffer, format: string) {
  let secureUrl: string;
  try {
    secureUrl = await new Promise<string>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "truth-pill-articles",
            // Second gate, enforced by Cloudinary against the account itself, so
            // the format bound holds even if the checks above were bypassed.
            resource_type: "image",
            allowed_formats: [format],
          },
          (error, result) => {
            if (error || !result) reject(error ?? new Error("Upload failed"));
            else resolve(result.secure_url);
          },
        )
        .end(buffer);
    });
  } catch (error) {
    // Only the HTTP status is logged, never error.message. A signed upload
    // request carries api_key and signature in its URL, and the Cloudinary
    // SDK's transport-level failures can embed that URL in the error, so the
    // message is not guaranteed to be free of credential material. The status
    // code is enough to tell a 401 from a 413 from a 5xx.
    const status =
      typeof error === "object" &&
      error !== null &&
      "http_code" in error &&
      typeof (error as { http_code: unknown }).http_code === "number"
        ? (error as { http_code: number }).http_code
        : "unknown";
    console.error("Cloudinary upload failed. http_status:", status);
    throw new Error("Upload failed");
  }

  return assertTrustedUrl(secureUrl);
}

export async function uploadImage(formData: FormData): Promise<string> {
  const headerList = await headers();
  const clientIp = parseClientIp(headerList.get("x-forwarded-for")) ?? "unknown";
  enforceRateLimit(uploadLimiter, clientIp);

  await requireAdmin();

  const entry = formData.get("file");
  if (!(entry instanceof File)) throw new ActionError(422, "No file provided");

  const format = await assertUploadAllowed(entry);
  const buffer = Buffer.from(await entry.arrayBuffer());
  return uploadToCloudinary(buffer, format);
}
