"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { apiFetch } from "@/lib/api-client"
import { fetchPublicRestaurantBySlugOrId } from "@/lib/public-restaurant"
import { getImageUrl } from "@/lib/utils"
import { normalizeRestaurant, type ManagedRestaurant } from "@/lib/restaurant-normalizers"
import { Button } from "@/components/ui/button"
import { HeroSection } from "@/components/restaurant/HeroSection"
import { ExperienceHighlightsSection } from "@/components/restaurant/ExperienceHighlightsSection"
import { StorySection } from "@/components/restaurant/StorySection"
import { TopMenusSection } from "@/components/restaurant/TopMenusSection"
import { GallerySection } from "@/components/restaurant/GallerySection"
import { TestimonialsSection } from "@/components/restaurant/TestimonialsSection"
import { EventsSection } from "@/components/restaurant/EventsSection"
import { LocationSection } from "@/components/restaurant/LocationSection"
import { ReservationSection } from "@/components/restaurant/ReservationSection"
import { FooterSection } from "@/components/restaurant/FooterSection"
import { FloatingSocialCTA } from "@/components/restaurant/FloatingSocialCTA"
import { ThemeToggle } from "@/components/theme-toggle"

type MenuItem = {
  id: string
  name: string
  description?: string
  price: number
  currency?: string
  image_url?: string
  category_name?: string
  prep_time?: string
  is_available?: boolean
}

type EventItem = {
  id?: string
  title?: string
  name?: string
  date?: string
  start_date?: string
  time?: string
  start_time?: string
  description?: string
  image_url?: string
  poster_url?: string
  cover_url?: string
}

interface RestaurantShowcaseProps {
  hotelSlug: string
  initialData?: any
}

const GEO_TAG_REGEX = /\s*\[geo:([-+]?\d*\.?\d+),\s*([-+]?\d*\.?\d+)\]\s*$/i
const COORDINATE_ADDRESS_REGEX = /^\s*([-+]?\d*\.?\d+)\s*,\s*([-+]?\d*\.?\d+)\s*$/

function normalizeAddress(address: string): string {
  if (!address) return ""
  return address.replace(GEO_TAG_REGEX, "").trim()
}

function parseCoordinateAddress(address: string): { lat: number; lng: number } | null {
  const match = address.match(COORDINATE_ADDRESS_REGEX)
  if (!match) return null

  const lat = Number(match[1])
  const lng = Number(match[2])
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng }
}

function extractList(payload: any): any[] {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.data?.items)) return payload.data.items
  if (Array.isArray(payload?.items)) return payload.items
  return []
}

function fallbackTestimonials(name: string) {
  return [
    {
      name: "Marta H.",
      text: name + " has one of the most elegant dining atmospheres in the city. The food is consistently outstanding.",
      rating: 5,
      verified: true,
      date: new Date().toISOString(),
    },
    {
      name: "Samuel K.",
      text: "Exceptional service, refined presentation, and a menu that feels carefully curated from start to finish.",
      rating: 5,
      verified: true,
      date: new Date().toISOString(),
    },
    {
      name: "Liya T.",
      text: "Perfect place for family dinners and celebrations. Every dish we tried was memorable.",
      rating: 5,
      verified: true,
      date: new Date().toISOString(),
    },
  ]
}

