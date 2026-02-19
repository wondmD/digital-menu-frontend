"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, ArrowRight, Loader2 } from "lucide-react"
import { getImageUrl } from "@/lib/utils"

type MenuPreviewItem = {
  id: string
  name: string
  price: number
  currency?: string
  description?: string
  image_url?: string
  category_name?: string
  rating?: number
  is_spicy?: boolean
  is_vegetarian?: boolean
  is_popular?: boolean
}

interface MenuPreviewSectionProps {
  items: MenuPreviewItem[]
  loading?: boolean
  menuLink: string
}

export function MenuPreviewSection({ items, loading, menuLink }: MenuPreviewSectionProps) {
  if (loading) {
    return (
      <section id="menu-preview" className="relative py-20 md:py-32 bg-background">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-16 right-10 h-64 w-64 rounded-full bg-primary/10 blur-[120px]" />
        </div>
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-6">
              Signature Plates
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-serif font-bold mb-6">
              Taste Our Excellence
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover our signature dishes crafted with passion and the finest ingredients
            </p>
          </motion.div>

          <div className="flex justify-center">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading our delicious menu...</span>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (!items || items.length === 0) return null

  const displayItems = items.slice(0, 5)

  const formatPrice = (price: number, currency?: string) => {
    const symbol = currency || "$"
    return `${symbol}${price.toFixed(2)}`
  }

  return (
    <section id="menu-preview" className="relative py-20 md:py-32 bg-gradient-to-b from-background to-muted/20">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-16 right-10 h-64 w-64 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-0 left-8 h-72 w-72 rounded-full bg-amber-500/10 blur-[140px]" />
      </div>
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-6">
            Signature Plates
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-serif font-bold mb-6">
            Taste Our Excellence
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-serif">
            Discover our signature dishes crafted with passion and the finest ingredients
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {displayItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
            >
              <Card className="group rounded-2xl overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]">
                {/* Item Image */}
                <div className="relative h-48 md:h-56 overflow-hidden">
                  <Image
                    src={getImageUrl(item.image_url) || "/hotel.webp"}
                    alt={item.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  
                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                    {item.is_popular && (
                      <Badge className="bg-red-500 text-white hover:bg-red-600">
                        Popular
                      </Badge>
                    )}
                    {item.is_spicy && (
                      <Badge variant="secondary" className="bg-orange-500 text-white hover:bg-orange-600">
                        🌶️ Spicy
                      </Badge>
                    )}
                    {item.is_vegetarian && (
                      <Badge variant="secondary" className="bg-green-500 text-white hover:bg-green-600">
                        🥬 Vegetarian
                      </Badge>
                    )}
                  </div>

                  {/* Rating */}
                  {item.rating && (
                    <div className="absolute top-4 right-4">
                      <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-semibold">{item.rating}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Item Content */}
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-xl font-bold line-clamp-2 group-hover:text-primary transition-colors">
                        {item.name}
                      </h3>
                      <span className="text-lg font-bold text-primary whitespace-nowrap">
                        {formatPrice(item.price, item.currency)}
                      </span>
                    </div>
                    
                    {/* Category */}
                    {item.category_name && (
                      <p className="text-sm text-muted-foreground uppercase tracking-wide">
                        {item.category_name}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  {item.description && (
                    <p className="text-muted-foreground line-clamp-3 leading-relaxed">
                      {item.description}
                    </p>
                  )}

                  {/* Quick Stats */}
                  <div className="flex items-center gap-4 pt-2">
                    {item.rating && (
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{item.rating}</span>
                      </div>
                    )}
                    {item.is_popular && (
                      <span className="text-sm text-muted-foreground">
                        Customer Favorite
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Explore Full Menu CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center"
        >
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-3xl p-8 md:p-12 max-w-4xl mx-auto">
            <div className="space-y-6">
              <h3 className="text-2xl md:text-3xl font-serif font-bold">
                Ready to explore the full menu?
              </h3>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-serif">
                Discover our complete collection of culinary masterpieces, from appetizers to desserts
              </p>
              <Button
                asChild
                size="lg"
                className="rounded-xl px-8 h-14 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                <Link href={menuLink}>
                  Explore Full Menu
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
