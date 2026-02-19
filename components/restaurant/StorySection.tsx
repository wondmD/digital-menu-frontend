"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { getImageUrl } from "@/lib/utils"

type Restaurant = {
  name: string
  description?: string
  cuisine_type?: string
  cover_url?: string
  logo_url?: string
  established_year?: number
  chef_name?: string
  special_features?: string[]
}

interface StorySectionProps {
  hotel: Restaurant
  coverImage?: string
}

export function StorySection({ hotel, coverImage }: StorySectionProps) {
  const storyImage = coverImage || getImageUrl(
    hotel.cover_url ||
    (hotel as any).cover_image_url ||
    (hotel as any).cover_image ||
    (hotel as any).cover
  ) || "/hotel.webp"

  const features = hotel.special_features || [
    "Farm-to-table ingredients",
    "Seasonal menu changes",
    "Award-winning chef",
    "Wine pairing expertise"
  ]

  return (
    <section id="story" className="relative py-20 md:py-32 bg-gradient-to-b from-background to-muted/20">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 left-8 h-64 w-64 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-0 right-6 h-72 w-72 rounded-full bg-rose-500/10 blur-[140px]" />
      </div>
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-16 items-center">
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
              <Badge variant="outline" className="rounded-full px-4 py-2 text-xs uppercase tracking-[0.3em]">
                Our Story
              </Badge>
              <h2 className="text-3xl sm:text-4xl md:text-6xl font-serif font-bold leading-tight">
                Crafting memories
                <br />
                <span className="text-primary">since {hotel.established_year || 2010}</span>
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
                {hotel.description ||
                  `Welcome to ${hotel.name}, where culinary artistry meets warm hospitality. Our journey began with a simple vision: to create a space where food tells a story and every meal becomes a cherished memory.`}
              </p>
              <p>
                Rooted in tradition yet inspired by innovation, we source the finest ingredients from local farms and trusted suppliers. Our kitchen is a canvas where seasonal flavors transform into extraordinary dishes that delight the senses and nourish the soul.
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
                    <p className="text-xl font-semibold">
                      {hotel.cuisine_type || "Seasonal Contemporary"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border border-border/40 bg-card/70 backdrop-blur-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <h3 className="text-sm uppercase tracking-[0.3em] text-muted-foreground font-semibold">
                      Atmosphere
                    </h3>
                    <p className="text-xl font-semibold">
                      Warm & Elegant
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Special Features */}
            {features.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="space-y-4"
              >
                <h3 className="text-sm uppercase tracking-[0.3em] text-muted-foreground font-semibold">
                  What Makes Us Special
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {features.slice(0, 4).map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors duration-200"
                    >
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Chef Information */}
            {hotel.chef_name && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="pt-6 border-t border-border"
              >
                <p className="text-sm text-muted-foreground">
                  Led by Executive Chef <span className="font-semibold text-foreground">{hotel.chef_name}</span>
                </p>
              </motion.div>
            )}
          </motion.div>

          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative"
          >
            <div className="relative h-[600px] rounded-3xl overflow-hidden shadow-2xl">
              <Image 
                src={storyImage} 
                alt={`${hotel.name} story`} 
                fill 
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
              
              {/* Floating Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="absolute bottom-8 left-8 bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl max-w-xs"
              >
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-primary">Award Winning</p>
                  <p className="text-2xl font-bold">Excellence in Dining</p>
                  <p className="text-sm text-muted-foreground">Recognized for outstanding culinary innovation</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
