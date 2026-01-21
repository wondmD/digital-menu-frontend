"use client"

import Link from "next/link"
import Image from "next/image"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { QrCode, Smartphone, Sparkles, Search, Utensils, MapPin, Loader2, ArrowRight, Star, Clock, ShoppingBag, Flame, ChefHat, Zap } from "lucide-react"
import { useEffect, useState, useMemo } from "react"
import { apiFetch } from "@/lib/api-client"

type Restaurant = {
  id: string
  name: string
  slug: string
  description?: string
  image_url?: string
  address?: string
  cuisine_type?: string
  rating?: number
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

export default function LandingPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [dishes, setDishes] = useState<Dish[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        // Fetch restaurants
        const res = await apiFetch<any>("/restaurants")
        const restaurantList = Array.isArray(res) ? res : (res?.data || [])
        
        // Add some mock metadata since API doesn't provide it yet
        const enhancedRestaurants = restaurantList.map((r: any) => ({
          ...r,
          rating: (Math.random() * (5 - 4) + 4).toFixed(1),
          delivery_time: ["15-25", "20-30", "30-45"][Math.floor(Math.random() * 3)] + " min"
        }))
        setRestaurants(enhancedRestaurants)

        // Try to fetch some dishes from the first few restaurants to show as "Featured"
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
    <div className="flex min-h-screen flex-col bg-[#FDFCF8] relative overflow-hidden selection:bg-primary/10">
      <Navbar />
      <main className="flex-1">
        {/* Floating Background Elements */}
        <div className="absolute top-0 left-0 w-full h-[800px] pointer-events-none -z-10 overflow-hidden">
          <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
          <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-secondary/10 blur-[100px]" />
        </div>

        {/* Hero Section */}
        <section className="relative pt-24 pb-20 md:pt-36 md:pb-32">
          <div className="container relative z-10 mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-3 rounded-full bg-white px-5 py-2 text-sm font-bold text-primary mb-10 shadow-xl shadow-primary/5 border border-primary/5 animate-in fade-in slide-in-from-top-4 duration-1000">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
              <span className="tracking-wide uppercase text-[10px]">Premium Dining Experience</span>
            </div>
            
            <h1 className="mx-auto max-w-5xl font-serif text-6xl font-normal leading-[1.05] tracking-tight sm:text-8xl md:text-9xl text-primary mb-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              The Art of <span className="italic relative">
                Digital
                <svg className="absolute -bottom-2 left-0 w-full h-3 text-secondary/30" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0 5 Q 25 0, 50 5 T 100 5" fill="none" stroke="currentColor" strokeWidth="4" />
                </svg>
              </span> Dining
            </h1>
            
            <p className="mx-auto mb-12 max-w-2xl text-lg text-muted-foreground/80 font-medium md:text-xl md:leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
              Discover local gems, curated menus, and seamless ordering. Join thousands of food lovers exploring the future of hospitality.
            </p>
            
            {/* Elegant Search Bar */}
            <div className="mx-auto max-w-3xl relative animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-primary/5 to-secondary/20 rounded-[3rem] blur opacity-25 group-focus-within:opacity-100 transition duration-1000" />
                <div className="relative flex items-center bg-white rounded-[2.5rem] border border-primary/10 shadow-2xl p-2 transition-all group-focus-within:border-primary/30">
                  <div className="pl-6 pr-3 border-r border-primary/5 hidden md:flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <span className="text-sm font-bold text-primary/60 whitespace-nowrap">Nearby</span>
                  </div>
                  <Search className="ml-4 h-6 w-6 text-primary/40 group-focus-within:text-primary transition-colors" />
                  <Input 
                    className="h-16 w-full border-none bg-transparent pl-4 pr-8 text-xl focus-visible:ring-0 shadow-none placeholder:text-primary/20"
                    placeholder="Search dishes, restaurants, or flavors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button className="hidden md:flex h-14 px-8 rounded-full text-lg font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                    Explore
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3 animate-in fade-in duration-1000 delay-500">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-primary/30 mr-2">Top Picks:</span>
              {["Italian", "Sushi", "Gourmet", "Cafes", "Rooftops"].map((tag) => (
                <button 
                  key={tag}
                  onClick={() => setSearchQuery(tag)} 
                  className="px-5 py-2.5 bg-white text-primary text-xs font-bold rounded-full border border-primary/5 hover:border-primary/20 hover:bg-primary/5 hover:shadow-lg transition-all"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Dishes Section */}
        {dishes.length > 0 && !searchQuery && (
          <section className="py-24 bg-[#F8F7F2] relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-[#FDFCF8] to-transparent" />
             <div className="container mx-auto px-6 relative z-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest mb-4">
                      <Flame className="h-3 w-3 fill-amber-600" /> Chef's Recommendations
                    </div>
                    <h2 className="text-5xl font-serif text-primary">Signature Dishes</h2>
                    <p className="text-muted-foreground mt-2 max-w-md">Indulge in our handpicked favorites from top-rated kitchens across the city.</p>
                  </div>
                  <Button variant="ghost" className="text-primary font-bold group">
                    View seasonal picks <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>

                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                  {dishes.map((dish, i) => (
                    <Card key={dish.id} className="group relative border-none bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                      <div className="relative aspect-square overflow-hidden">
                        <Image 
                          src={dish.image_url || "/hotel.webp"} 
                          alt={dish.name} 
                          fill 
                          className="object-cover transition-transform duration-700 group-hover:scale-110" 
                        />
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
                        <div className="absolute top-6 right-6 h-12 w-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ShoppingBag className="h-5 w-5" />
                        </div>
                        <div className="absolute bottom-6 left-6 right-6">
                          <p className="text-white/70 text-[10px] font-black uppercase tracking-widest mb-1">{dish.restaurant_name}</p>
                          <h4 className="text-xl font-serif text-white">{dish.name}</h4>
                        </div>
                      </div>
                      <CardContent className="p-8">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-2xl font-serif text-primary">${dish.price}</span>
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                            <ChefHat className="h-3 w-3" /> Popular
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed h-10 mb-6">
                          {dish.description || "A masterfully crafted dish featuring seasonal ingredients and bold flavors."}
                        </p>
                        <Button className="w-full h-12 rounded-2xl bg-primary/5 text-primary hover:bg-primary hover:text-white border-none shadow-none font-bold transition-all" asChild>
                          <Link href={`/menu/${dish.restaurant_slug}`}>View Detail</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
             </div>
          </section>
        )}

        {/* Featured Restaurants Section */}
        <section className="py-32 bg-white">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest mb-4">
                  <Star className="h-3 w-3 fill-primary" /> Top Rated Places
                </div>
                <h2 className="text-5xl font-serif font-normal text-primary">Discover the <span className="italic">Best Spots</span></h2>
                <p className="text-muted-foreground mt-4 text-lg">Curated lists of extraordinary dining destinations refined for every palate.</p>
              </div>
              <div className="flex items-center gap-4">
                 <div className="hidden sm:block text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/40">Total Found</p>
                    <p className="text-2xl font-serif text-primary">{filteredRestaurants.length} Venues</p>
                 </div>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 gap-6 bg-[#FDFCF8] rounded-[4rem] border border-primary/5">
                <div className="relative">
                  <Loader2 className="h-16 w-16 animate-spin text-primary opacity-20" />
                  <Utensils className="absolute inset-0 m-auto h-6 w-6 text-primary animate-bounce" />
                </div>
                <div className="text-center">
                  <p className="text-xl font-serif text-primary">Crafting the directory...</p>
                  <p className="text-sm text-muted-foreground mt-1">Sourcing fresh data just for you</p>
                </div>
              </div>
            ) : filteredRestaurants.length > 0 ? (
              <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
                {filteredRestaurants.map((restaurant, i) => (
                  <Link key={restaurant.id} href={`/menu/${restaurant.slug}`} className="group">
                    <article className="relative h-full flex flex-col bg-[#FDFCF8] rounded-[3rem] overflow-hidden border border-primary/5 hover:border-primary/20 shadow-sm hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] transition-all duration-700 hover:-translate-y-3">
                      <div className="relative aspect-[16/11] overflow-hidden m-4 rounded-[2rem]">
                        <Image 
                          src={restaurant.image_url || "/hotel.webp"} 
                          alt={restaurant.name} 
                          fill 
                          className="object-cover transition-transform duration-1000 group-hover:scale-110" 
                        />
                        <div className="absolute top-5 right-5 h-10 w-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-lg">
                           <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                        </div>
                        <div className="absolute bottom-5 left-5">
                          <div className="inline-flex items-center gap-2 rounded-full bg-black/40 backdrop-blur-md px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-white border border-white/10">
                            {restaurant.cuisine_type || "Cuisine"}
                          </div>
                        </div>
                      </div>
                      <div className="p-10 pt-4 flex-1 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                           <h3 className="text-3xl font-serif text-primary group-hover:text-primary/70 transition-colors tracking-tight">{restaurant.name}</h3>
                        </div>
                        <p className="text-muted-foreground line-clamp-3 leading-relaxed mb-8 flex-1">
                          {restaurant.description || "Experience the perfect blend of tradition and innovation at one of the city's most beloved dining landmarks."}
                        </p>
                        <div className="grid grid-cols-2 gap-4 border-t border-primary/5 pt-8">
                           <div className="flex items-center gap-2.5">
                              <div className="h-9 w-9 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                                <Clock className="h-4 w-4" />
                              </div>
                              <div className="text-left">
                                <p className="text-[9px] font-black uppercase tracking-widest text-primary/30">Delivery</p>
                                <p className="text-xs font-bold text-primary">{restaurant.delivery_time}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-2.5">
                              <div className="h-9 w-9 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                                <Star className="h-4 w-4 fill-primary/20 text-primary" />
                              </div>
                              <div className="text-left">
                                <p className="text-[9px] font-black uppercase tracking-widest text-primary/30">Reviews</p>
                                <p className="text-xs font-bold text-primary">{restaurant.rating} Rating</p>
                              </div>
                           </div>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-32 text-center bg-[#FDFCF8] rounded-[4rem] border-2 border-dashed border-primary/10">
                <div className="mx-auto w-24 h-24 rounded-full bg-primary/5 flex items-center justify-center mb-8 text-primary/20">
                  <Search className="h-12 w-12" />
                </div>
                <h3 className="text-3xl font-serif text-primary">No results found</h3>
                <p className="text-muted-foreground mt-3 max-w-sm mx-auto">Try refining your search or exploring our top picks to find something delicious.</p>
                <Button variant="link" onClick={() => setSearchQuery("")} className="mt-6 text-primary font-bold">Clear all filters</Button>
              </div>
            )}
          </div>
        </section>

        {/* Home Owner CTA Section */}
        <section className="py-32 bg-primary relative overflow-hidden mx-6 mb-12 rounded-[4rem]">
          <div className="absolute inset-0 bg-white/5 opacity-20 pointer-events-none" />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-[100px]" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-white/5 rounded-full blur-[100px]" />
          
          <div className="container relative z-10 mx-auto px-6 text-center">
            <div className="max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white text-[10px] font-black uppercase tracking-widest mb-10 border border-white/20">
                <ChefHat className="h-3 w-3" /> Restaurant Partnership
              </div>
              <h2 className="text-5xl font-serif text-white md:text-8xl leading-none mb-10 tracking-tight">
                Empower Your <br /><span className="italic opacity-80">Culinary Identity</span>
              </h2>
              <p className="text-white/70 text-lg md:text-xl font-medium mb-16 max-w-2xl mx-auto leading-relaxed">
                Transform your menu into a high-converting digital experience. Join hundreds of establishments setting the new standard for guest engagement.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <Button 
                  size="lg" 
                  className="h-20 px-12 text-xl font-bold rounded-2xl bg-white text-primary border-none hover:bg-[#FDFCF8] hover:scale-105 active:scale-95 transition-all shadow-[0_20px_50px_-10px_rgba(255,255,255,0.3)]"
                  asChild
                >
                  <Link href="/register">Join the Network</Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="h-20 px-12 text-xl font-bold rounded-2xl border-white/20 text-white hover:bg-white/10 bg-transparent"
                  asChild
                >
                  <Link href="/login">Partner Dashboard</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="pt-24 pb-12 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid gap-16 md:grid-cols-2 lg:grid-cols-4 mb-24">
            <div className="space-y-8">
              <Link href="/" className="flex items-center space-x-3 group">
                <div className="rounded-2xl bg-primary p-3 text-white shadow-2xl shadow-primary/20 group-hover:rotate-12 transition-transform">
                  <ChefHat className="h-6 w-6" />
                </div>
                <span className="text-3xl font-serif font-normal tracking-tight text-primary">MenuQR</span>
              </Link>
              <p className="text-muted-foreground font-medium leading-relaxed">
                Elevating the intersection of hospitality and technology. We craft digital experiences that taste as good as they look.
              </p>
            </div>
            
            {[
              { title: "Exploration", links: ["Featured Venues", "Seasonal Picks", "Dishes Near You", "New Openings"] },
              { title: "Support", links: ["Documentation", "Help Center", "Live Chat", "Terms of Service"] },
              { title: "Company", links: ["Our Philosophy", "Careers", "Sustainability", "Press Kit"] }
            ].map((col) => (
              <div key={col.title}>
                <h4 className="mb-8 font-black text-primary uppercase tracking-widest text-[11px]">{col.title}</h4>
                <ul className="space-y-5 text-muted-foreground font-medium">
                  {col.links.map(link => (
                    <li key={link} className="hover:text-primary transition-colors cursor-pointer group flex items-center gap-2">
                       <span className="h-1 w-1 rounded-full bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                       {link}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-12 border-t border-primary/5 flex flex-col md:flex-row items-center justify-between gap-6 text-[11px] font-black uppercase tracking-widest text-primary/30">
            <p>© {new Date().getFullYear()} MenuQR Global. All rights reserved.</p>
            <div className="flex gap-8">
               <span className="cursor-pointer hover:text-primary transition-colors">Privacy Privacy</span>
               <span className="cursor-pointer hover:text-primary transition-colors">Cookies Settings</span>
               <span className="cursor-pointer hover:text-primary transition-colors">Status: Operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
