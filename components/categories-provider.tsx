"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useConvex } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

export type CategorySummary = {
  _id: Id<"categories">;
  _creationTime: number;
  name: string;
  slug: string;
  description?: string;
  coverImage?: string;
  pexelsImages?: string[];
  articleCount: number;
  pillarCount: number;
  createdAt?: number;
};

export type PillarSummary = {
  _id: Id<"pillars">;
  _creationTime: number;
  name: string;
  slug: string;
  description?: string;
  coverImage?: string;
  pexelsImages?: string[];
  categoryId: Id<"categories">;
  createdAt?: number;
  categoryName: string;
  categorySlug: string;
};

interface PublicDataContextValue {
  categories: CategorySummary[] | undefined;
  pillars: PillarSummary[] | undefined;
}

const PublicDataContext = createContext<PublicDataContextValue>({
  categories: undefined,
  pillars: undefined,
});

/**
 * Fetches `api.categories.listAll` + `api.pillars.listAll` ONCE per app load
 * via a one-shot, non-reactive `useConvex().query()` call and caches them.
 * Public components (navbar, category-showcase, filtered-blog-grid) consume the
 * cache instead of opening a live subscription on every mount.
 */
export function CategoriesProvider({ children }: { children: ReactNode }) {
  const convex = useConvex();
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
          convex.query(api.categories.listAll),
          convex.query(api.pillars.listAll),
        ]);
        if (!cancelled) {
          setCategories(cats as CategorySummary[]);
          setPillars(pils as PillarSummary[]);
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
  }, [convex]);

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
