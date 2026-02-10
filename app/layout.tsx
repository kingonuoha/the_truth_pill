import type { Metadata } from "next";
import { Geist, Lora, Outfit } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Truth Pill | Insight into Human Behavior",
  description: "A psychology-focused content platform for living a full life and understanding human behavior.",
};

import { AnalyticsTracker } from "@/components/analytics-tracker";
import { AuthRedirect } from "@/components/auth-redirect";
import { Footer } from "@/components/footer";
import { Suspense } from "react";
import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${lora.variable} ${outfit.variable} antialiased font-sans bg-background`}
      >
        <ConvexClientProvider>
          <Suspense fallback={null}>
            <AnalyticsTracker />
            <AuthRedirect />
            <Toaster position="top-center" richColors />
          </Suspense>
          {children}
          <Footer />
        </ConvexClientProvider>
      </body>
    </html>
  );
}
