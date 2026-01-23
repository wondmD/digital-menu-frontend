"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { ArrowLeft, Search, Info, Coffee, Leaf, Loader2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn, getImageUrl, getImageUrls } from "@/lib/utils"
import { apiFetch } from "@/lib/api-client"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { X, Flame, Clock } from "lucide-react"

type Category = { id: string; name: string; description?: string; items?: any[] }
type MenuItem = { 
  id: string; 
  name: string; 
  description: string; 
  price: number; 
  currency: string; 
  image?: any;
  images?: any[];
  image_url?: string; 
  image_urls?: string[];
  category_id: string;
  is_available?: boolean;
  available?: boolean;
}
type Restaurant = { name: string; slug: string; description?: string; is_published?: boolean; id?: string }

interface MenuListClientProps {
    hotelSlug: string
    initialHotel?: Restaurant | null
    initialCategories?: Category[]
    initialItems?: MenuItem[]
}

export default function MenuListClient({ hotelSlug, initialHotel, initialCategories = [], initialItems = [] }: MenuListClientProps) {
  const [hotel, setHotel] = useState<Restaurant | null>(initialHotel || null)
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [items, setItems] = useState<MenuItem[]>(initialItems)
  const [activeCategory, setActiveCategory] = useState(initialCategories.length > 0 ? initialCategories[0].id : "")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(!initialHotel)
  const [itemsLoading, setItemsLoading] = useState(false)
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  
  const mainRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!initialHotel) setLoading(true)
        
        let currentHotel = hotel

        // 1. Load Restaurant if missing
        if (!currentHotel) {
          const rRes = await apiFetch<any>(`/restaurants/${hotelSlug}`)
          currentHotel = rRes?.data || rRes
          setHotel(currentHotel)
        }

        // 2. Load Categories if missing
        let cData = categories
        // The backend API now requires the numeric/UUID Restaurant ID for sub-resources
        const restaurantIdForMenu = currentHotel?.id || hotelSlug 
        if (!cData || cData.length === 0) {
          const cRes = await apiFetch<any>(`/restaurants/${restaurantIdForMenu}/categories`)
          cData = Array.isArray(cRes) ? cRes : (cRes?.data || [])
          setCategories(cData)
          if (cData.length > 0) setActiveCategory(cData[0].id)
        }

        // Categories are loaded, we can show the UI now
        setLoading(false)

        // 3. Load items in parallel if missing
        if ((!items || items.length === 0) && cData.length > 0) {
          setItemsLoading(true)
          
          // Initial check for items already in categories
          const existingItems: MenuItem[] = []
          for (const cat of cData) {
            if (cat.items && Array.isArray(cat.items)) {
              cat.items.forEach((item: any) => {
                existingItems.push({
                  ...item,
                  category_id: String(cat.id),
                  price: Number(item.price || 0),
                  currency: item.currency || "USD",
                  image_url: getImageUrl(item.image_url || item.images || item.image),
                  image_urls: getImageUrls(item.image_urls || item.images || item.image || item.image_url)
                })
              })
            }
          }

          // Even if some items exist, we try to fetch from individual category endpoints
          // as they might have more detailed data or categories might not have full item lists.
          const fetchPromises = cData.map(async (cat) => {
            try {
              const iRes = await apiFetch<any>(`/restaurants/${restaurantIdForMenu}/categories/${cat.id}/items`)
              
              // Robust item extraction from various possible response formats
              let iData: any[] = []
              const raw = iRes?.data || iRes
              
              if (Array.isArray(raw)) {
                iData = raw
              } else if (raw?.items && Array.isArray(raw.items)) {
                iData = raw.items
              } else if (raw?.data && Array.isArray(raw.data)) {
                iData = raw.data
              } else if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) {
                // Handle single item response if applicable
                iData = [raw]
              }

              return iData.map((item: any) => ({
                ...item,
                category_id: String(cat.id),
                price: Number(item.price || 0),
                currency: item.currency || "USD",
                image_url: getImageUrl(item.image_url || item.images || item.image),
                image_urls: getImageUrls(item.image_urls || item.images || item.image || item.image_url)
              }))
            } catch (err) {
              console.error(`Failed to fetch items for category ${cat.id}:`, err)
              return []
            }
          })

          const results = await Promise.all(fetchPromises)
          const fetchedItems = results.flat()
          
          // Combine existing and fetched items, avoiding duplicates by ID
          const combined = [...existingItems]
          fetchedItems.forEach(item => {
            if (!combined.some(existing => existing.id === item.id)) {
              combined.push(item)
            }
          })

          setItems(combined)
          setItemsLoading(false)
        }
      } catch (err) {
        console.error(err)
        setLoading(false)
        setItemsLoading(false)
      }
    }
    loadData()
  }, [hotelSlug, initialHotel, initialCategories, initialItems])

  const filteredItems = useMemo(() => items.filter(
    (item) =>
      ((item.name || "").toLowerCase().includes((searchQuery || "").toLowerCase()) ||
      (item.description || "").toLowerCase().includes((searchQuery || "").toLowerCase()))
  ), [items, searchQuery])

  const currentCategory = useMemo(() => 
    categories.find(c => String(c.id) === String(activeCategory)) || categories[0]
  , [categories, activeCategory])

  const categoryItems = useMemo(() => 
    filteredItems.filter(i => String(i.category_id) === String(currentCategory?.id || ""))
  , [filteredItems, currentCategory])

  const scrollToCategory = (id: string) => {
    setActiveCategory(id)
    if (mainRef.current) {
      mainRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  if (loading) {
    return (
       <div className="flex h-screen items-center justify-center bg-[#FDFCF8]">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
       </div>
    )
  }

  const isPublished = hotel?.is_published === true || String(hotel?.is_published) === "true"

  if (hotel && !isPublished) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#FDFCF8] gap-4 p-6 text-center">
        <h1 className="text-2xl font-bold text-primary">Menu Offline</h1>
        <p className="text-muted-foreground max-w-xs text-balance">
          This restaurant's menu is currently in draft mode and not visible to the public.
        </p>
        <Button asChild>
          <Link href={`/menu/${hotelSlug}`}>Back to Profile</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDFCF8] pb-24 font-sans antialiased">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-primary/10 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <Button variant="ghost" size="icon" className="-ml-3 h-12 w-12 rounded-2xl hover:bg-primary/5" asChild>
            <Link href={`/menu/${hotelSlug}`}>
              <ArrowLeft className="h-6 w-6 text-primary" />
            </Link>
          </Button>
          <div className="flex flex-col items-center text-center">
            <p className="text-[11px] uppercase tracking-[0.3em] text-primary font-semibold">Menu</p>
            <h2 className="text-xl font-serif text-primary truncate max-w-[260px]">{hotel?.name || "Restaurant"}</h2>
          </div>
          <Button variant="ghost" size="icon" className="-mr-3 h-12 w-12 rounded-2xl hover:bg-primary/5">
            <Info className="h-6 w-6 text-primary" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 lg:px-10">
        <section className="mt-10 grid gap-6 rounded-3xl bg-white/70 p-6 shadow-lg ring-1 ring-primary/5 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" /> Seasonal highlights
            </div>
            <h1 className="text-4xl font-serif font-normal leading-tight text-primary">Explore our crafted menu</h1>
            <p className="max-w-2xl text-lg text-muted-foreground">
              {hotel?.description || "Discover chef-driven dishes, curated beverages, and signatures designed to elevate every visit."}
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 rounded-2xl bg-primary/5 px-4 py-2 text-sm font-semibold text-primary">
                <Leaf className="h-4 w-4" />
                {categories.length} categories
              </div>
              <div className="inline-flex items-center gap-2 rounded-2xl bg-primary/5 px-4 py-2 text-sm font-semibold text-primary">
                <Coffee className="h-4 w-4" />
                {filteredItems.length} items available
              </div>
            </div>
          </div>
          <div className="space-y-4 rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/5 via-white to-primary/5 p-4 shadow-inner">
            <div className="text-sm font-semibold text-primary">Search & filter</div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary/40" />
              <Input
                className="pl-12 h-12 rounded-2xl bg-white border-primary/10 focus-visible:ring-2 focus-visible:ring-primary/20 text-base"
                placeholder="Find dishes, drinks, or specials"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-8 lg:grid-cols-[1fr_2.25fr]" ref={mainRef}>
          <aside className="lg:sticky lg:top-24 space-y-6">
            <div className="rounded-3xl border border-primary/10 bg-white/80 p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.25em] text-primary font-bold">Browse</p>
              <div className="mt-4 flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-1">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => scrollToCategory(category.id)}
                    className={cn(
                      "flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition-all",
                      activeCategory === category.id
                        ? "bg-primary text-white shadow"
                        : "bg-primary/5 text-primary hover:bg-primary/10",
                    )}
                  >
                    <span>{category.name}</span>
                    <span className="text-xs opacity-80">
                      {items.filter((i) => String(i.category_id) === String(category.id)).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div className="space-y-12">
            {!currentCategory ? (
               <div className="py-16 text-center">
                 <h3 className="text-xl font-semibold">No menu categories found</h3>
               </div>
            ) : (
                <section className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                      <Leaf className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-serif font-normal text-primary">{currentCategory.name}</h3>
                      <p className="text-sm text-muted-foreground">{currentCategory.description || "Handpicked favorites and new arrivals."}</p>
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {categoryItems.map((item) => {
                      const isAvailable = item.available ?? item.is_available ?? true
                      const images = item.image_urls && item.image_urls.length > 0 
                        ? item.image_urls 
                        : [item.image_url || "/placeholder.svg"]
                      
                      return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-primary/10 bg-white shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl cursor-pointer"
                      >
                        <div className="relative aspect-[4/3] w-full overflow-hidden">
                          {images.length > 1 ? (
                            <Carousel className="h-full w-full group/carousel">
                              <CarouselContent className="h-full -ml-0">
                                {images.map((url, idx) => (
                                  <CarouselItem key={idx} className="h-full pl-0">
                                    <div className="relative h-full w-full">
                                      <Image
                                        src={url}
                                        alt={`${item.name} ${idx + 1}`}
                                        fill
                                        className={cn(
                                          "object-cover transition-transform duration-700 group-hover:scale-110",
                                          !isAvailable && "grayscale opacity-60",
                                        )}
                                      />
                                    </div>
                                  </CarouselItem>
                                ))}
                              </CarouselContent>
                              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                                {images.map((_, idx) => (
                                  <div key={idx} className="h-1.5 w-1.5 rounded-full bg-white/70 shadow-sm" />
                                ))}
                              </div>
                            </Carousel>
                          ) : (
                            <Image
                              src={images[0]}
                              alt={item.name}
                              fill
                              className={cn(
                                "object-cover transition-transform duration-700 group-hover:scale-110",
                                !isAvailable && "grayscale opacity-60",
                              )}
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-70" />
                          <div className="absolute left-4 top-4 flex items-center gap-2">
                             {!isAvailable && (
                               <Badge className="bg-white/90 text-primary" variant="secondary">
                                 Out of Stock
                               </Badge>
                             )}
                          </div>
                          <div className="absolute right-4 bottom-4">
                            <Badge className="h-9 px-4 text-base font-semibold bg-white text-primary shadow border-primary/10">
                              {item.currency} {item.price.toFixed(2)}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex flex-1 flex-col gap-3 p-5">
                          <div className="flex items-start justify-between gap-3">
                            <h4 className="text-xl font-semibold text-foreground leading-tight">{item.name}</h4>
                            <span className="text-xs rounded-full bg-primary/5 px-3 py-1 font-semibold text-primary">
                              {currentCategory.name}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{item.description}</p>
                        </div>
                      </div>
                    )})}
                  </div>

                  {itemsLoading && categoryItems.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
                      <p className="text-muted-foreground animate-pulse">Curating delicacies...</p>
                    </div>
                  )}

                  {!itemsLoading && categoryItems.length === 0 && (
                    <div className="py-16 text-center">
                      <div className="mx-auto h-16 w-16 rounded-full bg-primary/5 text-primary flex items-center justify-center mb-4">
                        <Search className="h-8 w-8" />
                      </div>
                      <h3 className="text-xl font-semibold">No items found</h3>
                      <p className="text-sm text-muted-foreground">Try a different search or switch categories.</p>
                    </div>
                  )}
                </section>
            )}
          </div>
        </section>
      </main>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center bg-primary text-white rounded-[2rem] px-8 py-4 shadow-2xl shadow-primary/40 border border-white/20 backdrop-blur-sm gap-5 transition-transform hover:scale-105 active:scale-95">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-80">Experience</span>
            <span className="text-sm font-bold leading-none tracking-tight">Handcrafted by MenuQR</span>
          </div>
        </div>
      </div>

      <Drawer open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DrawerContent className="max-h-[90vh] rounded-t-[3rem] border-none bg-[#FDFCF8] p-0 overflow-hidden">
          <div className="mx-auto w-12 h-1.5 bg-primary/10 rounded-full mt-4 mb-2" />
          {selectedItem && (
            <div className="flex flex-col h-full">
              <div className="relative aspect-[4/3] w-full shrink-0">
                {(() => {
                  const images = getImageUrls(selectedItem.image_urls || selectedItem.images || selectedItem.image || selectedItem.image_url);
                  if (images.length === 0) images.push("/placeholder.svg");
                  
                  return images.length > 1 ? (
                    <Carousel className="h-full w-full">
                      <CarouselContent className="h-full -ml-0">
                        {images.map((url, idx) => (
                          <CarouselItem key={idx} className="h-full pl-0">
                            <div className="relative h-full w-full">
                              <Image src={url} alt={selectedItem.name} fill className="object-cover" />
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                    </Carousel>
                  ) : (
                    <Image src={images[0]} alt={selectedItem.name} fill className="object-cover" />
                  );
                })()}
                <div className="absolute top-6 right-6">
                   <DrawerClose asChild>
                      <Button variant="secondary" size="icon" className="h-12 w-12 rounded-2xl bg-white/80 backdrop-blur-xl border-none shadow-xl">
                        <X className="h-6 w-6 text-primary" />
                      </Button>
                   </DrawerClose>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-8 py-10 custom-scrollbar">
                <div className="flex flex-col gap-6">
                   <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                         <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest text-primary border-primary/20 bg-primary/5 py-0 px-2 rounded-md">
                           {categories.find(c => String(c.id) === String(selectedItem.category_id))?.name}
                         </Badge>
                         <DrawerTitle className="text-4xl font-serif text-primary lowercase first-letter:uppercase">
                           {selectedItem.name}
                         </DrawerTitle>
                      </div>
                      <div className="text-3xl font-bold text-primary">
                        {selectedItem.currency === "EUR" ? "€" : "$"}{parseFloat(String(selectedItem.price || 0)).toFixed(2)}
                      </div>
                   </div>

                   <DrawerDescription className="text-lg text-muted-foreground leading-relaxed font-medium">
                      {selectedItem.description || "A chef-crafted signature dish prepared with the finest seasonal ingredients."}
                   </DrawerDescription>

                   <div className="grid grid-cols-2 gap-4 pt-6 border-t border-primary/10">
                      <div className="flex flex-col gap-1.5 p-4 rounded-3xl bg-orange-50/50 border border-orange-100/50">
                         <p className="text-[10px] font-black uppercase tracking-widest text-orange-600/60">Spice Level</p>
                         <div className="flex items-center gap-2">
                            <Flame className="h-5 w-5 text-orange-500" />
                            <span className="font-bold text-orange-700">Moderate Heat</span>
                         </div>
                      </div>
                      <div className="flex flex-col gap-1.5 p-4 rounded-3xl bg-primary/5 border border-primary/10">
                         <p className="text-[10px] font-black uppercase tracking-widest text-primary/40">Preparation</p>
                         <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-primary/60" />
                            <span className="font-bold text-primary">15 - 20 mins</span>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-4 pt-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary/40">Dietary Information</p>
                      <div className="flex flex-wrap gap-2">
                         {["Gluten Free", "Organic", "Chef's Special"].map(tag => (
                           <Badge key={tag} variant="outline" className="rounded-full px-4 py-1.5 border-primary/10 text-primary/70 font-bold text-[11px]">
                             {tag}
                           </Badge>
                         ))}
                      </div>
                   </div>
                </div>
              </div>
              
              <DrawerFooter className="p-8 pt-0">
                <Button className="w-full h-16 rounded-[2rem] text-lg font-bold shadow-2xl shadow-primary/30" onClick={() => setSelectedItem(null)}>
                  Close Detail
                </Button>
              </DrawerFooter>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  )
}
