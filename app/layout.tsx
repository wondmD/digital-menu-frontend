import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import { AuthSessionProvider } from "@/components/auth-session-provider"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "MenuQR | Elegant Digital Menus for Modern Hospitality",
    template: "%s | MenuQR",
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
  ],
  authors: [{ name: "MenuQR Team" }],
  creator: "MenuQR",
  publisher: "MenuQR",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://menuqr.com"), // Replace with actual domain
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "MenuQR | Elegant Digital Menus",
    description: "Nature-inspired, high-performance digital menus for hotels and cafés.",
    url: "https://menuqr.com",
    siteName: "MenuQR",
    images: [
      {
        url: "/hotel.webp",
        width: 1200,
        height: 630,
        alt: "MenuQR Digital Menu Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MenuQR | Elegant Digital Menus",
    description: "Nature-inspired, high-performance digital menus for hotels and cafés.",
    images: ["/hotel.webp"],
    creator: "@menuqr",
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
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
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
            {children}
            <Toaster />
            <Analytics />
          </ThemeProvider>
        </AuthSessionProvider>
      </body>
    </html>
  )
}
