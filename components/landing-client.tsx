"use client"

import Link from "next/link"
import Image from "next/image"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { 
  QrCode, Smartphone, Sparkles, Search, Utensils, MapPin, 
  Loader2, ArrowRight, Star, Clock, ShoppingBag, Flame, 
  ChefHat, Zap, Play, CheckCircle2, Menu as MenuIcon
} from "lucide-react"
import { useEffect, useState, useMemo, useRef } from "react"
import { apiFetch } from "@/lib/api-client"
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion"
import { cn } from "@/lib/utils"

const MotionLink = motion(Link)

type Restaurant = {
  id: string
  name: string
  slug: string
  description?: string
  image_url?: string
  address?: string
  cuisine_type?: string
  rating?: number | string
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
}

const SEARCH_PLACEHOLDERS = [
  "What are you craving today?",
  "Search premium restaurants...",
  "Discover secret menus...",
  "Find the best sushi nearby...",
  "Explore gourmet steakhouse..."
]

function RestaurantCard({ restaurant, index }: { restaurant: Restaurant; index: number }) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const mouseXSpring = useSpring(x)
  const mouseYSpring = useSpring(y)

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const xPct = (mouseX / width) - 0.5
    const yPct = (mouseY / height) - 0.5
    x.set(xPct)
    y.set(yPct)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      viewport={{ once: true }}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group"
    >
      <Link href={`/menu/${restaurant.slug}`} className="block h-full">
        <article className="relative h-full flex flex-col bg-slate-900/40 rounded-[4rem] p-5 border border-white/5 group-hover:border-primary/40 shadow-2xl transition-all duration-700 overflow-hidden backdrop-blur-sm">
          <div 
            style={{ transform: "translateZ(50px)" }}
            className="relative aspect-[16/11] rounded-[3.5rem] overflow-hidden mb-8"
          >
            <Image 
              src={restaurant.image_url || "/hotel.webp"} 
              alt={restaurant.name} 
              fill 
              className="object-cover transition-transform duration-1000 group-hover:scale-110" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
            <div className="absolute top-8 right-8 h-14 w-14 rounded-full bg-white/95 text-primary flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                <Star className="h-6 w-6 fill-primary" />
            </div>
            <div className="absolute bottom-8 left-8 flex items-center gap-3">
                <div className="px-6 py-2 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 text-[11px] font-black uppercase tracking-widest text-white italic">
                  {restaurant.cuisine_type || "Gourmet"}
                </div>
            </div>
          </div>

          <div style={{ transform: "translateZ(30px)" }} className="px-6 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-4xl font-serif tracking-tighter group-hover:text-primary transition-colors">{restaurant.name}</h3>
              </div>
              <p className="text-muted-foreground text-lg line-clamp-2 leading-relaxed font-medium mb-10 group-hover:text-foreground transition-colors transition-opacity">
                {restaurant.description || "The intersection of tradition and innovation. A curated dining experience for the most demanding aficionados."}
              </p>
              
              <div className="mt-auto pt-10 border-t border-border/10 grid grid-cols-2 gap-8 pb-4">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-muted/50 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                      <Clock className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Wait Time</p>
                      <p className="font-bold">{restaurant.delivery_time}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-muted/50 flex items-center justify-center text-secondary group-hover:bg-secondary/20 transition-colors">
                      <Sparkles className="h-6 w-6 fill-secondary" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Rating</p>
                      <p className="font-bold">{restaurant.rating} / 5.0</p>
                    </div>
                </div>
              </div>
          </div>
        </article>
      </Link>
    </motion.div>
  )
}

