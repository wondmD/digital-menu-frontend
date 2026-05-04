"use client"

import { motion } from "framer-motion"
import { Facebook, Instagram, Twitter, Globe, Send } from "lucide-react"

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.35V2h-3.4v13.13a2.9 2.9 0 1 1-2-2.77V8.9a6.3 6.3 0 1 0 5.4 6.23v-6.67a8.2 8.2 0 0 0 4.77 1.53V6.69z" />
    </svg>
  )
}

type Restaurant = {
  facebook_url?: string
  instagram_url?: string
  twitter_url?: string
  tiktok_url?: string
  telegram_url?: string
  website_url?: string
}

interface SocialLinksProps {
  hotel: Restaurant
  variant?: "light" | "dark"
  showAll?: boolean
  size?: "sm" | "md" | "lg" | "responsive"
  transparent?: boolean
  className?: string
}

export function SocialLinks({
  hotel,
  variant = "dark",
  showAll = false,
  size = "md",
  transparent = false,
  className,
}: SocialLinksProps) {
  const isLight = variant === "light"
  const iconClass = isLight
    ? "text-white/80 hover:text-white"
    : "text-muted-foreground hover:text-foreground"
  const bgClass = transparent
    ? (isLight
        ? "bg-transparent border-white/30"
        : "bg-transparent border-border/50")
    : (isLight
        ? "bg-white/10 hover:bg-white/20 border-white/20"
        : "bg-muted/60 hover:bg-muted border-border/60")
  const disabledClass = transparent
    ? (isLight
        ? "bg-transparent text-white/30 border-white/15"
        : "bg-transparent text-muted-foreground/40 border-border/30")
    : (isLight
        ? "bg-white/5 text-white/30 border-white/10"
        : "bg-muted/30 text-muted-foreground/40 border-border/30")
  const sizeClass = {
    sm: "h-9 w-9",
    md: "h-11 w-11",
    lg: "h-14 w-14",
    responsive: "h-11 w-11 md:h-14 md:w-14",
  }[size]
  const iconSizeClass = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
    responsive: "h-5 w-5 md:h-6 md:w-6",
  }[size]

  const socialLinks = [
    {
      href: hotel.facebook_url,
      icon: Facebook,
      label: "Facebook",
    },
    {
      href: hotel.instagram_url,
      icon: Instagram,
      label: "Instagram",
    },
    {
      href: hotel.twitter_url,
      icon: Twitter,
      label: "Twitter",
    },
    {
      href: hotel.tiktok_url,
      icon: TikTokIcon,
      label: "TikTok",
    },
    {
      href: (hotel as any).telegram_url,
      icon: Send,
      label: "Telegram",
    },
    {
      href: hotel.website_url,
      icon: Globe,
      label: "Website",
    },
  ]

  const linksToRender = showAll ? socialLinks : socialLinks.filter(link => link.href)

  if (linksToRender.length === 0) return null

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {linksToRender.map((link, index) => {
        const Icon = link.icon
        const isActive = Boolean(link.href)
        const sharedClass = cn(
          "flex items-center justify-center rounded-2xl border transition-all duration-300",
          sizeClass,
          isActive ? bgClass : disabledClass,
          isActive ? iconClass : "cursor-not-allowed"
        )

        if (!isActive) {
          return (
            <motion.div
              key={link.label}
              className={sharedClass}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.08 }}
              aria-label={`${link.label} not available`}
              title={`${link.label} not available`}
              role="img"
            >
              <Icon className={iconSizeClass} />
            </motion.div>
          )
        }

        return (
          <motion.a
            key={link.label}
            href={link.href!}
            target="_blank"
            rel="noreferrer"
            className={sharedClass}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.08 }}
            whileHover={{ scale: 1.08, y: -2 }}
            whileTap={{ scale: 0.96 }}
            aria-label={link.label}
          >
            <Icon className={cn(iconSizeClass, "transition-transform duration-300 group-hover:scale-110")} />
          </motion.a>
        )
      })}
    </div>
  )
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ")
}
