"use server";

import { signIn, auth } from "@/auth";
import { AuthError } from "next-auth";
import { api as nestApi } from "@/lib/api";
import {
  ActionError,
  RateLimiter,
  enforceRateLimit,
} from "@/lib/server-action-guards";

/**
 * Public auth server actions. A server action is a public HTTP endpoint
 * (AGENTS.md Security Hard Rule 7, CN-1 gap G1), so each one validates its
 * input and is rate-limited. The OTP actions additionally require a session for
 * the `password_change` flow, which is a signed-in operation.
 */

const registerLimiter = new RateLimiter(5, 60_000);
const otpSendLimiter = new RateLimiter(5, 60_000);
const otpVerifyLimiter = new RateLimiter(10, 60_000);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

type OtpType = "password_reset" | "password_change";

/** Every OTP action resolves to this shape; `error` mirrors `message` on failure. */
interface OtpActionResult {
  success: boolean;
  message: string;
  error?: string;
}

function failure(message: string): OtpActionResult {
  return { success: false, message, error: message };
}

function isEmail(value: unknown): value is string {
  return typeof value === "string" && value.length <= 320 && EMAIL_PATTERN.test(value);
}

function isOtpType(value: unknown): value is OtpType {
  return value === "password_reset" || value === "password_change";
}

function isCode(value: unknown): value is string {
  return typeof value === "string" && /^\d{4,8}$/.test(value);
}

export async function registerUser(formData: FormData) {
  const name = formData.get("name");
  const email = formData.get("email");
  const password = formData.get("password");
  const subscribe = formData.get("subscribe") === "true";

  if (
    typeof name !== "string" ||
    name.trim().length === 0 ||
    !isEmail(email) ||
    typeof password !== "string" ||
    password.length < MIN_PASSWORD_LENGTH
  ) {
    return { error: "Invalid registration details" };
  }

  try {
    enforceRateLimit(registerLimiter, `register:${email.toLowerCase()}`);
  } catch (error) {
    if (error instanceof ActionError) return { error: "Too many requests" };
    throw error;
  }

  try {
    // The password is hashed **server-side** by the API (`PasswordsService`);
    // the frozen web-side `bcrypt.hash` step is dropped (DEV-061).
    await nestApi.post(
      "/users/register",
      { name, email, password, newsletterSubscribed: subscribe },
      { sub: null },
    );

    await signIn("credentials", { email, password, redirect: false });

    return { success: true };
  } catch {
    // Neutral: never surface whether the address already exists.
    return { success: true };
  }
}

export async function loginUser(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");

  if (!isEmail(email) || typeof password !== "string" || password.length === 0) {
    return { error: "Invalid email or password" };
  }

  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return { error: "Invalid credentials" };
    }
    throw error;
  }
}

export async function resetPasswordAction(token: string, formData: FormData) {
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");

  if (
    typeof password !== "string" ||
    password.length < MIN_PASSWORD_LENGTH ||
    password !== confirmPassword
  ) {
    return { error: "Invalid password" };
  }

  try {
    // Token + plaintext password; the API hashes server-side (DEV-061).
    await nestApi.post(
      "/users/password/reset",
      { token, password },
      { sub: null },
    );

    return { success: true };
  } catch {
    return { error: "Invalid or expired reset token" };
  }
}

export async function sendOtpAction(
  email: string,
  type: OtpType,
): Promise<OtpActionResult> {
  if (!isEmail(email) || !isOtpType(type)) {
    return failure("Invalid request");
  }

  // `password_change` is a signed-in operation: require a verified session
  // (CN-1 gap G1). `password_reset` is intentionally usable signed-out.
  if (type === "password_change") {
    const session = await auth();
    if (!session?.user?.email) {
      return failure("Unauthorized");
    }
  }

  try {
    enforceRateLimit(otpSendLimiter, `otp-send:${email.toLowerCase()}`);
  } catch (error) {
    if (error instanceof ActionError) {
      return failure("Too many requests");
    }
    throw error;
  }

  try {
    const result = await nestApi.post<{ success: boolean; message: string }>(
      "/otp/generate-otp",
      { email, type },
      { sub: null },
    );
    return { success: result.success, message: result.message };
  } catch {
    // Neutral failure: do not reveal address existence or lockout state.
    return failure("Failed to send code");
  }
}

export async function verifyAndChangePasswordAction(
  email: string,
  code: string,
  type: OtpType,
  formData: FormData,
): Promise<OtpActionResult> {
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");

  if (!isEmail(email) || !isCode(code) || !isOtpType(type)) {
    return failure("Invalid request");
  }
  if (
    typeof password !== "string" ||
    password.length < MIN_PASSWORD_LENGTH ||
    password !== confirmPassword
  ) {
    return failure("Invalid password");
  }

  if (type === "password_change") {
    const session = await auth();
    if (!session?.user?.email) {
      return failure("Unauthorized");
    }
  }

  try {
    enforceRateLimit(otpVerifyLimiter, `otp-verify:${email.toLowerCase()}`);
  } catch (error) {
    if (error instanceof ActionError) {
      return failure("Too many requests");
    }
    throw error;
  }

  try {
    const result = await nestApi.post<{ success: boolean; message?: string }>(
      "/otp/verify-otp-and-change-password",
      { email, code, type, newPassword: password },
      { sub: null },
    );

    // One identical failure message on every path (R4).
    return result.success
      ? { success: true, message: result.message ?? "" }
      : failure("Invalid or expired code");
  } catch {
    return failure("Invalid or expired code");
  }
}
