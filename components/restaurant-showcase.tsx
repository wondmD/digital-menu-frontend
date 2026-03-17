"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import { useTheme } from "next-themes"
import { apiFetch } from "@/lib/api-client"
import { getImageUrl } from "@/lib/utils"
import { normalizeRestaurant, type ManagedRestaurant } from "@/lib/restaurant-normalizers"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowRight,
  Award,
  Camera,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Facebook,
  Globe,
  Heart,
  Instagram,
  MapPin,
  Mail,
  MessageCircle,
  Moon,
  Navigation,
  Phone,
  Quote,
  Send,
  Share2,
  Star,
  Sun,
  Utensils,
  X,
} from "lucide-react"

type MenuItem = {
  id: string
  name: string
  description?: string
  price: number
  currency?: string
  image_url?: string
  is_available?: boolean
  is_featured?: boolean
  display_order?: number
}

type TestimonialItem = {
  name: string
  text: string
  rating: number
}

interface RestaurantShowcaseProps {
  hotelSlug: string
  initialData?: any
}

export default function RestaurantShowcase({ hotelSlug, initialData }: RestaurantShowcaseProps) {
  const [restaurant, setRestaurant] = useState<ManagedRestaurant | null>(
    initialData ? normalizeRestaurant(initialData) : null
  )
  const [loading, setLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [itemsLoading, setItemsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const { theme, setTheme } = useTheme()
  const { scrollY } = useScroll()
  const heroY = useTransform(scrollY, [0, 600], [0, 100])
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (initialData) return

    const loadRestaurant = async () => {
      try {
        setLoading(true)
        const res = await apiFetch<any>(`/restaurants/${hotelSlug}`)
        setRestaurant(normalizeRestaurant(res?.data || res))
      } catch (err: any) {
        setError(err.message || "Failed to load restaurant")
      } finally {
        setLoading(false)
      }
    }

    loadRestaurant()
  }, [hotelSlug, initialData])

  useEffect(() => {
    if (!restaurant?.slug && !restaurant?.id) return

    const loadItems = async () => {
      try {
        setItemsLoading(true)
        const res = await apiFetch<any>(`/restaurants/${hotelSlug}/categories`)
        const categories = Array.isArray(res) ? res : (res?.data || [])
        
        const allItems: MenuItem[] = []
        for (const category of categories.slice(0, 3)) {
          try {
            const itemsRes = await apiFetch<any>(`/restaurants/${hotelSlug}/categories/${category.id}/items`)
            const items = Array.isArray(itemsRes) ? itemsRes : (itemsRes?.data || [])
            allItems.push(...items.slice(0, 3))
          } catch (e) {
            console.error(`Failed to load items for category ${category.id}`, e)
          }
        }
        setMenuItems(allItems)
      } catch (err) {
        console.error("Failed to load menu items:", err)
      } finally {
        setItemsLoading(false)
      }
    }

    loadItems()
  }, [restaurant, hotelSlug])

  // Sample testimonials if none provided
  const testimonials: TestimonialItem[] = useMemo(() => [
    {
      name: "Sarah Chen",
      text: "Absolutely exquisite dining experience! The attention to detail and flavors were outstanding.",
      rating: 5
    },
    {
      name: "Michael Rodriguez",
      text: "A hidden gem! Every dish was a masterpiece. Can't wait to return.",
      rating: 5
    },
    {
      name: "Emma Thompson",
      text: "Perfect ambiance, impeccable service, and food that tells a story.",
      rating: 5
    }
  ], [])

  const galleryImages = useMemo(() => {
    const images = []
    
    // Add cover image if available
    if (restaurant?.cover_image_url || restaurant?.cover_url) {
      images.push({
        id: 'cover',
        url: restaurant.cover_image_url || restaurant.cover_url,
        alt: `${restaurant.name} - Restaurant View`,
        caption: 'Welcome to our restaurant'
      })
    }
    
    // Add menu item images
    menuItems.slice(0, 6).forEach((item, index) => {
      if (item.image_url) {
        images.push({
          id: item.id,
          url: item.image_url,
          alt: item.name,
          caption: item.name
        })
      }
    })
    
    // Add gallery images if available
    if (restaurant?.gallery_images && Array.isArray(restaurant.gallery_images)) {
      restaurant.gallery_images.forEach((img: any, index: number) => {
        images.push({
          id: `gallery-${index}`,
          url: img.url || img,
          alt: img.caption || `Gallery image ${index + 1}`,
          caption: img.caption
        })
      })
    }
    
    return images.slice(0, 8)
  }, [restaurant, menuItems])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    )
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Restaurant Not Found</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Theme Toggle */}
      {mounted && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed top-4 right-4 z-50 p-3 rounded-full bg-card/80 backdrop-blur-sm border border-border hover:bg-card transition-colors"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </motion.button>
      )}

      {/* Sticky Menu CTA */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-6 left-6 right-6 z-40 md:hidden"
      >
        <Button
          onClick={() => setShowMobileMenu(true)}
          className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-semibold rounded-2xl shadow-lg flex items-center justify-between px-6"
        >
          <span>Explore Menu</span>
          <Utensils className="h-5 w-5" />
        </Button>
      </motion.div>

      {/* HERO SECTION */}
      <section className="relative h-screen overflow-hidden">
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="absolute inset-0"
        >
          <Image
            src={getImageUrl(restaurant.cover_image_url || restaurant.cover_url) || "/hotel.webp"}
            alt={restaurant.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/80" />
        </motion.div>

        <div className="relative z-10 h-full flex flex-col justify-between px-6 py-8 md:px-12 md:py-16">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              {restaurant.logo_url && (
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-white/10 backdrop-blur-sm p-2">
                  <Image
                    src={getImageUrl(restaurant.logo_url) || "/hotel.webp"}
                    alt={restaurant.name}
                    width={64}
                    height={64}
                    className="w-full h-full object-contain rounded-xl"
                  />
                </div>
              )}
              <div>
                <Badge className="bg-primary/20 text-primary border-primary/30 mb-2">
                  {restaurant.cuisine_type || "Fine Dining"}
                </Badge>
                <h1 className="text-2xl md:text-4xl font-bold text-white">
                  {restaurant.name}
                </h1>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
              >
                <Heart className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </motion.div>

          {/* Hero Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex-1 flex flex-col justify-center items-center text-center"
          >
            {/* Restaurant Logo */}
            {restaurant.logo_url && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="mb-8"
              >
                <div className="w-32 h-32 bg-white/20 backdrop-blur-sm rounded-3xl p-4 shadow-2xl border border-white/30">
                  <Image
                    src={getImageUrl(restaurant.logo_url) || "/hotel.webp"}
                    alt={restaurant.name}
                    width={100}
                    height={100}
                    className="w-full h-full object-contain rounded-2xl"
                  />
                </div>
              </motion.div>
            )}
            
            {/* Restaurant Name - Large Styled Font */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 tracking-tight"
              style={{
                textShadow: '0 4px 20px rgba(0,0,0,0.3), 0 0 60px rgba(230,57,70,0.3)',
                fontFamily: 'Georgia, serif',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 50%, #ffffff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              {restaurant.name}
            </motion.h1>
            
            {/* Restaurant Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="text-lg md:text-2xl text-white/90 mb-8 leading-relaxed font-serif max-w-3xl"
              style={{ textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}
            >
              {restaurant.description || "Experience culinary excellence in an atmosphere of refined elegance and warm hospitality."}
            </motion.p>
            
            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 mb-12"
            >
              <Button
                size="lg"
                className="bg-[#E63946] hover:bg-[#E63946]/90 text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-xl shadow-[#E63946]/20 hover:shadow-[#E63946]/30 transition-all duration-300"
                asChild
              >
                <Link href={`/menu/${hotelSlug}/list`}>
                  Explore Menu
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
              
              {(restaurant.phone || restaurant.address) && (
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:border-[#F4A261]/50 px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300"
                >
                  <MapPin className="h-5 w-5 mr-2" />
                  Get Directions
                </Button>
              )}
            </motion.div>
            
            {/* Social Media Icons - Bottom Center */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.8 }}
              className="flex items-center justify-center gap-4"
            >
              {restaurant.instagram_url && (
                <motion.a
                  href={restaurant.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-12 h-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300"
                >
                  <Instagram className="h-6 w-6" />
                </motion.a>
              )}
              
              {restaurant.facebook_url && (
                <motion.a
                  href={restaurant.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-12 h-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300"
                >
                  <Facebook className="h-6 w-6" />
                </motion.a>
              )}
              
              {restaurant.tiktok_url && (
                <motion.a
                  href={restaurant.tiktok_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-12 h-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300"
                >
                  <MessageCircle className="h-6 w-6" />
                </motion.a>
              )}
              
              {restaurant.telegram_url && (
                <motion.a
                  href={restaurant.telegram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-12 h-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300"
                >
                  <Send className="h-6 w-6" />
                </motion.a>
              )}
              
              {restaurant.website_url && (
                <motion.a
                  href={restaurant.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-12 h-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300"
                >
                  <Globe className="h-6 w-6" />
                </motion.a>
              )}
            </motion.div>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex justify-center"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center"
            >
              <div className="w-1 h-3 bg-white/60 rounded-full mt-2" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* RESTAURANT INFORMATION */}
      <section className="py-20 md:py-24 px-6 md:px-12 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#F9FAFB] via-[#E5E7EB] to-[#D1D5DB] dark:from-[#0F172A] dark:via-[#1F2937] dark:to-[#374151]" />
        
        {/* Decorative Graphics - More Colorful */}
        <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-gradient-to-br from-[#E63946]/15 to-[#F4A261]/10 to-transparent blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-gradient-to-br from-[#2A9D8F]/12 to-[#E63946]/08 to-transparent blur-3xl" />
        <div className="absolute top-1/2 left-1/4 w-32 h-32 rounded-full bg-gradient-to-br from-[#F4A261]/10 to-[#2A9D8F]/08 to-transparent blur-2xl" />
        <div className="absolute bottom-1/3 right-1/3 w-48 h-48 rounded-full bg-gradient-to-br from-[#E63946]/08 to-[#F4A261]/06 to-transparent blur-2xl" />
        
        {/* Abstract Shapes - More Colorful */}
        <div className="absolute top-0 right-0 w-96 h-96 opacity-25">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-gradient-to-br from-[#E63946]/12 to-[#F4A261]/08 to-transparent blur-3xl transform rotate-45" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-gradient-to-br from-[#2A9D8F]/10 to-[#E63946]/06 to-transparent blur-2xl transform -rotate-12" />
          <div className="absolute top-1/2 left-1/2 w-32 h-32 rounded-full bg-gradient-to-br from-[#F4A261]/08 to-[#2A9D8F]/06 to-transparent blur-xl transform rotate-12" />
        </div>
        <div className="absolute bottom-0 left-0 w-80 h-80 opacity-20">
          <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full bg-gradient-to-br from-[#F4A261]/10 to-[#E63946]/08 to-transparent blur-2xl transform rotate-12" />
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-gradient-to-br from-[#2A9D8F]/08 to-[#F4A261]/06 to-transparent blur-xl transform -rotate-45" />
          <div className="absolute bottom-1/4 right-1/4 w-24 h-24 rounded-full bg-gradient-to-br from-[#E63946]/06 to-[#2A9D8F]/04 to-transparent blur-lg transform rotate-45" />
        </div>
        
        {/* Additional Colorful Elements */}
        <div className="absolute top-1/4 right-1/4 w-72 h-72 opacity-15">
          <div className="absolute top-0 left-0 w-48 h-48 rounded-full bg-gradient-to-br from-[#F4A261]/10 to-[#E63946]/06 to-transparent blur-2xl transform rotate-45" />
          <div className="absolute bottom-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br from-[#2A9D8F]/08 to-[#F4A261]/04 to-transparent blur-xl transform -rotate-12" />
        </div>
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 opacity-12">
          <div className="absolute bottom-0 right-0 w-40 h-40 rounded-full bg-gradient-to-br from-[#E63946]/08 to-[#F4A261]/06 to-transparent blur-2xl transform rotate-45" />
          <div className="absolute top-0 left-0 w-32 h-32 rounded-full bg-gradient-to-br from-[#2A9D8F]/06 to-[#E63946]/04 to-transparent blur-xl transform -rotate-12" />
        </div>
        
        <div className="relative z-10 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Restaurant Information</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Everything you need to know about our restaurant
            </p>
            <p className="text-muted-foreground text-base max-w-xl mx-auto mt-4">
              From our humble beginnings to becoming a culinary destination, every detail has been carefully crafted to provide you with an unforgettable dining experience.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {restaurant.phone && (
              <motion.a
                href={`tel:${restaurant.phone}`}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 dark:border-slate-700 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#E63946]/10 dark:bg-[#E63946]/20 rounded-xl flex items-center justify-center group-hover:bg-[#E63946]/20 transition-colors">
                    <Phone className="h-6 w-6 text-[#E63946]" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{restaurant.phone}</p>
                    <p className="text-xs text-muted-foreground mt-1">Call us for reservations</p>
                  </div>
                </div>
              </motion.a>
            )}

            {restaurant.email && (
              <motion.a
                href={`mailto:${restaurant.email}`}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 dark:border-slate-700 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#E63946]/10 dark:bg-[#E63946]/20 rounded-xl flex items-center justify-center group-hover:bg-[#E63946]/20 transition-colors">
                    <Mail className="h-6 w-6 text-[#E63946]" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{restaurant.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">Send us your inquiries</p>
                  </div>
                </div>
              </motion.a>
            )}

            {restaurant.address && (
              <motion.a
                href={`https://maps.google.com/?q=${encodeURIComponent(restaurant.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 dark:border-slate-700 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#E63946]/10 dark:bg-[#E63946]/20 rounded-xl flex items-center justify-center group-hover:bg-[#E63946]/20 transition-colors">
                    <MapPin className="h-6 w-6 text-[#E63946]" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-2">{restaurant.address}</p>
                    <p className="text-xs text-muted-foreground mt-1">Find us easily</p>
                  </div>
                </div>
              </motion.a>
            )}

            {restaurant.opening_hours && (
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 dark:border-slate-700"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#E63946]/10 dark:bg-[#E63946]/20 rounded-xl flex items-center justify-center">
                    <Clock className="h-6 w-6 text-[#E63946]" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Hours</p>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{restaurant.opening_hours}</p>
                    <p className="text-xs text-muted-foreground mt-1">We're waiting for you</p>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
          
          {/* Additional Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-12 text-center"
          >
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 border border-white/20 dark:border-slate-600">
              <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-slate-100">Our Story</h3>
              <p className="text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Founded with a passion for exceptional cuisine and warm hospitality, our restaurant has been serving the community for over a decade. 
                We believe that great food is not just about taste, but about creating memories that last a lifetime.
              </p>
              <div className="mt-6 flex justify-center gap-8">
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#E63946]">10+</p>
                  <p className="text-sm text-muted-foreground">Years of Excellence</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#2A9D8F]">50k+</p>
                  <p className="text-sm text-muted-foreground">Happy Customers</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#F4A261]">100+</p>
                  <p className="text-sm text-muted-foreground">Menu Items</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Visual Divider */}
        <div className="relative z-10 mt-20 flex items-center justify-center">
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-[#E63946]/30 to-transparent" />
          <div className="mx-4 w-2 h-2 bg-[#E63946]/20 rounded-full" />
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-[#E63946]/30 to-transparent" />
        </div>
      </section>

      {/* IMAGE GALLERY */}
      {galleryImages.length > 0 && (
        <section className="py-20 md:py-24 px-6 md:px-12 relative overflow-hidden">
          {/* Background Gradients */}
          <div className="absolute inset-0 bg-gradient-to-br from-white via-[#F8FAFC] to-[#F1F5F9] dark:from-[#0F172A] dark:via-[#111827] dark:to-[#1F2937]" />
          
          {/* Decorative Graphics - More Colorful */}
          <div className="absolute top-32 right-20 w-80 h-80 rounded-full bg-gradient-to-br from-[#2A9D8F]/12 to-[#E63946]/08 to-transparent blur-3xl" />
          <div className="absolute bottom-32 left-20 w-96 h-96 rounded-full bg-gradient-to-br from-[#F4A261]/10 to-[#2A9D8F]/06 to-transparent blur-3xl" />
          <div className="absolute top-1/3 left-1/4 w-40 h-40 rounded-full bg-gradient-to-br from-[#E63946]/08 to-[#F4A261]/06 to-transparent blur-2xl" />
          <div className="absolute bottom-1/4 right-1/3 w-56 h-56 rounded-full bg-gradient-to-br from-[#2A9D8F]/08 to-[#F4A261]/04 to-transparent blur-2xl" />
          
          {/* Abstract Shapes - More Colorful */}
          <div className="absolute top-0 left-0 w-72 h-72 opacity-20">
            <div className="absolute top-0 left-0 w-48 h-48 rounded-full bg-gradient-to-br from-[#E63946]/10 to-[#F4A261]/06 to-transparent blur-2xl transform rotate-12" />
            <div className="absolute bottom-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br from-[#F4A261]/08 to-[#2A9D8F]/04 to-transparent blur-xl transform -rotate-45" />
            <div className="absolute top-1/2 right-1/2 w-24 h-24 rounded-full bg-gradient-to-br from-[#2A9D8F]/06 to-[#E63946]/04 to-transparent blur-lg transform rotate-45" />
          </div>
          <div className="absolute bottom-0 right-0 w-64 h-64 opacity-18">
            <div className="absolute bottom-0 right-0 w-40 h-40 rounded-full bg-gradient-to-br from-[#2A9D8F]/10 to-[#F4A261]/06 to-transparent blur-2xl transform -rotate-12" />
            <div className="absolute top-0 left-0 w-32 h-32 rounded-full bg-gradient-to-br from-[#F4A261]/08 to-[#E63946]/04 to-transparent blur-xl transform rotate-45" />
            <div className="absolute bottom-1/4 left-1/4 w-20 h-20 rounded-full bg-gradient-to-br from-[#E63946]/06 to-[#2A9D8F]/04 to-transparent blur-md transform -rotate-45" />
          </div>
          
          {/* Additional Colorful Elements */}
          <div className="absolute top-1/4 right-1/4 w-80 h-80 opacity-15">
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-gradient-to-br from-[#F4A261]/10 to-[#2A9D8F]/06 to-transparent blur-2xl transform rotate-45" />
            <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-gradient-to-br from-[#E63946]/08 to-[#F4A261]/04 to-transparent blur-xl transform -rotate-12" />
          </div>
          <div className="absolute bottom-1/4 left-1/4 w-72 h-72 opacity-12">
            <div className="absolute bottom-0 right-0 w-40 h-40 rounded-full bg-gradient-to-br from-[#2A9D8F]/08 to-[#E63946]/06 to-transparent blur-2xl transform rotate-45" />
            <div className="absolute top-0 left-0 w-32 h-32 rounded-full bg-gradient-to-br from-[#F4A261]/06 to-[#2A9D8F]/04 to-transparent blur-xl transform -rotate-12" />
          </div>
          
          <div className="relative z-10 max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-4">Gallery</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Take a visual journey through our culinary creations and elegant ambiance
              </p>
              <p className="text-muted-foreground text-base max-w-xl mx-auto mt-4">
                Every dish tells a story, every corner holds a memory. Explore our world through carefully curated moments 
                that capture the essence of our culinary artistry and warm hospitality.
              </p>
            </motion.div>

            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-xl border border-white/20 dark:border-slate-600">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {galleryImages.map((image, index) => (
                  <motion.div
                    key={image.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group shadow-lg hover:shadow-2xl transition-all duration-300 border border-white/30 dark:border-slate-600"
                    onClick={() => setGalleryIndex(index)}
                  >
                    <Image
                      src={getImageUrl(image.url) || "/hotel.webp"}
                      alt={image.alt}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    {image.caption && (
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {image.caption}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
            
            {/* Additional Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="mt-12 text-center"
            >
              <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm rounded-3xl p-8 border border-white/20 dark:border-slate-600">
                <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-slate-100">Culinary Artistry</h3>
                <p className="text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-6">
                  Our gallery showcases the passion and creativity that goes into every dish. From farm-fresh ingredients to 
                  innovative presentation techniques, each image represents our commitment to excellence.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-[#E63946]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Camera className="h-8 w-8 text-[#E63946]" />
                    </div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Professional Photography</h4>
                    <p className="text-sm text-muted-foreground">Every shot is carefully crafted to showcase our culinary masterpieces</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-[#2A9D8F]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Heart className="h-8 w-8 text-[#2A9D8F]" />
                    </div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Made with Love</h4>
                    <p className="text-sm text-muted-foreground">Each dish is prepared with passion and attention to detail</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-[#F4A261]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Star className="h-8 w-8 text-[#F4A261]" />
                    </div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Award Winning</h4>
                    <p className="text-sm text-muted-foreground">Recognized for excellence in culinary innovation and service</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Visual Divider */}
          <div className="relative z-10 mt-20 flex items-center justify-center">
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-[#2A9D8F]/30 to-transparent" />
            <div className="mx-4 w-2 h-2 bg-[#2A9D8F]/20 rounded-full" />
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-[#2A9D8F]/30 to-transparent" />
          </div>
        </section>
      )}

      {/* TESTIMONIALS */}
      <section className="py-20 md:py-24 px-6 md:px-12 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#F8FAFC] via-[#F1F5F9] to-[#E5E7EB] dark:from-[#0F172A] dark:via-[#111827] dark:to-[#1F2937]" />
        
        {/* Decorative Graphics - More Colorful */}
        <div className="absolute top-20 left-32 w-72 h-72 rounded-full bg-gradient-to-br from-[#F4A261]/12 to-[#E63946]/08 to-transparent blur-3xl" />
        <div className="absolute bottom-20 right-32 w-96 h-96 rounded-full bg-gradient-to-br from-[#E63946]/10 to-[#2A9D8F]/06 to-transparent blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-40 h-40 rounded-full bg-gradient-to-br from-[#2A9D8F]/08 to-[#F4A261]/06 to-transparent blur-2xl" />
        <div className="absolute bottom-1/3 left-1/3 w-48 h-48 rounded-full bg-gradient-to-br from-[#F4A261]/08 to-[#E63946]/06 to-transparent blur-2xl" />
        
        {/* Abstract Shapes - More Colorful */}
        <div className="absolute top-0 right-0 w-80 h-80 opacity-22">
          <div className="absolute top-0 right-0 w-56 h-56 rounded-full bg-gradient-to-br from-[#E63946]/10 to-[#F4A261]/06 to-transparent blur-2xl transform rotate-45" />
          <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full bg-gradient-to-br from-[#F4A261]/08 to-[#2A9D8F]/04 to-transparent blur-xl transform -rotate-12" />
          <div className="absolute top-1/2 left-1/2 w-24 h-24 rounded-full bg-gradient-to-br from-[#2A9D8F]/06 to-[#E63946]/04 to-transparent blur-lg transform rotate-12" />
        </div>
        <div className="absolute bottom-0 left-0 w-72 h-72 opacity-18">
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-gradient-to-br from-[#2A9D8F]/10 to-[#E63946]/06 to-transparent blur-2xl transform rotate-12" />
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br from-[#E63946]/08 to-[#F4A261]/04 to-transparent blur-xl transform -rotate-45" />
          <div className="absolute bottom-1/4 right-1/4 w-20 h-20 rounded-full bg-gradient-to-br from-[#F4A261]/06 to-[#2A9D8F]/04 to-transparent blur-md transform rotate-45" />
        </div>
        
        {/* Additional Colorful Elements */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 opacity-15">
          <div className="absolute top-0 left-0 w-48 h-48 rounded-full bg-gradient-to-br from-[#E63946]/10 to-[#2A9D8F]/06 to-transparent blur-2xl transform rotate-45" />
          <div className="absolute bottom-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br from-[#F4A261]/08 to-[#E63946]/04 to-transparent blur-xl transform -rotate-12" />
        </div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 opacity-12">
          <div className="absolute bottom-0 right-0 w-40 h-40 rounded-full bg-gradient-to-br from-[#2A9D8F]/08 to-[#F4A261]/06 to-transparent blur-2xl transform rotate-45" />
          <div className="absolute top-0 left-0 w-32 h-32 rounded-full bg-gradient-to-br from-[#E63946]/06 to-[#2A9D8F]/04 to-transparent blur-xl transform -rotate-12" />
        </div>
        
        <div className="relative z-10 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">What Our Guests Say</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Discover why our guests keep coming back for more
            </p>
            <p className="text-muted-foreground text-base max-w-xl mx-auto mt-4">
              Nothing makes us happier than seeing our guests leave with smiles. Here are some of the wonderful things 
              our valued customers have shared about their experiences with us.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -4 }}
                className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/30 dark:border-slate-600"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${i < testimonial.rating ? 'fill-[#F4A261] text-[#F4A261]' : 'text-slate-300 dark:text-slate-600'}`}
                    />
                  ))}
                </div>
                <Quote className="h-8 w-8 text-[#E63946]/20 mb-4" />
                <p className="text-muted-foreground mb-6 italic leading-relaxed">"{testimonial.text}"</p>
                <p className="font-semibold text-slate-900 dark:text-slate-100">{testimonial.name}</p>
                <p className="text-xs text-muted-foreground mt-2">Verified Customer</p>
              </motion.div>
            ))}
          </div>
          
          {/* Additional Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-12 text-center"
          >
            <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-3xl p-8 border border-white/20 dark:border-slate-600">
              <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-slate-100">Guest Experience</h3>
              <p className="text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-6">
                At our restaurant, every guest is treated like family. We take pride in creating memorable experiences 
                that keep our customers coming back time and time again.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#F4A261]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Star className="h-8 w-8 text-[#F4A261]" />
                  </div>
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">4.9/5 Rating</h4>
                  <p className="text-sm text-muted-foreground">Average customer satisfaction</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#E63946]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Heart className="h-8 w-8 text-[#E63946]" />
                  </div>
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">12k+ Reviews</h4>
                  <p className="text-sm text-muted-foreground">Happy customers worldwide</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#2A9D8F]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MessageCircle className="h-8 w-8 text-[#2A9D8F]" />
                  </div>
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">98% Return</h4>
                  <p className="text-sm text-muted-foreground">Guests come back again</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#F4A261]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Award className="h-8 w-8 text-[#F4A261]" />
                  </div>
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Awards Won</h4>
                  <p className="text-sm text-muted-foreground">Industry recognition</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Visual Divider */}
          <div className="mt-20 flex items-center justify-center">
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-[#F4A261]/30 to-transparent" />
            <div className="mx-4 w-2 h-2 bg-[#F4A261]/20 rounded-full" />
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-[#F4A261]/30 to-transparent" />
          </div>
        </div>
      </section>

      {/* SOCIAL MEDIA */}
      {(restaurant.instagram_url || restaurant.facebook_url || restaurant.tiktok_url || restaurant.telegram_url || restaurant.website_url) && (
        <section className="py-20 md:py-24 px-6 md:px-12 relative overflow-hidden">
          {/* Background Gradients */}
          <div className="absolute inset-0 bg-gradient-to-br from-white via-[#F8FAFC] to-[#F1F5F9] dark:from-[#0F172A] dark:via-[#111827] dark:to-[#1F2937]" />
          
          {/* Decorative Graphics - More Colorful */}
          <div className="absolute top-40 right-16 w-80 h-80 rounded-full bg-gradient-to-br from-[#E63946]/12 to-[#F4A261]/08 to-transparent blur-3xl" />
          <div className="absolute bottom-40 left-16 w-96 h-96 rounded-full bg-gradient-to-br from-[#2A9D8F]/10 to-[#E63946]/06 to-transparent blur-3xl" />
          <div className="absolute top-1/4 left-1/3 w-48 h-48 rounded-full bg-gradient-to-br from-[#F4A261]/08 to-[#2A9D8F]/06 to-transparent blur-2xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-gradient-to-br from-[#E63946]/08 to-[#F4A261]/04 to-transparent blur-2xl" />
          
          {/* Abstract Shapes - More Colorful */}
          <div className="absolute top-0 left-0 w-96 h-96 opacity-20">
            <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-gradient-to-br from-[#E63946]/10 to-[#F4A261]/06 to-transparent blur-2xl transform rotate-45" />
            <div className="absolute bottom-0 right-0 w-48 h-48 rounded-full bg-gradient-to-br from-[#F4A261]/08 to-[#2A9D8F]/04 to-transparent blur-xl transform -rotate-12" />
            <div className="absolute top-1/2 right-1/2 w-24 h-24 rounded-full bg-gradient-to-br from-[#2A9D8F]/06 to-[#E63946]/04 to-transparent blur-lg transform rotate-12" />
          </div>
          <div className="absolute bottom-0 right-0 w-80 h-80 opacity-18">
            <div className="absolute bottom-0 right-0 w-56 h-56 rounded-full bg-gradient-to-br from-[#2A9D8F]/10 to-[#F4A261]/06 to-transparent blur-2xl transform rotate-12" />
            <div className="absolute top-0 left-0 w-40 h-40 rounded-full bg-gradient-to-br from-[#E63946]/08 to-[#F4A261]/04 to-transparent blur-xl transform rotate-45" />
            <div className="absolute bottom-1/4 left-1/4 w-20 h-20 rounded-full bg-gradient-to-br from-[#F4A261]/06 to-[#2A9D8F]/04 to-transparent blur-md transform -rotate-45" />
          </div>
          
          {/* Additional Colorful Elements */}
          <div className="absolute top-1/4 right-1/4 w-72 h-72 opacity-15">
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-gradient-to-br from-[#F4A261]/10 to-[#E63946]/06 to-transparent blur-2xl transform rotate-45" />
            <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-gradient-to-br from-[#E63946]/08 to-[#F4A261]/04 to-transparent blur-xl transform -rotate-12" />
          </div>
          <div className="absolute bottom-1/4 left-1/4 w-64 h-64 opacity-12">
            <div className="absolute bottom-0 right-0 w-40 h-40 rounded-full bg-gradient-to-br from-[#2A9D8F]/08 to-[#F4A261]/06 to-transparent blur-2xl transform rotate-45" />
            <div className="absolute top-0 left-0 w-32 h-32 rounded-full bg-gradient-to-br from-[#E63946]/06 to-[#2A9D8F]/04 to-transparent blur-xl transform -rotate-12" />
          </div>
          
          <div className="relative z-10 max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-4">Follow Us</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
                Stay connected for updates, special offers, and behind-the-scenes content
              </p>
              <p className="text-muted-foreground text-base max-w-xl mx-auto">
                Join our community and be the first to know about new dishes, special events, and exclusive offers. 
                We love sharing our culinary journey with you!
              </p>

              <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 inline-flex shadow-xl border border-white/30 dark:border-slate-600">
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  {restaurant.instagram_url && (
                    <motion.a
                      href={restaurant.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-14 h-14 bg-gradient-to-br from-[#E63946] to-[#E63946]/80 rounded-2xl flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Instagram className="h-6 w-6" />
                    </motion.a>
                  )}
                  
                  {restaurant.facebook_url && (
                    <motion.a
                      href={restaurant.facebook_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-14 h-14 bg-gradient-to-br from-[#2A9D8F] to-[#2A9D8F]/80 rounded-2xl flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Facebook className="h-6 w-6" />
                    </motion.a>
                  )}
                  
                  {restaurant.tiktok_url && (
                    <motion.a
                      href={restaurant.tiktok_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-14 h-14 bg-gradient-to-br from-[#F4A261] to-[#F4A261]/80 rounded-2xl flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <MessageCircle className="h-6 w-6" />
                    </motion.a>
                  )}
                  
                  {restaurant.telegram_url && (
                    <motion.a
                      href={restaurant.telegram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-14 h-14 bg-gradient-to-br from-[#E63946] to-[#E63946]/80 rounded-2xl flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Send className="h-6 w-6" />
                    </motion.a>
                  )}
                  
                  {restaurant.website_url && (
                    <motion.a
                      href={restaurant.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-14 h-14 bg-gradient-to-br from-[#2A9D8F] to-[#2A9D8F]/80 rounded-2xl flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Globe className="h-6 w-6" />
                    </motion.a>
                  )}
                </div>
              </div>
              
              {/* Additional Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="mt-8"
              >
                <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm rounded-3xl p-8 border border-white/20 dark:border-slate-600">
                  <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-slate-100">Stay Connected</h3>
                  <p className="text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-6">
                    Follow us on social media to get daily updates, behind-the-scenes content, and exclusive offers 
                    that you won't find anywhere else.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-[#E63946]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Share2 className="h-8 w-8 text-[#E63946]" />
                      </div>
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Daily Updates</h4>
                      <p className="text-sm text-muted-foreground">New dishes and special offers</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-[#2A9D8F]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Camera className="h-8 w-8 text-[#2A9D8F]" />
                      </div>
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Behind Scenes</h4>
                      <p className="text-sm text-muted-foreground">Kitchen stories and more</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-[#F4A261]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Heart className="h-8 w-8 text-[#F4A261]" />
                      </div>
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Community</h4>
                      <p className="text-sm text-muted-foreground">Join our food family</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Visual Divider */}
          <div className="relative z-10 mt-20 flex items-center justify-center">
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-[#E63946]/30 to-transparent" />
            <div className="mx-4 w-2 h-2 bg-[#E63946]/20 rounded-full" />
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-[#E63946]/30 to-transparent" />
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer className="relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#F1F5F9] via-[#E5E7EB] to-[#D1D5DB] dark:from-[#111827] dark:via-[#1F2937] dark:to-[#374151]" />
        
        {/* Decorative Graphics - More Colorful */}
        <div className="absolute top-10 right-20 w-64 h-64 rounded-full bg-gradient-to-br from-[#E63946]/10 to-[#F4A261]/06 to-transparent blur-3xl" />
        <div className="absolute bottom-10 left-20 w-80 h-80 rounded-full bg-gradient-to-br from-[#2A9D8F]/08 to-[#E63946]/04 to-transparent blur-3xl" />
        <div className="absolute top-1/3 left-1/3 w-32 h-32 rounded-full bg-gradient-to-br from-[#F4A261]/08 to-[#2A9D8F]/06 to-transparent blur-2xl" />
        <div className="absolute bottom-1/3 right-1/3 w-48 h-48 rounded-full bg-gradient-to-br from-[#E63946]/08 to-[#F4A261]/04 to-transparent blur-2xl" />
        
        {/* Abstract Shapes - More Colorful */}
        <div className="absolute top-0 right-0 w-72 h-72 opacity-20">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-gradient-to-br from-[#E63946]/10 to-[#F4A261]/06 to-transparent blur-2xl transform rotate-45" />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-gradient-to-br from-[#2A9D8F]/08 to-[#E63946]/04 to-transparent blur-xl transform -rotate-12" />
          <div className="absolute top-1/2 left-1/2 w-24 h-24 rounded-full bg-gradient-to-br from-[#F4A261]/06 to-[#2A9D8F]/04 to-transparent blur-lg transform rotate-12" />
        </div>
        <div className="absolute bottom-0 left-0 w-64 h-64 opacity-18">
          <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full bg-gradient-to-br from-[#F4A261]/10 to-[#E63946]/06 to-transparent blur-2xl transform rotate-12" />
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br from-[#E63946]/08 to-[#F4A261]/04 to-transparent blur-xl transform -rotate-45" />
          <div className="absolute bottom-1/4 right-1/4 w-20 h-20 rounded-full bg-gradient-to-br from-[#2A9D8F]/06 to-[#F4A261]/04 to-transparent blur-md transform rotate-45" />
        </div>
        
        {/* Additional Colorful Elements */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 opacity-15">
          <div className="absolute top-0 left-0 w-48 h-48 rounded-full bg-gradient-to-br from-[#E63946]/10 to-[#2A9D8F]/06 to-transparent blur-2xl transform rotate-45" />
          <div className="absolute bottom-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br from-[#F4A261]/08 to-[#E63946]/04 to-transparent blur-xl transform -rotate-12" />
        </div>
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 opacity-12">
          <div className="absolute bottom-0 right-0 w-40 h-40 rounded-full bg-gradient-to-br from-[#2A9D8F]/08 to-[#F4A261]/06 to-transparent blur-2xl transform rotate-45" />
          <div className="absolute top-0 left-0 w-32 h-32 rounded-full bg-gradient-to-br from-[#E63946]/06 to-[#2A9D8F]/04 to-transparent blur-xl transform -rotate-12" />
        </div>
        
        <div className="relative z-10 border-t border-[#E63946]/10 dark:border-[#E63946]/20 py-16 md:py-20 px-6 md:px-12">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  {restaurant.logo_url && (
                    <div className="w-10 h-10 bg-[#E63946]/10 dark:bg-[#E63946]/20 rounded-xl p-2">
                      <Image
                        src={getImageUrl(restaurant.logo_url) || "/hotel.webp"}
                        alt={restaurant.name}
                        width={40}
                        height={40}
                        className="w-full h-full object-contain rounded-lg"
                      />
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{restaurant.name}</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  {restaurant.description || "Excellence in every dish, perfection in every moment."}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Experience the perfect blend of traditional flavors and modern culinary innovation.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-4 text-slate-900 dark:text-slate-100">Contact</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  {restaurant.phone && (
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-[#E63946]" />
                      <span>{restaurant.phone}</span>
                    </p>
                  )}
                  {restaurant.email && (
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-[#E63946]" />
                      <span>{restaurant.email}</span>
                    </p>
                  )}
                  {restaurant.address && (
                    <p className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-[#E63946] mt-0.5 flex-shrink-0" />
                      <span>{restaurant.address}</span>
                    </p>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-[#E63946]/10 dark:border-[#E63946]/20">
                  <p className="text-xs text-muted-foreground">Business Hours: {restaurant.opening_hours || "Daily 11:00 AM - 10:00 PM"}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-4 text-slate-900 dark:text-slate-100">Quick Links</h4>
                <div className="space-y-2">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-muted-foreground hover:text-[#E63946] hover:bg-[#E63946]/5 transition-colors" 
                    asChild
                  >
                    <Link href={`/menu/${hotelSlug}/list`}>View Menu</Link>
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-muted-foreground hover:text-[#E63946] hover:bg-[#E63946]/5 transition-colors" 
                    asChild
                  >
                    <Link href="/">Back to Home</Link>
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-muted-foreground hover:text-[#E63946] hover:bg-[#E63946]/5 transition-colors" 
                    asChild
                  >
                    <Link href={`/menu/${hotelSlug}/list#contact`}>Contact Us</Link>
                  </Button>
                </div>
                <div className="mt-4 pt-4 border-t border-[#E63946]/10 dark:border-[#E63946]/20">
                  <p className="text-xs text-muted-foreground">Emergency: {restaurant.phone || "+1 (555) 123-4567"}</p>
                </div>
              </div>
            </div>

            {/* Additional Footer Content */}
            <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm rounded-3xl p-8 border border-white/20 dark:border-slate-600">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 text-slate-900 dark:text-slate-100">Our Promise</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    We are committed to providing exceptional dining experiences with the freshest ingredients 
                    and warm hospitality that makes every guest feel special.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-3 text-slate-900 dark:text-slate-100">Awards</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Recognized for culinary excellence, outstanding service, and commitment to quality.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-3 text-slate-900 dark:text-slate-100">Sustainability</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    We source locally whenever possible and implement eco-friendly practices in our operations.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-[#E63946]/10 dark:border-[#E63946]/20 pt-8 text-center text-sm text-muted-foreground">
              <p className="mb-2">&copy; 2024 {restaurant.name}. All rights reserved.</p>
              <p className="text-xs">Powered by Agelgil Digital Menus | Crafted with ❤️ in {new Date().getFullYear()}</p>
              <div className="mt-2 flex justify-center gap-4">
                <a href="#" className="text-xs text-[#E63946] hover:text-[#E63946]/80 transition-colors">Privacy Policy</a>
                <a href="#" className="text-xs text-[#E63946] hover:text-[#E63946]/80 transition-colors">Terms of Service</a>
                <a href="#" className="text-xs text-[#E63946] hover:text-[#E63946]/80 transition-colors">Cookie Policy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Gallery Lightbox */}
      <AnimatePresence>
        {galleryIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setGalleryIndex(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl max-h-[90vh] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative aspect-video rounded-2xl overflow-hidden">
                <Image
                  src={getImageUrl(galleryImages[galleryIndex].url) || "/hotel.webp"}
                  alt={galleryImages[galleryIndex].alt}
                  fill
                  className="object-contain"
                />
              </div>

              <button
                onClick={() => setGalleryIndex(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              {galleryImages.length > 1 && (
                <>
                  <button
                    onClick={() => setGalleryIndex((galleryIndex - 1 + galleryImages.length) % galleryImages.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={() => setGalleryIndex((galleryIndex + 1) % galleryImages.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}

              {galleryImages[galleryIndex].caption && (
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-white text-lg font-medium">
                    {galleryImages[galleryIndex].caption}
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu Modal */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end"
            onClick={() => setShowMobileMenu(false)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="bg-background rounded-t-3xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">Quick Actions</h3>
                  <button
                    onClick={() => setShowMobileMenu(false)}
                    className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <Button
                    className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl"
                    asChild
                  >
                    <Link href={`/menu/${hotelSlug}/list`}>
                      <Utensils className="h-5 w-5 mr-2" />
                      View Full Menu
                    </Link>
                  </Button>

                  {restaurant.phone && (
                    <Button
                      variant="outline"
                      className="w-full h-14 rounded-2xl"
                      asChild
                    >
                      <a href={`tel:${restaurant.phone}`}>
                        <Phone className="h-5 w-5 mr-2" />
                        Call Restaurant
                      </a>
                    </Button>
                  )}

                  {restaurant.address && (
                    <Button
                      variant="outline"
                      className="w-full h-14 rounded-2xl"
                      asChild
                    >
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(restaurant.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Navigation className="h-5 w-5 mr-2" />
                        Get Directions
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
