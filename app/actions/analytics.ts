"use server";

import { headers } from "next/headers";
import { fetchMutation } from "convex/nextjs";
import { api } from "../../convex/_generated/api";

export async function trackVisit(data: {
  visitorId: string;
  url: string;
  referrer?: string;
}) {
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for") || "127.0.0.1";
  const userAgent = headerList.get("user-agent") || "unknown";

  // Basic OS/Browser detection (in a real app, use a library)
  const isMobile = /mobile/i.test(userAgent);
  const isTablet = /tablet/i.test(userAgent);
  const device = isMobile ? "mobile" : isTablet ? "tablet" : "desktop";

  // This would ideally call a Geo IP service
  // For now, we'll log what we have

  try {
    await fetchMutation(api.analytics.logPageVisit, {
      visitorId: data.visitorId,
      url: data.url,
      ipAddress: ip,
      device: device,
      browser: userAgent.split(" ")[0], // Simplified
      os: "Detected from UA", // Simplified
      referrer: data.referrer,
    });
  } catch (error) {
    console.error("Failed to track visit:", error);
  }
}
