"use client"

import { useEffect, useMemo, useState } from "react"
import { apiFetch } from "@/lib/api-client"
import { cn, getImageUrl } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Utensils, MapPin, Phone, Mail, Star, Clock, Calendar, ExternalLink } from "lucide-react"
import { motion } from "framer-motion"
import { ThemeToggle } from "@/components/theme-toggle"
// Import new components
import { HeroSection } from "./restaurant/HeroSection"
import { StorySection } from "./restaurant/StorySection"
import { LocationSection } from "./restaurant/LocationSection"
import { ReservationSection } from "./restaurant/ReservationSection"
import { EventsSection } from "./restaurant/EventsSection"
import { MenuPreviewSection } from "./restaurant/MenuPreviewSection"
import { TestimonialsSection } from "./restaurant/TestimonialsSection"
import { FooterSection } from "./restaurant/FooterSection"
import { GallerySection } from "./restaurant/GallerySection"
import { TopMenusSection } from "./restaurant/TopMenusSection"
import { ExperienceHighlightsSection } from "./restaurant/ExperienceHighlightsSection"
import { FloatingSocialCTA } from "./restaurant/FloatingSocialCTA"

type Restaurant = {
  id: string
  name: string
  slug: string
  description?: string
  tagline?: string
  address?: string
  phone?: string
  logo_url?: string
  cover_url?: string
  is_published?: boolean
  cuisine_type?: string
  email?: string
  instagram_url?: string
  facebook_url?: string
  twitter_url?: string
  tiktok_url?: string
  telegram_url?: string
  website_url?: string
  opening_hours?: string
  rating?: number
  review_count?: number
  enableReservation?: boolean
  enable_reservation?: boolean
  reservation_enabled?: boolean
  events?: EventItem[]
  upcoming_events?: EventItem[]
  testimonials?: Testimonial[]
  popular_items?: MenuPreviewItem[]
  featured_items?: MenuPreviewItem[]
  gallery_images?: GalleryImage[]
  top_menus?: TopMenuItem[]
}

type EventItem = {
  id?: string
  title: string
  date: string
  description?: string
  image_url?: string
  href?: string
}

type Testimonial = {
  name: string
  text: string
  rating?: number
}

type MenuPreviewItem = {
  id: string
  name: string
  price: number
  currency?: string
  description?: string
  image_url?: string
}

type GalleryImage = {
  id: string
  url: string
  alt: string
  caption?: string
}

type TopMenuItem = {
  id: string
  name: string
  description: string
  price: number
  currency?: string
  image_url?: string
  category?: string
  rating?: number
  prep_time?: string
  is_signature?: boolean
  is_popular?: boolean
  dietary_tags?: string[]
}

type BestDish = {
  id: string
  name: string
  description: string
  price: number
  currency?: string
  image_url?: string
  rating: number
  tag: string
}

interface HotelMenuClientProps {
  hotelSlug: string
  initialData?: Restaurant
}

