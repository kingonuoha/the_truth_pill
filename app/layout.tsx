import type { Metadata } from "next";
import { Geist, Lora, Outfit } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "./providers";
import { AnalyticsTracker } from "@/components/analytics-tracker";
import { AuthRedirect } from "@/components/auth-redirect";
import { FooterWrapper } from "@/components/footer-wrapper";
import { Suspense } from "react";
import { Toaster } from "sonner";
import { AdSenseScript } from "@/components/adsense-script";

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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://thetruthpill.com'),
  title: {
    default: "The Truth Pill | Insight into Human Behavior",
    template: "%s | The Truth Pill"
  },
  description: "A psychology-focused content platform for living a full life and understanding human behavior.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://thetruthpill.com",
    siteName: "The Truth Pill",
    title: "The Truth Pill | Insight into Human Behavior",
    description: "A psychology-focused content platform for living a full life and understanding human behavior.",
    images: [
      {
        url: "/og-image.png", // Fallback static OG image
        width: 1200,
        height: 630,
        alt: "The Truth Pill",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Truth Pill | Insight into Human Behavior",
    description: "A psychology-focused content platform for living a full life and understanding human behavior.",
    images: ["/og-image.png"],
  },
};

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
            <AdSenseScript />
            <Toaster position="top-right" richColors />
          </Suspense>
          {children}
          <FooterWrapper />
        </ConvexClientProvider>
      </body>
    </html>
  );
}
