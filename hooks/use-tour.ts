"use client";

import { useEffect, useRef, useState } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useSession } from "next-auth/react";
import { TOUR_DEFINITIONS } from "@/lib/tours/config";
import { bffFetch } from "@/lib/bff-client";
import type { SelfUser } from "@/lib/content-types";

export function useTour(tourId: string, isReady: boolean = true) {
  const { status } = useSession();
  const [user, setUser] = useState<SelfUser | null>(null);
  const hasStartedRef = useRef(false);

  // The caller's own profile comes from the session (`GET /api/me`), not a
  // `?email=` selector (DEV-029).
  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    (async () => {
      try {
        const me = await bffFetch<SelfUser>("/api/me");
        if (!cancelled) setUser(me);
      } catch {
        if (!cancelled) setUser(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);

  // A signed-out session must not reuse a stale profile. Deriving this instead
  // of clearing `user` inside the effect avoids react-hooks/set-state-in-effect.
  const effectiveUser = status === "authenticated" ? user : null;

  useEffect(() => {
    if (!isReady || !effectiveUser || hasStartedRef.current) return;

    const completedTours = effectiveUser.completedTours || [];
    if (completedTours.includes(tourId)) return;

    const steps = TOUR_DEFINITIONS[tourId];
    if (!steps) {
      console.warn(`Tour config for "${tourId}" not found.`);
      return;
    }

    hasStartedRef.current = true;

    // Small delay to ensure the DOM elements are fully rendered and animated
    const timeoutId = setTimeout(() => {
      const driverObj = driver({
        showProgress: true,
        steps: steps,
        onDestroyStarted: () => {
          // Fire completion to the API when the tour finishes/skips.
          bffFetch("/api/me/tours", { method: "POST", body: { tourId } }).catch(
            (err) => console.error("Failed to mark tour completed:", err),
          );
          driverObj.destroy();
        },
      });

      driverObj.drive();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [effectiveUser, isReady, tourId]);

  return {
    startTour: () => {
      /* Optional manual start */
      const steps = TOUR_DEFINITIONS[tourId];
      if (steps) {
        const driverObj = driver({ steps, showProgress: true });
        driverObj.drive();
      }
    },
  };
}
