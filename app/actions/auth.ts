"use server";

import { api } from "@/convex/_generated/api";
import { fetchMutation } from "convex/nextjs";
import bcrypt from "bcryptjs";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export async function registerUser(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const subscribe = formData.get("subscribe") === "true";

  if (!name || !email || !password) {
    return { error: "Missing required fields" };
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await fetchMutation(api.users.register, {
      name,
      email,
      password: hashedPassword,
      newsletterSubscribed: subscribe,
    });

    // Auto-login after registration
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    return { success: true };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Registration error:", err);
    return { error: err.message || "Failed to register" };
  }
}

export async function loginUser(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Missing email or password" };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials" };
        default:
          return { error: "Something went wrong" };
      }
    }
    throw error;
  }
}
export async function resetPasswordAction(token: string, formData: FormData) {
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    return { error: "Missing required fields" };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = (await fetchMutation(api.users.resetPassword, {
      token,
      password: hashedPassword,
    })) as { success: boolean; message?: string };

    if (result.success) {
      return { success: true };
    } else {
      return { error: result.message || "Failed to reset password" };
    }
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Reset password error:", err);
    return { error: err.message || "Failed to reset password" };
  }
}

export async function sendOtpAction(
  email: string,
  type: "password_reset" | "password_change",
) {
  try {
    const result = await fetchMutation(api.otp.generateOtp, { email, type });
    return {
      success: result.success,
      message: result.message,
    };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("OTP send error:", err);
    return {
      success: false,
      error: err.message || "Failed to send code",
      message: err.message || "Failed to send code",
    };
  }
}

export async function verifyAndChangePasswordAction(
  email: string,
  code: string,
  type: "password_reset" | "password_change",
  formData: FormData,
) {
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    return {
      success: false,
      error: "Missing required fields",
      message: "Missing required fields",
    };
  }

  if (password !== confirmPassword) {
    return {
      success: false,
      error: "Passwords do not match",
      message: "Passwords do not match",
    };
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = (await fetchMutation(api.otp.verifyOtpAndChangePassword, {
      email,
      code,
      type,
      newPassword: hashedPassword,
    })) as { success: boolean; message?: string };

    return {
      success: result.success,
      message: result.message || "",
      error: result.success ? undefined : result.message || "Action failed",
    };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("OTP Verification/Password change error:", err);
    return {
      success: false,
      error: err.message || "Failed to change password",
      message: err.message || "Failed to change password",
    };
  }
}
