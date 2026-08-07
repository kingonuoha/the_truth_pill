"use client";

import { useEffect, useRef } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useQuery, useMutation } from "convex/react";
import { useSession } from "next-auth/react";
import { api } from "@/convex/_generated/api";
import { TOUR_DEFINITIONS } from "@/lib/tours/config";

export function useTour(tourId: string, isReady: boolean = true) {
  const { data: session } = useSession();
  const email = session?.user?.email;
  
  const user = useQuery(api.users.currentUser, email ? { email } : "skip");
  const completeTour = useMutation(api.users.completeTour);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (!isReady || !user || !email || hasStartedRef.current) return;

    const completedTours = user.completedTours || [];
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
          // Fire completion to Convex Database when tour finishes/skips
          completeTour({ tourId, email }).catch((err) =>
            console.error("Failed to mark tour completed:", err)
          );
          driverObj.destroy();
        },
      });

      driverObj.drive();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [user, email, isReady, tourId, completeTour]);

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
