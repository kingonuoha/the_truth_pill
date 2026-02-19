"use server";

import { headers } from "next/headers";
import { fetchMutation } from "convex/nextjs";
import { api } from "../../convex/_generated/api";
import { UAParser } from "ua-parser-js";

export async function trackVisit(data: {
  visitorId: string;
  url: string;
  referrer?: string;
}) {
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for") || "127.0.0.1";
  const userAgent = headerList.get("user-agent") || "unknown";

  // Parse User Agent
  const parser = new UAParser(userAgent);
  const result = parser.getResult();
  const deviceType = result.device.type || "desktop";
  const browserName = result.browser.name || "Unknown";
  const osName = result.os.name || "Unknown";

  // Fetch GeoIP data
  let geoLocation = undefined;
  try {
    // ipapi.co provides free geo data for development
    // In production, you might want to use a more robust service or a local DB
    if (ip !== "127.0.0.1" && ip !== "::1") {
      const geoResponse = await fetch(`https://ipapi.co/${ip}/json/`);
      if (geoResponse.ok) {
        const geoData = await geoResponse.json();
        geoLocation = {
          country: geoData.country_name,
          city: geoData.city,
        };
      }
    }
  } catch (error) {
    console.error("Failed to fetch geo location:", error);
  }

  try {
    await fetchMutation(api.analytics.logPageVisit, {
      visitorId: data.visitorId,
      url: data.url,
      ipAddress: ip,
      geoLocation,
      device: deviceType,
      browser: browserName,
      os: osName,
      referrer: data.referrer,
    });
  } catch (error) {
    console.error("Failed to track visit:", error);
  }
}