export default function HotelMenuClient({ hotelSlug, initialData }: HotelMenuClientProps) {
  const [hotel, setHotel] = useState<Restaurant | null>(initialData || null)
  const [loading, setLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)
  const [menuPreview, setMenuPreview] = useState<MenuPreviewItem[]>([])
  const [menuLoading, setMenuLoading] = useState(false)

  useEffect(() => {
    if (initialData) return

    const load = async () => {
      try {
        setLoading(true)
        const res = await apiFetch<any>(`/restaurants/${hotelSlug}`)
        const restaurantData = res?.data || res
        
        setHotel(restaurantData)
      } catch (err: any) {
        setError(err.message || "Failed to load restaurant details")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [hotelSlug, initialData])

  useEffect(() => {
    const loadMenuPreview = async () => {
      try {
        setMenuLoading(true)
        const res = await apiFetch<any>(`/restaurants/${hotelSlug}/categories`)
        const categories = Array.isArray(res) ? res : (res?.data || [])
        const items: MenuPreviewItem[] = []

        for (const category of categories.slice(0, 4)) {
          const itemsRes = await apiFetch<any>(`/restaurants/${hotelSlug}/categories/${category.id}/items`)
          const categoryItems = Array.isArray(itemsRes) ? itemsRes : (itemsRes?.data || [])
          for (const item of categoryItems) {
            items.push({
              id: String(item.id),
              name: item.name,
              price: Number(item.price || 0),
              currency: item.currency,
              description: item.description,
              image_url: item.image_url,
            })
            if (items.length >= 5) break
          }
          if (items.length >= 5) break
        }

        setMenuPreview(items)
      } catch (err) {
        console.error("Failed to load menu preview", err)
      } finally {
        setMenuLoading(false)
      }
    }

    loadMenuPreview()
  }, [hotelSlug])

  if (loading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-[#0c0c0c]">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="h-12 w-12 rounded-full border border-white/20 animate-spin border-t-white" />
          <p className="text-sm uppercase tracking-[0.4em] text-white/70">Loading experience</p>
        </motion.div>
      </div>
    )
  }

  const isPublished = hotel?.is_published === true || String(hotel?.is_published) === "true"

  if (error || !hotel || !isPublished) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background gap-8 p-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="mx-auto w-24 h-24 rounded-full bg-secondary flex items-center justify-center">
            <Utensils className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-4xl font-serif text-foreground">
            {!hotel || !isPublished ? "Closed For Refurbishment" : "Menu Not Found"}
          </h1>
          <p className="text-muted-foreground max-w-sm mx-auto text-lg">
            {hotel && !isPublished 
              ? "We are currently curating our masterpiece. Please check back soon for an exquisite dining experience."
              : (error || "The culinary destination you're looking for has moved.")}
          </p>
          <Button asChild size="lg" variant="outline" className="rounded-full px-8">
            <Link href="/">Return to Entrance</Link>
          </Button>
        </motion.div>
      </div>
    )
  }

  const coverImage = getImageUrl(
    hotel.cover_url ||
    (hotel as any).cover_image_url ||
    (hotel as any).cover_image ||
    (hotel as any).cover
  ) || "/hotel.webp"

  const logoImage = getImageUrl(
    hotel.logo_url ||
    (hotel as any).logo_image_url ||
    (hotel as any).logo_image ||
    (hotel as any).logo
  )

  const reservationEnabled = Boolean(
    hotel.enableReservation ??
    hotel.enable_reservation ??
    hotel.reservation_enabled
  )

  const events = useMemo(() => {
    const source = hotel.events || hotel.upcoming_events
    return Array.isArray(source) ? source : []
  }, [hotel.events, hotel.upcoming_events])

  const testimonials = useMemo<Testimonial[]>(() => {
    const source = hotel.testimonials
    if (Array.isArray(source) && source.length > 0) return source
    return [
      {
        name: "Selam T.",
        text: "Elegant ambiance, refined flavors, and impeccable service. This place feels like a destination.",
        rating: 5,
      },
      {
        name: "Meklit A.",
        text: "Every dish was thoughtfully crafted. The menu and experience feel truly premium.",
        rating: 5,
      },
      {
        name: "Daniel K.",
        text: "A beautiful space with unforgettable meals. We will be back for special occasions.",
        rating: 4,
      },
    ]
  }, [hotel.testimonials])

  const previewItems = useMemo<MenuPreviewItem[]>(() => {
    if (menuPreview.length > 0) return menuPreview
    const source = (hotel.popular_items || hotel.featured_items) as MenuPreviewItem[] | undefined
    return Array.isArray(source) ? source.slice(0, 5) : []
  }, [menuPreview, hotel.popular_items, hotel.featured_items])

  const bestDishes = useMemo<BestDish[]>(() => {
    if (previewItems.length > 0) {
      return previewItems.slice(0, 3).map((item, index) => ({
        id: item.id,
        name: item.name,
        description: item.description || "A signature creation loved by our guests.",
        price: item.price,
        currency: item.currency,
        image_url: item.image_url,
        rating: 4.8,
        tag: index === 0 ? "Chef's Pick" : "House Favorite",
      }))
    }

    return [
      {
        id: "signature-1",
        name: "Saffron Citrus Salmon",
        description: "Slow-roasted salmon with saffron glaze, citrus zest, and garden herbs.",
        price: 28,
        currency: "$",
        image_url: "/hotel.webp",
        rating: 4.9,
        tag: "Chef's Pick",
      },
      {
        id: "signature-2",
        name: "Golden Truffle Risotto",
        description: "Creamy arborio rice finished with truffle oil and aged parmesan.",
        price: 22,
        currency: "$",
        image_url: "/hotel.webp",
        rating: 4.8,
        tag: "House Favorite",
      },
      {
        id: "signature-3",
        name: "Heritage Spiced Lamb",
        description: "Tender lamb braised with seasonal spices and roasted vegetables.",
        price: 30,
        currency: "$",
        image_url: "/hotel.webp",
        rating: 4.7,
        tag: "Guest Choice",
      },
    ]
  }, [previewItems])

  const mapQuery = hotel.address ? encodeURIComponent(hotel.address) : ""
  const mapSrc = mapQuery ? `https://www.google.com/maps?q=${mapQuery}&output=embed` : ""
  const mapLink = mapQuery ? `https://www.google.com/maps/search/?api=1&query=${mapQuery}` : ""
  const menuLink = `/menu/${hotelSlug}/list`

  // Gallery images - use restaurant's actual images
  const galleryImages = useMemo<GalleryImage[]>(() => {
    // Try to get gallery images from different possible fields
    const possibleGalleryFields = [
      hotel.gallery_images,
      (hotel as any).gallery,
      (hotel as any).images,
      (hotel as any).photos,
      (hotel as any).restaurant_images
    ]
    
    let galleryData = null
    for (const field of possibleGalleryFields) {
      if (field && Array.isArray(field) && field.length > 0) {
        galleryData = field
        break
      }
    }
    
    if (galleryData) {
      // Transform the data to match our GalleryImage type
      return galleryData.map((img: any, index: number) => ({
        id: img.id || `gallery-${index}`,
        url: getImageUrl(img.url || img.image_url || img.src || img) || 
             getImageUrl(img) || 
             (typeof img === 'string' ? img : 
              img?.image_url || img?.url || img?.src || 
              (index === 0 ? coverImage : "/hotel.webp")),
        alt: img.alt || img.caption || img.title || `${hotel.name} Gallery Image ${index + 1}`,
        caption: img.caption || img.description || img.title || undefined
      }))
    }
    
    // Fallback: create gallery from cover image and some default images
    return [
      {
        id: "cover-image",
        url: coverImage,
        alt: `${hotel.name} - Main View`,
        caption: hotel.tagline || "Welcome to our restaurant"
      },
      {
        id: "interior-1",
        url: "/hotel.webp",
        alt: `${hotel.name} Interior`,
        caption: "Elegant dining atmosphere"
      },
      {
        id: "interior-2",
        url: "/hotel.webp",
        alt: `${hotel.name} Dining Area`,
        caption: "Comfortable dining spaces"
      },
      {
        id: "food-1",
        url: "/hotel.webp",
        alt: "Signature Dish",
        caption: "Culinary excellence"
      },
      {
        id: "food-2",
        url: "/hotel.webp",
        alt: "Chef's Special",
        caption: "Artisanal cuisine"
      },
      {
        id: "ambiance",
        url: "/hotel.webp",
        alt: "Restaurant Ambiance",
        caption: "Perfect dining experience"
      }
    ]
  }, [hotel, coverImage, hotel.name, hotel.tagline])

  // Sample top menus
  const topMenus = useMemo<TopMenuItem[]>(() => {
    if (hotel.top_menus && hotel.top_menus.length > 0) {
      return hotel.top_menus
    }
    // Fallback sample items
    return [
      {
        id: "top-1",
        name: "Wagyu Beef Tenderloin",
        description: "Premium wagyu beef with truffle mashed potatoes and seasonal vegetables.",
        price: 85,
        currency: "$",
        image_url: "/hotel.webp",
        rating: 4.9,
        prep_time: "25 min",
        is_signature: true,
        dietary_tags: ["Gluten-Free Options"]
      },
      {
        id: "top-2",
        name: "Lobster Thermidor",
        description: "Fresh Atlantic lobster with cognac cream sauce and gruyère cheese.",
        price: 65,
        currency: "$",
        image_url: "/hotel.webp",
        rating: 4.8,
        prep_time: "30 min",
        is_signature: true,
        dietary_tags: ["Seafood", "Rich"]
      },
      {
        id: "top-3",
        name: "Truffle Wild Mushroom Risotto",
        description: "Creamy arborio rice with wild mushrooms, white truffle, and aged parmesan.",
        price: 42,
        currency: "$",
        image_url: "/hotel.webp",
        rating: 4.7,
        prep_time: "20 min",
        is_signature: true,
        dietary_tags: ["Vegetarian"]
      },
      {
        id: "top-4",
        name: "Pan-Seared Sea Bass",
        description: "Mediterranean sea bass with lemon butter sauce and roasted vegetables.",
        price: 38,
        currency: "$",
        image_url: "/hotel.webp",
        rating: 4.6,
        prep_time: "18 min",
        is_popular: true,
        dietary_tags: ["Light", "Healthy"]
      },
      {
        id: "top-5",
        name: "Duck Confit",
        description: "Traditional French duck confit with cherry reduction and roasted potatoes.",
        price: 48,
        currency: "$",
        image_url: "/hotel.webp",
        rating: 4.8,
        prep_time: "35 min",
        is_popular: true,
        dietary_tags: ["Classic", "Rich"]
      }
    ]
  }, [hotel.top_menus])

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-primary/10 blur-[140px]" />
        <div className="absolute top-[35%] -left-24 h-[320px] w-[320px] rounded-full bg-amber-500/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[380px] w-[380px] rounded-full bg-emerald-500/10 blur-[140px]" />
      </div>
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50">
        <ThemeToggle />
      </div>
      <main className="relative">
        <HeroSection
          hotel={hotel}
          coverImage={coverImage}
          logoImage={logoImage}
          menuLink={menuLink}
          mapLink={mapLink}
          reservationEnabled={reservationEnabled}
        />
        <ExperienceHighlightsSection hotel={hotel} />
        <StorySection hotel={hotel} coverImage={coverImage} />
        <GallerySection images={galleryImages} />
        <TopMenusSection items={topMenus} menuLink={menuLink} />
        {(previewItems.length > 0 || menuLoading) && (
          <MenuPreviewSection
            items={previewItems}
            loading={menuLoading}
            menuLink={menuLink}
          />
        )}
        {(hotel.address || hotel.phone) && (
          <LocationSection hotel={hotel} mapSrc={mapSrc} mapLink={mapLink} />
        )}
        {reservationEnabled && (
          <ReservationSection hotel={hotel} />
        )}
        {events.length > 0 && (
          <EventsSection events={events} />
        )}
        <TestimonialsSection testimonials={testimonials} />
      </main>
      <FooterSection hotel={hotel} />
      <FloatingSocialCTA hotel={hotel} />
    </div>
  )
}
