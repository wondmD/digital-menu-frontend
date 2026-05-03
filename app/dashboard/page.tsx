"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  QrCode, 
  Utensils, 
  ListTree, 
  Plus, 
  Loader2, 
  Sparkles, 
  Building2, 
  ShieldCheck,
  Activity,
  ExternalLink,
  Zap,
  MapPin,
  ChevronRight
} from "lucide-react"
import { apiFetch } from "@/lib/api-client"
import Link from "next/link"
import { motion, Variants } from "framer-motion"
import { cn, getImageUrl } from "@/lib/utils"

type Restaurant = {
  id: string
  name: string
  slug?: string
  description?: string
  city?: string
  country?: string
  is_published?: boolean
  cuisine_type?: string
  logo?: any
  logo_url?: string
  logo_image_url?: string
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const token = (session?.user as any)?.accessToken as string | undefined

  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<any>(null)

  useEffect(() => {
    if (!token) {
      if (status !== "loading") setLoading(false)
      return
    }
    
    const load = async () => {
      try {
        setLoading(true)
        const subscriptionPromise = apiFetch<any>("/subscription/me", { token }).catch(() => null)
        const restRes = await apiFetch<any>("/my-restaurants", { token })

        const list: Restaurant[] = Array.isArray(restRes) ? restRes : (restRes?.data ?? [])
        setRestaurants(list)
        void subscriptionPromise.then((subRes) => {
          setSubscription(subRes?.data || subRes)
        })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token, status])

  if (status === "loading" || loading) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-8 px-6">
        <div className="relative h-24 w-24">
          <div className="absolute inset-0 rounded-[2.5rem] border-4 border-primary/10 animate-[spin_3s_linear_infinite]" />
          <div className="absolute inset-4 rounded-3xl border-4 border-primary animate-[spin_1.5s_linear_infinite]" />
          <div className="absolute inset-0 flex items-center justify-center">
             <Activity className="h-8 w-8 text-primary animate-pulse" />
          </div>
        </div>
        <div className="space-y-4">
          <p className="text-[11px] font-black uppercase tracking-[0.5em] text-muted-foreground animate-pulse">Loading data...</p>
          <p className="text-[10px] font-serif italic text-muted-foreground tracking-widest">Retrieving records...</p>
        </div>
      </div>
    )
  }

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  const item: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 20
      }
    }
  }

  return (
    <div className="max-w-350 mx-auto space-y-8 md:space-y-12 pb-12 md:pb-20 px-4 md:px-6">
      {/* 1. OPERATIONAL CONTROL HEADER */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col xl:flex-row gap-6 md:gap-12 items-start xl:items-end justify-between border-b border-border/50 pb-8 md:pb-10"
      >
        <div className="space-y-4 md:space-y-6 flex-1 w-full text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-4">
            <div className="h-2 w-2 rounded-full bg-secondary animate-pulse shadow-[0_0_15px_#22c55e]" />
             <Badge className="bg-primary/10 text-primary border border-primary/20 font-black text-[9px] md:text-[10px] uppercase tracking-[0.4em] px-3 md:px-4 py-1.5 md:py-2 rounded-full">
               System active
             </Badge>
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-foreground tracking-tighter uppercase leading-[0.9]">
              Dashboard <br />
              <span className="text-muted-foreground italic font-serif lowercase tracking-normal opacity-50">overview</span>
            </h1>
            <p className="text-muted-foreground font-medium max-w-xl text-base md:text-lg italic font-serif leading-relaxed">
              Manage your restaurants and menus from a single dashboard. 
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap gap-4 md:gap-6 w-full xl:w-auto">
          <Button className="h-14 md:h-16 px-6 md:px-8 rounded-2xl md:rounded-3xl bg-primary text-white font-black uppercase text-[10px] md:text-xs tracking-[0.2em] hover:scale-105 transition-all shadow-xl flex-1 md:flex-none" asChild>
            <Link href="/dashboard/profile">
              <Plus className="h-5 w-5 mr-2 md:mr-3" /> New Restaurant
            </Link>
          </Button>
          <Button variant="ghost" className="h-14 md:h-16 px-6 md:px-8 rounded-2xl md:rounded-3xl bg-muted/50 border border-border/50 font-black uppercase text-[10px] md:text-xs tracking-[0.2em] text-foreground hover:bg-foreground hover:text-background transition-all flex-1 md:flex-none" asChild>
            <Link href="/dashboard/qr">
              <QrCode className="h-5 w-5 mr-2 md:mr-3" /> QR Management
            </Link>
          </Button>
        </div>
      </motion.div>

      {/* 2. ANALYTICS GRID */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
      >
        {(() => {
          const activeMenus = restaurants.filter((r) => r.is_published).length
          const draftMenus = Math.max(0, restaurants.length - activeMenus)
          const maxRestaurants = subscription?.features?.max_restaurants
          const restaurantCapacity = typeof maxRestaurants === "number"
            ? (maxRestaurants === -1 ? "Unlimited" : String(maxRestaurants))
            : "Loading..."

          return [
            { label: "Restaurants", val: restaurants.length, icon: Building2, color: "text-blue-500", detail: "Registered" },
            { label: "Published", val: activeMenus, icon: ShieldCheck, color: "text-secondary", detail: "Live menus" },
            { label: "Draft", val: draftMenus, icon: ListTree, color: "text-primary", detail: "Not published" },
            { label: "Capacity", val: restaurantCapacity, icon: Activity, color: "text-amber-500", detail: "Plan limit" },
          ]
        })().map((stat, i) => (
          <motion.div key={i} variants={item}>
            <Card className="bg-card/40 backdrop-blur-3xl border border-border/50 rounded-2xl md:rounded-3xl p-5 md:p-6 overflow-hidden group hover:border-primary/20 transition-all duration-700">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div className={cn("h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl flex items-center justify-center bg-muted", stat.color)}>
                  <stat.icon className="h-5 w-5 md:h-6 md:w-6" />
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</span>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl md:text-3xl font-black text-foreground tracking-tighter">{stat.val}</h3>
                  <span className="text-[10px] md:text-[11px] font-bold text-muted-foreground tracking-tight uppercase opacity-50">{stat.detail}</span>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* 3. MAIN INTERFACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 md:gap-16">
        {/* Restaurants Overview */}
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="lg:col-span-2 space-y-6 md:space-y-8"
        >
          <div className="flex items-center justify-between px-2 md:px-4">
            <h2 className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-muted-foreground/40">Recent restaurants</h2>
            <Link href="/dashboard/profile" className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:underline transition-all underline-offset-4 decoration-2">
              View all <span className="hidden sm:inline">restaurants</span> <ChevronRight className="h-3 w-3 inline ml-0.5" />
            </Link>
          </div>

          <div className="grid gap-4">
            {restaurants.length === 0 ? (
              <motion.div variants={item}>
                <Card className="bg-muted/20 border-2 border-border/50 border-dashed rounded-[3rem] md:rounded-[4rem] p-12 md:p-32 flex flex-col items-center text-center space-y-8 backdrop-blur-sm">
                  <div className="h-20 w-20 md:h-28 md:w-28 rounded-full bg-muted flex items-center justify-center">
                    <Building2 className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground/10" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl md:text-3xl font-serif italic text-foreground tracking-tight">No restaurants found</h3>
                    <p className="text-muted-foreground/30 font-medium max-w-sm mx-auto leading-relaxed uppercase text-[9px] md:text-[10px] tracking-widest">Add your first restaurant to get started.</p>
                  </div>
                  <Button className="rounded-xl md:rounded-2xl px-8 md:px-12 h-14 md:h-16 bg-primary text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em]" asChild>
                    <Link href="/dashboard/profile">Add restaurant</Link>
                  </Button>
                </Card>
              </motion.div>
            ) : (
              restaurants.slice(0, 3).map((res) => (
                <motion.div key={res.id} variants={item}>
                  <Card 
                    className="bg-card/40 backdrop-blur-3xl border border-border/50 border-l-4 border-l-primary rounded-2xl md:rounded-3xl group hover:border-primary/20 transition-all duration-500 overflow-hidden"
                  >
                    <div className="flex flex-col md:flex-row items-center p-4 md:p-6 gap-4 md:gap-8">
                      <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl md:rounded-3xl bg-muted border border-border/50 overflow-hidden relative flex items-center justify-center group-hover:bg-primary/10 transition-colors shrink-0">
                        {res.logo || res.logo_url || res.logo_image_url ? (
                          <Image 
                            src={getImageUrl(res.logo || res.logo_url || res.logo_image_url) || ""}
                            alt={res.name}
                            fill
                            sizes="80px"
                            className="object-cover transition-transform group-hover:scale-110" 
                          />
                        ) : (
                          <Building2 className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground/20 group-hover:text-primary transition-colors" />
                        )}
                      </div>
                      
                      <div className="flex-1 space-y-2 text-center md:text-left w-full">
                        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
                          <h4 className="text-xl md:text-2xl font-black text-foreground tracking-tighter uppercase">{res.name}</h4>
```
                          <Badge variant="outline" className={cn(
                            "text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] border-none px-3 py-1 h-auto flex items-center gap-1.5",
                            res.is_published ? "bg-secondary/10 text-secondary" : "bg-muted text-muted-foreground/40"
                          )}>
                            <div className={cn("h-1 w-1 rounded-full", res.is_published ? "bg-secondary animate-pulse" : "bg-muted-foreground/30")} />
                            {res.is_published ? "Published" : "Draft" }
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-6 text-[9px] md:text-[10px] font-bold text-muted-foreground/40 tracking-widest uppercase">
                          <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3 md:h-3.5 md:w-3.5" /> {res.city || "Global"}</div>
                          <div className="flex items-center gap-1.5"><Utensils className="h-3 w-3 md:h-3.5 md:w-3.5 text-primary" /> {res.cuisine_type || "International"}</div>
                        </div>
                      </div>

                      <div className="flex gap-2.5 w-full md:w-auto justify-center">
                         <Button variant="ghost" size="icon" className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-muted/50 border border-border/50 hover:bg-primary/10 hover:border-primary/20 text-muted-foreground/40 hover:text-primary transition-all flex-1 md:flex-none" asChild>
                            <Link href={`/dashboard/menu?restaurantId=${res.id}`}>
                               <Utensils className="h-4 w-4 md:h-5 md:w-5" />
                            </Link>
                         </Button>
                         <Button variant="ghost" size="icon" className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-muted/50 border border-border/50 hover:bg-muted hover:border-border text-muted-foreground/40 hover:text-foreground transition-all flex-1 md:flex-none" asChild>
                           <Link href={`/${res.slug}`} target="_blank">
                               <ExternalLink className="h-4 w-4 md:h-5 md:w-5" />
                            </Link>
                         </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* Sidebar Intelligence Panel */}
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-6 md:space-y-8"
        >
           <div className="px-2 md:px-4">
            <h2 className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-muted-foreground/40">Analytics summary</h2>
          </div>

          <motion.div variants={item}>
            <Card className="bg-card/60 backdrop-blur-3xl border border-border/50 rounded-3xl p-6 md:p-8 space-y-4 md:space-y-6 overflow-hidden relative group">
                <div className="flex items-center gap-2">
                   <Sparkles className="h-4 w-4 text-primary" />
                   <span className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] text-primary">Restaurant status</span>
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-2xl md:text-3xl font-black text-foreground tracking-tighter uppercase leading-tight">
                    {restaurants.length} Restaurants
                  </h3>
                  <p className="text-muted-foreground font-medium text-[11px] md:text-xs leading-relaxed">
                    {restaurants.filter((r) => r.is_published).length} published and {Math.max(0, restaurants.length - restaurants.filter((r) => r.is_published).length)} draft menus.
                  </p>
                </div>

                 <div className="aspect-4/3 w-full rounded-3xl md:rounded-4xl bg-muted/50 border-2 border-border/50 flex flex-col items-center justify-center relative overflow-hidden group">
                   <div className="absolute inset-0 bg-linear-to-t from-background to-transparent opacity-60" />
                   <h4 className="relative z-10 text-4xl md:text-5xl font-black text-foreground opacity-10 group-hover:opacity-10 transition-opacity uppercase tracking-widest">Data</h4>
                   <div className="absolute bottom-6 md:bottom-8 left-6 md:left-8 right-6 md:right-8 flex items-center justify-between text-[9px] md:text-[11px] font-black uppercase tracking-[0.3em] text-foreground">
                     <span>Published</span>
                     <span className="text-primary">{restaurants.filter((r) => r.is_published).length}</span>
                   </div>
                </div>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="bg-primary/5 border border-primary/20 rounded-3xl p-6 md:p-8 space-y-6 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 md:p-6 text-primary/10 group-hover:text-primary/20 transition-colors">
                  <Zap className="h-10 w-10 md:h-12 md:w-12" />
               </div>
               <div className="space-y-2">
                  <span className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] text-primary">Subscription plan</span>
                  <div className="space-y-1">
                    <h4 className="text-xl md:text-2xl font-black text-foreground tracking-tighter uppercase leading-tight">Manage your plan</h4>
                    <p className="text-[11px] md:text-xs text-muted-foreground font-medium leading-relaxed max-w-55">
                       Up to {subscription?.features?.max_restaurants === -1 ? 'unlimited' : subscription?.features?.max_restaurants} restaurants allowed.
                    </p>
                  </div>
               </div>
               <Button className="w-full rounded-2xl h-12 md:h-14 bg-primary text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform text-white" asChild>
                <Link href="/dashboard/subscription">View details</Link>
               </Button>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
