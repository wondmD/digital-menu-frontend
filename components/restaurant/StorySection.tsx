"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { TemplatePatternBackdrop, TemplateFrameOrnament } from "@/components/menu-templates/shared"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { getImageUrl } from "@/lib/utils"

type Restaurant = {
  name: string
  description?: string
  history?: string
  cuisine_type?: string
  opening_hours?: string
  cover_url?: string
  logo_url?: string
  established_year?: number
}

interface StorySectionProps {
  hotel: Restaurant
  coverImage?: string
  templateTheme?: any
  variant?: "restaurant" | "hotel" | "cafe"
}

export function StorySection({ hotel, coverImage, templateTheme, variant = "restaurant" }: StorySectionProps) {
  if (!hotel.history && !hotel.description) return null

  const storyImage = coverImage || getImageUrl(
    hotel.cover_url ||
    (hotel as any).cover_image_url ||
    (hotel as any).cover_image ||
    (hotel as any).cover
  )

  return (
    <section id="story" className="relative bg-linear-to-b from-background via-muted/5 to-background py-20 md:py-32">
      {templateTheme ? <TemplatePatternBackdrop theme={templateTheme} variant={variant} /> : null}
      {templateTheme ? (
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-80 scale-105">
          <TemplatePatternBackdrop theme={templateTheme} variant={variant} />
        </div>
      ) : null}
      {templateTheme ? <TemplateFrameOrnament theme={templateTheme} variant={variant} /> : null}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 left-8 h-64 w-64 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-0 right-6 h-72 w-72 rounded-full bg-rose-500/10 blur-[140px]" />
      </div>
      <div className="container mx-auto px-6">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-8"
          >
            {/* Section Header */}
            <div className="space-y-4">
              <Badge variant="outline" className="rounded-full border-border/60 bg-background/80 px-4 py-2 text-xs uppercase tracking-[0.3em] backdrop-blur-md">
                Our Story
              </Badge>
              <h2 className="max-w-xl text-3xl font-serif font-bold leading-tight sm:text-4xl md:text-6xl">
                Our Story
                {hotel.established_year ? (
                  <>
                    <br />
                    <span className="text-primary">since {hotel.established_year}</span>
                  </>
                ) : null}
              </h2>
            </div>

            {/* Description */}
            <motion.div 
              className="space-y-6 text-base sm:text-lg text-muted-foreground leading-relaxed font-serif"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <p>
                {hotel.history ||
                  hotel.description}
              </p>
            </motion.div>

            {/* Key Features Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="grid sm:grid-cols-2 gap-6"
            >
              <Card className="rounded-2xl border border-border/40 bg-card/70 backdrop-blur-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <h3 className="text-sm uppercase tracking-[0.3em] text-muted-foreground font-semibold">
                      Cuisine
                    </h3>
                    <p className="text-xl font-semibold text-foreground">
                      {hotel.cuisine_type || "Seasonal Contemporary"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border border-border/40 bg-card/70 backdrop-blur-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <h3 className="text-sm uppercase tracking-[0.3em] text-muted-foreground font-semibold">
                      Hours
                    </h3>
                    <p className="text-xl font-semibold text-foreground">
                      {hotel.opening_hours || "Not specified"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

          </motion.div>

          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative"
          >
            {storyImage ? (
              <div className="relative h-120 overflow-hidden rounded-4xl border border-border/50 shadow-2xl md:h-150">
                <Image
                  src={storyImage}
                  alt={`${hotel.name} story`}
                  fill
                  sizes="(max-width: 768px) 100vw, 600px"
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-transparent" />
              </div>
            ) : null}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
