"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getImageUrl } from "@/lib/utils"
import { SocialLinks } from "@/components/restaurant/SocialLinks"
import { Clock, MapPin, Phone, Mail, Utensils, QrCode, ArrowRight } from "lucide-react"

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
  const heroImage = coverImage || getImageUrl(hotel.cover_url || hotel.logo_url)
  const logo = logoImage || getImageUrl(hotel.logo_url)
  const hasSocialLinks = Boolean(
    hotel.instagram_url ||
    hotel.facebook_url ||
    hotel.twitter_url ||
    hotel.tiktok_url ||
    hotel.telegram_url ||
    hotel.website_url
  )

  return (
    <section className="relative flex min-h-screen w-full items-center overflow-hidden">
      <div className="absolute inset-0">
        {heroImage ? (
          <Image
            src={heroImage}
            alt={hotel.name}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        ) : (
          <div className="h-full w-full bg-linear-to-br from-neutral-900 via-neutral-800 to-neutral-900" />
        )}
        <div className="absolute inset-0 bg-linear-to-r from-black/70 via-black/50 to-black/70" />
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-black/40" />
      </div>

      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-20 left-10 h-20 w-20 rounded-full bg-linear-to-br from-primary/20 to-primary/10 blur-xl"
        />
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, 30, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-20 right-10 h-32 w-32 rounded-full bg-linear-to-br from-amber-500/20 to-orange-500/10 blur-xl"
        />
      </div>

      <div className="relative z-10 container mx-auto px-6 py-20 md:py-32">
        <div className="grid min-h-[80vh] items-center gap-10 lg:grid-cols-2 lg:gap-12">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="space-y-8 text-center lg:text-left"
          >
            {hotel.cuisine_type && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="inline-flex"
              >
                <Badge className="rounded-full border-0 bg-linear-to-r from-amber-500 to-orange-500 px-6 py-2 text-sm font-semibold text-white">
                  <Utensils className="mr-2 h-4 w-4" />
                  {hotel.cuisine_type}
                </Badge>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <h1 className="mb-4 text-4xl font-serif font-bold leading-tight text-white sm:text-5xl md:text-7xl">
                {hotel.name}
              </h1>
            </motion.div>

            {(hotel.tagline || hotel.description) && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-lg leading-relaxed text-white/90 sm:text-xl md:text-2xl font-serif"
              >
                {hotel.tagline || hotel.description}
              </motion.p>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-white/90 backdrop-blur-sm">
                Scan Now
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-white/90 backdrop-blur-sm">
                Fresh Food Photos
              </div>
            </div>

            {hotel.opening_hours && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="flex flex-wrap items-center justify-center gap-4 lg:justify-start"
              >
                <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 backdrop-blur-sm">
                  <Clock className="h-4 w-4 text-white" />
                  <span className="font-medium text-white">{hotel.opening_hours}</span>
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-wrap items-center justify-center gap-4 lg:justify-start"
            >
              <Button
                size="lg"
                className="w-full border-0 bg-linear-to-r from-primary to-primary/80 px-8 h-14 text-base font-semibold text-white shadow-2xl shadow-black/30 transition-all duration-300 hover:scale-105 hover:from-primary/90 hover:to-primary/70 sm:w-auto"
                asChild
              >
                <Link href={menuLink}>
                  <QrCode className="mr-2 h-4 w-4" />
                  Explore Menu
                </Link>
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="w-full rounded-xl border border-white/40 bg-white/95 px-8 h-14 text-base font-semibold text-slate-900 backdrop-blur-sm transition-all duration-300 hover:bg-white dark:border-white/30 dark:bg-white/15 dark:text-white dark:hover:bg-white/20 sm:w-auto"
                asChild
              >
                <a href={mapLink} target="_blank" rel="noreferrer">
                  <MapPin className="mr-2 h-4 w-4" />
                  Directions
                </a>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="flex flex-wrap items-center justify-center gap-6 text-white/90 lg:justify-start"
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

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
            className="flex flex-col items-center justify-center space-y-6 md:space-y-8"
          >
            {logo && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="relative"
              >
                <div className="relative h-40 w-40 overflow-hidden rounded-3xl border border-white/30 bg-white/10 p-4 shadow-2xl shadow-black/30 backdrop-blur-md sm:h-48 sm:w-48 md:h-64 md:w-64">
                  <Image
                    src={logo}
                    alt={hotel.name}
                    fill
                    className="object-contain p-2 drop-shadow-2xl"
                    sizes="(max-width: 768px) 160px, 256px"
                  />
                </div>
                <div className="pointer-events-none absolute inset-0 rounded-4xl border border-white/10" />
                {(hotel.tagline || hotel.description) && (
                  <div className="mt-4 text-center">
                    {hotel.tagline && (
                      <p className="mx-auto max-w-[14rem] text-sm italic text-white/90">“{hotel.tagline}”</p>
                    )}
                    {hotel.description && (
                      <p className="mt-2 text-xs uppercase tracking-wider text-white/70">{hotel.description}</p>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {hasSocialLinks && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.7 }}
                className="w-full space-y-6 text-center"
              >
                <div className="px-2">
                  <SocialLinks
                    hotel={hotel}
                    variant="light"
                    size="responsive"
                    transparent
                    className="flex-wrap justify-center"
                  />
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="flex h-10 w-6 justify-center rounded-full border-2 border-white/30"
        >
          <div className="mt-2 h-3 w-1 rounded-full bg-white/60" />
        </motion.div>
      </motion.div>
    </section>
  )
}
