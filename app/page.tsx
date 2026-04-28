import { Metadata } from "next"
import LandingClient from "@/components/landing-client"
import { getSiteUrl } from "@/lib/site-url"

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: "Agelgil | Elegant Digital Menus for Modern Hospitality",
  description: "Transform your dining experience with nature-inspired, high-performance digital menus designed for hotels and cafés. Contactless, elegant, and efficient.",
  keywords: [
    "digital menu", "contactless dining", "QR code restaurant", 
    "Ethiopian hospitality", "hotel technology", "restaurant menu app",
    "Agelgil menu", "modern dining experience"
  ],
  alternates: {
    canonical: `${siteUrl}/`,
  },
  openGraph: {
    title: "Agelgil | The Future of Digital Menus",
    description: "Elegant, high-performance digital menus designed for the next generation of hospitality.",
    images: [{
      url: "/hotel.webp",
      width: 1200,
      height: 630,
      alt: "Agelgil Landing Page"
    }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Agelgil Digital Menus",
    description: "Contactless dining experience for hotels and cafes.",
    images: ["/hotel.webp"],
  }
}

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Agelgil",
            "operatingSystem": "Web",
            "applicationCategory": "BusinessApplication",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "Elegant digital menus for hotels and cafes. High-performance contactless dining technology.",
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "ratingCount": "150"
            }
          })
        }}
      />
      <LandingClient />
    </>
  )
}