export default function RestaurantShowcase({ hotelSlug, initialData }: RestaurantShowcaseProps) {
  const [restaurant, setRestaurant] = useState<ManagedRestaurant | null>(
    initialData ? normalizeRestaurant(initialData) : null
  )
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadRestaurant = async () => {
      try {
        if (!initialData) {
          setLoading(true)
        }
        const data = await fetchPublicRestaurantBySlugOrId(hotelSlug)
        if (!data) {
          throw new Error("Restaurant not found")
        }
        setRestaurant(normalizeRestaurant(data))
      } catch (err: any) {
        if (!initialData) {
          setError(err?.message || "Failed to load restaurant")
        }
      } finally {
        if (!initialData) {
          setLoading(false)
        }
      }
    }

    loadRestaurant()
  }, [hotelSlug, initialData])

  useEffect(() => {
    if (!restaurant) return

    const loadExtras = async () => {
      const restaurantIdentifier = String(restaurant.id || hotelSlug)

      try {
        const categoriesRes = (await apiFetch("/restaurants/" + restaurantIdentifier + "/categories")) as any
        const categories = extractList(categoriesRes)

        const collected: MenuItem[] = []
        for (const category of categories.slice(0, 6)) {
          try {
            const itemsRes = (await apiFetch("/restaurants/" + restaurantIdentifier + "/categories/" + category.id + "/items")) as any
            const items = extractList(itemsRes)
            for (const item of items.slice(0, 8)) {
              collected.push({
                id: String(item.id),
                name: String(item.name || "Menu Item"),
                description: item.description || "Chef-crafted with premium ingredients.",
                price: Number(item.price || 0),
                currency: item.currency || "$",
                image_url: getImageUrl(item.image_url || item.image?.url || item.images?.[0]?.url) || undefined,
                category_name: category.name || "Featured",
                prep_time: item.prep_time || "15 min",
                is_available: item.is_available !== false,
              })
            }
          } catch {
            continue
          }
        }
        setMenuItems(collected)
      } catch {
        setMenuItems([])
      }

      try {
        const eventsRes = (await apiFetch("/restaurants/" + restaurantIdentifier + "/events")) as any
        setEvents(extractList(eventsRes))
      } catch {
        setEvents([])
      }
    }

    loadExtras()
  }, [restaurant, hotelSlug])

  const galleryImages = useMemo(() => {
    const images: Array<{ id: string; url: string; alt: string; caption?: string }> = []

    const cover = getImageUrl(restaurant?.cover_image_url || restaurant?.cover_url)
    if (cover) {
      images.push({
        id: "cover",
        url: cover,
        alt: (restaurant?.name || "Restaurant") + " cover image",
        caption: "Welcome to our space",
      })
    }

    const gallerySource = Array.isArray(restaurant?.gallery) ? restaurant?.gallery : []
    for (let i = 0; i < gallerySource.length; i += 1) {
      const raw = gallerySource[i]
      const url = getImageUrl(typeof raw === "string" ? raw : raw?.url)
      if (url) {
        images.push({
          id: "gallery-" + i,
          url,
          alt: (restaurant?.name || "Restaurant") + " gallery " + (i + 1),
          caption: typeof raw === "object" ? raw?.caption : undefined,
        })
      }
    }

    for (const item of menuItems) {
      if (item.image_url) {
        images.push({
          id: "menu-" + item.id,
          url: item.image_url,
          alt: item.name,
          caption: item.name,
        })
      }
    }

    const uniq = new Map<string, { id: string; url: string; alt: string; caption?: string }>()
    for (const image of images) {
      if (!uniq.has(image.url)) uniq.set(image.url, image)
    }

    return Array.from(uniq.values()).slice(0, 12)
  }, [restaurant, menuItems])

  const topMenus = useMemo(() => {
    return menuItems.slice(0, 9).map((item, index) => ({
      id: item.id,
      name: item.name,
      description: item.description || "Prepared with seasonal ingredients and precision.",
      price: item.price,
      currency: item.currency || "$",
      image_url: item.image_url,
      category: item.category_name,
      prep_time: item.prep_time || "15 min",
      is_signature: index < 3,
      is_popular: index >= 3 && index < 6,
      dietary_tags: [],
    }))
  }, [menuItems])

  const eventCards = useMemo(() => {
    return events.slice(0, 6).map((event, index) => ({
      id: event.id || "event-" + index,
      title: event.title || event.name || "Special Event",
      date: event.date || event.start_date || new Date().toISOString(),
      time: event.time || event.start_time,
      description: event.description || "Join us for an exclusive dining event.",
      image_url: getImageUrl(event.image_url || event.poster_url || event.cover_url) || undefined,
    }))
  }, [events])

  const locationAddress = useMemo(() => normalizeAddress(restaurant?.address || ""), [restaurant])
  const locationCoordinates = useMemo(() => parseCoordinateAddress(locationAddress), [locationAddress])

  const mapLink = useMemo(() => {
    if (locationCoordinates) {
      return `https://www.google.com/maps/dir/?api=1&destination=${locationCoordinates.lat},${locationCoordinates.lng}`
    }
    if (locationAddress) {
      return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(locationAddress)
    }
    return ""
  }, [locationCoordinates, locationAddress])

  const mapSrc = useMemo(() => {
    if (locationCoordinates) {
      return `https://www.google.com/maps?q=${locationCoordinates.lat},${locationCoordinates.lng}&z=17&output=embed`
    }
    if (locationAddress) {
      return "https://www.google.com/maps?q=" + encodeURIComponent(locationAddress) + "&output=embed"
    }
    return ""
  }, [locationCoordinates, locationAddress])

  const menuLink = "/" + hotelSlug + "/list"

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-6 text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
            className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary mx-auto"
          />
          <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground font-black">Preparing experience</p>
        </div>
      </div>
    )
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center max-w-xl space-y-4">
          <h1 className="text-3xl md:text-5xl font-serif font-bold">Restaurant not found</h1>
          <p className="text-muted-foreground">{error || "We could not load this restaurant at the moment."}</p>
          <Button asChild className="rounded-xl px-8">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    )
  }

  const heroRestaurant = {
    id: restaurant.id,
    name: restaurant.name || "Restaurant",
    slug: restaurant.slug || hotelSlug,
    description: restaurant.description,
    tagline: (restaurant as any).tagline,
    address: locationAddress,
    phone: restaurant.phone,
    email: restaurant.email,
    logo_url: restaurant.logo_url,
    cover_url: restaurant.cover_image_url || restaurant.cover_url,
    cuisine_type: restaurant.cuisine_type,
    opening_hours: (restaurant as any).opening_hours,
    instagram_url: (restaurant as any).instagram_url,
    facebook_url: (restaurant as any).facebook_url,
    twitter_url: (restaurant as any).twitter_url,
    tiktok_url: (restaurant as any).tiktok_url,
    telegram_url: (restaurant as any).telegram_url,
    website_url: (restaurant as any).website_url || restaurant.website,
  }

  return (
    <main className="bg-background text-foreground">
      <div className="fixed right-4 top-4 z-50 rounded-xl border border-border/60 bg-background/80 shadow-lg backdrop-blur-md">
        <ThemeToggle />
      </div>

      <HeroSection
        hotel={heroRestaurant as any}
        coverImage={getImageUrl(restaurant.cover_image_url || restaurant.cover_url) || undefined}
        logoImage={getImageUrl(restaurant.logo_url) || null}
        menuLink={menuLink}
        mapLink={mapLink}
        reservationEnabled={Boolean(restaurant.phone || restaurant.email)}
      />

      <ExperienceHighlightsSection hotel={heroRestaurant as any} />
      <StorySection hotel={heroRestaurant as any} coverImage={getImageUrl(restaurant.cover_image_url || restaurant.cover_url) || undefined} />
      <TopMenusSection items={topMenus} menuLink={menuLink} />
      <GallerySection images={galleryImages} />
      <TestimonialsSection testimonials={fallbackTestimonials(restaurant.name || "Our Restaurant")} />
      <EventsSection events={eventCards as any} />
      <LocationSection hotel={heroRestaurant as any} mapSrc={mapSrc} mapLink={mapLink} />
      <ReservationSection hotel={heroRestaurant as any} />
      <FooterSection hotel={heroRestaurant as any} />
      <FloatingSocialCTA hotel={heroRestaurant as any} />
    </main>
  )
}
