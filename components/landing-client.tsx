"use client"

import Link from "next/link"
import Image from "next/image"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  QrCode, Smartphone, Sparkles, Search, Utensils, MapPin, 
  Loader2, ArrowRight, ShoppingBag, Flame, 
  ChefHat, Zap, Play, CheckCircle2, Menu as MenuIcon, Mail, Twitter, Instagram, Facebook
} from "lucide-react"
import { useEffect, useState, useMemo, useRef } from "react"
import { apiFetch } from "@/lib/api-client"
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion"
import { cn, getImageUrl } from "@/lib/utils"
import { Logo } from "@/components/logo"

const MotionLink = motion(Link)

type Restaurant = {
  id: string
  name: string
  slug: string
  description?: string
  logo_url?: string
  cover_url?: string
  address?: string
  cuisine_type?: string
  latitude?: number
  longitude?: number
}

function getRestaurantIdentifier(restaurant: any): string {
  const value =
    restaurant?.slug ||
    restaurant?.restaurant_slug ||
    restaurant?.hotel_slug

  return value ? String(value) : ""
}

type Dish = {
  id: string
  name: string
  price: number
  description?: string
  image_url?: string
  restaurant_name: string
  restaurant_slug: string
  category_name?: string
}

const RESTAURANT_PLACEHOLDERS = [
  "Search premium restaurants...",
  "Discover secret menus...",
  "Explore gourmet steakhouse...",
  "Find the best cafes nearby...",
  "Browse top-rated venues..."
]

const DISH_PLACEHOLDERS = [
  "What are you craving today?",
  "Search dishes by name...",
  "Find the best sushi nearby...",
  "Explore signature pasta...",
  "Hunt for spicy specials..."
]

function parseCoordinateAddress(address?: string): { lat: number; lng: number } | null {
  if (!address) return null
  const match = address.match(/^\s*([-+]?\d*\.?\d+)\s*,\s*([-+]?\d*\.?\d+)\s*$/)
  if (!match) return null

  const lat = Number(match[1])
  const lng = Number(match[2])
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng }
}

function resolveRestaurantCoordinates(restaurant: any): { lat: number; lng: number } | null {
  const lat = Number(restaurant?.latitude ?? restaurant?.lat)
  const lng = Number(restaurant?.longitude ?? restaurant?.lng)
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return { lat, lng }
  }
  return parseCoordinateAddress(restaurant?.address)
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180
}

function distanceKm(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): number {
  const earthRadiusKm = 6371
  const dLat = toRadians(to.lat - from.lat)
  const dLng = toRadians(to.lng - from.lng)
  const lat1 = toRadians(from.lat)
  const lat2 = toRadians(to.lat)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return earthRadiusKm * c
}

function RestaurantCard({
  restaurant,
  index,
  compact = false,
}: {
  restaurant: Restaurant
  index: number
  compact?: boolean
}) {
  const restaurantIdentifier = getRestaurantIdentifier(restaurant)
  const menuHref = restaurantIdentifier ? `/${restaurantIdentifier}` : "/"

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.5 }}
      viewport={{ once: true }}
      className="group"
    >
      <Link href={menuHref} className="block h-full">
        <article
          className={cn(
            "relative h-full flex flex-col bg-card/40 border border-border group-hover:border-primary/40 shadow-xl transition-all duration-500 overflow-hidden backdrop-blur-sm",
            compact ? "rounded-3xl p-3" : "rounded-[2.5rem] p-4"
          )}
        >
          <div
            className={cn(
              "relative overflow-hidden",
              compact ? "aspect-[4/3] rounded-2xl mb-4" : "aspect-square rounded-[2rem] mb-5"
            )}
          >
            <Image 
              src={getImageUrl(restaurant.cover_url || restaurant.logo_url) || "/hotel.webp"} 
              alt={restaurant.name} 
              fill 
              className="object-cover transition-transform duration-700 group-hover:scale-110" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60" />
            <div className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/95 text-primary flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="absolute bottom-4 left-4">
                <div className="px-4 py-1 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-[9px] font-black uppercase tracking-widest text-white italic">
                  {restaurant.cuisine_type || "Gourmet"}
                </div>
            </div>
          </div>

          <div className={cn("px-2 flex-1 flex flex-col", compact && "px-1")}>
              <h3 className={cn("font-serif tracking-tight group-hover:text-primary transition-colors mb-2 line-clamp-1", compact ? "text-lg md:text-xl" : "text-xl md:text-2xl")}>
                {restaurant.name}
              </h3>
              <p className={cn("text-muted-foreground line-clamp-2 leading-relaxed font-medium", compact ? "text-xs mb-4" : "text-sm mb-6")}>
                {restaurant.description || "The intersection of tradition and innovation curated for you."}
              </p>
              
          </div>
        </article>
      </Link>
    </motion.div>
  )
}

