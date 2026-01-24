"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  QrCode, 
  Utensils, 
  ListTree, 
  Eye, 
  TrendingUp, 
  Plus, 
  Loader2, 
  Sparkles, 
  Building2, 
  ShieldCheck,
  Activity,
  ExternalLink,
  Flame,
  Zap,
  MapPin,
  ChevronRight
} from "lucide-react"
import { apiFetch } from "@/lib/api-client"
import Link from "next/link"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

type Restaurant = {
  id: string
  name: string
  slug?: string
  description?: string
  city?: string
  country?: string
  is_published?: boolean
  cuisine_type?: string
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const token = (session?.user as any)?.accessToken as string | undefined

  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<any>(null)
  const [telemetry, setTelemetry] = useState({
    totalScans: 0,
    activeMenus: 0,
    topDishes: 0
  })

  useEffect(() => {
    if (!token) {
      if (status !== "loading") setLoading(false)
      return
    }
    
    const load = async () => {
      try {
        setLoading(true)
        const [restRes, subRes] = await Promise.all([
          apiFetch<any>("/my-restaurants", { token }),
          apiFetch<any>("/subscription/me", { token }).catch(() => null)
        ])

        const list: Restaurant[] = Array.isArray(restRes) ? restRes : (restRes?.data ?? [])
        setRestaurants(list)
        setSubscription(subRes?.data || subRes)
        
        setTelemetry({
          totalScans: Math.floor(Math.random() * 1200) + 400,
          activeMenus: list.filter(r => r.is_published).length,
          topDishes: list.length * 12
        })
      } catch (err: any) {
        console.error("Dashboard Load Error:", err)
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
          <div className="absolute inset-4 rounded-[1.5rem] border-4 border-primary animate-[spin_1.5s_linear_infinite]" />
          <div className="absolute inset-0 flex items-center justify-center">
             <Activity className="h-8 w-8 text-primary animate-pulse" />
          </div>
        </div>
        <div className="space-y-4">
          <p className="text-[11px] font-black uppercase tracking-[0.5em] text-muted-foreground animate-pulse">Synchronizing Intelligence</p>
          <p className="text-[10px] font-serif italic text-muted-foreground tracking-widest">Accessing the Grand Registry...</p>
        </div>
      </div>
    )
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  const item = {
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
    <div className="max-w-[1400px] mx-auto space-y-20 pb-32 px-6">
      {/* 1. OPERATIONAL CONTROL HEADER */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col xl:flex-row gap-16 items-start xl:items-end justify-between border-b border-border/50 pb-16"
      >
        <div className="space-y-8 flex-1">
          <div className="flex items-center gap-4">
            <div className="h-2 w-2 rounded-full bg-secondary animate-pulse shadow-[0_0_15px_#22c55e]" />
             <Badge className="bg-primary/10 text-primary border border-primary/20 font-black text-[10px] uppercase tracking-[0.4em] px-6 py-2.5 rounded-full">
               System Active
             </Badge>
          </div>
          <div className="space-y-4">
            <h1 className="text-6xl md:text-8xl lg:text-[110px] font-black text-foreground tracking-tighter uppercase leading-[0.8]">
              Command <br />
              <span className="text-muted-foreground italic font-serif lowercase tracking-normal opacity-50">monitor</span>
            </h1>
            <p className="text-muted-foreground font-medium max-w-2xl text-xl italic font-serif leading-relaxed">
              "Manage your culinary empire from a single interface. Orchestrate deployments and monitor real-time telemetry."
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-6 w-full xl:w-auto">
          <Button className="h-24 px-12 rounded-[2.5rem] bg-primary text-white font-black uppercase text-xs tracking-[0.3em] hover:scale-105 transition-all shadow-[0_30px_60px_-15px_rgba(230,57,70,0.5)] flex-1 md:flex-none" asChild>
            <Link href="/dashboard/profile">
              <Plus className="h-6 w-6 mr-4" /> New Establishment
            </Link>
          </Button>
          <Button variant="ghost" className="h-24 px-12 rounded-[2.5rem] bg-muted/50 border-2 border-border font-black uppercase text-xs tracking-[0.3em] text-foreground hover:bg-foreground hover:text-background transition-all flex-1 md:flex-none" asChild>
            <Link href="/dashboard/qr">
              <QrCode className="h-6 w-6 mr-4" /> Broadcast Hub
            </Link>
          </Button>
        </div>
      </motion.div>

      {/* 2. TELEMETRY GRID */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
      >
        {[
          { label: "Establishments", val: restaurants.length, icon: Building2, color: "text-blue-500", detail: "Active Locations" },
          { label: "Live Deployment", val: telemetry.activeMenus, icon: ShieldCheck, color: "text-secondary", detail: "Public Menus" },
          { label: "Menu Registry", val: telemetry.topDishes, icon: ListTree, color: "text-primary", detail: "Total Offerings" },
          { label: "Global Scans", val: telemetry.totalScans.toLocaleString(), icon: Activity, color: "text-amber-500", detail: "Last 30 Days" },
        ].map((stat, i) => (
          <motion.div key={i} variants={item}>
            <Card className="bg-card/40 backdrop-blur-3xl border-2 border-border rounded-[3rem] p-10 overflow-hidden group hover:border-primary/20 transition-all duration-700">
              <div className="flex items-center justify-between mb-10">
                <div className={cn("h-16 w-16 rounded-[1.5rem] flex items-center justify-center bg-muted", stat.color)}>
                  <stat.icon className="h-8 w-8" />
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-black text-secondary">
                  <TrendingUp className="h-4 w-4" />
                  <span>+12%</span>
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">{stat.label}</span>
                <div className="flex items-baseline gap-3">
                  <h3 className="text-5xl font-black text-foreground tracking-tighter">{stat.val}</h3>
                  <span className="text-[11px] font-bold text-muted-foreground tracking-tight uppercase">{stat.detail}</span>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* 3. MAIN INTERFACE GRID */}
      <div className="grid lg:grid-cols-3 gap-16">
        {/* Establishment Matrix */}
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="lg:col-span-2 space-y-12"
        >
          <div className="flex items-center justify-between px-4">
            <h2 className="text-sm font-black uppercase tracking-[0.5em] text-muted-foreground/30">Active Registries</h2>
            <Link href="/dashboard/profile" className="text-[11px] font-black uppercase tracking-[0.3em] text-primary hover:underline transition-all underline-offset-8 decoration-2">
              Operational Matrix <ChevronRight className="h-3 w-3 inline ml-1" />
            </Link>
          </div>

          <div className="grid gap-6">
            {restaurants.length === 0 ? (
              <motion.div variants={item}>
                <Card className="bg-muted/20 border-2 border-border border-dashed rounded-[4rem] p-32 flex flex-col items-center text-center space-y-8 backdrop-blur-sm">
                  <div className="h-28 w-28 rounded-full bg-muted flex items-center justify-center">
                    <Building2 className="h-12 w-12 text-muted-foreground/10" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-3xl font-serif italic text-foreground tracking-tight">Command Silence</h3>
                    <p className="text-muted-foreground/30 font-medium max-w-sm mx-auto leading-relaxed uppercase text-[10px] tracking-widest">No establishments registered. <br /> Begin your deployment ritual now.</p>
                  </div>
                  <Button className="rounded-2xl px-12 h-16 bg-primary text-[11px] font-black uppercase tracking-[0.3em]" asChild>
                    <Link href="/dashboard/profile">Add Restaurant</Link>
                  </Button>
                </Card>
              </motion.div>
            ) : (
              restaurants.slice(0, 3).map((res) => (
                <motion.div key={res.id} variants={item}>
                  <Card 
                    className="bg-card/40 backdrop-blur-3xl border-2 border-border border-l-4 border-l-primary rounded-[2.5rem] group hover:border-primary/20 transition-all duration-500 overflow-hidden"
                  >
                    <div className="flex flex-col md:flex-row items-center p-10 gap-10">
                      <div className="h-24 w-24 rounded-[2.5rem] bg-muted border border-border overflow-hidden relative flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                        <Building2 className="h-10 w-10 text-muted-foreground/20 group-hover:text-primary transition-colors" />
                      </div>
                      
                      <div className="flex-1 space-y-3 text-center md:text-left">
                        <div className="flex flex-col md:flex-row items-center gap-4">
                          <h4 className="text-3xl font-black text-foreground tracking-tighter uppercase">{res.name}</h4>
```
                          <Badge variant="outline" className={cn(
                            "text-[9px] font-black uppercase tracking-[0.3em] border-none px-4 py-1.5 h-auto flex items-center gap-2",
                            res.is_published ? "bg-secondary/20 text-secondary" : "bg-muted text-muted-foreground/60"
                          )}>
                            <div className={cn("h-1.5 w-1.5 rounded-full", res.is_published ? "bg-secondary animate-pulse" : "bg-muted-foreground/40")} />
                            {res.is_published ? "Live Broadcast" : "Internal Draft" }
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-8 text-[11px] font-bold text-muted-foreground/30 tracking-widest uppercase">
                          <div className="flex items-center gap-2.5"><MapPin className="h-4 w-4" /> {res.city || "Global"}</div>
                          <div className="flex items-center gap-2.5"><Utensils className="h-4 w-4 text-primary" /> {res.cuisine_type || "International"}</div>
                          <div className="flex items-center gap-2.5 text-muted-foreground/50"><Eye className="h-4 w-4" /> 1.2K Views</div>
                        </div>
                      </div>

                      <div className="flex gap-4">
                         <Button variant="ghost" size="icon" className="h-16 w-16 rounded-[1.5rem] bg-muted/50 border border-border/50 hover:bg-primary/20 hover:border-primary/20 text-muted-foreground/40 hover:text-primary transition-all" asChild>
                            <Link href={`/dashboard/menu?restaurantId=${res.id}`}>
                               <Utensils className="h-6 w-6" />
                            </Link>
                         </Button>
                         <Button variant="ghost" size="icon" className="h-16 w-16 rounded-[1.5rem] bg-muted/50 border border-border/50 hover:bg-muted hover:border-border text-muted-foreground/40 hover:text-foreground transition-all" asChild>
                            <Link href={`/menu/${res.slug}`} target="_blank">
                               <ExternalLink className="h-6 w-6" />
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
          className="space-y-12"
        >
           <div className="px-4">
            <h2 className="text-sm font-black uppercase tracking-[0.5em] text-muted-foreground/30">System Intelligence</h2>
          </div>

          <motion.div variants={item}>
            <Card className="bg-card/60 backdrop-blur-3xl border-2 border-border/50 rounded-[3.5rem] p-10 space-y-8 overflow-hidden relative group">
                <div className="flex items-center gap-3">
                   <Sparkles className="h-5 w-5 text-primary" />
                   <span className="text-[11px] font-black uppercase tracking-[0.4em] text-primary">Top Performer</span>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-4xl font-black text-foreground tracking-tighter uppercase leading-none">Golden Truffle <br /> <span className="text-muted-foreground/30 italic font-serif lowercase tracking-normal">Signature</span></h3>
                  <p className="text-muted-foreground font-medium text-sm leading-relaxed">Most engaged asset across all registries this cycle.</p>
                </div>

                <div className="aspect-[4/3] w-full rounded-[2rem] bg-muted/50 border-2 border-border/50 flex flex-col items-center justify-center relative overflow-hidden group">
                   <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-60" />
                   <h4 className="relative z-10 text-5xl font-black text-foreground opacity-10 group-hover:opacity-10 transition-opacity">INSIGHT</h4>
                   <div className="absolute bottom-8 left-8 right-8 flex items-center justify-between text-[11px] font-black uppercase tracking-[0.3em] text-foreground">
                      <div className="flex items-center gap-3">
                         <Flame className="h-5 w-5 text-primary animate-pulse" />
                         <span>Trending Heat</span>
                      </div>
                      <span className="text-primary">+842</span>
                   </div>
                </div>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="bg-primary/5 border-2 border-primary/20 rounded-[3.5rem] p-10 space-y-10 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8">
                  <Zap className="h-20 w-20 text-primary opacity-10 group-hover:opacity-20 transition-opacity" />
               </div>
               <div className="space-y-4">
                  <span className="text-[11px] font-black uppercase tracking-[0.5em] text-primary">Tier Strategy</span>
                  <div className="space-y-2">
                    <h4 className="text-3xl font-black text-foreground tracking-tighter uppercase leading-none">Maximize <br /> Reach.</h4>
                    <p className="text-sm text-muted-foreground font-medium leading-relaxed max-w-[200px]">
                       Your currently deployed {subscription?.features?.max_restaurants === -1 ? 'unlimited' : subscription?.features?.max_restaurants} holding capacity is high.
                    </p>
                  </div>
               </div>
               <Button className="w-full rounded-[2rem] h-20 bg-primary text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl shadow-primary/30 hover:scale-[1.02] transition-transform text-white" asChild>
                  <Link href="/packages">Upgrade Strategy</Link>
               </Button>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
