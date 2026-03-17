"use client"

import Image from "next/image"
import { Suspense, useEffect, useMemo, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Utensils, 
  CheckCircle2, 
  XCircle, 
  Info, 
  TrendingUp, 
  DollarSign,
  LayoutGrid,
  ChevronRight,
  ChevronDown,
  Settings2,
  Clock,
  Flame,
  Leaf,
  Camera,
  UploadCloud,
  Eye,
  EyeOff,
  Activity,
  Layers,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { apiFetch, apiFetchWithProgress } from "@/lib/api-client"
import { cn, getImageUrl, getImageUrls } from "@/lib/utils"
import Link from "next/link"
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel"

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { motion, AnimatePresence } from "framer-motion"
import { LoadingSignal } from "@/components/ui/loading-signal"
import { Progress } from "@/components/ui/progress"

type Restaurant = { id: string; name: string; slug?: string; status?: string; is_published?: boolean }
type Category = { id: string; name: string; description?: string }
type MenuItem = {
  id: string
  name: string
  description?: string
  price: number
  currency?: string
  image?: any
  images?: any[]
  image_url?: string
  image_urls?: string[]
  is_available: boolean
  available?: boolean
  category_id: string
}

function extractList(payload: any): any[] {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.data?.items)) return payload.data.items
  if (Array.isArray(payload?.data?.data)) return payload.data.data
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.results)) return payload.results
  return []
}

function normalizeItem(raw: any): MenuItem {
  return {
    ...raw,
    id: String(raw?.id || raw?.ID || raw?.uuid || `temp-${Math.random()}`),
    name: String(raw?.name || "Untitled Asset"),
    description: raw?.description || "",
    price: Number(raw?.price || 0),
    currency: String(raw?.currency || "USD"),
    image: raw?.image,
    images: raw?.images,
    image_url: raw?.image_url,
    image_urls: raw?.image_urls,
    category_id: String(raw?.category_id || ""),
    is_available: Boolean(raw?.available ?? raw?.is_available ?? true),
    available: Boolean(raw?.available ?? raw?.is_available ?? true),
  }
}

