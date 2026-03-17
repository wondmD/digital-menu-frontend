"use client"

import { MenuItem, TemplateProps } from "./types"
import { motion } from "framer-motion"
import Image from "next/image"
import { Logo } from "@/components/logo"
import { getImageUrl } from "@/lib/utils"
import { Search, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import RatingStars from "./RatingStars"
import { useState } from "react"

export default function Template1({
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

  const [localRatings, setLocalRatings] = useState<Record<string, { rating: number; count: number }>>({})

  const filteredItems = categoryItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const logoImage = getImageUrl(hotel.logo_url || (hotel as any).logo_image_url)

  return (
    <div className="min-h-screen bg-[#FDFCF8] dark:bg-[#121210] text-[#1A1A1A] dark:text-[#EAEAEA] font-serif pb-24 transition-colors duration-500 overflow-x-hidden">
      {/* Header */}
      <header className="pt-12 md:pt-16 pb-8 md:pb-12 px-4 sm:px-6 text-center border-b border-[#E5E1D8] dark:border-[#2A2A28]">
        {logoImage && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-5 sm:mb-6"
          >
            <Image src={logoImage} alt={hotel.name} fill className="object-contain" />
          </motion.div>
        )}
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl sm:text-4xl md:text-5xl font-serif tracking-tight mb-3 sm:mb-4"
        >
          {hotel.name}
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm font-sans uppercase tracking-[0.3em] text-[#706C61] dark:text-[#A09D95]"
        >
          Menu Selection
        </motion.p>
      </header>

      {/* Navigation & Search */}
      <div className="sticky top-0 z-30 bg-[#FDFCF8]/90 dark:bg-[#121210]/90 backdrop-blur-md border-b border-[#E5E1D8] dark:border-[#2A2A28]">
        <div className="container max-w-4xl mx-auto px-4 sm:px-6 py-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#706C61] dark:text-[#A09D95]" />
            <Input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search our collection..."
              className="pl-10 bg-transparent border-[#E5E1D8] dark:border-[#2A2A28] focus:ring-[#706C61] dark:focus:ring-[#A09D95] font-sans"
            />
          </div>
          
          <div className="flex items-center gap-6 sm:gap-8 overflow-x-auto pb-2 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onCategoryChange(cat.id)}
                className={cn(
                  "text-sm font-sans uppercase tracking-widest whitespace-nowrap transition-colors pb-2 relative",
                  activeCategory === cat.id 
                    ? "text-[#1A1A1A] dark:text-white font-bold" 
                    : "text-[#706C61] dark:text-[#A09D95] hover:text-[#1A1A1A] dark:hover:text-white"
                )}
              >
                {cat.name}
                {activeCategory === cat.id && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1A1A1A] dark:bg-primary"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="container max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
        <div className="space-y-16">
          {itemsLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-[#706C61]" />
              <p className="font-sans text-sm uppercase tracking-widest text-[#706C61]">Refining selection...</p>
            </div>
          ) : filteredItems.length > 0 ? (
            <div className="grid gap-12">
              {filteredItems.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => onItemClick(item)}
                  className="group cursor-pointer flex flex-row gap-4 sm:gap-6 items-start w-full"
                >
                    {item.image_url && (
                      <div className="relative h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-36 shrink-0 overflow-hidden rounded-sm bg-[#F5F2ED] dark:bg-[#1A1A18]">
                      <Image
                        src={getImageUrl(item.image_url) || "/placeholder.svg"}
                        alt={item.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    </div>
                  )}
                    <div className="flex-1 space-y-2 w-full min-w-0">
                      <div className="flex flex-col gap-1 w-full min-w-0">
                        <h3 className="min-w-0 text-lg sm:text-2xl font-serif text-[#1A1A1A] dark:text-[#EAEAEA] group-hover:text-primary transition-colors break-words">
                        {item.name}
                      </h3>
                        <span className="text-base sm:text-xl font-serif text-[#1A1A1A] dark:text-[#EAEAEA]">
                        {item.currency} {item.price.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-sm sm:text-base text-[#706C61] dark:text-[#A09D95] font-sans leading-relaxed max-w-2xl break-words">
                      {item.description}
                    </p>
                      {(() => {
                        const baseRating = item.rating ?? 0
                        const baseCount = item.rating_count ?? 0
                        const local = localRatings[item.id]
                        const rating = local?.rating ?? baseRating
                        const count = local?.count ?? baseCount

                        return (
                          <div className="pt-1" onClick={(event) => event.stopPropagation()}>
                            <RatingStars
                              rating={rating}
                              count={count}
                              onRate={(value) => {
                                setLocalRatings((prev) => ({
                                  ...prev,
                                  [item.id]: {
                                    rating: value,
                                    count: prev[item.id]?.count ?? baseCount + 1,
                                  },
                                }))
                              }}
                            />
                          </div>
                        )
                      })()}
                    {item.is_available === false && (
                      <span className="inline-block text-[10px] uppercase tracking-[0.2em] px-2 py-1 bg-[#F5F2ED] dark:bg-[#1A1A18] text-[#706C61] dark:text-[#A09D95] border border-[#E5E1D8] dark:border-[#2A2A28]">
                        Currently Unavailable
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 space-y-4">
              <p className="text-xl font-serif italic text-[#706C61] dark:text-[#A09D95]">No dishes match your search</p>
              <button 
                onClick={() => onSearchChange("")}
                className="text-sm font-sans uppercase tracking-[0.2em] underline dark:text-white"
              >
                Clear Search
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className="mt-24 py-12 border-t border-[#E5E1D8] dark:border-[#2A2A28] text-center">
        <div className="flex flex-col items-center justify-center gap-4">
          <span className="text-[10px] font-sans uppercase tracking-[0.3em] text-[#706C61] dark:text-[#A09D95] opacity-70">
            Presented by
          </span>
          <Logo width={110} height={35} grayscale />
        </div>
      </footer>
    </div>
  )
}
