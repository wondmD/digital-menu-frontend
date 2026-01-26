import { Metadata } from "next"
import LandingClient from "@/components/landing-client"

export const metadata: Metadata = {
  title: "Agelgil | Elegant Digital Menus for Modern Hospitality",
  description: "Transform your dining experience with nature-inspired, high-performance digital menus designed for hotels and cafés. Explore local gems and curated menus.",
  alternates: {
    canonical: "https://agelgil.com",
  },
}

export default function LandingPage() {
  return <LandingClient />
}
