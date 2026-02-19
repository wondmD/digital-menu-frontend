"use client"

import { motion } from "framer-motion"
import { Star, Sparkles, Clock, ChefHat } from "lucide-react"
import { Badge } from "@/components/ui/badge"

type Restaurant = {
  name: string
  rating?: number
  review_count?: number
  cuisine_type?: string
  opening_hours?: string
}

interface ExperienceHighlightsSectionProps {
  hotel: Restaurant
}

export function ExperienceHighlightsSection({ hotel }: ExperienceHighlightsSectionProps) {
  const stats = [
    {
      title: "Guest Rating",
      value: hotel.rating ? `${hotel.rating.toFixed(1)}/5` : "4.9/5",
      subtitle: hotel.review_count ? `${hotel.review_count}+ reviews` : "500+ reviews",
      icon: Star,
      accent: "from-amber-500/20 to-amber-500/5",
    },
    {
      title: "Signature Cuisine",
      value: hotel.cuisine_type || "Seasonal Contemporary",
      subtitle: "Chef curated menu",
      icon: ChefHat,
      accent: "from-primary/20 to-primary/5",
    },
    {
      title: "Service Window",
      value: hotel.opening_hours || "Open Daily",
      subtitle: "8:00 AM - 11:00 PM",
      icon: Clock,
      accent: "from-emerald-500/20 to-emerald-500/5",
    },
    {
      title: "Atmosphere",
      value: "Elegant & Warm",
      subtitle: "Designed for celebrations",
      icon: Sparkles,
      accent: "from-rose-500/20 to-rose-500/5",
    },
  ]

  return (
    <section className="relative py-16 md:py-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_55%)]" />
      <div className="container mx-auto px-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <Badge variant="outline" className="rounded-full px-4 py-2 text-xs uppercase tracking-[0.3em]">
            The Experience
          </Badge>
          <h2 className="text-3xl md:text-5xl font-serif font-bold mt-5">
            Crafted for unforgettable moments
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg font-serif">
            Every detail is designed to elevate your visit to {hotel.name}.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="rounded-3xl border border-border/60 bg-card/70 backdrop-blur-xl p-6 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all"
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.accent} flex items-center justify-center mb-5`}>
                  <Icon className="h-5 w-5 text-foreground" />
                </div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  {stat.title}
                </p>
                <p className="text-xl font-semibold mt-2">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground mt-2 font-serif">
                  {stat.subtitle}
                </p>
              </motion.div>
            )}
          )}
        </div>
      </div>
    </section>
  )
}
