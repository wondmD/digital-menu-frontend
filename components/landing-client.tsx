"use client"

import Link from "next/link"
import Image from "next/image"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  QrCode, Smartphone, Sparkles, Search, Utensils, MapPin, 
  Loader2, ArrowRight, Star, Clock, ShoppingBag, Flame, 
  ChefHat, Zap, Play, CheckCircle2, Menu as MenuIcon
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
  rating?: number | string
  rating_count?: number
  delivery_time?: string
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
  rating?: number
  rating_count?: number
}

type ReviewEntry = {
  rating: number
  text: string
  created_at: string
}

type ReviewAggregate = {
  rating: number
  count: number
  reviews: ReviewEntry[]
}

const RESTAURANT_REVIEW_STORAGE_KEY = "home-restaurant-reviews-v1"
const DISH_REVIEW_STORAGE_KEY = "home-dish-reviews-v1"

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

function RestaurantCard({
  restaurant,
  index,
  compact = false,
  onReview,
}: {
  restaurant: Restaurant
  index: number
  compact?: boolean
  onReview: (restaurant: Restaurant) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.5 }}
      viewport={{ once: true }}
      className="group"
    >
      <Link href={`/menu/${restaurant.slug}`} className="block h-full">
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
                <Star className="h-4 w-4 fill-primary" />
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
              
              <div className={cn("mt-auto pt-4 border-t border-border/10 flex items-center justify-between font-bold", compact ? "text-[10px]" : "text-[11px]")}>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{restaurant.delivery_time}</span>
                </div>
                <div className="flex items-center gap-2 text-primary">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{restaurant.rating} {restaurant.rating_count ? `(${restaurant.rating_count})` : ""}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  onReview(restaurant)
                }}
                className={cn(
                  "mt-3 w-full rounded-xl border border-primary/30 bg-primary/10 text-primary font-black uppercase tracking-wider transition-colors hover:bg-primary/20",
                  compact ? "h-8 text-[9px]" : "h-9 text-[10px]"
                )}
              >
                Rate & Review
              </button>
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
  onReview,
}: {
  dish: Dish
  index: number
  compact?: boolean
  onSelect: (dish: Dish) => void
  onReview: (dish: Dish) => void
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
              <div className="text-[10px] font-bold text-primary flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-primary" />
                <span>{(dish.rating || 0).toFixed(1)}{dish.rating_count ? ` (${dish.rating_count})` : ""}</span>
              </div>
            </div>
            <div className="mt-2">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onReview(dish)
                }}
                className={cn(
                  "w-full rounded-lg border border-primary/30 bg-primary/10 text-primary font-black uppercase tracking-wider hover:bg-primary/20",
                  compact ? "h-7 text-[8px]" : "h-8 text-[9px]"
                )}
              >
                Rate Dish
              </button>
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
  const [searchMode, setSearchMode] = useState<"restaurants" | "dishes">("restaurants")
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null)
  const [restaurantReviews, setRestaurantReviews] = useState<Record<string, ReviewAggregate>>({})
  const [dishReviews, setDishReviews] = useState<Record<string, ReviewAggregate>>({})
  const [reviewTarget, setReviewTarget] = useState<{ type: "restaurant" | "dish"; id: string; name: string } | null>(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewText, setReviewText] = useState("")
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
      const placeholders = searchMode === "dishes" ? DISH_PLACEHOLDERS : RESTAURANT_PLACEHOLDERS
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [searchMode])

  useEffect(() => {
    setPlaceholderIndex(0)
  }, [searchMode])

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const storedRestaurantReviews = window.localStorage.getItem(RESTAURANT_REVIEW_STORAGE_KEY)
      const storedDishReviews = window.localStorage.getItem(DISH_REVIEW_STORAGE_KEY)
      if (storedRestaurantReviews) setRestaurantReviews(JSON.parse(storedRestaurantReviews))
      if (storedDishReviews) setDishReviews(JSON.parse(storedDishReviews))
    } catch {
      setRestaurantReviews({})
      setDishReviews({})
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem(RESTAURANT_REVIEW_STORAGE_KEY, JSON.stringify(restaurantReviews))
  }, [restaurantReviews])

  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem(DISH_REVIEW_STORAGE_KEY, JSON.stringify(dishReviews))
  }, [dishReviews])

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await apiFetch<any>("/restaurants")
        const restaurantList = Array.isArray(res) ? res : (res?.data || [])
        
        const enhancedRestaurants = restaurantList.map((r: any) => ({
          ...r,
          rating: (Math.random() * (5 - 4) + 4).toFixed(1),
          delivery_time: ["15-25", "20-30", "30-45"][Math.floor(Math.random() * 3)] + " min"
        }))
        setRestaurants(enhancedRestaurants)

        const featuredDishes: Dish[] = []
        for (const rest of enhancedRestaurants.slice(0, 8)) {
          const restaurantIdentifier = rest.slug || rest.id
          if (!restaurantIdentifier) continue

          try {
            const categoriesRes = await apiFetch<any>(`/restaurants/${restaurantIdentifier}/categories`)
            const categories = Array.isArray(categoriesRes) ? categoriesRes : (categoriesRes?.data || [])

            for (const category of categories.slice(0, 4)) {
              try {
                const itemsRes = await apiFetch<any>(`/restaurants/${restaurantIdentifier}/categories/${category.id}/items`)
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
                    rating: Number(item.rating || 0),
                    rating_count: Number(item.rating_count || 0),
                  })
                })
              } catch {
                continue
              }
            }
          } catch (e) {
            console.error(`Failed to fetch dishes for ${rest.name}`, e)
          }
        }

        const deduplicated = featuredDishes.filter(
          (dish, index, array) => array.findIndex((other) => other.id === dish.id && other.restaurant_slug === dish.restaurant_slug) === index
        )
        setDishes(deduplicated)
      } catch (err) {
        console.error("Failed to load initial data", err)
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

  const restaurantsWithReviews = useMemo(() => {
    return restaurants.map((restaurant) => {
      const local = restaurantReviews[restaurant.id]
      if (!local) return restaurant
      return {
        ...restaurant,
        rating: local.rating.toFixed(1),
        rating_count: local.count,
      }
    })
  }, [restaurants, restaurantReviews])

  const dishesWithReviews = useMemo(() => {
    return dishes.map((dish) => {
      const key = `${dish.restaurant_slug}:${dish.id}`
      const local = dishReviews[key]
      if (!local) return dish
      return {
        ...dish,
        rating: local.rating,
        rating_count: local.count,
      }
    })
  }, [dishes, dishReviews])

  const filteredRestaurantsWithReviews = useMemo(() => {
    const restaurantById = new Map(restaurantsWithReviews.map((restaurant) => [restaurant.id, restaurant]))
    return filteredRestaurants.map((restaurant) => restaurantById.get(restaurant.id) || restaurant)
  }, [filteredRestaurants, restaurantsWithReviews])

  const filteredDishesWithReviews = useMemo(() => {
    const dishByCompositeId = new Map(dishesWithReviews.map((dish) => [`${dish.restaurant_slug}:${dish.id}`, dish]))
    return filteredDishes.map((dish) => dishByCompositeId.get(`${dish.restaurant_slug}:${dish.id}`) || dish)
  }, [filteredDishes, dishesWithReviews])

  const submitReview = () => {
    if (!reviewTarget) return
    const content = reviewText.trim()
    if (!content) return

    const newReview: ReviewEntry = {
      rating: reviewRating,
      text: content,
      created_at: new Date().toISOString(),
    }

    if (reviewTarget.type === "restaurant") {
      setRestaurantReviews((previous) => {
        const current = previous[reviewTarget.id] || { rating: 0, count: 0, reviews: [] }
        const nextCount = current.count + 1
        const nextRating = ((current.rating * current.count) + reviewRating) / nextCount
        return {
          ...previous,
          [reviewTarget.id]: {
            rating: Number(nextRating.toFixed(1)),
            count: nextCount,
            reviews: [newReview, ...current.reviews].slice(0, 20),
          },
        }
      })
    } else {
      setDishReviews((previous) => {
        const current = previous[reviewTarget.id] || { rating: 0, count: 0, reviews: [] }
        const nextCount = current.count + 1
        const nextRating = ((current.rating * current.count) + reviewRating) / nextCount
        return {
          ...previous,
          [reviewTarget.id]: {
            rating: Number(nextRating.toFixed(1)),
            count: nextCount,
            reviews: [newReview, ...current.reviews].slice(0, 20),
          },
        }
      })
    }

    setReviewText("")
    setReviewRating(5)
    setReviewTarget(null)
  }

  const activeReviews = useMemo(() => {
    if (!reviewTarget) return [] as ReviewEntry[]
    if (reviewTarget.type === "restaurant") {
      return restaurantReviews[reviewTarget.id]?.reviews || []
    }
    return dishReviews[reviewTarget.id]?.reviews || []
  }, [reviewTarget, restaurantReviews, dishReviews])

  const hasSearch = searchQuery.length > 0

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
                          {(searchMode === "dishes" ? DISH_PLACEHOLDERS : RESTAURANT_PLACEHOLDERS)[placeholderIndex]}
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
                    {searchMode === "dishes" ? "Search Food" : "Search Restaurants"}
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
                        Popular <span className="not-italic font-bold text-primary">Nearby</span>
                      </h3>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSearchMode("restaurants")}
                          className={cn(
                            "h-8 px-3 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest transition-colors",
                            searchMode === "restaurants"
                              ? "bg-primary text-white"
                              : "bg-muted text-muted-foreground hover:text-foreground"
                          )}
                        >
                          Restaurants
                        </button>
                        <button
                          type="button"
                          onClick={() => setSearchMode("dishes")}
                          className={cn(
                            "h-8 px-3 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest transition-colors",
                            searchMode === "dishes"
                              ? "bg-primary text-white"
                              : "bg-muted text-muted-foreground hover:text-foreground"
                          )}
                        >
                          Food
                        </button>
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
                          {searchMode === "restaurants" && filteredRestaurantsWithReviews.length > 0 && (
                            <div className="space-y-6">
                              <h4 className="text-xs font-black uppercase tracking-[0.4em] text-muted-foreground ml-2">Restaurant Matches</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                                {filteredRestaurantsWithReviews.slice(0, 8).map((restaurant, i) => (
                                  <RestaurantCard
                                    key={restaurant.id}
                                    restaurant={restaurant}
                                    index={i}
                                    compact
                                    onReview={(restaurantRecord) => setReviewTarget({ type: "restaurant", id: restaurantRecord.id, name: restaurantRecord.name })}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {searchMode === "dishes" && filteredDishesWithReviews.length > 0 && (
                            <div className="space-y-6">
                              <h4 className="text-xs font-black uppercase tracking-[0.4em] text-muted-foreground ml-2">Dish Matches</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                                {filteredDishesWithReviews.slice(0, 9).map((dish, i) => (
                                  <DishCard
                                    key={`${dish.restaurant_slug}-${dish.id}`}
                                    dish={dish}
                                    index={i}
                                    compact
                                    onSelect={setSelectedDish}
                                    onReview={(dishRecord) => setReviewTarget({ type: "dish", id: `${dishRecord.restaurant_slug}:${dishRecord.id}`, name: dishRecord.name })}
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          {searchMode === "restaurants" && !filteredRestaurants.length && (
                             <div className="py-20 text-center bg-card/20 rounded-[3rem] border-2 border-dashed border-white/5">
                                <p className="text-muted-foreground italic">No restaurants found for "{searchQuery}"</p>
                             </div>
                          )}

                            {searchMode === "dishes" && !filteredDishesWithReviews.length && (
                             <div className="py-20 text-center bg-card/20 rounded-[3rem] border-2 border-dashed border-white/5">
                                <p className="text-muted-foreground italic">No dishes found for "{searchQuery}"</p>
                             </div>
                          )}
                        </div>
                    ) : (
                        <div className="space-y-12">
                          {searchMode === "restaurants" && (
                            <div className="space-y-6">
                              <h4 className="text-xs font-black uppercase tracking-[0.4em] text-muted-foreground ml-2">Popular Restaurants</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                                {filteredRestaurantsWithReviews.slice(0, 6).map((restaurant, i) => (
                                  <RestaurantCard
                                    key={restaurant.id}
                                    restaurant={restaurant}
                                    index={i}
                                    compact
                                    onReview={(restaurantRecord) => setReviewTarget({ type: "restaurant", id: restaurantRecord.id, name: restaurantRecord.name })}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {searchMode === "dishes" && (
                            <div className="space-y-6">
                              <h4 className="text-xs font-black uppercase tracking-[0.4em] text-muted-foreground ml-2">Featured Dishes</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                                {filteredDishesWithReviews.slice(0, 6).map((dish, i) => (
                                  <DishCard
                                    key={`${dish.restaurant_slug}-${dish.id}`}
                                    dish={dish}
                                    index={i}
                                    compact
                                    onSelect={setSelectedDish}
                                    onReview={(dishRecord) => setReviewTarget({ type: "dish", id: `${dishRecord.restaurant_slug}:${dishRecord.id}`, name: dishRecord.name })}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                    )}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* RESTAURANT DIRECTORY - CONTINUATION */}
        <section className="py-20 md:py-40 bg-background relative" id="restaurants">

          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 md:mb-24 gap-8 md:gap-12">
               <div className="max-w-2xl">
                  <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    className="flex items-center gap-3 mb-4 md:mb-6"
                  >
                     <div className="h-[2px] w-8 md:w-12 bg-primary" />
                     <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-primary">Gourmet Directory</p>
                  </motion.div>
                  <h2 className="text-5xl md:text-8xl font-serif tracking-tight leading-[1] md:leading-none italic font-normal text-foreground">Featured <br /><span className="not-italic text-primary font-bold">Restaurants</span></h2>
               </div>
               <div className="flex flex-col items-start md:items-end gap-2 group cursor-default">
                  <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground">Network Status</p>
                  <div className="text-2xl md:text-3xl font-bold flex items-center gap-4 text-foreground">
                     {restaurants.length} Restaurants
                     <div className="flex gap-1.5 h-6 items-end">
                        {[1,2,3,4,5].map(i => (
                          <motion.div 
                            key={i}
                            animate={{ height: [10, 24, 10] }}
                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                            className="w-1 md:w-1.5 rounded-full bg-primary" 
                          />
                        ))}
                     </div>
                  </div>
               </div>
            </div>

            {loading ? (
              <div className="grid gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-4">
                 {[1,2,3,4].map(i => (
                   <div key={i} className="flex flex-col gap-6 h-auto rounded-[2.5rem] bg-slate-900/50 p-6 border border-white/5 overflow-hidden animate-pulse">
                      <div className="aspect-square w-full rounded-[2rem] bg-white/5" />
                      <div className="space-y-3">
                        <div className="h-8 w-2/3 bg-white/5 rounded-lg" />
                        <div className="h-4 w-full bg-white/5 rounded-lg" />
                      </div>
                   </div>
                 ))}
                 <div className="col-span-full pt-10 text-center">
                    <motion.div 
                      animate={{ 
                        rotate: [0, 10, -10, 0],
                        y: [0, -10, 0]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="inline-block"
                    >
                      <ChefHat className="h-12 md:h-16 w-12 md:w-16 text-primary mb-4 md:mb-6 mx-auto" />
                    </motion.div>
                    <h3 className="text-xl md:text-2xl font-serif text-muted-foreground italic">Loading our featured restaurants...</h3>
                 </div>
              </div>
            ) : searchMode === "restaurants" && filteredRestaurantsWithReviews.length > 0 ? (
              <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {filteredRestaurantsWithReviews.map((restaurant, i) => (
                  <RestaurantCard
                    key={restaurant.id}
                    restaurant={restaurant}
                    index={i}
                    onReview={(restaurantRecord) => setReviewTarget({ type: "restaurant", id: restaurantRecord.id, name: restaurantRecord.name })}
                  />
                ))}
              </div>
            ) : searchMode === "dishes" && filteredDishesWithReviews.length > 0 ? (
              <div className="space-y-6">
                <h4 className="text-xs font-black uppercase tracking-[0.4em] text-muted-foreground ml-2">Dish Directory</h4>
                <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {filteredDishesWithReviews.map((dish, i) => (
                    <DishCard
                      key={`${dish.restaurant_slug}-${dish.id}`}
                      dish={dish}
                      index={i}
                      onSelect={setSelectedDish}
                      onReview={(dishRecord) => setReviewTarget({ type: "dish", id: `${dishRecord.restaurant_slug}:${dishRecord.id}`, name: dishRecord.name })}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                className="py-20 md:py-40 text-center bg-slate-900/40 rounded-[3rem] md:rounded-[5rem] border-2 border-dashed border-white/10 px-6"
              >
                 <Utensils className="h-16 w-16 md:h-20 md:w-20 mx-auto text-white/5 mb-8 md:mb-10" />
                 <h3 className="text-3xl md:text-5xl font-serif mb-4 md:mb-6">No restaurants found</h3>
                 <p className="text-muted-foreground text-lg md:text-xl max-w-sm md:max-w-md mx-auto mb-8 md:mb-10 font-medium">
                   {searchMode === "restaurants" 
                     ? "Try broadening your search criteria or clearing all active filters."
                     : "Try searching for different dishes or switch to restaurant mode."
                   }
                 </p>
                 <Button 
                   variant="outline" 
                   className="h-14 md:h-16 px-8 md:px-10 rounded-xl md:rounded-2xl text-base md:text-lg font-bold border-primary text-primary hover:bg-primary hover:text-white"
                   onClick={() => {
                     setSearchQuery("")
                     if (searchMode === "dishes") {
                       setSearchMode("restaurants")
                     }
                   }}
                 >
                   {searchMode === "restaurants" ? "Clear all filters" : "Browse Restaurants"}
                 </Button>
              </motion.div>
            )}
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
                       <Image 
                         src="/hotel.webp" 
                         alt="Architecture" 
                         width={800} 
                         height={1000} 
                         className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000" 
                       />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                          <motion.div 
                            animate={{ scale: [1, 1.1, 1] }} 
                            transition={{ duration: 2, repeat: Infinity }}
                            className="h-16 w-16 md:h-24 md:w-24 rounded-full bg-primary flex items-center justify-center text-white shadow-3xl shadow-primary/50 cursor-pointer"
                          >
                             <Play className="h-6 w-6 md:h-10 md:w-10 fill-white ml-1 md:ml-2" />
                          </motion.div>
                       </div>
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

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-primary font-bold">
                    <Star className="h-4 w-4 fill-primary" />
                    <span>{(selectedDish.rating || 0).toFixed(1)} {selectedDish.rating_count ? `(${selectedDish.rating_count})` : "(0)"}</span>
                  </div>
                  <button
                    type="button"
                    className="text-xs font-black uppercase tracking-widest text-primary hover:underline"
                    onClick={() => setReviewTarget({ type: "dish", id: `${selectedDish.restaurant_slug}:${selectedDish.id}`, name: selectedDish.name })}
                  >
                    Rate this dish
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button asChild className="sm:flex-1 rounded-xl">
                    <Link href={`/menu/${selectedDish.restaurant_slug}/list`}>
                      Go to Menu
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="sm:flex-1 rounded-xl">
                    <Link href={`/menu/${selectedDish.restaurant_slug}`}>
                      Restaurant Page
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!reviewTarget} onOpenChange={(open) => !open && setReviewTarget(null)}>
        <DialogContent className="max-w-lg rounded-3xl border border-border/60 bg-background">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-2xl font-serif">Rate & Review</DialogTitle>
            <DialogDescription>
              Share your experience for {reviewTarget?.name || "this selection"}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setReviewRating(value)}
                  className="transition-transform hover:scale-110"
                  aria-label={`Set rating ${value}`}
                >
                  <Star className={cn("h-7 w-7", value <= reviewRating ? "fill-primary text-primary" : "text-muted-foreground")} />
                </button>
              ))}
              <span className="ml-2 text-sm font-bold text-primary">{reviewRating}/5</span>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Your Review</p>
              <Textarea
                value={reviewText}
                onChange={(event) => setReviewText(event.target.value)}
                placeholder="Tell others what you liked..."
                className="min-h-28 rounded-xl"
              />
            </div>

            {activeReviews.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Recent Reviews</p>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {activeReviews.slice(0, 3).map((entry, index) => (
                    <div key={`${entry.created_at}-${index}`} className="rounded-xl border border-border/60 bg-card/50 p-3">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-black text-primary">{entry.rating}/5</span>
                        <span className="text-muted-foreground">{new Date(entry.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{entry.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setReviewTarget(null)}>
                Cancel
              </Button>
              <Button type="button" className="rounded-xl" onClick={submitReview} disabled={!reviewText.trim()}>
                Submit Review
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <footer className="py-20 md:py-32 bg-card border-t border-border relative overflow-hidden">
        {/* Decorative Blur */}
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] pointer-events-none translate-x-1/2 translate-y-1/2" />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid gap-16 md:gap-24 md:grid-cols-2 lg:grid-cols-4 mb-20 md:mb-40">
            <div className="lg:col-span-1 space-y-8 md:space-y-12">
               <Link href="/" className="flex items-center group">
                  <Logo width={140} height={44} />
               </Link>
               <p className="text-muted-foreground text-lg md:text-xl leading-relaxed italic">
                  "Where the art of hospitality meets the precision of digital engineering. We craft experiences, not just menus."
               </p>
               <div className="flex gap-4 md:gap-6">
                  {[Play, Smartphone, QrCode].map((Icon, i) => (
                    <motion.div 
                      key={i} 
                      whileHover={{ y: -5, backgroundColor: "rgba(230,57,70,0.1)", borderColor: "rgba(230,57,70,0.5)", color: "#E63946" }}
                      className="h-10 w-10 md:h-14 md:w-14 rounded-xl md:rounded-2xl bg-muted border border-border flex items-center justify-center text-muted-foreground transition-all cursor-pointer"
                    >
                       <Icon className="h-5 w-5 md:h-6 md:w-6" />
                    </motion.div>
                  ))}
               </div>
            </div>

            {[
              { title: "Platform", links: ["Digital Menus", "Instant Scan", "Dashboard", "Analytics", "API Access"] },
              { title: "Experience", links: ["Partners", "Gallery", "Success Stories", "Sustainability", "Careers"] },
              { title: "Resources", links: ["Documentation", "Integration Guide", "Legal", "Privacy Policy", "System Status"] }
            ].map(col => (
              <div key={col.title}>
                 <h4 className="text-[10px] md:text-xs font-black uppercase tracking-[0.5em] mb-8 md:mb-12 text-primary">{col.title}</h4>
                 <ul className="space-y-4 md:space-y-8">
                    {col.links.map(link => (
                      <li key={link} className="text-muted-foreground text-base md:text-lg hover:text-foreground transition-all cursor-pointer flex items-center gap-4 group">
                         <span className="h-[2px] w-0 bg-primary group-hover:w-6 md:group-hover:w-8 transition-all duration-500" />
                         <span className="group-hover:translate-x-2 transition-transform">{link}</span>
                      </li>
                    ))}
                 </ul>
              </div>
            ))}
          </div>

          <div className="pt-10 md:pt-20 border-t border-border flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
             <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 md:gap-10">
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground italic text-center">© 2026 Agelgil (አገልግል)</span>
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground flex items-center gap-3">
                   <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-secondary animate-pulse" />
                   System Status: Online
                </span>
             </div>
             
             <div className="flex flex-wrap justify-center gap-6 md:gap-16 text-[9px] md:text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground">
                <span className="hover:text-primary transition-colors cursor-pointer">Sitemap</span>
                <span className="hover:text-primary transition-colors cursor-pointer">Security</span>
                <span className="hover:text-primary transition-colors cursor-pointer">Cookie Policy</span>
             </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
