"use client";

import { usePathname } from "next/navigation";
import { Footer } from "./footer";

export function FooterWrapper() {
    const pathname = usePathname();
    const isExcludedPage = pathname?.startsWith("/admin") || pathname?.startsWith("/dashboard") || pathname?.startsWith("/auth");

    if (isExcludedPage) return null;

    return <Footer />;
}
