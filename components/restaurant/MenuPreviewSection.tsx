"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Loader2 } from "lucide-react"
import { getImageUrl } from "@/lib/utils"

type MenuPreviewItem = {
  id: string
  name: string
  price: number
  currency?: string
  description?: string
  image_url?: string
  category_name?: string
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
        "use client"

        import Image from "next/image"
        import Link from "next/link"
        import { motion } from "framer-motion"
        import { Button } from "@/components/ui/button"
        import { Card, CardContent } from "@/components/ui/card"
        import { Badge } from "@/components/ui/badge"
        import { ArrowRight, Loader2 } from "lucide-react"
        import { getImageUrl } from "@/lib/utils"

        type MenuPreviewItem = {
          id: string
          name: string
          price: number
          currency?: string
          description?: string
          image_url?: string
          category_name?: string
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
              <section id="menu-preview" className="relative bg-background py-20 md:py-32">
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute -top-16 right-10 h-64 w-64 rounded-full bg-primary/10 blur-[120px]" />
                </div>
                <div className="container mx-auto px-6">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-16 text-center"
                  >
                    <div className="mb-6 inline-flex rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary shadow-sm backdrop-blur-sm">
                      Signature Plates
                    </div>
                    <h2 className="mb-6 text-3xl font-serif font-bold sm:text-4xl md:text-6xl">
                      Taste Our Excellence
                    </h2>
                    <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg md:text-xl">
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
            <section id="menu-preview" className="relative overflow-hidden bg-linear-to-b from-background via-muted/10 to-background py-20 md:py-32">
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
                  className="mb-16 text-center"
                >
                  <div className="mb-6 inline-flex rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary shadow-sm backdrop-blur-sm">
                    Fresh Food Gallery
                  </div>
                  <h2 className="mb-6 text-3xl font-serif font-bold sm:text-4xl md:text-6xl">
                    Scan, crave, and order in seconds
                  </h2>
                  <p className="mx-auto max-w-2xl font-serif text-base text-muted-foreground sm:text-lg md:text-xl">
                    Browse vivid food photos, tap the menu, and move from appetite to order with almost no friction.
                  </p>
                  <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] shadow-sm backdrop-blur-sm">
                      Scan Now
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-primary shadow-sm backdrop-blur-sm">
                      Order Now
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/60 bg-amber-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-amber-700 shadow-sm backdrop-blur-sm dark:text-amber-300">
                      Chef&apos;s Picks
                    </div>
                  </div>
                </motion.div>

                <div className="mb-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {displayItems.map((item, index) => {
                    const imageUrl = getImageUrl(item.image_url)

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: index * 0.1 }}
                      >
                        <Card className="group overflow-hidden rounded-[1.75rem] border border-border/60 bg-card/90 shadow-lg backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl">
                          {imageUrl ? (
                            <div className="relative h-56 overflow-hidden md:h-64">
                              <Image
                                src={imageUrl}
                                alt={item.name}
                                fill
                                sizes="(max-width: 768px) 100vw, 33vw"
                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                              />
                              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />

                              <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                                <Badge className="border border-white/20 bg-white/15 text-white backdrop-blur-sm hover:bg-white/15">
                                  Order Now
                                </Badge>
                                {item.is_popular && (
                                  <Badge className="bg-red-500 text-white shadow-lg shadow-red-500/30 hover:bg-red-600">
                                    Popular
                                  </Badge>
                                )}
                                {item.is_spicy && (
                                  <Badge className="bg-orange-500 text-white shadow-lg shadow-orange-500/30 hover:bg-orange-600">
                                    🌶️ Spicy
                                  </Badge>
                                )}
                              </div>

                              <div className="absolute right-4 top-4">
                                <Badge className="border-0 bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-500">
                                  Scan Now
                                </Badge>
                              </div>

                              <div className="absolute inset-x-4 bottom-4">
                                <div className="rounded-2xl border border-white/15 bg-black/35 px-4 py-3 text-white backdrop-blur-md">
                                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70">Fresh photo</p>
                                  <p className="mt-1 line-clamp-1 text-sm font-semibold">Tap to explore this dish and order fast.</p>
                                </div>
                              </div>
                            </div>
                          ) : null}

                          <CardContent className="space-y-4 p-6">
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-3">
                                <h3 className="line-clamp-2 text-xl font-bold transition-colors group-hover:text-primary">
                                  {item.name}
                                </h3>
                                <span className="whitespace-nowrap text-lg font-bold text-primary">
                                  {formatPrice(item.price, item.currency)}
                                </span>
                              </div>

                              {item.category_name && (
                                <p className="text-sm uppercase tracking-wide text-muted-foreground">
                                  {item.category_name}
                                </p>
                              )}
                            </div>

                            {item.description && (
                              <p className="line-clamp-3 leading-relaxed text-muted-foreground">
                                {item.description}
                              </p>
                            )}

                            {item.is_popular && (
                              <div className="pt-2">
                                <span className="text-sm text-muted-foreground">Customer Favorite</span>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="text-center"
                >
                      <div className="relative mx-auto max-w-4xl overflow-hidden rounded-4xl border border-border/50 bg-linear-to-r from-primary/15 via-background to-amber-500/10 p-8 shadow-2xl md:p-12">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(230,57,70,0.12),transparent_45%)]" />
                    <div className="space-y-6">
                      <h3 className="text-2xl font-serif font-bold md:text-3xl">
                        Ready to order your favorites now?
                      </h3>
                      <p className="mx-auto max-w-2xl font-serif text-lg text-muted-foreground">
                        Open the full menu, scan the highlights, and move from appetite to action in one smooth step.
                      </p>
                      <Button
                        asChild
                        size="lg"
                        className="rounded-xl border-0 bg-linear-to-r from-primary to-orange-500 px-8 h-14 text-base font-semibold text-white shadow-lg transition-all duration-300 group hover:shadow-xl"
                      >
                        <Link href={menuLink} prefetch={false}>
                          Order Now
                          <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </section>
          )
        }
