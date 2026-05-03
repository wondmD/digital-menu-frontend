"use client"

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { apiFetch, apiFetchOrNull } from "@/lib/api-client"
import { fetchPublicRestaurantBySlugOrId } from "@/lib/public-restaurant"
import { getImageUrl } from "@/lib/utils"
import { normalizeRestaurant, type ManagedRestaurant } from "@/lib/restaurant-normalizers"
import { Button } from "@/components/ui/button"
import { HeroSection } from "@/components/restaurant/HeroSection"
import { StorySection } from "@/components/restaurant/StorySection"
import { GallerySection } from "@/components/restaurant/GallerySection"
import { TestimonialsSection } from "@/components/restaurant/TestimonialsSection"
import { EventsSection } from "@/components/restaurant/EventsSection"
import { LocationSection } from "@/components/restaurant/LocationSection"
import { FooterSection } from "@/components/restaurant/FooterSection"
import { FloatingSocialCTA } from "@/components/restaurant/FloatingSocialCTA"
import type { RestaurantShowcaseBundle } from "@/lib/public-data.server"

type MenuItem = {
  id: string
  name: string
  description?: string
  price: number
  currency?: string
  image_url?: string
  category_name?: string
  rating?: number
  prep_time?: string
  is_available?: boolean
}

type EventItem = {
  id?: string
  title?: string
  name?: string
  date?: string
  start_date?: string
  end_date?: string
  time?: string
  start_time?: string
  end_time?: string
  description?: string
  image_url?: string
  poster_url?: string
  cover_url?: string
  timezone?: string
  location?: string
  is_active?: boolean
}

interface RestaurantShowcaseProps {
  hotelSlug: string
  initialData?: any
  initialBundle?: RestaurantShowcaseBundle
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

type RestaurantVisualTheme = {
  primary: string
  accent: string
  secondary: string
  surface: "light" | "dark" | ""
}

const THEME_PRESET_DEFAULTS: Record<string, RestaurantVisualTheme> = {
  "classic-elegance": { primary: "#B45309", accent: "#F59E0B", secondary: "#92400E", surface: "light" },
  "modern-luxe": { primary: "#E11D48", accent: "#FB7185", secondary: "#9F1239", surface: "dark" },
  "fresh-organic": { primary: "#15803D", accent: "#4ADE80", secondary: "#166534", surface: "light" },
  "royal-night": { primary: "#4338CA", accent: "#818CF8", secondary: "#312E81", surface: "dark" },
}

function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value)
}

function parseThemeSettings(input: unknown): Record<string, any> {
  if (!input) return {}
  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input)
      return parsed && typeof parsed === "object" ? parsed : {}
    } catch {
      return {}
    }
  }
  return typeof input === "object" ? (input as Record<string, any>) : {}
}

function resolveRestaurantTheme(themeSettings: unknown): RestaurantVisualTheme {
  const parsed = parseThemeSettings(themeSettings)
  const preset = typeof parsed.preset === "string" ? parsed.preset : ""
  const presetBase = THEME_PRESET_DEFAULTS[preset] || {
    primary: "#E63946",
    accent: "#F4A261",
    secondary: "#2A9D8F",
    surface: "",
  }

  const surfaceRaw = typeof parsed.surface === "string" ? parsed.surface.toLowerCase() : ""
  const surface = surfaceRaw === "light" || surfaceRaw === "dark" ? surfaceRaw : presetBase.surface

  return {
    primary: isHexColor(parsed.primary) ? parsed.primary : presetBase.primary,
    accent: isHexColor(parsed.accent) ? parsed.accent : presetBase.accent,
    secondary: isHexColor(parsed.secondary) ? parsed.secondary : presetBase.secondary,
    surface,
  }
}

function extractList(payload: any): any[] {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.data?.items)) return payload.data.items
  if (Array.isArray(payload?.items)) return payload.items
  return []
}

function isActiveEvent(event: EventItem): boolean {
  // Treat missing flag as active so older payloads still render.
  if (typeof event?.is_active === "boolean") return event.is_active
  return true
}

