"use server";

import { v2 as cloudinary } from "cloudinary";
import { fetchQuery } from "convex/nextjs";
import { auth } from "@/auth";
import { api } from "@/convex/_generated/api";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const SIGNATURE_BYTES = 12;

// Allowlist, not a denylist: an unrecognised type is rejected rather than
// permitted, so a new or malformed type cannot slip past. image/svg+xml is
// deliberately absent — SVG can carry script and is delivered from this site's
// own Cloudinary host.
//
// A Map, not an object literal. `{"image/png": "png"}["constructor"]` and
// `["__proto__"]` resolve up the prototype chain to truthy values, which would
// hand a non-image Content-Type a format string and defeat the allowlist.
const ALLOWED_FORMATS = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
  ["image/avif", "avif"],
]);

function startsWithAscii(bytes: Uint8Array, offset: number, value: string) {
  for (let i = 0; i < value.length; i++) {
    if (bytes[offset + i] !== value.charCodeAt(i)) return false;
  }
  return true;
}

// entry.type is client-declared, so it is only trusted once the bytes agree.
// An out-of-range read yields undefined, which fails the comparison, so a
// truncated header is rejected rather than throwing.
function hasImageSignature(type: string, bytes: Uint8Array) {
  switch (type) {
    case "image/jpeg":
      return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    case "image/png":
      return startsWithAscii(bytes, 0, "\x89PNG\r\n\x1a\n");
    case "image/gif":
      return (
        startsWithAscii(bytes, 0, "GIF87a") || startsWithAscii(bytes, 0, "GIF89a")
      );
    case "image/webp":
      return (
        startsWithAscii(bytes, 0, "RIFF") && startsWithAscii(bytes, 8, "WEBP")
      );
    case "image/avif":
      return (
        startsWithAscii(bytes, 4, "ftyp") &&
        (startsWithAscii(bytes, 8, "avif") || startsWithAscii(bytes, 8, "avis"))
      );
    default:
      return false;
  }
}

async function requireAdmin() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) throw new Error("Unauthorized");

  // The role is re-read from the database instead of being taken from
  // session.user.role. middleware.ts trusts token.role, and auth.ts's jwt
  // callback swallows a failed Convex read, so the token's role can be stale
  // after a demotion or missing entirely. users.currentUser is a plain
  // by_email query and never touches ctx.auth, which is permanently null
  // (S-004), so this read is sound. `email` comes from the verified session,
  // never from the request body.
  //
  // A failed lookup denies. The message is logged because a Convex query
  // error carries the function name and the email, neither of which is a
  // credential, and losing it would make this denial undiagnosable.
  let role: string | undefined;
  try {
    const dbUser = await fetchQuery(api.users.currentUser, { email });
    role = dbUser?.role;
  } catch (error) {
    console.error(
      "Upload authorization lookup failed:",
      error instanceof Error ? error.message : "unknown error",
    );
  }

  if (role !== "admin") throw new Error("Unauthorized");
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
    throw new Error("Upload failed");
  }

  if (parsed.protocol !== "https:" || parsed.hostname !== "res.cloudinary.com") {
    throw new Error("Upload failed");
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName || !parsed.pathname.startsWith(`/${cloudName}/`)) {
    throw new Error("Upload failed");
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
  await requireAdmin();

  const entry = formData.get("file");
  if (!(entry instanceof File)) throw new Error("No file provided");
  if (entry.size === 0) throw new Error("No file provided");

  // Checked before arrayBuffer() so an oversized body is never materialised as
  // a Buffer. next.config.ts sets serverActions.bodySizeLimit to "50mb", so
  // this 5 MB bound is the binding one.
  if (entry.size > MAX_FILE_SIZE_BYTES) throw new Error("File too large");

  const format = ALLOWED_FORMATS.get(entry.type);
  if (!format) throw new Error("Unsupported file type");

  const head = new Uint8Array(
    await entry.slice(0, SIGNATURE_BYTES).arrayBuffer(),
  );
  if (!hasImageSignature(entry.type, head)) {
    throw new Error("Unsupported file type");
  }

  const buffer = Buffer.from(await entry.arrayBuffer());
  return uploadToCloudinary(buffer, format);
}
