"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getImageUrl } from "@/lib/utils"
import { SocialLinks } from "@/components/restaurant/SocialLinks"
import { Clock, MapPin, Phone, Mail, Utensils, Sparkles } from "lucide-react"

type Restaurant = {
  id: string
  name: string
  slug: string
  description?: string
  tagline?: string
  address?: string
  phone?: string
  email?: string
  logo_url?: string
  cover_url?: string
  cuisine_type?: string
  opening_hours?: string
  instagram_url?: string
  facebook_url?: string
  twitter_url?: string
  tiktok_url?: string
  telegram_url?: string
  website_url?: string
}

interface HeroSectionProps {
  hotel: Restaurant
  coverImage?: string
  logoImage?: string | null
  menuLink: string
  mapLink: string
}

export function HeroSection({
  hotel,
  coverImage,
  logoImage,
  menuLink,
  mapLink,
}: HeroSectionProps) {
  const heroImage = coverImage || getImageUrl(hotel.cover_url || hotel.logo_url) || "/placeholder.svg"
  const logo = logoImage || getImageUrl(hotel.logo_url)

  return (
    <section className="relative w-full overflow-hidden min-h-screen flex items-center">
      {/* Background Image with Enhanced Overlay */}
      <div className="absolute inset-0">
        <Image 
          src={heroImage} 
          alt={hotel.name} 
          fill 
          className="object-cover" 
          priority 
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
      </div>

      {/* Floating Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ 
            x: [0, 30, 0],
            y: [0, -20, 0],
            rotate: [0, 5, 0]
          }}
          transition={{ 
            duration: 20, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full blur-xl"
        />
        <motion.div
          animate={{ 
            x: [0, -20, 0],
            y: [0, 30, 0],
            rotate: [0, -5, 0]
          }}
          transition={{ 
            duration: 25, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="absolute bottom-20 right-10 w-32 h-32 bg-gradient-to-br from-amber-500/20 to-orange-500/10 rounded-full blur-xl"
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-6 py-20 md:py-32">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center min-h-[80vh]">
          {/* Left Column - Restaurant Info */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="space-y-8 text-center lg:text-left"
          >
            {/* Cuisine Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="inline-flex"
            >
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 px-6 py-2 text-sm font-semibold rounded-full">
                <Utensils className="mr-2 h-4 w-4" />
                {hotel.cuisine_type || "Fine Dining"}
              </Badge>
            </motion.div>

            {/* Restaurant Name */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-serif font-bold text-white leading-tight mb-4">
                {hotel.name}
              </h1>
            </motion.div>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg sm:text-xl md:text-2xl text-white/90 font-serif leading-relaxed"
            >
              {hotel.tagline || hotel.description || "Experience culinary excellence in every bite"}
            </motion.p>

            {/* Status Badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-4"
            >
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-5 py-3 border border-white/20">
                <Clock className="h-4 w-4 text-white" />
                <span className="text-white font-medium">
                  {hotel.opening_hours || "Open Daily 8:00 AM - 11:00 PM"}
                </span>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-4"
            >
              <Button 
                size="lg" 
                className="w-full sm:w-auto rounded-xl px-8 h-14 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-2xl shadow-black/30 hover:shadow-black/40 transition-all duration-300 hover:scale-105 border-0" 
                asChild
              >
                <Link href={menuLink}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  View Menu
                </Link>
              </Button>
              
              {mapLink && (
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="w-full sm:w-auto rounded-xl px-8 h-14 text-base font-semibold bg-white/95 text-slate-900 border border-white/40 hover:bg-white dark:bg-white/15 dark:text-white dark:border-white/30 dark:hover:bg-white/20 backdrop-blur-sm transition-all duration-300" 
                  asChild
                >
                  <a href={mapLink} target="_blank" rel="noreferrer">
                    <MapPin className="mr-2 h-4 w-4" />
                    Directions
                  </a>
                </Button>
              )}
            </motion.div>

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-white/90"
            >
              {hotel.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">{hotel.address}</span>
                </div>
              )}
              {hotel.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span className="text-sm">{hotel.phone}</span>
                </div>
              )}
              {hotel.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">{hotel.email}</span>
                </div>
              )}
            </motion.div>
          </motion.div>

          {/* Right Column - Logo & Social */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
            className="flex flex-col items-center justify-center space-y-6 md:space-y-8"
          >
            {/* Restaurant Logo */}
            {logo && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="relative"
              >
                <div className="relative w-40 h-40 sm:w-48 sm:h-48 md:w-64 md:h-64 rounded-3xl overflow-hidden border border-white/30 bg-white/10 backdrop-blur-md p-4">
                  <Image 
                    src={logo} 
                    alt={hotel.name} 
                    fill 
                    className="object-contain p-2 drop-shadow-2xl" 
                  />
                </div>
                <div className="absolute inset-0 rounded-[2rem] border border-white/10 pointer-events-none" />
              </motion.div>
            )}

            {/* Social Media Links */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="text-center space-y-6 w-full"
            >
              <div className="px-2">
                <p className="text-white/70 text-xs font-serif uppercase tracking-[0.35em] mb-5">
                  Follow Our Journey
                </p>
                <SocialLinks
                  hotel={hotel}
                  variant="light"
                  size="responsive"
                  showAll
                  transparent
                  className="justify-center flex-wrap"
                />
                <p className="text-white/50 text-xs mt-5">Stay close for events, specials, and seasonal menus.</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center"
        >
          <div className="w-1 h-3 bg-white/60 rounded-full mt-2" />
        </motion.div>
      </motion.div>
    </section>
  )
}
