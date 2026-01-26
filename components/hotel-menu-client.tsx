"use client"

import { Button } from "@/components/ui/button"
import { MapPin, Phone, Instagram, Facebook, ArrowRight, Loader2, Globe } from "lucide-react"
import { Logo } from "@/components/logo"
import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/api-client"
import { getImageUrl, getImageUrls } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"

type Restaurant = {
  id: string
  name: string
  slug: string
  description?: string
  address?: string
  phone?: string
  image_url?: string | string[]
  is_published?: boolean
  cuisine_type?: string
}

interface HotelMenuClientProps {
  hotelSlug: string
  initialData?: Restaurant
}

export default function HotelMenuClient({ hotelSlug, initialData }: HotelMenuClientProps) {
  const [hotel, setHotel] = useState<Restaurant | null>(initialData || null)
  const [loading, setLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initialData) return

    const load = async () => {
      try {
        setLoading(true)
        const res = await apiFetch<any>(`/restaurants/${hotelSlug}`)
        setHotel(res?.data || res)
      } catch (err: any) {
        setError(err.message || "Failed to load restaurant details")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [hotelSlug, initialData])

  if (loading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-background">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <Utensils className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-xl font-serif text-foreground animate-pulse">Preparing your table...</p>
        </motion.div>
      </div>
    )
  }

  // Handle boolean strings from FormData backend if necessary, or pure booleans
  const isPublished = hotel?.is_published === true || String(hotel?.is_published) === "true"

  if (error || !hotel || !isPublished) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background gap-4 p-6 text-center">
        <h1 className="text-3xl font-serif text-foreground">
          {!hotel || !isPublished ? "Menu Offline" : "Menu Not Found"}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 max-w-xs">
          {hotel && !isPublished 
            ? "This restaurant's menu is currently in draft mode and not visible to the public."
            : (error || "The requested restaurant does not exist.")}
        </p>
        <Button asChild size="lg" className="rounded-full">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    )
  }

  const images = getImageUrls(hotel.image_url) || ["/hotel.webp"]

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans overflow-x-hidden">
      <main className="flex-1 pb-32">
        {/* Hero Section with Carousel */}
        <div className="relative h-[65vh] w-full overflow-hidden">
          <Carousel 
            className="h-full w-full"
            plugins={[
              Autoplay({
                delay: 4000,
              }),
            ]}
          >
            <CarouselContent className="h-[65vh] ml-0">
              {images.map((img, idx) => (
                <CarouselItem key={idx} className="h-full w-full pl-0">
                  <div className="relative h-full w-full">
                    <Image
                      src={img}
                      alt={`${hotel.name} - image ${idx + 1}`}
                      fill
                      className="object-cover"
                      priority={idx === 0}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
          
          {/* Gradients for readability */}
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background via-background/40 to-transparent" />
          <div className="absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-black/20 to-transparent" />
          
          {/* Logo Overlay - Elegant positioning */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="absolute bottom-6 inset-x-0 flex flex-col items-center px-6 text-center"
          >
            {hotel.cuisine_type && (
              <Badge variant="outline" className="mb-3 bg-white/20 backdrop-blur-md text-white border-white/30 px-4 py-1 rounded-full text-xs uppercase tracking-widest font-bold">
                {hotel.cuisine_type}
              </Badge>
            )}
            <h1 className="text-5xl font-serif text-foreground tracking-tight sm:text-7xl mb-2 drop-shadow-sm">
              {hotel.name}
            </h1>
          </motion.div>
        </div>

        {/* Content Section */}
        <div className="container px-6 py-12 mx-auto max-w-lg">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="space-y-12"
          >
            {/* Description */}
            <div className="text-center space-y-4">
              <p className="text-lg text-slate-700 dark:text-slate-300 font-medium leading-relaxed italic">
                "{hotel.description || "A culinary journey awaits you. Experience the finest selection of dishes prepared with passion and the freshest ingredients."}"
              </p>
            </div>

            {/* Info Cards */}
            <div className="grid gap-4">
              <div className="flex items-start gap-4 p-5 rounded-3xl bg-secondary/30 border border-border/50 group hover:bg-secondary/50 transition-colors">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-1 pt-1 text-left">
                  <p className="font-bold text-foreground">Our Location</p>
                  <p className="text-sm text-muted-foreground leading-snug">
                    {hotel.address || "Location information not provided"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-5 rounded-3xl bg-secondary/30 border border-border/50 group hover:bg-secondary/50 transition-colors">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-1 pt-1 text-left">
                  <p className="font-bold text-foreground">Contact Us</p>
                  <p className="text-sm text-muted-foreground leading-snug">
                    {hotel.phone || "No contact phone provided"}
                  </p>
                </div>
              </div>
            </div>

            {/* Links / Socials */}
            <div className="flex items-center justify-center gap-6 pt-4">
              <Link href="#" className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center border border-border hover:bg-white dark:hover:bg-slate-800 transition-all hover:scale-110 shadow-sm">
                <Instagram className="h-6 w-6 text-foreground" />
              </Link>
              <Link href="#" className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center border border-border hover:bg-white dark:hover:bg-slate-800 transition-all hover:scale-110 shadow-sm">
                <Facebook className="h-6 w-6 text-foreground" />
              </Link>
              <Link href="#" className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center border border-border hover:bg-white dark:hover:bg-slate-800 transition-all hover:scale-110 shadow-sm">
                <Globe className="h-6 w-6 text-foreground" />
              </Link>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 inset-x-0 p-6 z-50">
        <div className="container max-w-lg mx-auto">
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.5, type: "spring", damping: 20 }}
          >
            <Button
              size="lg"
              className="h-16 w-full rounded-2xl text-xl font-bold shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] group flex items-center justify-center gap-3 bg-primary text-primary-foreground border-none"
              asChild
            >
              <Link href={`/menu/${hotelSlug}/list`}>
                Explore Menu <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>

      <footer className="pb-40 text-center">
        <div className="flex flex-col items-center justify-center gap-3">
          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em] opacity-60">
            Experience by
          </span>
          <div className="flex flex-col items-center gap-2">
            <Logo width={120} height={40} />
            <span className="text-xl font-serif text-primary italic">አገልግል</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

