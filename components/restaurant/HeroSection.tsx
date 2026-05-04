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
  rating?: number
  review_count?: number
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
    <section className="relative isolate flex min-h-screen w-full items-center overflow-hidden pt-24 md:pt-28">
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
        <div className="absolute inset-0 bg-linear-to-r from-black/75 via-black/45 to-black/70" />
        <div className="absolute inset-0 bg-linear-to-t from-black/85 via-transparent to-black/30" />
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

      <div className="relative z-10 container mx-auto px-4 py-16 sm:px-6 md:py-24">
        <div className="grid min-h-[78vh] items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="space-y-8 text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.32em] text-white/85 backdrop-blur-md"
            >
              <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_20px_rgba(230,57,70,0.7)]" />
              Crafted digital dining
            </motion.div>

            {hotel.cuisine_type && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="inline-flex"
              >
                <Badge className="rounded-full border border-white/15 bg-white/10 px-6 py-2 text-sm font-semibold text-white/90 shadow-sm backdrop-blur-md">
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
              <h1 className="max-w-3xl text-5xl font-serif font-bold leading-[0.92] tracking-tight text-white sm:text-6xl md:text-8xl">
                {hotel.name}
              </h1>
            </motion.div>

            {(hotel.tagline || hotel.description) && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="max-w-2xl text-lg leading-relaxed text-white/85 sm:text-xl md:text-2xl font-serif"
              >
                {hotel.tagline || hotel.description}
              </motion.p>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
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
              className="flex flex-wrap items-center justify-center gap-4 text-white/90 lg:justify-start"
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

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="w-full max-w-md"
            >
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-left backdrop-blur-md">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Hours</p>
                <p className="mt-2 line-clamp-2 text-sm font-medium text-white/90">{hotel.opening_hours || "Open daily"}</p>
              </div>
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
                className="relative w-full max-w-120"
              >
                <div className="relative overflow-hidden rounded-4xl border border-white/15 bg-linear-to-br from-white/14 via-white/8 to-white/4 p-5 shadow-[0_30px_100px_rgba(0,0,0,0.35)] backdrop-blur-2xl sm:p-6">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_35%)]" />
                  <div className="absolute -right-10 top-8 h-32 w-32 rounded-full bg-primary/20 blur-3xl" />
                  <div className="relative grid gap-5 sm:grid-cols-[0.95fr_1.05fr] sm:items-center">
                    <div className="flex items-center justify-center">
                      <div className="relative aspect-square w-full max-w-44 overflow-hidden rounded-3xl border border-white/20 bg-white/15 p-4 shadow-2xl shadow-black/20 sm:max-w-none">
                        <Image
                          src={logo}
                          alt={hotel.name}
                          fill
                          className="object-contain p-4 drop-shadow-2xl"
                          sizes="(max-width: 768px) 176px, 192px"
                        />
                      </div>
                    </div>

                    <div className="space-y-4 text-center sm:text-left">
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/60">Signature House</p>
                        <h2 className="text-2xl font-serif font-bold leading-tight text-white sm:text-3xl">
                          {hotel.name}
                        </h2>
                      </div>

                      <div className="grid gap-2 text-sm text-white/80">
                        {/* cuisine_type removed from logo panel (not provided by backend) */}
                        {hotel.opening_hours && (
                          <p className="leading-relaxed text-white/85">Open hours: {hotel.opening_hours}</p>
                        )}
                        {hotel.address && (
                          <p className="leading-relaxed text-white/70">{hotel.address}</p>
                        )}
                      </div>

                      {/* Ratings removed: not provided by backend */}
                    </div>
                  </div>
                </div>
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
