"use client"

import { MenuItem, TemplateProps } from "./types"
import { motion } from "framer-motion"
import Image from "next/image"
import { Logo } from "@/components/logo"
import { getImageUrl } from "@/lib/utils"
import { Search, Loader2, Zap } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export default function Template3({
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

  // Ensure we get the correct logo URL field
  const logoImage = getImageUrl(hotel.logo_url || (hotel as any).logo_image_url)

  const query = searchQuery.toLowerCase()
  const filteredItems = categoryItems.filter((item) => {
    if (!query) return true
    return item.name.toLowerCase().includes(query) || (item.description || "").toLowerCase().includes(query)
  })

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-24 font-sans">
      {/* Search Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-5 sm:py-6 sticky top-0 z-40">
        <div className="container max-w-3xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-black flex items-center gap-2">
               {logoImage ? (
                 <motion.div
                   initial={{ scale: 0.8, opacity: 0 }}
                   animate={{ scale: 1, opacity: 1 }}
                   className="relative w-8 h-8 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700"
                 >
                   <Image
                     src={logoImage}
                     alt={hotel.name}
                     fill
                     className="object-cover"
                   />
                 </motion.div>
               ) : (
                 <Zap className="h-6 w-6 text-primary fill-current" />
               )}
               {hotel.name}
            </h1>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Quick search Ethiopian menu..."
              className="pl-10 h-11 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-lg dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Tightly packed categories */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 sticky top-27 sm:top-31 z-30">
        <div className="container max-w-3xl mx-auto flex gap-2 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all",
                activeCategory === cat.id 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Efficient List */}
      <main className="container max-w-3xl mx-auto px-4 sm:px-6 py-8">
         <motion.section
           initial={{ opacity: 0, y: 8 }}
           animate={{ opacity: 1, y: 0 }}
           className="mb-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5"
         >
           <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Selected Category</p>
           <h2 className="mt-1 text-xl sm:text-2xl font-black text-slate-900 dark:text-white wrap-break-word">
             {currentCategory?.name || "Highlights"}
           </h2>
           <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
             {currentCategory?.description || "Fast, flavorful picks designed for quick decisions and great taste."}
           </p>
           <span className="mt-3 inline-flex rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">
             {filteredItems.length} item{filteredItems.length === 1 ? "" : "s"}
           </span>
         </motion.section>

         <div className="space-y-4">
            {itemsLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredItems.length > 0 ? (
              <div className="grid gap-2">
                {filteredItems.map((item, idx) => (
                  (() => {
                    const itemImage = getImageUrl(item.image_url || item.image || item.images || item.image_urls)
                    return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    onClick={() => onItemClick(item)}
                    className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:border-primary/50 transition-all active:scale-[0.98]"
                  >
                    {itemImage ? (
                      <div className="relative h-16 w-16 shrink-0 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                        <Image
                          src={itemImage || "/placeholder.svg"}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-16 w-16 shrink-0 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center uppercase font-black text-slate-300 dark:text-slate-600">
                        {item.name.substring(0, 2)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0 pr-2">
                      <h3 className="font-bold text-slate-900 dark:text-white truncate">{item.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{item.description}</p>
                    </div>
                    <div className="text-right">
                       <p className="font-black text-primary whitespace-nowrap">
                          {item.currency} {item.price.toFixed(item.price % 1 === 0 ? 0 : 2)}
                       </p>
                        {(item.is_available === false || item.available === false) && (
                         <p className="text-[10px] font-bold uppercase tracking-wide text-rose-500 mt-1">Sold Out</p>
                        )}
                    </div>
                  </motion.div>
                    )
                  })()
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-slate-400">
                 No results found.
              </div>
            )}
         </div>
      </main>

      <footer className="mt-12 mb-12 flex flex-col items-center justify-center gap-3">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          Powered by
        </span>
        <Logo width={100} height={32} />
      </footer>
    </div>
  )
}