function DishCard({
  dish,
  index,
  compact = false,
  onSelect,
}: {
  dish: Dish
  index: number
  compact?: boolean
  onSelect: (dish: Dish) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className="group"
    >
      <div
        role="button"
        tabIndex={0}
        className="block h-full w-full text-left"
        onClick={() => onSelect(dish)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            onSelect(dish)
          }
        }}
      >
        <article
          className={cn(
            "flex gap-4 bg-card/40 rounded-3xl border border-border group-hover:border-primary/40 transition-all backdrop-blur-sm",
            compact ? "p-3" : "p-4"
          )}
        >
          <div className={cn("relative shrink-0 rounded-2xl overflow-hidden shadow-lg", compact ? "h-20 w-20" : "h-24 w-24")}>
            <Image 
              src={getImageUrl(dish.image_url) || "/hotel.webp"} 
              alt={dish.name} 
              fill 
              className="object-cover group-hover:scale-110 transition-transform" 
            />
          </div>
          <div className="flex-1 flex flex-col justify-center min-w-0">
            <div className="flex justify-between items-start mb-1">
              <h4 className={cn("font-bold truncate group-hover:text-primary transition-colors", compact ? "text-base" : "text-lg")}>{dish.name}</h4>
              <span className={cn("text-primary font-black whitespace-nowrap ml-2", compact ? "text-xs" : "text-sm")}>${dish.price}</span>
            </div>
            <p className={cn("text-muted-foreground line-clamp-2", compact ? "text-[11px] mb-1" : "text-xs mb-2")}>{dish.description}</p>
            <div className="flex items-center justify-between gap-2">
              <div className={cn("px-2 py-0.5 bg-primary/10 text-primary font-black uppercase rounded-md tracking-widest", compact ? "text-[7px]" : "text-[8px]")}>{dish.restaurant_name}</div>
            </div>
          </div>
        </article>
      </div>
    </motion.div>
  )
}

