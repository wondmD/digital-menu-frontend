"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { MapPin, Phone, Mail, Clock } from "lucide-react"
import { SocialLinks } from "@/components/restaurant/SocialLinks"

type Restaurant = {
  name: string
  address?: string
  phone?: string
  email?: string
  opening_hours?: string
  description?: string
  facebook_url?: string
  instagram_url?: string
  twitter_url?: string
  tiktok_url?: string
  telegram_url?: string
  website_url?: string
}

interface FooterSectionProps {
  hotel: Restaurant
  templateTheme?: any
  variant?: "restaurant" | "hotel" | "cafe"
}

const COORDINATE_ADDRESS_REGEX = /^\s*([-+]?\d*\.?\d+)\s*,\s*([-+]?\d*\.?\d+)\s*$/

export function FooterSection({ hotel, templateTheme, variant = "restaurant" }: FooterSectionProps) {
  const currentYear = new Date().getFullYear()
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
    <footer className="relative mt-8 rounded-t-4xl border-t border-border/60 bg-linear-to-b from-muted/30 to-background">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-white/30 blur-3xl dark:bg-white/5" />
        <div className="absolute right-0 bottom-0 h-80 w-80 rounded-full bg-slate-300/25 blur-3xl dark:bg-slate-500/10" />
        <div className="absolute inset-0 opacity-35 bg-[radial-gradient(circle_at_1px_1px,rgba(71,85,105,0.2)_1px,transparent_0)] bg-size-[22px_22px] dark:opacity-15" />
      </div>
      <div className="container mx-auto px-6 py-16">
        <div className="mb-12 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Restaurant Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6 lg:col-span-2"
          >
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-foreground">{hotel.name}</h3>
              {hotel.description ? (
                <p className="text-muted-foreground leading-relaxed max-w-md">{hotel.description}</p>
              ) : null}
            </div>

            {/* Social Links */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Connect With Us
              </h4>
              <SocialLinks hotel={hotel} size="sm" className="flex-wrap" />
            </div>
          </motion.div>

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-6"
          >
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Contact
            </h4>
            <div className="space-y-4">
              {displayAddress && (
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm text-muted-foreground leading-relaxed">
                    {displayAddress}
                  </span>
                </div>
              )}
              
              {hotel.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 shrink-0 text-primary" />
                  <Link 
                    href={`tel:${hotel.phone}`} 
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {hotel.phone}
                  </Link>
                </div>
              )}
              
              {hotel.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 shrink-0 text-primary" />
                  <Link 
                    href={`mailto:${hotel.email}`} 
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {hotel.email}
                  </Link>
                </div>
              )}
            </div>
          </motion.div>

          {/* Hours */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            {hotel.opening_hours ? (
              <>
                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Hours
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-primary shrink-0" />
                    <div className="text-sm text-muted-foreground">
                      <p>{hotel.opening_hours}</p>
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="border-t border-border/60 pt-8"
        >
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>© {currentYear} {hotel.name}. All rights reserved.</span>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}
