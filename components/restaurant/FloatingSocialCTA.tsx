"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle, X } from "lucide-react"
import { SocialLinks } from "@/components/restaurant/SocialLinks"

type Restaurant = {
  facebook_url?: string
  instagram_url?: string
  twitter_url?: string
  tiktok_url?: string
  telegram_url?: string
  website_url?: string
}

interface FloatingSocialCTAProps {
  hotel: Restaurant
}

export function FloatingSocialCTA({ hotel }: FloatingSocialCTAProps) {
  const [open, setOpen] = useState(false)
  const hasSocialLinks = Boolean(
    hotel.facebook_url ||
    hotel.instagram_url ||
    hotel.twitter_url ||
    hotel.tiktok_url ||
    hotel.telegram_url ||
    hotel.website_url
  )

  if (!hasSocialLinks) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="mb-4 max-w-[90vw] rounded-4xl border border-border/60 bg-card/90 p-4 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Connect</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-8 w-8 rounded-full border border-border/60 bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close social links"
              >
                <X className="h-4 w-4 mx-auto" />
              </button>
            </div>
            <SocialLinks hotel={hotel} size="md" />
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 transition-transform hover:scale-105 sm:h-14 sm:w-14"
        aria-label={open ? "Hide social links" : "Show social links"}
      >
        <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>
    </div>
  )
}