export default function LandingClient() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [dishes, setDishes] = useState<Dish[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [restaurantFilter, setRestaurantFilter] = useState<"all" | "nearby">("all")
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null)
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  })
  
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  useEffect(() => {
    const interval = setInterval(() => {
      const placeholders = RESTAURANT_PLACEHOLDERS
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await apiFetch<any>("/restaurants")
        const restaurantList = Array.isArray(res) ? res : (res?.data || [])
        
        const enhancedRestaurants: Restaurant[] = restaurantList
          .map((r: any) => {
            const identifier = getRestaurantIdentifier(r)
            if (!identifier || !r?.name) return null
            const coords = resolveRestaurantCoordinates(r)

            return {
              ...r,
              id: String(r.id || identifier),
              slug: identifier,
              name: String(r.name),
              latitude: coords?.lat,
              longitude: coords?.lng,
            }
          })
          .filter((restaurant: Restaurant | null): restaurant is Restaurant => restaurant !== null)

        setRestaurants(enhancedRestaurants)

        const featuredDishes: Dish[] = []
        for (const rest of enhancedRestaurants.slice(0, 8)) {
          const restaurantId = rest.id
          if (!restaurantId) continue

          try {
            const categoriesRes = await apiFetch<any>(`/restaurants/${restaurantId}/categories`)
            const categories = Array.isArray(categoriesRes) ? categoriesRes : (categoriesRes?.data || [])

            for (const category of categories.slice(0, 4)) {
              try {
                const itemsRes = await apiFetch<any>(`/restaurants/${restaurantId}/categories/${category.id}/items`)
                const items = Array.isArray(itemsRes) ? itemsRes : (itemsRes?.data || [])

                items.slice(0, 4).forEach((item: any) => {
                  if (!item?.id || !item?.name) return
                  featuredDishes.push({
                    id: String(item.id),
                    name: String(item.name),
                    price: Number(item.price || 0),
                    description: item.description || "",
                    image_url: getImageUrl(item.image_url || item.image?.url || item.images?.[0]?.url) || undefined,
                    restaurant_name: rest.name,
                    restaurant_slug: rest.slug || String(rest.id),
                    category_name: category.name,
                  })
                })
              } catch {
                continue
              }
            }
          } catch (e) {}
        }

        const deduplicated = featuredDishes.filter(
          (dish, index, array) => array.findIndex((other) => other.id === dish.id && other.restaurant_slug === dish.restaurant_slug) === index
        )
        setDishes(deduplicated)
      } catch (err) {
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filteredRestaurants = useMemo(() => 
    restaurants.filter(r => 
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.cuisine_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  , [restaurants, searchQuery])

  const filteredDishes = useMemo(() => 
    dishes.filter(d => 
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.restaurant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.category_name?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  , [dishes, searchQuery])

  const hasSearch = searchQuery.length > 0

  const visibleRestaurants = useMemo(() => {
    if (restaurantFilter !== "nearby" || !userLocation) {
      return filteredRestaurants
    }

    return [...filteredRestaurants].sort((a, b) => {
      const aCoords = resolveRestaurantCoordinates(a)
      const bCoords = resolveRestaurantCoordinates(b)

      if (!aCoords && !bCoords) return 0
      if (!aCoords) return 1
      if (!bCoords) return -1

      return distanceKm(userLocation, aCoords) - distanceKm(userLocation, bCoords)
    })
  }, [filteredRestaurants, restaurantFilter, userLocation])

  const enableNearbyFilter = () => {
    setRestaurantFilter("nearby")
    if (userLocation || isLocating) return
    if (typeof navigator === "undefined" || !navigator.geolocation) return

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude })
        setIsLocating(false)
      },
      () => {
        setIsLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 120000 }
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary/30 selection:text-white overflow-x-hidden">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION - REDESIGNED */}
        <section ref={heroRef} className="relative min-h-[90vh] md:min-h-screen flex flex-col items-center pt-24 md:pt-32 overflow-hidden px-4 sm:px-6">
          {/* Background Visuals */}
          <div className="absolute inset-0 z-0">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(230,57,70,0.08),transparent_70%)] opacity-50" />
            <motion.div 
               style={{ y: heroY, opacity: heroOpacity }}
               className="absolute top-[5%] left-[50%] -translate-x-1/2 w-[300px] md:w-[800px] h-[300px] md:h-[600px] rounded-full bg-primary/10 blur-[80px] md:blur-[150px]" 
            />
          </div>

          <div className="container relative z-10 mx-auto">
            <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-6 shadow-sm border border-primary/20"
              >
                <Zap className="h-3 w-3 fill-primary" />
                The Future of Dining
              </motion.div>
              
              <h1 className="font-serif text-[clamp(2rem,8vw,5.5rem)] leading-[1] tracking-tighter mb-6 md:mb-8">
                Find. Scan. <span className="text-primary italic font-normal">Savor.</span>
              </h1>
              
              <p className="max-w-2xl mx-auto text-base md:text-xl text-muted-foreground mb-8 md:mb-12 leading-relaxed font-medium px-4">
                Explore premium digital menus from your favorite local spots. High-performance contactless dining technology at your fingertips.
              </p>
              
              {/* HERO SEARCH - CENTRALIZED */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="w-full max-w-3xl mx-auto mb-10 md:mb-16 relative group"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-[2rem] blur opacity-25 group-focus-within:opacity-50 transition duration-1000"></div>
                <div className="relative flex flex-col md:flex-row md:items-center gap-3 bg-card/60 backdrop-blur-2xl border border-white/10 rounded-2xl md:rounded-[2.5rem] p-3 md:p-3 shadow-2xl focus-within:border-primary/50 transition-all">
                  <Search className="ml-3 md:ml-6 h-5 md:h-7 w-5 md:w-7 text-muted-foreground group-focus-within:text-primary transition-colors shrink-0" />
                  <div className="flex-1 relative flex flex-col">
                    <div className="relative h-12 md:h-16 flex items-center">
                    <AnimatePresence mode="wait">
                      {!searchQuery && (
                        <motion.p
                          key={placeholderIndex}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute inset-x-0 pl-3 md:pl-5 text-sm md:text-xl font-medium text-muted-foreground pointer-events-none whitespace-nowrap overflow-hidden text-left"
                        >
                          {RESTAURANT_PLACEHOLDERS[placeholderIndex]}
                        </motion.p>
                      )}
                    </AnimatePresence>
                    <Input 
                      className="h-full w-full border-none bg-transparent pl-3 md:pl-5 pr-8 md:pr-10 text-base md:text-xl font-bold focus-visible:ring-0 shadow-none text-foreground selection:bg-primary/40"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    </div>
                  </div>
                  <Button className="w-full md:w-auto rounded-xl md:rounded-[1.8rem] bg-primary hover:bg-primary/90 font-black px-6 md:px-10 h-11 md:h-14 shadow-xl shadow-primary/20 text-white text-xs md:text-lg uppercase tracking-widest">
                    Search Restaurants
                  </Button>
                </div>
              </motion.div>

              {/* QUICK LISTING - VISIBLE IMMEDIATELY */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="w-full"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8 px-2 md:px-4">
                    <div className="flex flex-wrap items-center gap-4">
                      <h3 className="text-lg md:text-2xl font-serif italic text-foreground flex items-center gap-3">
                        <span className="not-italic font-bold text-primary">Nearby</span> Restaurants
                      </h3>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setRestaurantFilter("all")}
                          className={cn(
                            "h-8 px-3 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest transition-colors",
                            restaurantFilter === "all"
                              ? "bg-primary text-white"
                              : "bg-muted text-muted-foreground hover:text-foreground"
                          )}
                        >
                          All
                        </button>
                        <button
                          type="button"
                          onClick={enableNearbyFilter}
                          className={cn(
                            "h-8 px-3 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest transition-colors",
                            restaurantFilter === "nearby"
                              ? "bg-primary text-white"
                              : "bg-muted text-muted-foreground hover:text-foreground"
                          )}
                        >
                          Nearby
                        </button>
                        {restaurantFilter === "nearby" && isLocating && (
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Locating...</span>
                        )}
                      </div>
                    </div>
                    <div className="hidden sm:flex gap-2">
                         <div className="h-10 w-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-muted cursor-pointer transition-colors">
                            <ArrowRight className="h-5 w-5 rotate-180" />
                         </div>
                         <div className="h-10 w-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-muted cursor-pointer transition-colors">
                            <ArrowRight className="h-5 w-5" />
                         </div>
                    </div>
                </div>

                <div className="relative">
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-[300px] rounded-[2rem] bg-card/40 border border-white/5 animate-pulse" />
                            ))}
                        </div>
                    ) : hasSearch ? (
                        <div className="space-y-12">
                          {visibleRestaurants.length > 0 && (
                            <div className="space-y-6">
                              <h4 className="text-xs font-black uppercase tracking-[0.4em] text-muted-foreground ml-2">Restaurant Matches</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                                {visibleRestaurants.slice(0, 8).map((restaurant, i) => (
                                  <RestaurantCard
                                    key={restaurant.id}
                                    restaurant={restaurant}
                                    index={i}
                                    compact
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                          {!visibleRestaurants.length && (
                             <div className="py-20 text-center bg-card/20 rounded-[3rem] border-2 border-dashed border-white/5">
                                <p className="text-muted-foreground italic">No restaurants found for "{searchQuery}"</p>
                             </div>
                          )}
                        </div>
                    ) : (
                        <div className="space-y-12">
                          <div className="space-y-6">
                            <h4 className="text-xs font-black uppercase tracking-[0.4em] text-muted-foreground ml-2">Restaurants</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                              {visibleRestaurants.slice(0, 8).map((restaurant, i) => (
                                <RestaurantCard
                                  key={restaurant.id}
                                  restaurant={restaurant}
                                  index={i}
                                  compact
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                    )}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS - ARCHITECTURE */}
        <section className="py-20 md:py-40 bg-card" id="features">
           <div className="container mx-auto px-4 md:px-6">
              <div className="grid lg:grid-cols-2 gap-16 md:gap-32 items-center">
                 <div>
                    <motion.div 
                      initial={{ opacity: 0, x: -30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-secondary/10 text-secondary text-[10px] md:text-xs font-black uppercase tracking-widest mb-8 md:mb-10"
                    >
                      <Zap className="h-4 w-4 fill-secondary" />
                      Instant Set up
                    </motion.div>
                    <h2 className="text-5xl md:text-8xl font-serif mb-10 md:mb-12 tracking-tight leading-[1] text-foreground">Built for <br /> <span className="italic font-normal">Superior</span> <br /> Conversion.</h2>
                    
                    <div className="space-y-8 md:space-y-12">
                       {[
                         { step: "01", title: "Design Your Brand", desc: "Customize your digital menu presence within minutes. Our smart-theming engine adapts to your restaurant's style." },
                         { step: "02", title: "Menu Management", desc: "Real-time menu updates. Change prices, availability, and visuals instantly across all guest devices." },
                         { step: "03", title: "Go Live", desc: "Instantly publish your menu with high-res QR integration. No hardware needed, just powerful software." }
                       ].map((item, i) => (
                         <motion.div 
                           key={i}
                           initial={{ opacity: 0, x: -20 }}
                           whileInView={{ opacity: 1, x: 0 }}
                           transition={{ delay: i * 0.2 }}
                           viewport={{ once: true }}
                           className="flex gap-6 md:gap-10 group cursor-default"
                         >
                            <span className="text-4xl md:text-6xl font-serif italic text-muted-foreground/20 group-hover:text-primary transition-colors duration-500">{item.step}</span>
                            <div>
                               <h4 className="text-xl md:text-2xl font-bold mb-2 md:mb-3 text-foreground">{item.title}</h4>
                               <p className="text-muted-foreground text-sm md:text-base leading-relaxed font-medium">{item.desc}</p>
                            </div>
                         </motion.div>
                       ))}
                    </div>
                 </div>

                 <div className="relative">
                    <motion.div 
                       initial={{ opacity: 0, scale: 0.9 }}
                       whileInView={{ opacity: 1, scale: 1 }}
                       viewport={{ once: true }}
                       className="relative z-10 rounded-3xl md:rounded-[4rem] overflow-hidden border border-border shadow-3xl bg-card group"
                    >
                       <video
                         className="aspect-video w-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-1000"
                       src="/howto.mp4"
                       autoPlay
                       muted
                       loop
                       playsInline
                       controls
                      />
                       <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
                    </motion.div>
                    
                    {/* Decorative Elements */}
                    <div className="absolute -top-10 -right-10 md:-top-20 md:-right-20 w-40 md:w-80 h-40 md:h-80 bg-primary/20 rounded-full blur-[80px] md:blur-[120px] -z-10" />
                    <div className="absolute -bottom-10 -left-10 md:-bottom-20 md:-left-20 w-40 md:w-80 h-40 md:h-80 bg-secondary/10 rounded-full blur-[80px] md:blur-[120px] -z-10" />
                 </div>
              </div>
           </div>
        </section>

        {/* CALL TO ACTION - SIGNATURE SECTION */}
        <section className="py-20 md:py-40 relative px-4 md:px-6 overflow-hidden">
           <motion.div 
             initial={{ opacity: 0, y: 100 }}
             whileInView={{ opacity: 1, y: 0 }}
             transition={{ duration: 1 }}
             viewport={{ once: true }}
             className="max-w-7xl mx-auto rounded-[3rem] md:rounded-[5rem] bg-gradient-to-br from-primary to-[#800000] p-10 md:p-32 text-center relative overflow-hidden group shadow-[0_100px_200px_-50px_rgba(230,57,70,0.6)]"
           >
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
              <div className="absolute top-0 right-0 p-10 md:p-20 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-1000 hidden md:block">
                 <ChefHat className="h-[500px] w-[500px] text-white" />
              </div>

              <div className="relative z-10 max-w-4xl mx-auto">
                 <motion.div 
                   initial={{ y: 20, opacity: 0 }}
                   whileInView={{ y: 0, opacity: 1 }}
                   viewport={{ once: true }}
                   className="inline-flex items-center gap-2 md:gap-3 px-5 md:px-6 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-white text-[10px] md:text-xs font-black uppercase tracking-[0.4em] mb-8 md:mb-12 shadow-2xl"
                 >
                    <Sparkles className="h-3 md:h-4 w-3 md:w-4 fill-white" />
                    Join Now
                 </motion.div>

                 <h2 className="text-4xl sm:text-6xl md:text-9xl font-serif text-white mb-8 md:mb-14 tracking-tight leading-none">
                    Define Your <br /><span className="italic block mt-2 md:mt-4 font-normal text-white">Digital Experience.</span>
                 </h2>

                 <p className="text-white text-lg md:text-3xl mb-12 md:mb-20 max-w-3xl mx-auto leading-relaxed font-serif italic">
                    Join leading hospitality businesses redefining the intersection of taste and technology.
                 </p>

                 <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-8">
                    <Button 
                      size="lg" 
                      className="h-16 md:h-24 px-8 md:px-16 rounded-xl md:rounded-[2.5rem] bg-white text-primary text-xl md:text-2xl font-bold transition-all shadow-2xl hover:shadow-white/20 border-none w-full sm:w-auto"
                      asChild
                    >
                       <MotionLink 
                         href="/register"
                         whileHover={{ scale: 1.05 }}
                         whileTap={{ scale: 0.95 }}
                         transition={{ type: "spring", stiffness: 400, damping: 10 }}
                       >
                         Create Your Menu
                       </MotionLink>
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline" 
                      className="h-16 md:h-24 px-8 md:px-16 rounded-xl md:rounded-[2.5rem] bg-black/40 border-white/20 text-white text-xl md:text-2xl font-bold backdrop-blur-md flex items-center gap-4 transition-all w-full sm:w-auto"
                      asChild
                    >
                       <MotionLink 
                         href="/demo"
                         whileHover={{ scale: 1.05 }}
                         whileTap={{ scale: 0.95 }}
                         transition={{ type: "spring", stiffness: 400, damping: 10 }}
                       >
                         Explore Demo <ArrowRight className="h-6 w-6 md:h-8 md:w-8" />
                       </MotionLink>
                    </Button>
                 </div>
              </div>
           </motion.div>
        </section>
      </main>

      <Dialog open={!!selectedDish} onOpenChange={(open) => !open && setSelectedDish(null)}>
        <DialogContent className="max-w-xl rounded-3xl p-0 overflow-hidden border border-border/60 bg-background">
          {selectedDish && (
            <div className="grid md:grid-cols-[220px_1fr]">
              <div className="relative h-56 md:h-full min-h-[220px]">
                <Image
                  src={getImageUrl(selectedDish.image_url) || "/hotel.webp"}
                  alt={selectedDish.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6 md:p-7 space-y-4">
                <DialogHeader className="space-y-2 text-left">
                  <DialogTitle className="text-2xl font-serif">{selectedDish.name}</DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">
                    {selectedDish.description || "A delicious menu selection waiting for you."}
                  </DialogDescription>
                </DialogHeader>

                <div className="flex items-center justify-between text-sm">
                  <span className="px-2.5 py-1 rounded-md bg-primary/10 text-primary font-bold uppercase tracking-wider text-[10px]">
                    {selectedDish.restaurant_name}
                  </span>
                  <span className="text-lg font-black text-primary">${selectedDish.price}</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button asChild className="sm:flex-1 rounded-xl">
                    <Link href={`/${selectedDish.restaurant_slug}/list`}>
                      Go to Menu
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="sm:flex-1 rounded-xl">
                    <Link href={`/${selectedDish.restaurant_slug}`}>
                      Restaurant Page
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <footer className="py-20 md:py-32 bg-card border-t border-border relative overflow-hidden">
        {/* Decorative Blur */}
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] pointer-events-none translate-x-1/2 translate-y-1/2" />
        
        <div className="container mx-auto px-6 relative z-10">
           <div className="grid gap-8 md:gap-12 md:grid-cols-1 mb-12">
            <div className="space-y-8 md:space-y-12">
              <Link href="/" className="flex items-center group">
                <Logo width={140} height={44} />
              </Link>
              <p className="text-muted-foreground text-lg md:text-xl leading-relaxed italic">
                "Digital menus designed for hospitality — simple, reliable, and elegant."
              </p>
            </div>
           </div>

          <div className="pt-10 md:pt-20 border-t border-border flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
             <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 md:gap-10">
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground italic text-center">© 2026 Agelgil (አገልግል)</span>
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground flex items-center gap-3">
                   <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-secondary animate-pulse" />
                   System Status: Online
                </span>
             </div>
             
             <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-16 text-[9px] md:text-[10px] font-medium tracking-wide text-muted-foreground">
               <div className="flex items-center gap-4">
                 <a href="mailto:hello@agelgil.example" className="flex items-center gap-2 hover:text-primary transition-colors">
                   <Mail className="h-4 w-4" />
                   <span className="text-[11px] md:text-[12px]">hello@agelgil.example</span>
                 </a>
                 <a href="tel:+251900000000" className="flex items-center gap-2 hover:text-primary transition-colors">
                   <Smartphone className="h-4 w-4" />
                   <span className="text-[11px] md:text-[12px]">+251 90 000 0000</span>
                 </a>
               </div>

               <div className="flex items-center gap-4">
                 <a href="https://twitter.com/" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="hover:text-primary transition-colors">
                   <Twitter className="h-5 w-5" />
                 </a>
                 <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-primary transition-colors">
                   <Instagram className="h-5 w-5" />
                 </a>
                 <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:text-primary transition-colors">
                   <Facebook className="h-5 w-5" />
                 </a>
               </div>
             </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
