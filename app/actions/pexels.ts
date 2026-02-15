"use server";

import { getDynamicImage } from "@/lib/pexels";

export async function fetchCategoryImage(categoryName: string) {
  return await getDynamicImage(categoryName);
}
