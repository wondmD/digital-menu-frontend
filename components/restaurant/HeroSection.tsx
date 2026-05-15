"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Bilingual from "@/components/ui/Bilingual"
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
}

interface HeroSectionProps {
  hotel: Restaurant
  coverImage?: string
  logoImage?: string | null
  menuLink: string
  mapLink: string
}

const COORDINATE_ADDRESS_REGEX = /^\s*([-+]?\d*\.?\d+)\s*,\s*([-+]?\d*\.?\d+)\s*$/

export function HeroSection({ hotel, coverImage, logoImage, menuLink, mapLink }: HeroSectionProps) {
  const heroImage = coverImage || getImageUrl(hotel.cover_url || hotel.logo_url)
  const logo = logoImage || getImageUrl(hotel.logo_url)
  const hasSocialLinks = Boolean(hotel.instagram_url || hotel.facebook_url || hotel.twitter_url)
  const [resolvedPlaceName, setResolvedPlaceName] = useState<string>("")

  const coordinateAddress = useMemo(() => {
    const rawAddress = String(hotel.address || "").trim()
    const match = rawAddress.match(COORDINATE_ADDRESS_REGEX)
    if (!match) return null

    const lat = Number(match[1])
    const lng = Number(match[2])
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
    return { lat, lng }
  }, [hotel.address])

  useEffect(() => {
    let isCancelled = false

    const loadPlaceName = async () => {
      if (!coordinateAddress) {
        setResolvedPlaceName("")
        return
      }

      try {
        const params = new URLSearchParams({
          format: "jsonv2",
          lat: String(coordinateAddress.lat),
          lon: String(coordinateAddress.lng),
          zoom: "18",
          addressdetails: "1",
        })

        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
          headers: { Accept: "application/json" },
        })
        if (!response.ok) throw new Error("Reverse geocode failed")

        const payload = await response.json()
        const address = payload?.address || {}
        const primaryLabel =
          address?.attraction ||
          address?.tourism ||
          address?.amenity ||
          address?.building ||
          address?.neighbourhood ||
          address?.suburb ||
          address?.city_district ||
          address?.city ||
          address?.town ||
          address?.village ||
          payload?.name ||
          (typeof payload?.display_name === "string" ? payload.display_name.split(",")[0] : "")

        const subcity =
          address?.suburb ||
          address?.city_district ||
          address?.neighbourhood ||
          address?.quarter ||
          address?.hamlet ||
          ""

        const city =
          address?.city ||
          address?.town ||
          address?.municipality ||
          address?.county ||
          address?.state_district ||
          ""

        const parts = [primaryLabel, subcity, city]
          .map((part: unknown) => String(part || "").trim())
          .filter(Boolean)

        const uniqueParts = parts.filter((part, index) => parts.indexOf(part) === index)
        const composedLabel = uniqueParts.join(", ")

        if (!isCancelled) {
          setResolvedPlaceName(composedLabel)
        }
      } catch {
        if (!isCancelled) {
          setResolvedPlaceName("")
        }
      }
    }

    void loadPlaceName()
    return () => {
      isCancelled = true
    }
  }, [coordinateAddress])

  const displayAddress = resolvedPlaceName || hotel.address

  return (
    <section className="relative isolate flex min-h-screen w-full items-center overflow-hidden pt-20 md:pt-24">
      <div className="absolute inset-0">
        {heroImage ? (
          <Image src={heroImage} alt={hotel.name} fill className="object-cover" priority sizes="100vw" />
        ) : (
          <div className="h-full w-full bg-linear-to-br from-neutral-900 via-neutral-800 to-neutral-900" />
        )}
        <div className="absolute inset-0 bg-linear-to-r from-black/82 via-black/56 to-black/78" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.12),transparent_45%)]" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-14 sm:px-6 md:py-20">
        <div className="grid min-h-[78vh] items-center gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-14">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="space-y-9 text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.34em] text-white/90 backdrop-blur-md"
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
                <Badge className="rounded-full border border-white/15 bg-white/10 px-6 py-2 text-sm font-semibold text-white/90 shadow-sm">
                  <Utensils className="mr-2 h-4 w-4" />
                  {hotel.cuisine_type}
                </Badge>
              </motion.div>
            )}

            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }}>
              <h1 className="max-w-4xl text-6xl font-serif font-bold leading-[0.86] tracking-[-0.02em] text-white sm:text-7xl md:text-8xl lg:text-9xl">
                {hotel.name}
              </h1>
            </motion.div>

            {(hotel.tagline || hotel.description) && (
              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }} className="max-w-2xl text-lg leading-relaxed text-white/85 sm:text-xl md:text-[1.65rem] md:leading-relaxed font-serif">
                {hotel.tagline || hotel.description}
              </motion.p>
            )}

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }} className="flex flex-wrap items-center justify-center gap-3.5 lg:justify-start">
              <Button size="lg" className="w-full border-0 bg-linear-to-r from-primary to-primary/80 px-8 h-14 rounded-2xl text-base font-semibold text-white shadow-[0_14px_35px_rgba(0,0,0,0.25)] sm:w-auto" asChild>
                <Link href={menuLink} prefetch={false}>
                    <QrCode className="mr-2 h-4 w-4" />
                    <Bilingual ns="home" id="dialog.goToMenu" />
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              <Button size="lg" variant="outline" className="w-full rounded-2xl border border-white/35 bg-white/95 px-8 h-14 text-base font-semibold text-slate-900 shadow-sm sm:w-auto" asChild>
                <a href={mapLink} target="_blank" rel="noreferrer">
                  <MapPin className="mr-2 h-4 w-4" />
                  Directions
                </a>
              </Button>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.7 }} className="flex flex-wrap items-center justify-center gap-3.5 text-white/90 lg:justify-start">
              {displayAddress && (
                <a
                  href={mapLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur-md transition-colors hover:bg-white/16"
                  aria-label={`Open location for ${hotel.name} in maps`}
                >
                  <MapPin className="h-4 w-4" />
                  <span className="text-xs sm:text-sm">{displayAddress}</span>
                </a>
              )}
              {hotel.phone && (
                <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur-md">
                  <Phone className="h-4 w-4" />
                  <span className="text-xs sm:text-sm">{hotel.phone}</span>
                </div>
              )}
              {hotel.email && (
                <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur-md">
                  <Mail className="h-4 w-4" />
                  <span className="text-xs sm:text-sm">{hotel.email}</span>
                </div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.8 }} className="w-full max-w-md">
              <div className="rounded-2xl border border-white/20 bg-white/12 p-4 text-left backdrop-blur-md">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Hours</p>
                <p className="mt-2 line-clamp-2 text-sm font-medium text-white/90">{hotel.opening_hours || "Open daily"}</p>
              </div>
            </motion.div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1, ease: "easeOut", delay: 0.3 }} className="flex flex-col items-center justify-center space-y-5 md:space-y-7">
            {logo && (
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8, delay: 0.5 }} className="relative w-full max-w-120">
                <div className="relative overflow-hidden rounded-4xl border border-white/20 p-5 shadow-2xl">
                  <div className="relative grid gap-5 sm:grid-cols-[0.95fr_1.05fr] sm:items-center">
                    <div className="flex items-center justify-center">
                      <div className="relative aspect-square w-full max-w-44 overflow-hidden rounded-3xl border border-white/25 p-4">
                        <Image src={logo} alt={hotel.name} fill className="object-contain p-4" sizes="(max-width: 768px) 176px, 192px" />
                      </div>
                    </div>

                    <div className="space-y-4 text-center sm:text-left">
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/60">Signature House</p>
                        <h2 className="text-2xl font-serif font-bold leading-tight text-white sm:text-3xl lg:text-4xl">{hotel.name}</h2>
                      </div>

                      <div className="grid gap-2 text-sm text-white/80">
                        {hotel.opening_hours && <p className="leading-relaxed text-white/85">Open hours: {hotel.opening_hours}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {hasSocialLinks && (
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.7 }} className="w-full space-y-6 text-center">
                <div className="px-2">
                  <SocialLinks hotel={hotel as any} variant="light" size="responsive" transparent className="flex-wrap justify-center" />
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 1 }} className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="flex h-10 w-6 justify-center rounded-full border-2 border-white/30">
          <div className="mt-2 h-3 w-1 rounded-full bg-white/60" />
        </motion.div>
      </motion.div>
    </section>
  )
}

export default HeroSection
