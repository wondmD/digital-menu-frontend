import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Toaster } from "@/components/ui/toaster"
import { AuthSessionProvider } from "@/components/auth-session-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { FreeTrialBanner } from "@/components/free-trial-banner"
import { getSiteUrl } from "@/lib/site-url"
import "./globals.css"
// Ensure process-level unhandledRejection handler is registered on the server
import "@/lib/unhandled-rejection"

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Agelgil | Elegant Digital Menus for Modern Hospitality",
    template: "%s | Agelgil",
  },
  description:
    "Transform your dining experience with nature-inspired, high-performance digital menus designed for hotels and cafés.",
  keywords: [
    "digital menu",
    "QR code menu",
    "restaurant technology",
    "contactless dining",
    "hospitality software",
    "hotel menu",
    "café digital menu",
    "Agelgil",
    "አገልግል",
  ],
  authors: [{ name: "Agelgil Team" }],
  creator: "Agelgil",
  publisher: "Agelgil",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Agelgil | Elegant Digital Menus",
    description: "Nature-inspired, high-performance digital menus for hotels and cafés.",
    url: `${siteUrl}/`,
    siteName: "Agelgil",
    images: [
      {
        url: "/hotel.webp",
        width: 1200,
        height: 630,
        alt: "Agelgil Digital Menu Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Agelgil | Elegant Digital Menus",
    description: "Nature-inspired, high-performance digital menus for hotels and cafés.",
    images: ["/hotel.webp"],
    creator: "@agelgil",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      {
        url: "/logo_dark.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/logo_light.png",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    shortcut: "/logo_dark.png",
    apple: "/logo_light.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="font-sans antialiased"
      >
        <AuthSessionProvider>
          <ThemeProvider 
            attribute="class" 
            defaultTheme="system" 
            enableSystem 
            disableTransitionOnChange
          >
            <FreeTrialBanner />
            {children}
            <Toaster />
            <Analytics />
            <SpeedInsights />
          </ThemeProvider>
        </AuthSessionProvider>
      </body>
    </html>
  )
}
