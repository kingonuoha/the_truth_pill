"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { bffFetch } from "@/lib/bff-client";
import type { CategoryListItem, PillarListItem } from "@/lib/content-types";

export type CategorySummary = CategoryListItem;
export type PillarSummary = PillarListItem;

interface PublicDataContextValue {
  categories: CategorySummary[] | undefined;
  pillars: PillarSummary[] | undefined;
}

const PublicDataContext = createContext<PublicDataContextValue>({
  categories: undefined,
  pillars: undefined,
});

/**
 * Fetches the public category + pillar lists ONCE per app load via the BFF
 * (`GET /api/categories`, `GET /api/pillars`) and caches them. Public components
 * (navbar, category-showcase, filtered-blog-grid) consume the cache instead of
 * opening a live subscription on every mount.
 *
 * The shapes are the generated `CategoryListItemDto` / `PillarListItemDto`, so
 * the record id is the Nest UUID (`id`), never a legacy Convex `_id`.
 */
export function CategoriesProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<CategorySummary[] | undefined>(
    undefined,
  );
  const [pillars, setPillars] = useState<PillarSummary[] | undefined>(
    undefined,
  );
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    let cancelled = false;
    (async () => {
      try {
        const [cats, pils] = await Promise.all([
          bffFetch<CategorySummary[]>("/api/categories"),
          bffFetch<PillarSummary[]>("/api/pillars"),
        ]);
        if (!cancelled) {
          setCategories(cats);
          setPillars(pils);
        }
      } catch (error) {
        console.error("Failed to load public data:", error);
        if (!cancelled) {
          setCategories([]);
          setPillars([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PublicDataContext.Provider value={{ categories, pillars }}>
      {children}
    </PublicDataContext.Provider>
  );
}

export function useCategories() {
  return useContext(PublicDataContext).categories;
}

export function usePillars() {
  return useContext(PublicDataContext).pillars;
}
