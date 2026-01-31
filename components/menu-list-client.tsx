"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { ArrowLeft, Search, Info, Coffee, Leaf, Loader2, X, Flame, Clock } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { cn, getImageUrl, getImageUrls } from "@/lib/utils"
import { apiFetch } from "@/lib/api-client"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer"

import { LoadingSignal } from "@/components/ui/loading-signal"

// Template Imports
import { MenuItem, Category, Restaurant } from "./menu-templates/types"
import Template1 from "./menu-templates/Template1"
import Template2 from "./menu-templates/Template2"
import Template3 from "./menu-templates/Template3"

interface MenuListClientProps {
    hotelSlug: string
    initialHotel?: Restaurant | null
    initialCategories?: Category[]
    initialItems?: MenuItem[]
}

export default function MenuListClient({ hotelSlug, initialHotel, initialCategories = [], initialItems = [] }: MenuListClientProps) {
  const [hotel, setHotel] = useState<Restaurant | null>(initialHotel || null)
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [activeCategory, setActiveCategory] = useState(initialCategories.length > 0 ? initialCategories[0].id : "")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(!initialHotel)
  const [error, setError] = useState<string | null>(null)
  const [itemsLoading, setItemsLoading] = useState(false)
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  // Determine template (1, 2, or 3)
  // We'll look for a 'public_template' or 'template' field, defaulting to 1
  const selectedTemplate = hotel?.public_template || (hotel as any)?.template || 1

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!initialHotel) setLoading(true)
        
        let currentHotel = hotel

        // 1. Load Restaurant if missing
        if (!currentHotel || !currentHotel.id) {
          try {
            const rRes = await apiFetch<any>(`/restaurants/${hotelSlug}`)
            const rData = rRes?.data || rRes
            currentHotel = Array.isArray(rData) ? rData[0] : rData
            if (currentHotel) {
              setHotel(currentHotel)
            } else {
              throw new Error("No restaurant data found")
            }
          } catch (err) {
            console.error("Failed to load restaurant details:", err)
            setError("Restaurant details could not be loaded.")
            setLoading(false)
            return
          }
        }

        // 2. Load Categories and their items
        const restaurantIdForMenu = currentHotel?.id || hotelSlug 
        
        if (!restaurantIdForMenu || restaurantIdForMenu === "[hotel-slug]") {
          setLoading(false)
          return
        }

        try {
          setItemsLoading(true)
          const cRes = await apiFetch<any>(`/restaurants/${restaurantIdForMenu}/categories`)
          const cData = cRes?.data || cRes || []
          
          if (Array.isArray(cData)) {
            // Fetch items for each category
            const categoriesWithItems = await Promise.all(
              cData.map(async (cat: any) => {
                try {
                  const itRes = await apiFetch<any>(`/restaurants/${restaurantIdForMenu}/categories/${cat.id}/items`)
                  const itData = itRes?.data || itRes || []
                  return { ...cat, items: itData }
                } catch (e) {
                  return { ...cat, items: [] }
                }
              })
            )
            setCategories(categoriesWithItems)
            if (categoriesWithItems.length > 0 && !activeCategory) {
              setActiveCategory(categoriesWithItems[0].id)
            }
          }
        } catch (err) {
          console.error("Failed to load categories/items:", err)
        } finally {
          setItemsLoading(false)
        }

      } catch (err: any) {
        setError(err.message || "An unexpected error occurred")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [hotelSlug, initialHotel])

  const templateProps = {
    hotel: hotel || { name: "Restaurant", slug: hotelSlug },
    categories,
    activeCategory,
    onCategoryChange: setActiveCategory,
    onItemClick: setSelectedItem,
    searchQuery,
    onSearchChange: setSearchQuery,
    itemsLoading
  }

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background gap-4">
        <LoadingSignal />
        <p className="text-muted-foreground font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Setting the table...</p>
      </div>
    )
  }

  if (error || !hotel) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background gap-6 text-center p-6">
        <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
          <X className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="text-muted-foreground max-w-xs">{error || "We couldn't load the menu."}</p>
        </div>
        <Button asChild variant="outline" className="rounded-full">
          <Link href={`/menu/${hotelSlug}`}>Try Again</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Template Switcher Logic */}
      {Number(selectedTemplate) === 1 && <Template1 {...templateProps} />}
      {Number(selectedTemplate) === 2 && <Template2 {...templateProps} />}
      {Number(selectedTemplate) === 3 && <Template3 {...templateProps} />}

      {/* Shared Item Detail Drawer */}
      <Drawer open={!!selectedItem} onOpenChange={(open) => {
        if (!open) {
          setSelectedItem(null)
          setActiveImageIndex(0)
        }
      }}>
        <DrawerContent className="max-h-[96vh] md:max-h-[90vh] md:w-[90%] md:max-w-7xl md:mx-auto md:mb-6 rounded-t-[2.5rem] md:rounded-[2.5rem] border-none bg-background p-0 overflow-hidden shadow-2xl">
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-muted rounded-full z-50 md:hidden" />
          {selectedItem && (
            <div className="flex flex-col md:flex-row h-full bg-background">
              {/* Image Gallery Section */}
              <div className="flex flex-col md:flex-[1.1] bg-secondary/20 overflow-hidden">
                <div className="relative aspect-square md:aspect-auto md:flex-1 w-full overflow-hidden">
                  {(() => {
                    const images = getImageUrls(selectedItem.image_urls || selectedItem.images || selectedItem.image || selectedItem.image_url);
                    const validImages = images.length > 0 ? images : ["/placeholder.svg"];
                    const currentImg = validImages[activeImageIndex] || validImages[0];
                    
                    return (
                      <div className="h-full w-full relative group">
                        <Image 
                          src={currentImg} 
                          alt={selectedItem.name} 
                          fill 
                          className="object-cover transition-all duration-700 ease-in-out" 
                          priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        {validImages.length > 1 && (
                          <div className="absolute bottom-6 right-6 z-10 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-xs font-bold tracking-widest flex items-center gap-2 border border-white/10 md:hidden">
                            <span>{activeImageIndex + 1}</span>
                            <span className="opacity-40">/</span>
                            <span className="opacity-60">{validImages.length}</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  <div className="absolute top-6 right-6 z-30 md:hidden">
                     <DrawerClose asChild>
                        <Button variant="secondary" size="icon" className="h-10 w-10 rounded-full bg-background/90 backdrop-blur-xl border-none shadow-xl">
                          <X className="h-5 w-5 text-foreground" />
                        </Button>
                     </DrawerClose>
                  </div>
                </div>

                {/* Thumbnail Strip */}
                {(() => {
                  const images = getImageUrls(selectedItem.image_urls || selectedItem.images || selectedItem.image || selectedItem.image_url);
                  if (images.length <= 1) return null;
                  
                  return (
                    <div className="p-4 md:p-6 bg-secondary/10 border-t border-border">
                      <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar justify-center">
                        {images.map((url, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveImageIndex(idx)}
                            className={cn(
                              "relative flex-shrink-0 h-16 w-16 md:h-20 md:w-20 rounded-xl overflow-hidden transition-all duration-300 ring-offset-2",
                              activeImageIndex === idx 
                                ? "ring-2 ring-primary scale-105 shadow-lg" 
                                : "opacity-40 hover:opacity-80 scale-95"
                            )}
                          >
                            <Image src={url} alt={`${selectedItem.name} thumbnail ${idx}`} fill className="object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Detail Content Section */}
              <div className="flex-1 md:flex-[1.2] overflow-y-auto bg-background relative">
                <div className="hidden md:block absolute top-8 right-8 z-30">
                  <DrawerClose asChild>
                    <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground">
                      <X className="h-6 w-6" />
                    </Button>
                  </DrawerClose>
                </div>

                <div className="px-6 py-10 md:px-14 md:py-16 flex flex-col gap-10">
                   <div className="space-y-6">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="bg-primary/5 text-primary px-3 py-1 rounded-lg text-[10px] font-black tracking-[0.2em] uppercase border border-primary/10">
                           {categories.find(c => String(c.id) === String(selectedItem.category_id))?.name || "Selection"}
                        </span>
                        {selectedItem.is_available === false && (
                          <span className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 px-3 py-1 rounded-lg text-[10px] font-black tracking-[0.2em] uppercase border border-rose-100 dark:border-rose-900/30">
                             Sold Out
                          </span>
                        )}
                        <div className="flex-1 md:hidden" />
                        <div className="text-2xl font-black text-primary md:hidden">
                           {selectedItem.currency} {selectedItem.price.toFixed(2)}
                        </div>
                      </div>
                      
                      <DrawerTitle className="text-3xl md:text-5xl font-serif text-foreground leading-tight tracking-tight">
                        {selectedItem.name}
                      </DrawerTitle>

                      <div className="hidden md:flex items-center gap-4">
                        <div className="h-[1px] w-12 bg-primary/20" />
                        <div className="text-4xl font-serif text-primary">
                          <span className="text-xl font-sans font-bold vertical-super mr-1 opacity-80">{selectedItem.currency}</span>
                          {selectedItem.price.toFixed(2)}
                        </div>
                      </div>

                      <DrawerDescription className="text-lg md:text-xl text-muted-foreground leading-relaxed font-medium max-w-2xl">
                        {selectedItem.description || "Indulge in a masterpiece of flavor, meticulously prepared by our chefs."}
                      </DrawerDescription>
                   </div>

                   {/* Modern Info Tiles */}
                   <div className="grid grid-cols-2 gap-4 md:gap-6">
                      <div className="flex flex-col gap-3 p-5 md:p-7 rounded-[2rem] bg-secondary/20 border border-border transition-all hover:bg-secondary/30">
                         <div className="h-11 w-11 rounded-2xl bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
                            <Flame className="h-5 w-5" />
                         </div>
                         <div className="space-y-0.5">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Flavor Profile</p>
                            <p className="text-base font-bold text-foreground">Signature Selection</p>
                         </div>
                      </div>
                      <div className="flex flex-col gap-3 p-5 md:p-7 rounded-[2rem] bg-secondary/20 border border-border transition-all hover:bg-secondary/30">
                         <div className="h-11 w-11 rounded-2xl bg-sky-100 dark:bg-sky-900/20 flex items-center justify-center text-sky-600 dark:text-sky-400">
                            <Clock className="h-5 w-5" />
                         </div>
                         <div className="space-y-0.5">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Est. Arrival</p>
                            <p className="text-base font-bold text-foreground">15 - 20 Mins</p>
                         </div>
                      </div>
                   </div>

                   <div className="mt-8 md:mt-4 md:hidden">
                      <Button className="w-full h-16 rounded-2xl text-lg font-bold shadow-2xl shadow-primary/20" onClick={() => setSelectedItem(null)}>
                        Return to Menu
                      </Button>
                   </div>
                </div>
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  )
}