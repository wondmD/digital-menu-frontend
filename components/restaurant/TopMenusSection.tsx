"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { Star, ChefHat, Award, Clock, TrendingUp } from "lucide-react"
import { cn, getImageUrl } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

type TopMenuItem = {
  id: string
  name: string
  description: string
  price: number
  currency?: string
  image_url?: string
  category?: string
  prep_time?: string
  is_signature?: boolean
  is_popular?: boolean
  dietary_tags?: string[]
}

interface TopMenusSectionProps {
  items: TopMenuItem[]
  menuLink: string
  className?: string
}

export function TopMenusSection({ items, menuLink, className }: TopMenusSectionProps) {
  if (!items || items.length === 0) return null

  const signatureItems = items.filter(item => item.is_signature)
  const popularItems = items.filter(item => item.is_popular && !item.is_signature)
  const featuredItems = items.filter(item => !item.is_signature && !item.is_popular)

  return (
    <section id="top-menus" className={cn("py-20 md:py-28 bg-gradient-to-b from-background to-muted/20", className)}>
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <ChefHat className="h-6 w-6 text-primary" />
            <p className="text-sm uppercase tracking-[0.4em] text-muted-foreground font-serif">Chef's Selection</p>
          </div>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mt-2">
            Our Signature Creations
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto font-serif text-lg leading-relaxed">
            Handcrafted by our culinary team, these dishes represent the pinnacle of our gastronomic excellence.
          </p>
        </div>

        {/* Signature Dishes */}
        {signatureItems.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <Award className="h-6 w-6 text-primary" />
              <h3 className="text-2xl md:text-3xl font-serif font-semibold">Signature Dishes</h3>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {signatureItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: index * 0.15 }}
                  className="group"
                >
                  {getImageUrl(item.image_url) ? (
                    <div className="relative h-64 md:h-72 rounded-3xl overflow-hidden mb-6 shadow-lg">
                      <Image
                        src={getImageUrl(item.image_url) || ""}
                        alt={item.name}
                        fill
                        className="object-cover transition-transform duration-800 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0 font-semibold">
                          <Award className="mr-1 h-3 w-3" />
                          Signature
                        </Badge>
                      </div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex items-center justify-between">
                          <div />
                          {item.prep_time && (
                            <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1">
                              <Clock className="h-3 w-3" />
                              <span className="text-xs font-medium">{item.prep_time}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-6" />
                  )}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="text-xl font-serif font-bold">{item.name}</h4>
                      <span className="text-lg font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                        {item.currency || "$"}{item.price}
                      </span>
                    </div>
                    <p className="text-muted-foreground leading-relaxed font-serif">{item.description}</p>
                    {item.dietary_tags && item.dietary_tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {item.dietary_tags.map((tag, tagIndex) => (
                          <Badge key={tagIndex} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Popular Items */}
        {popularItems.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <TrendingUp className="h-6 w-6 text-primary" />
              <h3 className="text-2xl md:text-3xl font-serif font-semibold">Guest Favorites</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {popularItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="group"
                >
                  {getImageUrl(item.image_url) ? (
                    <div className="relative h-48 rounded-2xl overflow-hidden mb-4 shadow-md">
                      <Image
                        src={getImageUrl(item.image_url) || ""}
                        alt={item.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-red-500 text-white border-0 text-xs">
                          Popular
                        </Badge>
                      </div>
                      <div className="absolute bottom-3 left-3 right-3">
                        <div className="flex items-center justify-between">
                          <span className="text-white font-semibold">
                            {item.currency || "$"}{item.price}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : null}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-lg">{item.name}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Featured Items */}
        {featuredItems.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-8">
              <Star className="h-6 w-6 text-primary" />
              <h3 className="text-2xl md:text-3xl font-serif font-semibold">Featured Selections</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-card rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    {getImageUrl(item.image_url) ? (
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0">
                        <Image
                          src={getImageUrl(item.image_url) || ""}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : null}
                    <div className="flex-1 space-y-2">
                      <h4 className="font-semibold">{item.name}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-primary">{item.currency || "$"}{item.price}</span>
                        {item.category && (
                          <Badge variant="outline" className="text-xs">
                            {item.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center mt-12">
          <Button size="lg" className="rounded-xl px-8 font-serif" asChild>
            <Link href={menuLink}>
              Explore Complete Menu
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
