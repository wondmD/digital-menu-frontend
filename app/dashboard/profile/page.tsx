"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { apiFetch } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Building2, 
  MapPin, 
  Phone, 
  Clock, 
  CheckCircle2, 
  LayoutGrid,
  UtensilsCrossed,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Shield,
  Eye,
  EyeOff,
} from "lucide-react"
import Link from "next/link"

type Restaurant = {
  id: string
  name: string
  slug?: string
  description?: string
  phone?: string
  address?: string
  city?: string
  country?: string
  is_published?: boolean
  created_at?: string
}

type Category = {
  id: string
  name: string
  description?: string
  is_active?: boolean
  items_count?: number
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const token = (session?.user as any)?.accessToken as string | undefined
  const { toast } = useToast()

  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [selectedId, setSelectedId] = useState("")
  const [categories, setCategories] = useState<Category[]>([])
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [dataLoading, setDataLoading] = useState(false)
  const [publishing, setPublishing] = useState<string | null>(null)

  const ready = status === "authenticated" && !!token

  const selected = useMemo(
    () => restaurants.find((r) => r.id === selectedId) || restaurants[0],
    [restaurants, selectedId],
  )

  const togglePublish = async (res: Restaurant) => {
    if (!token) return
    try {
      setPublishing(res.id)
      const newStatus = !res.is_published
      const formData = new FormData()
      formData.append("is_published", newStatus ? "true" : "false")

      await apiFetch(`/my-restaurants/${res.id}`, {
        method: "PATCH",
        token,
        body: formData,
      })
      setRestaurants(prev => prev.map(r => r.id === res.id ? { ...r, is_published: newStatus } : r))
      toast({
        title: newStatus ? "Restaurant Published" : "Restaurant Unpublished",
        description: `${res.name} is now ${newStatus ? 'visible' : 'hidden'} to the public.`,
      })
    } catch (err: any) {
      toast({ title: "Failed to update status", description: err.message, variant: "destructive" })
    } finally {
      setPublishing(null)
    }
  }

  useEffect(() => {
    if (!ready) return
    const load = async () => {
      try {
        setLoading(true)
        
        // Load Restaurants
        const res = await apiFetch<{ data: Restaurant[] }>("/my-restaurants", { token })
        const list = res?.data || []
        setRestaurants(list)
        if (list.length && !selectedId) setSelectedId(list[0].id)

        // Load Subscription for usage limits
        try {
          const subRes = await apiFetch<any>("/subscription/me", { token })
          setSubscription(subRes?.data || subRes)
        } catch (subErr) {
          console.warn("Failed to load subscription info", subErr)
        }

      } catch (err: any) {
        toast({ title: "Could not load profile data", description: err?.message, variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [ready, token, toast, selectedId])

  // Load Categories for the selected restaurant
  useEffect(() => {
    if (!token || !selectedId) return
    const loadDetails = async () => {
      try {
        setDataLoading(true)
        const res = await apiFetch<any>(`/my-restaurants/${selectedId}/categories`, { token })
        setCategories(Array.isArray(res) ? res : (res?.data || []))
      } catch (err: any) {
        console.error("Failed to load restaurant details", err)
      } finally {
        setDataLoading(false)
      }
    }
    loadDetails()
  }, [selectedId, token])

  if (!ready) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Building2 className="h-12 w-12 text-muted-foreground animate-pulse" />
        <p className="text-sm text-muted-foreground">Sign in to manage your profile.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      {/* My Restaurants Header */}
      <div className="flex flex-col md:flex-row gap-8 items-start justify-between">
        <div className="flex gap-6 items-center">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-4xl font-black tracking-tight text-foreground">
                My Restaurants
              </h1>
            </div>
            <p className="text-muted-foreground text-sm font-medium">
              Manage and monitor all your digital menu locations.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button className="rounded-xl shadow-lg shadow-primary/20" asChild>
            <Link href="/dashboard" className="flex items-center gap-2">
              <UtensilsCrossed className="h-4 w-4" />
              Add New
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        <div className="lg:col-span-3 space-y-10">
          {/* Active Workspace / Restaurant Section */}
          <section className="space-y-6">
            <div className="flex items-end justify-between border-b pb-4">
              <div className="space-y-1">
                <h3 className="text-xl font-bold tracking-tight">Restaurant Overview</h3>
                <p className="text-sm text-muted-foreground">Manage your active business locations.</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="h-9 rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  disabled={!restaurants.length}
                >
                  {restaurants.map((res) => (
                    <option key={res.id} value={res.id}>
                      {res.name}
                    </option>
                  ))}
                </select>
                {selected?.slug && (
                  <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
                    <Link href={`/menu/${selected.slug}`} target="_blank">
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>

            {!restaurants.length ? (
              <div className="rounded-3xl border border-dashed p-12 text-center bg-muted/20">
                <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-20" />
                <h4 className="font-bold">No restaurants found</h4>
                <p className="text-sm text-muted-foreground mb-6">Start by creating your first restaurant profile.</p>
                <Button className="rounded-xl" asChild>
                  <Link href="/dashboard">Create Restaurant</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="p-6 rounded-3xl bg-secondary/30 border border-secondary transition-all hover:bg-secondary/50">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Location</p>
                    <p className="text-sm font-bold truncate">{selected?.address || "Address not provided"}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selected?.city && selected?.country ? `${selected.city}, ${selected.country}` : "Global"}
                    </p>
                  </div>
                  <div className="p-6 rounded-3xl bg-secondary/30 border border-secondary transition-all hover:bg-secondary/50 group relative">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Status</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${selected?.is_published ? 'bg-green-500' : 'bg-yellow-500'}`} />
                        <p className="text-sm font-bold uppercase tracking-tight">
                          {selected?.is_published ? "Live & Public" : "Draft Mode"}
                        </p>
                      </div>
                      {selected && (
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={publishing === selected.id}
                          onClick={() => togglePublish(selected)}
                          className={cn(
                            "h-8 w-8 rounded-xl transition-all",
                            selected.is_published 
                              ? "text-green-600 hover:text-green-700 hover:bg-green-50" 
                              : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                          )}
                        >
                          {publishing === selected.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          ) : selected.is_published ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selected?.is_published ? "Visible to customers" : "Visible only to you"}
                    </p>
                  </div>
                  
                  {/* Quick Access Actions Directly in Grid */}
                  <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10 flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3">Tools</p>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="rounded-xl h-10 w-10 p-0" asChild>
                           <Link href="/dashboard/menu"><UtensilsCrossed className="h-4 w-4" /></Link>
                        </Button>
                        <Button variant="ghost" size="sm" className="rounded-xl h-10 w-10 p-0" asChild>
                           <Link href="/dashboard/qr"><CheckCircle2 className="h-4 w-4" /></Link>
                        </Button>
                      </div>
                    </div>
                    <Link href={`/dashboard/menu?restaurantId=${selectedId}`} className="text-[10px] font-bold uppercase text-primary hover:underline">
                      Go to Menu Studio →
                    </Link>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60 px-1">Menu Categories</h4>
                  {dataLoading ? (
                    <div className="h-20 rounded-3xl bg-muted/50 animate-pulse" />
                  ) : categories.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {categories.map((cat) => (
                        <div key={cat.id} className="group flex items-center justify-between p-4 rounded-2xl border bg-card hover:bg-muted/30 transition-all">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                              <LayoutGrid className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                              <p className="text-sm font-bold">{cat.name}</p>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">Category</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center rounded-3xl border border-dashed">
                      <UtensilsCrossed className="h-6 w-6 text-muted-foreground mx-auto mb-2 opacity-30" />
                      <p className="text-xs text-muted-foreground">No menu categories yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Right Sidebar: Usage Statistics */}
        <div className="space-y-6">
          <div className="p-6 rounded-[2rem] border bg-background space-y-6 shadow-sm">
            <div className="space-y-1">
              <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 px-1">Resource Usage</h4>
              <p className="text-[10px] text-muted-foreground px-1 font-medium italic">Based on your {subscription?.plan_name || 'Current'} Plan</p>
            </div>

            <div className="space-y-6">
              {/* Restaurants Usage */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span>Restaurants</span>
                  <span>
                    {restaurants.length} / {subscription?.features?.max_restaurants === -1 ? '∞' : (subscription?.features?.max_restaurants || '—')}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-1000" 
                    style={{ 
                      width: `${subscription?.features?.max_restaurants === -1 ? 0 : 
                        Math.min(100, (restaurants.length / (subscription?.features?.max_restaurants || 1)) * 100)}%` 
                    }} 
                  />
                </div>
              </div>

              {/* Categories Usage */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span>Categories</span>
                  <span>
                    {categories.length} / {subscription?.features?.max_categories === -1 ? '∞' : (subscription?.features?.max_categories || '—')}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-orange-500 transition-all duration-1000" 
                    style={{ 
                      width: `${subscription?.features?.max_categories === -1 ? 0 : 
                        Math.min(100, (categories.length / (subscription?.features?.max_categories || 1)) * 100)}%` 
                    }} 
                  />
                </div>
              </div>

              {/* Workers/Staff */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span>Staff / Workers</span>
                  <span>
                    Limit: {subscription?.features?.max_staff_accounts === -1 ? '∞' : (subscription?.features?.max_staff_accounts || '—')}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-1000" 
                    style={{ 
                      width: `${subscription?.features?.max_staff_accounts === -1 ? 0 : '10%' /* Decorative mock if unknown */}` 
                    }} 
                  />
                </div>
              </div>
            </div>

            <Button variant="outline" className="w-full rounded-2xl h-11 text-xs font-bold border-primary/20 text-primary hover:bg-primary/5 shadow-inner" asChild>
              <Link href="/packages">Upgrade Capacity</Link>
            </Button>
          </div>

          <div className="p-6 rounded-[2rem] bg-orange-500/5 border border-orange-200/50 space-y-3">
             <div className="flex items-center gap-2 text-orange-700">
                <Sparkles className="h-4 w-4" />
                <p className="text-xs font-black uppercase tracking-tight">Pro Tip</p>
             </div>
             <p className="text-[11px] text-orange-800/70 font-medium leading-relaxed">
                Unlimited categories are available in the <span className="font-bold">Gold Tier</span>. Manage multiple branches from a single dashboard.
             </p>
          </div>
        </div>
      </div>
    </div>
  )
}