function MenuManagementContent() {
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const initialRestaurantId = searchParams.get("restaurantId")
  const initialCategoryId = searchParams.get("category")
  
  const token = (session?.user as any)?.accessToken as string | undefined
  const ready = status === "authenticated" && !!token
  const { toast } = useToast()

  // State
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [restaurantId, setRestaurantId] = useState<string>("")
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryId, setCategoryId] = useState<string>("")
  const [items, setItems] = useState<MenuItem[]>([])
  
  const [loading, setLoading] = useState(true)
  const [itemsLoading, setItemsLoading] = useState(false)
  const [publishing, setPublishing] = useState(false)
  
  const [searchQuery, setSearchQuery] = useState("")
  const [availabilityFilter, setAvailabilityFilter] = useState<"all" | "available" | "unavailable">("all")

  // Side Panel States
  const [itemPanelOpen, setItemPanelOpen] = useState(false)
  const [catPanelOpen, setCatPanelOpen] = useState(false)

  const selectedRestaurant = useMemo(() => 
    restaurants.find(r => r.id === restaurantId), 
    [restaurants, restaurantId]
  )

  const togglePublish = async () => {
    if (!token || !selectedRestaurant) return
    try {
      setPublishing(true)
      const newStatus = !selectedRestaurant.is_published
      await apiFetch(`/my-restaurants/${selectedRestaurant.id}`, {
        method: "PATCH",
        token,
        body: { is_published: newStatus },
      })
      setRestaurants(prev => prev.map(r => r.id === selectedRestaurant.id ? { ...r, is_published: newStatus } : r))
      toast({ title: newStatus ? "Menu published" : "Menu unpublished" })
    } catch (err: any) {
      toast({ title: "Failed to update status", description: err.message, variant: "destructive" })
    } finally {
      setPublishing(false)
    }
  }
  
  // Interaction States
  const [addCatOpen, setAddCatOpen] = useState(false)
  const [editCatOpen, setEditCatOpen] = useState(false)
  const [deleteCatOpen, setDeleteCatOpen] = useState(false)
  const [deleteItemOpen, setDeleteItemOpen] = useState(false)
  
  const [savingCat, setSavingCat] = useState(false)
  const [savingItem, setSavingItem] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  const [activeCategory, setActiveCategory] = useState<Category | null>(null)
  const [catDraft, setCatDraft] = useState({ name: "", description: "" })
  
  const [activeItem, setActiveItem] = useState<MenuItem | null>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [itemDraft, setItemDraft] = useState({
    name: "", description: "", price: "", currency: "USD",
    is_available: true, images: [] as (File | string)[]
  })

  // Computed Stats
  const stats = useMemo(() => {
    const total = items.length
    const available = items.filter(i => (i.available ?? i.is_available)).length
    const unavailable = total - available
    const avgPrice = total > 0 ? items.reduce((acc, i) => acc + (Number(i.price) || 0), 0) / total : 0
    return { total, available, unavailable, avgPrice }
  }, [items])

  const filteredItems = useMemo(() => {
    if (!searchQuery && availabilityFilter === "all") return items
    
    return items.filter(item => {
      const name = String(item.name || "").toLowerCase()
      const desc = String(item.description || "").toLowerCase()
      const query = searchQuery.toLowerCase()
      
      const matchesSearch = !query || name.includes(query) || desc.includes(query)
      
      const isAvailable = Boolean(item.available ?? item.is_available ?? true)
      const matchesFilter = availabilityFilter === "all" || 
                           (availabilityFilter === "available" && isAvailable) ||
                           (availabilityFilter === "unavailable" && !isAvailable)
      
      return matchesSearch && matchesFilter
    })
  }, [items, searchQuery, availabilityFilter])

  const refreshItems = async (targetRestaurantId: string, targetCategoryId: string) => {
    if (!token || !targetRestaurantId || !targetCategoryId) {
      setItems([])
      return
    }
    const res = await apiFetch<any>(`/my-restaurants/${targetRestaurantId}/categories/${targetCategoryId}/items`, { token })
    const itemsList = extractList(res)
    setItems(itemsList.map(normalizeItem))
  }

  // Initial Load: Restaurants
  useEffect(() => {
    if (!ready) return
    const load = async () => {
      try {
        setLoading(true)
        const res = await apiFetch<any>("/my-restaurants", { token })
        
        // Extract list as robustly as possible
        let list: Restaurant[] = []
        if (Array.isArray(res)) {
          list = res
        } else if (res && typeof res === 'object') {
          const raw = res.data || res.items || res
          list = Array.isArray(raw) ? raw : (raw.items || [])
        }
        
        setRestaurants(list)
        
        if (list.length) {
          // Try to find by UUID first, then by slug
          const found = initialRestaurantId && list.find((r: any) => 
            r.id === initialRestaurantId || r.slug === initialRestaurantId
          )
          
          if (found) {
            setRestaurantId(found.id)
          } else if (!restaurantId) {
            setRestaurantId(list[0].id)
          }

          // Subscription check
          try {
            const subRes = await apiFetch<any>("/subscription/me", { token })
            setSubscription(subRes?.data || subRes)
          } catch {}
        }
      } catch (err: any) {
        toast({ title: "Failed to load restaurants", description: err?.message, variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [ready, token, initialRestaurantId])

  // Load Categories when restaurant changes
  useEffect(() => {
    if (!ready || !restaurantId) return
    const loadCategories = async () => {
      try {
        const res = await apiFetch<any>(`/my-restaurants/${restaurantId}/categories`, { token })
        
        const list = extractList(res) as Category[]

        setCategories(list)
        
        if (initialCategoryId && list.find((c: any) => c.id === initialCategoryId)) {
          setCategoryId(initialCategoryId as string)
        } else if (list.length > 0) {
          // If current categoryId is not in the new list, reset to the first one
          if (!categoryId || !list.find((c: any) => c.id === categoryId)) {
            setCategoryId(list[0].id)
          }
        } else {
          setCategoryId("")
        }
      } catch (err: any) {
        toast({ title: "Failed to load categories", description: err?.message, variant: "destructive" })
      }
    }
    loadCategories()
  }, [ready, restaurantId, token, initialCategoryId])

  // Load Items when category changes
  useEffect(() => {
    let active = true
    if (!ready || !restaurantId || !categoryId || categoryId === "") {
      setItems([])
      return
    }

    const loadItems = async () => {
      try {
        setItemsLoading(true)
        const res = await apiFetch<any>(`/my-restaurants/${restaurantId}/categories/${categoryId}/items`, { token })
        if (!active) return
        const itemsList = extractList(res)
        setItems(itemsList.map(normalizeItem))
      } catch (err: any) {
        if (active) setItems([])
        console.error("Error loading items:", err)
      } finally {
        if (active) setItemsLoading(false)
      }
    }
    loadItems()
    return () => { active = false }
  }, [ready, restaurantId, categoryId, token])

  // Category Handlers
  const handleSaveCategory = async () => {
    if (!token || !catDraft.name.trim() || !restaurantId) return
    try {
      setSavingCat(true)
      const method = activeCategory ? "PATCH" : "POST"
      const url = activeCategory 
        ? `/my-restaurants/${restaurantId}/categories/${activeCategory.id}`
        : `/my-restaurants/${restaurantId}/categories`
      
      await apiFetch(url, {
        method,
        token,
        body: { 
          name: catDraft.name, 
          description: catDraft.description, 
          is_active: true
        }
      })

      toast({ title: activeCategory ? "Category updated" : "Category created" })
      setAddCatOpen(false)
      setEditCatOpen(false)
      
      const res = await apiFetch<any>(`/my-restaurants/${restaurantId}/categories`, { token })
      setCategories(Array.isArray(res) ? res : (res?.data || []))
    } catch (err: any) {
      toast({ title: "Error", description: err?.message, variant: "destructive" })
    } finally {
      setSavingCat(false)
    }
  }

  const handleDeleteCategory = async () => {
    if (!token || !activeCategory || !restaurantId) return
    try {
      setSavingCat(true)
      await apiFetch(`/my-restaurants/${restaurantId}/categories/${activeCategory.id}`, { method: "DELETE", token })
      toast({ title: "Category deleted" })
      setDeleteCatOpen(false)
      const res = await apiFetch<any>(`/my-restaurants/${restaurantId}/categories`, { token })
      const list = Array.isArray(res) ? res : (res?.data || [])
      setCategories(list)
      if (categoryId === activeCategory.id) setCategoryId(list[0]?.id || "")
    } catch (err: any) {
      toast({ title: "Error", description: err?.message, variant: "destructive" })
    } finally {
      setSavingCat(false)
    }
  }

  // Item Handlers
  const handleSaveItem = async () => {
    if (!token || !itemDraft.name.trim() || !restaurantId || !categoryId) return
    try {
      setSavingItem(true)
      const method = activeItem ? "PATCH" : "POST"
      const url = activeItem
        ? `/my-restaurants/${restaurantId}/categories/${categoryId}/items/${activeItem.id}`
        : `/my-restaurants/${restaurantId}/categories/${categoryId}/items`
      
      // Use FormData to support image uploads
      const formData = new FormData()
      formData.append("name", itemDraft.name.trim())
      formData.append("description", itemDraft.description.trim())
      formData.append("price", itemDraft.price.toString())
      formData.append("currency", itemDraft.currency)
      
      formData.append("is_available", String(itemDraft.is_available))
      formData.append("is_published", "true")
      
      itemDraft.images.forEach((img) => {
        if (img instanceof File) {
          formData.append("image", img)
        }
      })

      setUploadProgress(0)
      await apiFetchWithProgress(url, { 
        method, 
        token, 
        body: formData,
        onProgress: (pct) => setUploadProgress(pct)
      })
      toast({ title: activeItem ? "Item updated" : "Item created" })
      setUploadProgress(0)
      setItemPanelOpen(false)
      setActiveItem(null)
      await refreshItems(restaurantId, categoryId)
    } catch (err: any) {
      toast({ title: "Error", description: err?.message, variant: "destructive" })
    } finally {
      setSavingItem(false)
    }
  }

  const handleDeleteItem = async () => {
    if (!token || !activeItem || !restaurantId || !categoryId) return
    try {
      setSavingItem(true)
      await apiFetch(`/my-restaurants/${restaurantId}/categories/${categoryId}/items/${activeItem.id}`, {
        method: "DELETE",
        token,
      })
      toast({ title: "Item deleted" })
      setDeleteItemOpen(false)
      await refreshItems(restaurantId, categoryId)
    } catch (err: any) {
      toast({ title: "Error", description: err?.message, variant: "destructive" })
    } finally {
      setSavingItem(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <LoadingSignal message="Preparing your menu..." />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6 pb-20 px-4 md:px-0">
       {/* Menu management */}
       <div className="bg-card/40 backdrop-blur-3xl border border-border/60 rounded-3xl p-4 md:p-6 flex flex-col lg:flex-row items-center justify-between gap-6 md:gap-8 shadow-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px] -mr-48 -mt-48 transition-all group-hover:bg-primary/10" />
          
          <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6 z-10 text-center sm:text-left w-full sm:w-auto">
            <div className="h-14 w-14 md:h-16 md:w-16 rounded-2xl bg-muted border border-border/60 flex items-center justify-center shadow-inner relative group/icon">
              <Utensils className="h-6 w-6 md:h-8 md:w-8 text-primary group-hover/icon:scale-110 transition-transform" />
              <div className="absolute inset-0 bg-primary/20 blur-2xl opacity-0 group-hover/icon:opacity-100 transition-opacity" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-3">
                 <div className="h-1 w-6 md:w-8 bg-primary rounded-full" />
                 <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-primary">Menu limits</p>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-foreground uppercase">Menu <span className="italic font-serif text-primary">items.</span></h2>
              <p className="text-muted-foreground text-[10px] md:text-xs font-bold uppercase tracking-widest">{subscription?.plan_name || 'Standard'} Allocation</p>
            </div>
          </div>

          <div className="flex-1 max-w-lg w-full z-10 space-y-3">
             <div className="flex justify-between items-end mb-1 md:mb-2">
                <div className="space-y-1">
                   <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Total items</p>
                   <p className="text-base md:text-lg font-black text-foreground">
                     {stats.total} <span className="text-muted-foreground font-medium">/</span> {subscription?.features?.max_menu_items === -1 ? '∞' : (subscription?.features?.max_menu_items || '—')} <span className="text-[10px] md:text-xs font-medium text-muted-foreground lowercase ml-2">items</span>
                   </p>
                </div>
                {subscription?.features?.max_menu_items !== -1 && (
                   <span className="text-[9px] md:text-[10px] font-black text-primary p-2 bg-primary/10 rounded-lg">{(stats.total / (subscription?.features?.max_menu_items || 1) * 100).toFixed(0)}% USED</span>
                )}
             </div>
             <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${subscription?.features?.max_menu_items === -1 ? 0 : Math.min(100, (stats.total / (subscription?.features?.max_menu_items || 1)) * 100)}%` }}
                  transition={{ duration: 2, ease: "easeOut" }}
                  className="h-full bg-primary shadow-[0_0_15px_rgba(230,57,70,0.5)]" 
                />
             </div>
          </div>

          <Button variant="outline" className="w-full md:w-auto h-11 md:h-12 px-6 md:px-8 rounded-xl border-border/60 bg-muted/30 text-foreground font-black uppercase text-[9px] md:text-[10px] tracking-[0.3em] z-10 hover:bg-primary hover:text-white transition-all shadow-xl" asChild>
            <Link href="/packages">Upgrade plan</Link>
          </Button>
       </div>

      <div className="flex flex-col gap-6 md:gap-8 md:flex-row md:items-end md:justify-between px-2">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <Activity className="h-4 w-4 text-primary animate-pulse" />
             <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Management</span>
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tighter text-foreground uppercase leading-none">
            Menu <br className="sm:hidden" /> <span className="italic font-serif text-primary">management.</span>
          </h1>
          <p className="text-muted-foreground font-medium text-base md:text-lg max-w-lg">Manage your items and categories from a single interface.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4 w-full md:w-auto">
           {restaurants.length > 0 && (
             <div className="flex items-center gap-3 bg-card/60 p-1.5 rounded-2xl border border-border/50 shadow-2xl w-full sm:w-auto">
               <div className="flex flex-col gap-0.5 px-3 md:px-4 flex-1 sm:flex-none">
                  <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-primary/60">Currently customizing</span>
                  <div className="relative flex items-center group/select">
                    <select
                      className="bg-transparent text-[10px] md:text-xs font-black text-foreground focus:outline-none appearance-none cursor-pointer pr-10 z-10 w-full"
                      value={restaurantId}
                      onChange={(e) => {
                        setRestaurantId(e.target.value)
                        setCategoryId("")
                      }}
                    >
                      {restaurants.map(r => <option key={r.id} value={r.id} className="bg-card">{r.name.toUpperCase()}</option>)}
                    </select>
                    <ChevronDown className="absolute right-0 h-4 w-4 text-primary pointer-events-none transition-transform group-hover/select:translate-y-0.5" />
                  </div>
               </div>
               <div className="h-8 md:h-10 w-px bg-border/10 mx-1 md:mx-2" />
               <Button variant="ghost" size="icon" disabled={publishing} onClick={togglePublish} className={cn("h-11 w-11 md:h-12 md:w-12 rounded-xl transition-all", selectedRestaurant?.is_published ? "bg-primary/10 text-primary hover:bg-primary hover:text-white" : "bg-muted text-muted-foreground hover:text-foreground")}>
                 {publishing ? <LoadingSignal size="sm" className="h-4 w-4" /> : selectedRestaurant?.is_published ? <Eye className="h-5 w-5 md:h-6 md:w-6" /> : <EyeOff className="h-5 w-5 md:h-6 md:w-6" />}
               </Button>
             </div>
           )}
           <Button className="w-full sm:w-auto h-12 md:h-14 rounded-2xl px-6 md:px-8 gap-3 shadow-[0_20px_40px_-12px_rgba(230,57,70,0.3)] bg-primary hover:bg-primary/90 text-white font-black uppercase text-[10px] md:text-xs tracking-[0.2em] transition-all hover:scale-105 active:scale-95" disabled={!categoryId} onClick={() => { setActiveItem(null); setItemDraft({ name: "", description: "", price: "", currency: "USD", is_available: true, images: [] }); setItemPanelOpen(true); }}>
            <Plus className="h-5 w-5" /> Add item
          </Button>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total items", val: stats.total, icon: Utensils, color: "text-blue-400", bg: "bg-blue-400/10" },
          { label: "Available", val: stats.available, icon: CheckCircle2, color: "text-green-400", bg: "bg-green-400/10" },
          { label: "Unavailable", val: stats.unavailable, icon: XCircle, color: "text-red-400", bg: "bg-red-400/10" },
          { label: "Avg. Price", val: `${stats.avgPrice.toFixed(0)}`, icon: DollarSign, color: "text-orange-400", bg: "bg-orange-400/10" },
        ].map((s, i) => (
          <div key={i} className="group relative p-4 md:p-5 rounded-2xl bg-card/40 backdrop-blur-3xl border border-border/60 shadow-xl transition-all duration-500 hover:border-primary/20">
            <div className="flex flex-row items-center justify-between mb-3">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">{s.label}</span>
              <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center border border-border/60", s.bg)}>
                <s.icon className={cn("h-4 w-4", s.color)} />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <div className="text-xl md:text-2xl font-black tracking-tight text-foreground">{s.val}</div>
              {s.label === "Avg. Price" && <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">ETB</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
        <aside className="lg:col-span-3 space-y-4 md:space-y-6">
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
               <Layers className="h-4 w-4 text-muted-foreground/40" />
               <h2 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40">Categories</h2>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-all border border-border/60" onClick={() => { setActiveCategory(null); setCatDraft({ name: "", description: "" }); setAddCatOpen(true); }}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-row lg:flex-col gap-2.5 px-2 overflow-x-auto pb-4 lg:pb-0 scrollbar-hide">
            {categories.length > 0 ? categories.map((cat) => (
              <div key={cat.id} className={cn("group flex items-center justify-between p-3.5 md:p-4 rounded-xl transition-all cursor-pointer border shadow-lg hover:translate-x-1 shrink-0 min-w-[140px] lg:min-w-0", categoryId === cat.id ? "bg-primary text-white border-primary shadow-[0_15px_30px_-10px_rgba(230,57,70,0.4)]" : "bg-card/40 backdrop-blur-md border-border/60 hover:border-primary/20")} onClick={() => setCategoryId(cat.id)}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center shrink-0", categoryId === cat.id ? "bg-white/20" : "bg-muted")}>
                    <LayoutGrid className={cn("h-3 w-3", categoryId === cat.id ? "text-white" : "text-muted-foreground/40")} />
                  </div>
                  <span className="font-black text-[10px] md:text-[11px] tracking-widest uppercase truncate">{cat.name}</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className={cn("h-6 w-6 rounded-md", categoryId === cat.id ? "hover:bg-white/20 text-white" : "hover:bg-muted text-muted-foreground")} onClick={(e) => { e.stopPropagation(); setActiveCategory(cat); setCatDraft({ name: cat.name, description: cat.description || "" }); setEditCatOpen(true); }}>
                    <Edit2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )) : (
              <div className="p-6 rounded-2xl border-2 border-dashed border-border/60 bg-muted/20 text-center space-y-3 w-full">
                 <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">No categories</p>
                 <Button variant="ghost" className="text-primary text-[9px] font-black uppercase tracking-widest h-auto p-0" onClick={() => setAddCatOpen(true)}>Add first</Button>
              </div>
            )}
          </div>
        </aside>

        <section className="lg:col-span-9 space-y-6 md:space-y-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center bg-card/60 backdrop-blur-3xl p-2 rounded-2xl border border-border/60 shadow-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/40" />
              <Input placeholder="Search menu items..." className="pl-12 border-none bg-transparent h-11 focus-visible:ring-0 text-sm font-bold placeholder:text-muted-foreground/20 text-foreground" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <div className="flex items-center gap-3 pr-2">
              <select className="h-9 w-full md:w-auto rounded-xl border border-border/50 bg-muted/40 px-4 text-[9px] font-black uppercase tracking-[0.2em] focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all appearance-none cursor-pointer pr-10 hover:bg-muted/60 text-foreground" style={{ backgroundImage: `url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e\")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.8rem center', backgroundSize: '1em' }} value={availabilityFilter} onChange={(e) => setAvailabilityFilter(e.target.value as any)}>
                <option value="all" className="bg-card text-foreground">All items</option>
                <option value="available" className="bg-card text-foreground">Available</option>
                <option value="unavailable" className="bg-card text-foreground">Unavailable</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
            {itemsLoading ? (
               <div className="col-span-full py-32">
                  <LoadingSignal message="Loading items..." />
               </div>
            ) : filteredItems.length > 0 ? (
              filteredItems.map((item) => {
                const isAvailable = item.available ?? item.is_available ?? true
                // Robust category lookup
                const category = categories.find((c) => String(c.id) === String(item.category_id))
                const categoryName = category?.name || "Uncategorized"
                
                const rawImages = item.image_urls || item.images || item.image || item.image_url
                const images = getImageUrls(rawImages)
                if (images.length === 0) images.push("/placeholder.svg")
                
                const popularity = item.popularity || Math.floor(Math.random() * 40) + 60;
                
                return (
                  <div key={item.id} className="h-full">
                    <Card className="group h-full overflow-hidden bg-card/40 backdrop-blur-3xl border-border/60 shadow-xl hover:shadow-[0_20px_40px_-10px_rgba(230,57,70,0.2)] hover:border-primary/40 transition-all duration-500 rounded-3xl border flex flex-col">
                      <div className="relative aspect-[16/10] overflow-hidden shrink-0">
                        {images[0] && (
                          <Image 
                            src={images[0]} 
                            alt={item.name || "Item"} 
                            fill 
                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                            unoptimized={images[0].startsWith('http')}
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                           <Badge className="bg-card/80 backdrop-blur-md border border-border/60 text-primary font-black uppercase text-[8px] tracking-widest px-3 h-7 rounded-lg shadow-xl">{categoryName.toUpperCase()}</Badge>
                           {isAvailable ? (
                             <div className="flex items-center gap-1.5 px-2 h-5 bg-secondary/10 backdrop-blur-md rounded-md border border-secondary/20">
                               <div className="h-1 w-1 rounded-full bg-secondary animate-pulse" />
                               <span className="text-[7px] font-black text-secondary tracking-widest uppercase">Live</span>
                             </div>
                           ) : (
                             <div className="flex items-center gap-1.5 px-2 h-5 bg-muted/50 backdrop-blur-md rounded-md border border-border/60">
                               <span className="text-[7px] font-black text-muted-foreground tracking-widest uppercase">Off</span>
                             </div>
                           )}
                        </div>
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <Button variant="secondary" size="icon" className="h-9 w-9 rounded-xl shadow-xl bg-background border border-border/60 hover:bg-primary hover:text-white transition-all" onClick={() => { setActiveItem(item); setItemDraft({ name: item.name || "", description: item.description || "", price: item.price?.toString() || "0", currency: item.currency || "USD", is_available: isAvailable, images: getImageUrls(rawImages) }); setItemPanelOpen(true); }}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                           <div className="space-y-0.5">
                              <h3 className="text-lg font-black text-foreground leading-none tracking-tight group-hover:text-primary transition-colors">{item.name}</h3>
                              <div className="flex items-center gap-1.5">
                                 <TrendingUp className="h-2.5 w-2.5 text-secondary" />
                                 <span className="text-[7px] font-black text-secondary uppercase tracking-[0.2em]">{popularity}% POPULARITY</span>
                              </div>
                           </div>
                           <span className="text-xl font-black text-foreground font-serif italic">
                             {item.price !== undefined && item.price !== null 
                               ? `${item.currency === "EUR" ? "€" : "ETB "}${parseFloat(item.price.toString()).toLocaleString()}` 
                               : "N/A"}
                           </span>
                        </div>
                      </div>
                      <CardHeader className="p-5 pb-3">
                        <CardDescription className="line-clamp-2 h-10 text-xs font-medium text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors">
                          {item.description || "No description provided."}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-5 pt-0 mt-auto">
                        <div className="flex items-center justify-between border-t border-border/40 pt-4 mt-1">
                          <div className="flex items-center gap-4">
                             <div className="flex flex-col">
                                <div className="flex items-center gap-3 text-muted-foreground">
                                   <div className="flex items-center gap-1.5"><Flame className="h-3 w-3 text-primary" /> <span className="text-[8px] font-bold">MILD</span></div>
                                   <div className="flex items-center gap-1.5"><Clock className="h-3 w-3 text-muted-foreground/40" /> <span className="text-[8px] font-bold">15M</span></div>
                                </div>
                             </div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 group-hover:text-primary transition-all text-muted-foreground/40" onClick={() => { setActiveItem(item); setItemDraft({ name: item.name || "", description: item.description || "", price: item.price?.toString() || "0", currency: item.currency || "USD", is_available: isAvailable, images: getImageUrls(rawImages) }); setItemPanelOpen(true); }}>
                             <ChevronRight className="h-5 w-5 transform group-hover:translate-x-0.5 transition-transform" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )
              })
            ) : (
              <div className="col-span-full py-32 text-center bg-card/20 rounded-3xl border-2 border-dashed border-border/60 group hover:border-primary/20 transition-all">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-muted border border-border/60 shadow-xl mb-6 group-hover:scale-110 transition-transform duration-500">
                  <Utensils className="h-8 w-8 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                </div>
                <h3 className="text-2xl font-black tracking-tight text-foreground mb-2">No menu items found.</h3>
                <p className="text-muted-foreground font-medium max-w-xs mx-auto mb-8 text-sm leading-relaxed">Start building your menu by adding your first item.</p>
                <Button className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-[0.3em] shadow-lg bg-primary text-white" onClick={() => setItemPanelOpen(true)}>
                  <Plus className="h-4 w-4 mr-3" /> Add item
                </Button>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Modal: Category Management */}
      <Dialog open={addCatOpen || editCatOpen} onOpenChange={(open) => { setAddCatOpen(open); setEditCatOpen(open) }}>
        <DialogContent className="rounded-3xl p-8 sm:max-w-md bg-card/95 backdrop-blur-3xl border border-border/60 shadow-2xl">
          <DialogHeader className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <LayoutGrid className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black tracking-tight text-foreground uppercase">{activeCategory ? "Edit Category" : "New Category"}</DialogTitle>
                <DialogDescription className="text-xs font-medium text-muted-foreground">Manage your groupings.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 ml-1">Category Name</Label>
              <Input
                className="h-12 rounded-xl border-border/50 bg-muted/30 focus-visible:ring-primary/20 text-base font-bold text-foreground transition-all"
                placeholder="e.g. Main Course"
                value={catDraft.name}
                onChange={e => setCatDraft(p => ({ ...p, name: e.target.value }))}
              />
            </div>
            
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 ml-1">Description</Label>
              <Input
                className="h-12 rounded-xl border-border/50 bg-muted/30 focus-visible:ring-primary/20 font-medium text-foreground transition-all"
                placeholder="Optional notes..."
                value={catDraft.description}
                onChange={e => setCatDraft(p => ({ ...p, description: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter className="mt-8 flex flex-col sm:flex-row gap-3">
            <Button 
                variant="ghost" 
                className="flex-1 h-12 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-muted text-muted-foreground transition-all" 
                onClick={() => {setAddCatOpen(false); setEditCatOpen(false)}}
            >
                Cancel
            </Button>
            <Button 
                className="flex-1 h-12 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] bg-primary hover:bg-primary/90 text-white shadow-xl transition-all" 
                onClick={handleSaveCategory} 
                disabled={!catDraft.name.trim() || savingCat}
            >
               {savingCat ? <LoadingSignal size="sm" className="h-4 w-4" /> : (activeCategory ? "Save Changes" : "Create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteCatOpen} onOpenChange={setDeleteCatOpen}>
        <AlertDialogContent className="rounded-3xl p-10 bg-card/98 backdrop-blur-3xl border border-border/60 shadow-3xl max-w-sm">
          <AlertDialogHeader className="mb-6 text-center">
            <div className="h-16 w-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6 mx-auto border border-primary/20">
              <Trash2 className="h-8 w-8" />
            </div>
            <AlertDialogTitle className="text-2xl font-black tracking-tighter text-foreground mb-2 uppercase">Delete Category?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-medium text-muted-foreground/40 leading-relaxed">
              Permanently remove this category and all its items.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="flex-1 h-12 rounded-xl border-border/50 bg-muted/40 text-[10px] font-black uppercase tracking-widest">Cancel</AlertDialogCancel>
            <AlertDialogAction className="flex-1 h-12 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest" onClick={handleDeleteCategory}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Item Management Panel */}
      <Sheet open={itemPanelOpen} onOpenChange={setItemPanelOpen}>
        <SheetContent className="w-full sm:max-w-xl bg-card border-l border-border/50 p-0 custom-scrollbar overflow-y-auto">
          <div className="relative h-40 bg-muted overflow-hidden">
             {itemDraft.images.length > 0 ? (
               <Image 
                 src={itemDraft.images[0] instanceof File ? URL.createObjectURL(itemDraft.images[0]) : itemDraft.images[0]} 
                 alt="Header" 
                 fill 
                 className="object-cover opacity-40 blur-sm"
               />
             ) : (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-50" />
             )}
             <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-card to-transparent" />
             <div className="absolute top-6 right-6 flex gap-4">
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-muted/50 border border-border/60 hover:bg-muted transition-all text-foreground" onClick={() => setItemPanelOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
             </div>
          </div>

          <div className="px-8 -mt-12 relative z-10 space-y-8 pb-16">
             <div className="space-y-3">
                <Badge className="bg-primary/10 text-primary border border-primary/20 font-black text-[9px] uppercase tracking-[0.4em] px-4 py-1.5 rounded-full">
                   {categories.find(c => c.id === categoryId)?.name || "Uncategorized"}
                </Badge>
                <div className="flex items-end justify-between gap-6">
                   <div className="space-y-1 flex-1">
                      <h2 className="text-3xl font-black tracking-tighter text-foreground uppercase">{activeItem ? "Edit Item" : "Add Item"}</h2>
                      <p className="text-muted-foreground/60 font-medium text-sm italic serif line-clamp-1">Refine your masterpieces.</p>
                   </div>
                   <div className="flex flex-col items-center gap-1.5">
                       <span className="text-[8px] font-black text-muted-foreground/30 uppercase tracking-[0.3em]">Status</span>
                       <div className="h-12 w-12 rounded-xl bg-muted/30 border border-border/50 flex items-center justify-center group hover:border-primary/20 transition-all">
                          <Flame className="h-5 w-5 text-primary" />
                       </div>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 gap-8 border-t border-border/40 pt-8">
                <div className="space-y-6">
                   <div className="space-y-3">
                      <Label className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 ml-1">Item Name</Label>
                      <Input
                        className="h-12 rounded-xl border-border/50 bg-muted/20 text-lg font-black text-foreground uppercase focus-visible:ring-primary/20"
                        placeholder="e.g. TRUFFLE RISOTTO"
                        value={itemDraft.name}
                        onChange={e => setItemDraft(p => ({ ...p, name: e.target.value }))}
                      />
                   </div>

                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 ml-1">Price</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                          <Input
                            type="number"
                            className="h-12 rounded-xl border-border/50 bg-muted/20 pl-10 text-base font-black text-foreground focus-visible:ring-primary/20"
                            step="0.01"
                            value={itemDraft.price}
                            onChange={e => setItemDraft(p => ({ ...p, price: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 ml-1">Currency</Label>
                        <select
                          className="h-12 w-full rounded-xl border-border/50 bg-muted/20 px-4 text-xs font-black text-foreground/80 uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-primary/20 appearance-none cursor-pointer"
                          value={itemDraft.currency}
                          onChange={e => setItemDraft(p => ({ ...p, currency: e.target.value }))}
                        >
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="ETB">ETB</option>
                          <option value="GBP">GBP</option>
                        </select>
                      </div>
                   </div>

                   <div className="space-y-3">
                      <Label className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 ml-1">Description</Label>
                      <textarea
                        className="w-full min-h-[120px] rounded-2xl border-border/40 bg-muted/20 p-5 text-sm font-medium text-foreground transition-all resize-none leading-relaxed focus:ring-1 focus:ring-primary/20 outline-none"
                        placeholder="Compelling description..."
                        value={itemDraft.description}
                        onChange={e => setItemDraft(p => ({ ...p, description: e.target.value }))}
                      />
                   </div>

                   <div className="space-y-4">
                      <Label className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 ml-1">Images</Label>
                      <div className="grid grid-cols-4 gap-3">
                         {itemDraft.images.map((img, idx) => (
                           <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-border/40 group/img">
                              <Image 
                                src={img instanceof File ? URL.createObjectURL(img) : img} 
                                alt="Item" 
                                fill 
                                className="object-cover group-hover/img:scale-110 transition-transform duration-500" 
                              />
                              <button 
                                className="absolute inset-0 bg-primary/80 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-all duration-300"
                                onClick={() => setItemDraft(p => ({ ...p, images: p.images.filter((_, i) => i !== idx) }))}
                              >
                                <X className="h-4 w-4 text-white" />
                              </button>
                           </div>
                         ))}
                         <button 
                           className="aspect-square rounded-xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-1.5 hover:border-primary/40 hover:bg-muted transition-all group/add"
                           onClick={() => document.getElementById("p-img")?.click()}
                         >
                            <UploadCloud className="h-4 w-4 text-muted-foreground/20 group-hover/add:text-primary transition-colors" />
                         </button>
                         <input id="p-img" type="file" className="hidden" multiple onChange={e => setItemDraft(p => ({ ...p, images: [...p.images, ...Array.from(e.target.files || [])] }))} />
                      </div>
                   </div>
                </div>

                <div className="pt-8 border-t border-border/40 space-y-6">
                   <div className="flex items-center justify-between p-5 rounded-2xl bg-muted/20 border border-border/40">
                      <div className="space-y-0.5">
                         <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">Live Status</span>
                         <p className="text-[10px] font-medium text-muted-foreground/40">Visible to guests.</p>
                      </div>
                      <Switch 
                         className="scale-110 data-[state=checked]:bg-primary"
                         checked={itemDraft.is_available}
                         onCheckedChange={checked => setItemDraft(p => ({ ...p, is_available: checked }))}
                      />
                   </div>

                   <AnimatePresence>
                     {savingItem && uploadProgress > 0 && (
                       <motion.div 
                         initial={{ opacity: 0, y: 10 }}
                         animate={{ opacity: 1, y: 0 }}
                         exit={{ opacity: 0 }}
                         className="space-y-3"
                       >
                         <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-primary">
                            <span>Processing</span>
                            <span>{uploadProgress}%</span>
                         </div>
                         <Progress value={uploadProgress} className="h-1 bg-muted rounded-full" />
                       </motion.div>
                     )}
                   </AnimatePresence>

                   <div className="flex gap-3">
                      {activeItem && (
                        <Button 
                          variant="ghost" 
                          className="h-14 w-14 rounded-2xl border border-border/40 bg-muted/20 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                          onClick={() => { setDeleteItemOpen(true); }}
                        >
                           <Trash2 className="h-5 w-5" />
                        </Button>
                      )}
                      <Button 
                        className="flex-1 h-14 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] bg-primary text-white shadow-xl transition-all"
                        onClick={handleSaveItem}
                        disabled={savingItem}
                      >
                         {savingItem ? <LoadingSignal size="sm" className="h-5 w-5" /> : (activeItem ? "Save Refinements" : "Finalize Item")}
                      </Button>
                   </div>
                </div>
             </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteItemOpen} onOpenChange={setDeleteItemOpen}>
        <AlertDialogContent className="rounded-3xl p-10 bg-card/98 backdrop-blur-3xl border border-border/60 shadow-3xl max-w-sm">
          <AlertDialogHeader className="mb-6 text-center">
            <div className="h-16 w-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6 mx-auto border border-primary/20">
              <Trash2 className="h-8 w-8" />
            </div>
            <AlertDialogTitle className="text-2xl font-black tracking-tighter text-foreground mb-2 uppercase">Delete Item?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-medium text-muted-foreground/40">
              Irreversible action.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="flex-1 h-12 rounded-xl border-border/50 bg-muted/40 text-[10px] font-black uppercase tracking-widest">Keep</AlertDialogCancel>
            <AlertDialogAction className="flex-1 h-12 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest" onClick={handleDeleteItem}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function MenuManagementPage() {
  return (
    <Suspense>
      <MenuManagementContent />
    </Suspense>
  )
}
