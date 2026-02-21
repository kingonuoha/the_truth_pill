import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const getVisitorId = (): string => {
  if (typeof window === "undefined") return "";

  let id = localStorage.getItem("tp_visitor_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("tp_visitor_id", id);
  }
  return id;
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getTimeAgo(date: number | Date) {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths}mo ago`;
  return `${Math.floor(diffInMonths / 12)}y ago`;
}

export function getAvatarUrl(name?: string, image?: string) {
  if (image) return image;
  const fallbackName = name ? encodeURIComponent(name) : "User";
  return `https://ui-avatars.com/api/?name=${fallbackName}&background=E0E7FF&color=4338CA&bold=true`;
}

export function getOgImageUrl(title: string) {
  const cloudName = "dsqs5h1r3";
  // The Truth Pill gradient: Sky Blue (#0ea5e9) to purple (#a855f7)
  const encodedTitle = encodeURIComponent(
    title.replace(/,/g, "%2C").replace(/\//g, "%2F"),
  );

  // Cloudinary dynamic OG image with text overlay and "gradient" effect
  // We use sky blue background (b_rgb:0ea5e9) and a purple gradient overlay (e_gradient_fade)
  return `https://res.cloudinary.com/${cloudName}/image/upload/w_1200,h_630,c_fill,q_auto,f_auto/b_rgb:0ea5e9/e_gradient_fade,y_-0.8,co_rgb:a855f7/l_text:lora_70_bold:${encodedTitle},co_white,w_1000,c_fit,y_-50/l_text:outfit_30_bold:The%20Truth%20Pill,co_white,g_south,y_50/v1/one-pixel.png`;
}
export function truncate(str: string, length: number) {
  if (!str) return "";
  return str.length > length ? str.substring(0, length - 3) + "..." : str;
}