export default function LandingClient() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [dishes, setDishes] = useState<Dish[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
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
      setPlaceholderIndex((prev) => (prev + 1) % SEARCH_PLACEHOLDERS.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

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
        for (const rest of enhancedRestaurants.slice(0, 3)) {
          try {
            const categories = await apiFetch<any>(`/restaurants/${rest.slug}/categories`)
            const cats = Array.isArray(categories) ? categories : (categories?.data || [])
            if (cats.length > 0) {
              const itemsRes = await apiFetch<any>(`/restaurants/${rest.slug}/categories/${cats[0].id}/items`)
              const items = Array.isArray(itemsRes) ? itemsRes : (itemsRes?.data || [])
              items.slice(0, 2).forEach((item: any) => {
                featuredDishes.push({
                  ...item,
                  restaurant_name: rest.name,
                  restaurant_slug: rest.slug,
                  category_name: cats[0].name
                })
              })
            }
          } catch (e) {
            console.error(`Failed to fetch dishes for ${rest.name}`, e)
          }
        }
        setDishes(featuredDishes)
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

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary/30 selection:text-white overflow-x-hidden">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section ref={heroRef} className="relative min-h-[100vh] flex items-center justify-center pt-20 overflow-hidden">
          {/* Background Visuals */}
          <div className="absolute inset-0 z-0">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(230,57,70,0.1),transparent_70%)] opacity-50" />
            <motion.div 
               style={{ y: heroY, opacity: heroOpacity }}
               className="absolute top-[10%] right-[5%] w-[500px] h-[500px] rounded-full bg-primary/20 blur-[120px]" 
            />
            <motion.div 
               style={{ y: heroY, opacity: heroOpacity }}
               className="absolute bottom-[5%] left-[5%] w-[450px] h-[450px] rounded-full bg-secondary/15 blur-[100px]" 
            />
          </div>

          <div className="container relative z-10 mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -60 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              viewport={{ once: true }}
            >
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-[0.3em] mb-10 shadow-2xl shadow-primary/40"
              >
                <Zap className="h-4 w-4 fill-white" />
                The Michelin-Star Standard
              </motion.div>
              
              <h1 className="font-serif text-[clamp(3.5rem,8vw,7.5rem)] leading-[0.85] tracking-tighter mb-10">
                Taste the <br />
                <span className="text-primary italic font-normal">Next Level</span> <br />
                of Dining.
              </h1>
              
              <p className="max-w-xl text-xl md:text-2xl text-muted-foreground mb-10 leading-relaxed font-medium">
                Elevate your restaurant with the world's most sophisticated digital menu ecosystem. Designed for speed, beauty, and conversion.
              </p>
              
              {/* HERO SEARCH - HIGHER VISIBILITY */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                viewport={{ once: true }}
                className="max-w-2xl mb-12 relative group z-40"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-3xl blur opacity-20 group-focus-within:opacity-40 transition duration-1000 group-focus-within:duration-200"></div>
                <div className="relative flex items-center bg-card/40 backdrop-blur-xl border border-border rounded-2xl p-2 shadow-2xl focus-within:border-primary/50 transition-all">
                  <Search className="ml-4 h-6 w-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <div className="flex-1 relative h-14 flex items-center">
                    <AnimatePresence mode="wait">
                      {!searchQuery && (
                        <motion.p
                          key={placeholderIndex}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute inset-x-0 pl-4 text-lg font-medium text-muted-foreground pointer-events-none whitespace-nowrap overflow-hidden"
                        >
                          {SEARCH_PLACEHOLDERS[placeholderIndex]}
                        </motion.p>
                      )}
                    </AnimatePresence>
                    <Input 
                      className="h-full w-full border-none bg-transparent pl-4 pr-10 text-lg font-medium focus-visible:ring-0 shadow-none text-foreground selection:bg-primary/40"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button className="rounded-xl bg-primary hover:bg-primary/90 font-bold px-6 shadow-lg shadow-primary/20 text-white">
                    Explore
                  </Button>
                </div>
              </motion.div>

              <div className="flex flex-wrap gap-6">
                <Button 
                  size="lg" 
                  className="h-16 px-10 rounded-2xl text-lg font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/30 transition-all duration-300 border-none text-white" 
                  asChild
                >
                  <MotionLink 
                    href="/register"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    Join the Elite
                  </MotionLink>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="h-16 px-10 rounded-2xl text-lg font-bold bg-muted/50 border-border hover:bg-muted transition-all text-foreground" 
                  asChild
                >
                  <MotionLink 
                    href="/login" 
                    className="flex items-center"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    Live Demo <Play className="ml-2 h-5 w-5 fill-foreground" />
                  </MotionLink>
                </Button>
              </div>

              <motion.div 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-20 flex items-center gap-10"
              >
                <div className="flex -space-x-4">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="h-14 w-14 rounded-full border-[3px] border-background bg-slate-800 flex items-center justify-center overflow-hidden ring-4 ring-primary/5 transition-transform hover:scale-110 hover:z-10 cursor-pointer">
                      <Image src={`https://api.dicebear.com/7.x/avataaars/svg?seed=chef${i}`} alt="chef" width={56} height={56} />
                    </div>
                  ))}
                </div>
                <div>
                   <div className="flex gap-1 mb-1">
                      {[1,2,3,4,5].map(i => <Star key={i} className="h-4 w-4 fill-accent text-accent" />)}
                   </div>
                   <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest italic">Trusted by 200+ Michelin Chefs</p>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              viewport={{ once: true }}
              className="relative hidden lg:block perspective-1000 z-0"
            >
              {/* Floating Menu Card Overlay */}
              <motion.div 
                animate={{ y: [0, -25, 0], rotate: [0, 2, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-12 -left-8 z-30 w-72 p-8 rounded-[2.5rem] bg-card/90 border border-border shadow-2xl backdrop-blur-3xl"
              >
                <div className="flex items-center gap-4 mb-8">
                   <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center text-white shadow-2xl shadow-primary/40">
                      <Flame className="h-7 w-7 fill-white" />
                   </div>
                   <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Signature</p>
                      <p className="text-lg font-bold text-foreground">Wagyu Gold</p>
                   </div>
                </div>
                <div className="space-y-4">
                   <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "85%" }}
                        transition={{ duration: 2, delay: 1 }}
                        className="h-full bg-primary" 
                      />
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="text-xs font-bold text-muted-foreground uppercase">Popularity</span>
                     <span className="text-xs font-black text-primary">85%</span>
                   </div>
                </div>
              </motion.div>

              <motion.div 
                animate={{ y: [0, 30, 0], scale: [1, 1.05, 1] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-6 -right-6 z-30 w-64 p-8 rounded-[2.5rem] bg-secondary border border-secondary/30 shadow-2xl backdrop-blur-2xl text-white"
              >
                <div className="flex items-center justify-between mb-6">
                   <Smartphone className="h-8 w-8" />
                   <div className="h-4 w-4 rounded-full bg-white animate-ping" />
                </div>
                <p className="text-sm font-medium mb-1 uppercase tracking-widest text-white">Active Users</p>
                <p className="text-4xl font-serif font-black text-white">1.2M+</p>
              </motion.div>

              <div className="relative rounded-[5rem] overflow-hidden border-[12px] border-card shadow-2xl aspect-[4/5] bg-card group">
                <Image 
                  src="/hotel.webp" 
                  alt="Premium Menu Mockup" 
                  fill 
                  className="object-cover transition-all duration-1000 group-hover:scale-110 opacity-70"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                <div className="absolute bottom-16 left-16 right-16">
                   <div className="flex gap-4 mb-8">
                       <span className="h-1.5 flex-1 bg-white/20 rounded-full overflow-hidden">
                          <motion.span 
                            animate={{ x: ["-100%", "200%"] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            className="block h-full w-1/3 bg-primary" 
                          />
                       </span>
                       <span className="h-1.5 w-12 bg-white/10 rounded-full" />
                   </div>
                   <h3 className="text-5xl font-serif text-white tracking-tight">The <span className="italic block text-white">Palace Grille</span></h3>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* PREMIUM RESTAURANT SHOWCASE */}
        <section className="py-40 bg-background relative" id="restaurants">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-24 gap-12">
               <div className="max-w-2xl">
                  <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    className="flex items-center gap-3 mb-6"
                  >
                     <div className="h-[2px] w-12 bg-primary" />
                     <p className="text-xs font-black uppercase tracking-[0.4em] text-primary">Curated Directory</p>
                  </motion.div>
                  <h2 className="text-6xl md:text-8xl font-serif tracking-tight leading-none italic font-normal text-foreground">Featured <br /><span className="not-italic text-primary font-bold">Establishments</span></h2>
               </div>
               <div className="flex flex-col items-end gap-2 group cursor-default">
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground">Network Pulse</p>
                  <div className="text-3xl font-bold flex items-center gap-4 text-foreground">
                     {restaurants.length} Registered Nodes
                     <div className="flex gap-1.5 h-6 items-end">
                        {[1,2,3,4,5].map(i => (
                          <motion.div 
                            key={i}
                            animate={{ height: [10, 24, 10] }}
                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                            className="w-1.5 rounded-full bg-primary" 
                          />
                        ))}
                     </div>
                  </div>
               </div>
            </div>

            {loading ? (
              <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
                 {[1,2,3].map(i => (
                   <div key={i} className="flex flex-col gap-8 h-[600px] rounded-[4rem] bg-slate-900/50 p-10 border border-white/5 overflow-hidden">
                      <div className="aspect-[16/11] w-full rounded-[3rem] bg-white/5 animate-pulse" />
                      <div className="space-y-4">
                        <div className="h-10 w-2/3 bg-white/5 rounded-full animate-pulse" />
                        <div className="h-6 w-full bg-white/5 rounded-full animate-pulse" />
                        <div className="h-6 w-1/2 bg-white/5 rounded-full animate-pulse" />
                      </div>
                      <div className="mt-auto flex gap-4 pt-10 border-t border-white/5">
                        <div className="h-12 w-12 rounded-2xl bg-white/5 animate-pulse" />
                        <div className="h-12 w-12 rounded-2xl bg-white/5 animate-pulse" />
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
                      <ChefHat className="h-16 w-16 text-primary mb-6 mx-auto" />
                    </motion.div>
                    <h3 className="text-2xl font-serif text-muted-foreground italic">Cooking your curated selection...</h3>
                 </div>
              </div>
            ) : filteredRestaurants.length > 0 ? (
              <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
                {filteredRestaurants.map((restaurant, i) => (
                  <RestaurantCard key={restaurant.id} restaurant={restaurant} index={i} />
                ))}
              </div>
            ) : (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="py-40 text-center bg-slate-900/40 rounded-[5rem] border-2 border-dashed border-white/10"
              >
                 <Utensils className="h-20 w-20 mx-auto text-white/5 mb-10" />
                 <h3 className="text-5xl font-serif mb-6">No matches for your palate</h3>
                 <p className="text-muted-foreground text-xl max-w-md mx-auto mb-10 font-medium">Try broadening your search criteria or clearing all active filters.</p>
                 <Button 
                   variant="outline" 
                   className="h-16 px-10 rounded-2xl text-lg font-bold border-primary text-primary hover:bg-primary hover:text-white"
                   onClick={() => setSearchQuery("")}
                 >
                   Clear all filters
                 </Button>
              </motion.div>
            )}
          </div>
        </section>

        {/* HOW IT WORKS - ARCHITECTURE */}
        <section className="py-40 bg-card">
           <div className="container mx-auto px-6">
              <div className="grid lg:grid-cols-2 gap-32 items-center">
                 <div>
                    <motion.div 
                      initial={{ opacity: 0, x: -30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-secondary/10 text-secondary text-xs font-black uppercase tracking-widest mb-10"
                    >
                      <Zap className="h-4 w-4 fill-secondary" />
                      Instant Deployment
                    </motion.div>
                    <h2 className="text-6xl md:text-8xl font-serif mb-12 tracking-tight leading-[0.9] text-foreground">Architected for <br /> <span className="italic font-normal">Superior</span> <br /> Conversion.</h2>
                    
                    <div className="space-y-12">
                       {[
                         { step: "01", title: "Identity Forge", desc: "Craft your digital brand presence within minutes. Our smart-theming engine adapts to your physical ambiance." },
                         { step: "02", title: "Dynamic Curation", desc: "Real-time menu management. Update prices, availability, and visuals instantly across all guest devices." },
                         { step: "03", title: "Global Activation", desc: "Go live with high-res QR integration. No hardware needed, just pure high-performance software." }
                       ].map((item, i) => (
                         <motion.div 
                           key={i}
                           initial={{ opacity: 0, x: -20 }}
                           whileInView={{ opacity: 1, x: 0 }}
                           transition={{ delay: i * 0.2 }}
                           className="flex gap-10 group cursor-default"
                         >
                            <span className="text-6xl font-serif italic text-muted-foreground/20 group-hover:text-primary transition-colors duration-500">{item.step}</span>
                            <div>
                               <h4 className="text-2xl font-bold mb-3 text-foreground">{item.title}</h4>
                               <p className="text-muted-foreground leading-relaxed font-medium">{item.desc}</p>
                            </div>
                         </motion.div>
                       ))}
                    </div>
                 </div>

                 <div className="relative">
                    <motion.div 
                       initial={{ opacity: 0, y: 50 }}
                       whileInView={{ opacity: 1, y: 0 }}
                       className="relative z-10 rounded-[4rem] overflow-hidden border border-border shadow-3xl bg-card group"
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
                            className="h-24 w-24 rounded-full bg-primary flex items-center justify-center text-white shadow-3xl shadow-primary/50 cursor-pointer"
                          >
                             <Play className="h-10 w-10 fill-white ml-2" />
                          </motion.div>
                       </div>
                    </motion.div>
                    
                    {/* Decorative Elements */}
                    <div className="absolute -top-20 -right-20 w-80 h-80 bg-primary/20 rounded-full blur-[120px] -z-10" />
                    <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-secondary/10 rounded-full blur-[120px] -z-10" />
                 </div>
              </div>
           </div>
        </section>

        {/* CALL TO ACTION - SIGNATURE SECTION */}
        <section className="py-40 relative px-6 overflow-hidden">
           <motion.div 
             initial={{ opacity: 0, scale: 0.95 }}
             whileInView={{ opacity: 1, scale: 1 }}
             transition={{ duration: 1 }}
             className="max-w-7xl mx-auto rounded-[5rem] bg-gradient-to-br from-primary to-[#800000] p-16 md:p-32 text-center relative overflow-hidden group shadow-[0_100px_200px_-50px_rgba(230,57,70,0.6)]"
           >
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
              <div className="absolute top-0 right-0 p-20 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                 <ChefHat className="h-[500px] w-[500px] text-white" />
              </div>

              <div className="relative z-10 max-w-4xl mx-auto">
                 <motion.div 
                   initial={{ y: 20, opacity: 0 }}
                   whileInView={{ y: 0, opacity: 1 }}
                   className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-white text-xs font-black uppercase tracking-[0.4em] mb-12 shadow-2xl"
                 >
                    <Sparkles className="h-4 w-4 fill-white" />
                    Limited Expansion
                 </motion.div>

                 <h2 className="text-7xl md:text-9xl font-serif text-white mb-14 tracking-tight leading-none">
                    Define Your <br /><span className="italic block mt-4 font-normal text-white">Legacy Today.</span>
                 </h2>

                 <p className="text-white text-xl md:text-3xl mb-20 max-w-3xl mx-auto leading-relaxed font-serif italic">
                    Join the exclusive circle of hospitality leaders redefining the intersection of taste and technology.
                 </p>

                 <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                    <Button 
                      size="lg" 
                      className="h-24 px-16 rounded-[2.5rem] bg-white text-primary text-2xl font-bold transition-all shadow-2xl hover:shadow-white/20 border-none"
                      asChild
                    >
                       <MotionLink 
                         href="/register"
                         whileHover={{ scale: 1.05 }}
                         whileTap={{ scale: 0.95 }}
                         transition={{ type: "spring", stiffness: 400, damping: 10 }}
                       >
                         Apply for Entry
                       </MotionLink>
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline" 
                      className="h-24 px-16 rounded-[2.5rem] bg-black/40 border-white/20 text-white text-2xl font-bold backdrop-blur-md flex items-center gap-4 transition-all"
                      asChild
                    >
                       <MotionLink 
                         href="/login"
                         whileHover={{ scale: 1.05 }}
                         whileTap={{ scale: 0.95 }}
                         transition={{ type: "spring", stiffness: 400, damping: 10 }}
                       >
                         Explore Demo <ArrowRight className="h-8 w-8" />
                       </MotionLink>
                    </Button>
                 </div>
              </div>
           </motion.div>
        </section>
      </main>

      <footer className="py-32 bg-card border-t border-border relative overflow-hidden">
        {/* Decorative Blur */}
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] pointer-events-none translate-x-1/2 translate-y-1/2" />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid gap-24 md:grid-cols-2 lg:grid-cols-4 mb-40">
            <div className="lg:col-span-1 space-y-12">
               <Link href="/" className="flex items-center gap-5 group">
                  <div className="h-20 w-20 rounded-[2rem] bg-primary flex items-center justify-center text-white shadow-2xl shadow-primary/40 group-hover:rotate-12 transition-all duration-500">
                     <ChefHat className="h-10 w-10" />
                  </div>
                  <div>
                    <span className="text-5xl font-serif block tracking-tighter text-foreground">MenuQR</span>
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-primary">Signature Hub</span>
                  </div>
               </Link>
               <p className="text-muted-foreground text-xl leading-relaxed italic">
                  "Where the art of hospitality meets the precision of digital engineering. We craft experiences, not just menus."
               </p>
               <div className="flex gap-6">
                  {[Play, Smartphone, QrCode].map((Icon, i) => (
                    <motion.div 
                      key={i} 
                      whileHover={{ y: -5, backgroundColor: "rgba(230,57,70,0.1)", borderColor: "rgba(230,57,70,0.5)", color: "#E63946" }}
                      className="h-14 w-14 rounded-2xl bg-muted border border-border flex items-center justify-center text-muted-foreground transition-all cursor-pointer"
                    >
                       <Icon className="h-6 w-6" />
                    </motion.div>
                  ))}
               </div>
            </div>

            {[
              { title: "Ecosystem", links: ["Dynamic Menus", "Instant Scan", "Chef Dashboard", "Michelin Insights", "API Access"] },
              { title: "Experience", links: ["Partner Directory", "Gallery", "Brand Stories", "Sustainability", "Careers"] },
              { title: "Resources", links: ["Developer Docs", "Integration Guide", "Legal Hub", "Privacy Contract", "Status"] }
            ].map(col => (
              <div key={col.title}>
                 <h4 className="text-xs font-black uppercase tracking-[0.5em] mb-12 text-primary">{col.title}</h4>
                 <ul className="space-y-8">
                    {col.links.map(link => (
                      <li key={link} className="text-muted-foreground text-lg hover:text-foreground transition-all cursor-pointer flex items-center gap-4 group">
                         <span className="h-[2px] w-0 bg-primary group-hover:w-8 transition-all duration-500" />
                         <span className="group-hover:translate-x-2 transition-transform">{link}</span>
                      </li>
                    ))}
                 </ul>
              </div>
            ))}
          </div>

          <div className="pt-20 border-t border-border flex flex-col md:flex-row items-center justify-between gap-12">
             <div className="flex flex-wrap items-center justify-center md:justify-start gap-10">
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground italic">© 2026 MenuQR Global Architecture</span>
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground flex items-center gap-3">
                   <div className="h-2 w-2 rounded-full bg-secondary animate-pulse" />
                   Ecosystem Hub: Operational
                </span>
             </div>
             
             <div className="flex gap-16 text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground">
                <span className="hover:text-primary transition-colors cursor-pointer">Sitemap</span>
                <span className="hover:text-primary transition-colors cursor-pointer">Security Ledger</span>
                <span className="hover:text-primary transition-colors cursor-pointer">Cookies Charter</span>
             </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
