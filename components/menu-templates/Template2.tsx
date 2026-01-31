"use client"

import { MenuItem, TemplateProps } from "./types"
import { motion } from "framer-motion"
import Image from "next/image"
import { getImageUrl } from "@/lib/utils"
import { Search, Loader2, Sparkles, Heart } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function Template2({
  hotel,
  categories,
  activeCategory,
  onCategoryChange,
  onItemClick,
  searchQuery,
  onSearchChange,
  itemsLoading,
}: TemplateProps) {
  const currentCategory = categories.find((c) => c.id === activeCategory)
  const categoryItems = currentCategory?.items || []

  const filteredItems = categoryItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const logoImage = getImageUrl(hotel.logo_url || (hotel as any).logo_image_url)

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* Dynamic Header */}
      <div className="relative pt-12 pb-16 px-6 overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 -rotate-12">
            <Sparkles className="h-32 w-32" />
        </div>
        <div className="container max-w-5xl mx-auto relative z-10 flex gap-6 items-center">
          {logoImage && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative w-20 h-20 rounded-2xl overflow-hidden bg-card shadow-lg border border-border"
            >
              <Image src={logoImage} alt={hotel.name} fill className="object-contain p-2" />
            </motion.div>
          )}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-5xl font-black tracking-tighter mb-4">
              {hotel.name}
            </h1>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary py-1 px-4 rounded-full border-none font-bold">
                Most Loved
              </Badge>
              <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
              <p className="text-muted-foreground font-semibold">
                Casual Dining & Treats
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Floating Search & Categories */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container max-w-5xl mx-auto px-6 py-5">
           <div className="flex flex-col md:flex-row gap-5 items-center justify-between">
              <div className="relative w-full md:max-w-xs transition-all focus-within:max-w-sm">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="What are you craving?"
                  className="pl-12 h-12 rounded-2xl bg-muted/30 border-none ring-1 ring-border focus-visible:ring-primary font-bold shadow-sm"
                />
              </div>

              <div className="flex items-center gap-3 overflow-x-auto w-full md:w-auto pb-1 no-scrollbar justify-start md:justify-end">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => onCategoryChange(cat.id)}
                    className={cn(
                      "px-6 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all",
                      activeCategory === cat.id 
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105" 
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
           </div>
        </div>
      </div>

      {/* Grid Layout */}
      <main className="container max-w-5xl mx-auto px-6 py-12">
        {itemsLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-6">
              <div className="relative">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <div className="absolute inset-0 bg-primary/20 blur-xl animate-pulse" />
              </div>
              <p className="font-black text-xl animate-pulse">Mixing Flavors...</p>
            </div>
          ) : filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredItems.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -8 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => onItemClick(item)}
                  className="flex flex-col bg-card rounded-[2.5rem] border border-border shadow-md overflow-hidden cursor-pointer group hover:shadow-2xl transition-all duration-500"
                >
                  <div className="relative aspect-[1/1.1] overflow-hidden">
                    <Image
                      src={getImageUrl(item.image_url) || "/placeholder.svg"}
                      alt={item.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/10 transition-opacity group-hover:opacity-0" />
                    <div className="absolute top-5 left-5">
                       <Badge className="bg-white/90 backdrop-blur-md text-black hover:bg-white border-none font-bold py-1.5 px-4 rounded-xl shadow-lg">
                          {item.currency} {item.price.toFixed(2)}
                       </Badge>
                    </div>
                    {idx % 3 === 0 && (
                       <div className="absolute top-5 right-5 h-10 w-10 bg-rose-500 rounded-full flex items-center justify-center shadow-lg text-white">
                          <Heart className="h-5 w-5 fill-current" />
                       </div>
                    )}
                  </div>
                  <div className="p-8 flex flex-col items-center text-center gap-3">
                    <h3 className="text-2xl font-black tracking-tight group-hover:text-primary transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-sm text-muted-foreground font-medium line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-muted/20 rounded-[3rem] border border-dashed border-border">
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
                <Search className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-black mb-2">Not found!</h3>
              <p className="text-muted-foreground font-medium mb-6">Maybe try searching for something else?</p>
              <Button onClick={() => onSearchChange("")} variant="outline" className="rounded-2xl px-8 py-6 h-auto font-bold">
                Clear all filters
              </Button>
            </div>
          )}
      </main>
    </div>
  )
}
