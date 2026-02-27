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
import { SmoothScroll } from "@/components/smooth-scroll";
import { ThemeShortcut } from "@/components/theme-shortcut";

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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://thetruthpill.org'),
  title: {
    default: "The Truth Pill | Insight into Human Behavior",
    template: "%s | The Truth Pill"
  },
  description: "A psychology-focused content platform for living a full life and understanding human behavior.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://thetruthpill.org",
    siteName: "The Truth Pill",
    title: "The Truth Pill | Insight into Human Behavior",
    description: "A psychology-focused content platform for living a full life and understanding human behavior.",
    images: [
      {
        url: "/truthpill/logo-icon.png",
        width: 1200,
        height: 630,
        alt: "The Truth Pill - Insight into Human Behavior",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Truth Pill | Insight into Human Behavior",
    description: "A psychology-focused content platform for living a full life and understanding human behavior.",
    images: ["/truthpill/logo-icon.png"],
  },
  icons: {
    icon: "/truthpill/logo-icon-svg.ico",
    shortcut: "/truthpill/logo-icon-svg.svg",
    apple: "/truthpill/logo-icon.png",
  }
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
          <SmoothScroll>
            <Suspense fallback={null}>
              <AnalyticsTracker />
              <AuthRedirect />
              <AdSenseScript />
              <Toaster position="top-right" richColors />
              <ThemeShortcut />
            </Suspense>
            {children}
            <FooterWrapper />
          </SmoothScroll>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