async function fetchRestaurantEvents(restaurantIdentifier: string): Promise<EventItem[]> {
  const candidatePaths = [
    `/my-restaurants/${restaurantIdentifier}/events?is_active=true`,
    `/restaurants/${restaurantIdentifier}/events?is_active=true`,
    `/restaurants/${restaurantIdentifier}/events`,
  ]

  for (const path of candidatePaths) {
    try {
      const res = (await apiFetch(path)) as any
      const rows = extractList(res) as EventItem[]
      if (rows.length > 0) {
        return rows.filter(isActiveEvent)
      }
    } catch {
      continue
    }
  }

  return []
}

export default function RestaurantShowcase({ hotelSlug, initialData, initialBundle }: RestaurantShowcaseProps) {
  const { setTheme, resolvedTheme } = useTheme()
  const [restaurant, setRestaurant] = useState<ManagedRestaurant | null>(
    initialBundle?.restaurant ? normalizeRestaurant(initialBundle.restaurant) : initialData ? normalizeRestaurant(initialData) : null
  )
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialBundle?.menuItems || [])
  const [events, setEvents] = useState<EventItem[]>(initialBundle?.events || [])
  const [loading, setLoading] = useState(!initialData && !initialBundle)
  const [error, setError] = useState<string | null>(null)
  const [isThemeMounted, setIsThemeMounted] = useState(false)
  const appliedSurfaceRef = useRef<string>("")

  useEffect(() => {
    setIsThemeMounted(true)
  }, [])

  useEffect(() => {
    const loadRestaurant = async () => {
      try {
        if (initialBundle) {
          setLoading(false)
          return
        }

        if (initialData) {
          setLoading(false)
          return
        }

        setLoading(true)
        setError(null)

        let data = await fetchPublicRestaurantBySlugOrId(hotelSlug)
        if (!data) {
          const res = await apiFetchOrNull("/restaurants/" + hotelSlug)
          data = res?.data || res
        }

        if (!data) {
          throw new Error("Restaurant not found")
        }

        setRestaurant(normalizeRestaurant(data))
      } catch (err: any) {
        setError(err?.message || "Failed to load restaurant")
      } finally {
        if (!initialData) {
          setLoading(false)
        }
      }
    }

    loadRestaurant()
  }, [hotelSlug, initialData, initialBundle])

  useEffect(() => {
    if (!restaurant || initialBundle) return

    const loadExtras = async () => {
      const restaurantIdentifier = String(restaurant.id || hotelSlug)

      try {
        const [categoriesRes, eventsList] = await Promise.all([
          apiFetch("/restaurants/" + restaurantIdentifier + "/categories"),
          fetchRestaurantEvents(restaurantIdentifier),
        ])

        const categories = extractList(categoriesRes as any)

        const collected = await Promise.all(
          categories.slice(0, 6).map(async (category: any) => {
            try {
              const itemsRes = (await apiFetch("/restaurants/" + restaurantIdentifier + "/categories/" + category.id + "/items")) as any
              const items = extractList(itemsRes)
              return items.slice(0, 8).map((item: any) => ({
                id: String(item.id),
                name: String(item.name || "Menu Item"),
                description: item.description || "Chef-crafted with premium ingredients.",
                price: Number(item.price || 0),
                currency: item.currency || "$",
                image_url: getImageUrl(item.image_url || item.image?.url || item.images?.[0]?.url) || undefined,
                category_name: category.name || "Featured",
                rating: Number(item.rating || 4.7),
                prep_time: item.prep_time || "15 min",
                is_available: item.is_available !== false,
              }))
            } catch {
              return []
            }
          })
        )

        setMenuItems(collected.flat())
        setEvents(eventsList)
      } catch {
        setMenuItems([])
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

  const eventCards = useMemo(() => {
    return events.slice(0, 6).map((event, index) => ({
      id: event.id || "event-" + index,
      title: event.title || event.name || "Special Event",
      date: event.date || event.start_date || new Date().toISOString(),
      end_date: event.end_date,
      time: event.time || event.start_time,
      end_time: event.end_time,
      description: event.description || "Join us for an exclusive dining event.",
      image_url: getImageUrl(event.image_url || event.poster_url || event.cover_url) || undefined,
      timezone: event.timezone,
      location: event.location,
      is_active: isActiveEvent(event),
    }))
  }, [events])

  const testimonialItems = useMemo(() => {
    const source = Array.isArray((restaurant as any)?.testimonials)
      ? (restaurant as any).testimonials
      : Array.isArray((restaurant as any)?.reviews)
      ? (restaurant as any).reviews
      : []

    return source
      .map((item: any, index: number) => ({
        name: String(item?.name || item?.author || item?.customer_name || "").trim(),
        text: String(item?.text || item?.comment || item?.message || "").trim(),
        rating: Number(item?.rating || 0) || undefined,
        date: item?.date || item?.created_at,
        verified: Boolean(item?.verified),
        id: String(item?.id || `testimonial-${index}`),
      }))
      .filter((item: any) => item.name && item.text)
  }, [restaurant])

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

  const visualTheme = useMemo(() => resolveRestaurantTheme(restaurant?.theme_settings), [restaurant?.theme_settings])

  const themedStyle = useMemo(() => {
    return {
      "--primary": visualTheme.primary,
      "--ring": visualTheme.primary,
      "--accent": visualTheme.accent,
      "--secondary": visualTheme.secondary,
      "--sidebar-primary": visualTheme.primary,
      "--sidebar-ring": visualTheme.primary,
    } as CSSProperties
  }, [visualTheme])

  useEffect(() => {
    if (!visualTheme.surface || !isThemeMounted) return
    const restaurantKey = String(restaurant?.id || hotelSlug)
    const applyKey = restaurantKey + ":" + visualTheme.surface
    if (appliedSurfaceRef.current === applyKey) return
    setTheme(visualTheme.surface)
    appliedSurfaceRef.current = applyKey
  }, [visualTheme.surface, isThemeMounted, restaurant?.id, hotelSlug, setTheme])

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
    opening_hours: restaurant.operation_time || (restaurant as any).opening_hours,
    operation_time: restaurant.operation_time,
    established_year: restaurant.year_established || (restaurant as any).established_year,
    history: restaurant.history,
    rating: Number((restaurant as any).rating || 4.8),
    review_count: Number((restaurant as any).review_count || (restaurant as any).rating_count || 500),
    instagram_url: restaurant.instagram_url || (restaurant as any).instagram_url,
    facebook_url: restaurant.facebook_url || (restaurant as any).facebook_url,
    twitter_url: restaurant.twitter_url || (restaurant as any).twitter_url,
    tiktok_url: restaurant.tiktok_url || (restaurant as any).tiktok_url,
    telegram_url: restaurant.telegram_url || (restaurant as any).telegram_url,
    whatsapp: restaurant.whatsapp || (restaurant as any).whatsapp,
    website_url: (restaurant as any).website_url || restaurant.website,
  }

  return (
    <main className="bg-background text-foreground" style={themedStyle}>
      <div className="fixed right-4 top-4 z-50">
        <Button
          variant="outline"
          size="icon"
          className="h-11 w-11 rounded-full border-border/60 bg-card/80 backdrop-blur"
          onClick={() => setTheme((resolvedTheme || "light") === "dark" ? "light" : "dark")}
          aria-label="Toggle light and dark mode"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
      </div>

      <HeroSection
        hotel={heroRestaurant as any}
        coverImage={getImageUrl(restaurant.cover_image_url || restaurant.cover_url) || undefined}
        logoImage={getImageUrl(restaurant.logo_url) || null}
        menuLink={menuLink}
        mapLink={mapLink}
      />

      <StorySection hotel={heroRestaurant as any} coverImage={getImageUrl(restaurant.cover_image_url || restaurant.cover_url) || undefined} />
      {galleryImages.length > 0 ? <GallerySection images={galleryImages} /> : null}
      {testimonialItems.length > 0 ? <TestimonialsSection testimonials={testimonialItems as any} /> : null}
      {eventCards.length > 0 ? (
        <EventsSection
          events={eventCards as any}
          coverImage={getImageUrl(restaurant.cover_image_url || restaurant.cover_url) || undefined}
        />
      ) : null}
      <LocationSection hotel={heroRestaurant as any} mapSrc={mapSrc} mapLink={mapLink} />
      <FooterSection hotel={heroRestaurant as any} />
      <FloatingSocialCTA hotel={heroRestaurant as any} />
    </main>
  )
}
