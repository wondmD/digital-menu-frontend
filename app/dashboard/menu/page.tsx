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
  Loader2, 
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
import { apiFetch } from "@/lib/api-client"
import { cn, getImageUrl, getImageUrls } from "@/lib/utils"
import Link from "next/link"
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel"

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { motion, AnimatePresence } from "framer-motion"

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
        
        let list: Category[] = []
        if (Array.isArray(res)) {
          list = res
        } else if (res && typeof res === 'object') {
          const raw = res.data || res.items || res
          list = Array.isArray(raw) ? raw : (raw.items || [])
        }

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

        let itemsList: any[] = []
        if (Array.isArray(res)) {
          itemsList = res
        } else if (res && typeof res === 'object') {
          // Exhaustive check for array placement including the provided CURL response structure
          if (Array.isArray(res.data)) {
            itemsList = res.data
          } else if (res.data && typeof res.data === 'object') {
             if (Array.isArray(res.data.items)) itemsList = res.data.items
             else if (Array.isArray(res.data.data)) itemsList = res.data.data
             else if (Array.isArray(res.data.results)) itemsList = res.data.results
          } else if (Array.isArray(res.items)) {
            itemsList = res.items
          } else if (Array.isArray(res.results)) {
            itemsList = res.results
          }
        }

        // Safety map and ensuring data availability
        const sanitizedItems = itemsList.map((item: any) => ({
          ...item,
          id: item.id || item.ID || item.uuid || `temp-${Math.random()}`,
          name: item.name || "Untitled Asset",
          price: item.price || 0,
          currency: item.currency || "USD",
          is_available: item.available ?? item.is_available ?? true
        }))

        setItems(sanitizedItems)
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
      
      // Items are live by default as per user request
      formData.append("is_available", "true")
      formData.append("is_published", "true")
      
      itemDraft.images.forEach((img) => {
        if (img instanceof File) {
          formData.append("image", img)
        }
      })

      await apiFetch(url, { method, token, body: formData })
      toast({ title: activeItem ? "Item updated" : "Item created" })
      setAddItemOpen(false)
      setEditItemOpen(false)
      
      const res = await apiFetch<any>(`/my-restaurants/${restaurantId}/categories/${categoryId}/items`, { token })
      
      let itemsList: any[] = []
      if (Array.isArray(res)) {
        itemsList = res
      } else if (res && typeof res === 'object') {
        if (Array.isArray(res.data)) itemsList = res.data
        else if (res.data && typeof res.data === 'object' && Array.isArray(res.data.items)) itemsList = res.data.items
        else if (res.items && Array.isArray(res.items)) itemsList = res.items
      }

      setItems(itemsList.map((item: any) => ({
        ...item,
        id: item.id || item.ID || item.uuid || `temp-${Math.random()}`,
        name: item.name || "Untitled Asset",
        price: item.price || 0,
        currency: item.currency || "USD",
        is_available: item.available ?? item.is_available ?? true
      })))
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
      
      const res = await apiFetch<any>(`/my-restaurants/${restaurantId}/categories/${categoryId}/items`, { token })
      
      let itemsList: any[] = []
      if (Array.isArray(res)) {
        itemsList = res
      } else if (res && typeof res === 'object') {
        if (Array.isArray(res.data)) itemsList = res.data
        else if (res.data && typeof res.data === 'object' && Array.isArray(res.data.items)) itemsList = res.data.items
        else if (res.items && Array.isArray(res.items)) itemsList = res.items
      }

      setItems(itemsList.map((item: any) => ({
        ...item,
        id: item.id || item.ID || item.uuid || `temp-${Math.random()}`,
        name: item.name || "Untitled Asset",
        price: item.price || 0,
        currency: item.currency || "USD",
        is_available: item.available ?? item.is_available ?? true
      })))
    } catch (err: any) {
      toast({ title: "Error", description: err?.message, variant: "destructive" })
    } finally {
      setSavingItem(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Loading menu...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8 pb-20 px-4 md:px-0">
       {/* Menu management */}
       <div className="bg-card/40 backdrop-blur-3xl border border-border/60 rounded-[2rem] md:rounded-[3rem] p-6 md:p-8 flex flex-col lg:flex-row items-center justify-between gap-8 md:gap-10 shadow-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px] -mr-48 -mt-48 transition-all group-hover:bg-primary/10" />
          
          <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6 z-10 text-center sm:text-left w-full sm:w-auto">
            <div className="h-16 w-16 md:h-20 md:w-20 rounded-[1.5rem] md:rounded-[2.5rem] bg-muted border border-border/60 flex items-center justify-center shadow-inner relative group/icon">
              <Utensils className="h-8 w-8 md:h-10 md:w-10 text-primary group-hover/icon:scale-110 transition-transform" />
              <div className="absolute inset-0 bg-primary/20 blur-2xl opacity-0 group-hover/icon:opacity-100 transition-opacity" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-3">
                 <div className="h-1 w-6 md:w-8 bg-primary rounded-full" />
                 <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-primary">Menu limits</p>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-foreground uppercase">Menu <span className="italic font-serif text-primary">items.</span></h2>
              <p className="text-muted-foreground text-[10px] md:text-xs font-bold uppercase tracking-widest">{subscription?.plan_name || 'Standard'} Allocation</p>
            </div>
          </div>

          <div className="flex-1 max-w-lg w-full z-10 space-y-4">
             <div className="flex justify-between items-end mb-2 md:mb-4">
                <div className="space-y-1">
                   <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Total items</p>
                   <p className="text-lg md:text-xl font-black text-foreground">
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

          <Button variant="outline" className="w-full md:w-auto h-12 md:h-14 px-8 md:px-10 rounded-xl md:rounded-[1.5rem] border-border/60 bg-muted/30 text-foreground font-black uppercase text-[9px] md:text-[10px] tracking-[0.3em] z-10 hover:bg-primary hover:text-white transition-all shadow-xl" asChild>
            <Link href="/packages">Upgrade plan</Link>
          </Button>
       </div>

      <div className="flex flex-col gap-8 md:gap-10 md:flex-row md:items-end md:justify-between px-2">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <Activity className="h-4 w-4 text-primary animate-pulse" />
             <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Management</span>
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter text-foreground uppercase leading-none">
            Menu <br className="sm:hidden" /> <span className="italic font-serif text-primary">management.</span>
          </h1>
          <p className="text-muted-foreground font-medium text-lg md:text-xl max-w-lg">Manage your menu items, categories, and availability from a single interface.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-5 w-full md:w-auto">
           {restaurants.length > 0 && (
             <div className="flex items-center gap-3 bg-card/60 p-2 rounded-[1.5rem] md:rounded-[2rem] border border-border/50 shadow-2xl w-full sm:w-auto">
               <div className="flex flex-col gap-1.5 px-3 md:px-4 flex-1 sm:flex-none">
                  <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-primary/60">Select restaurant</span>
                  <select
                    className="bg-transparent text-xs md:text-sm font-black text-foreground focus:outline-none appearance-none cursor-pointer pr-6"
                    value={restaurantId}
                    onChange={(e) => {
                      setRestaurantId(e.target.value)
                      setCategoryId("")
                    }}
                  >
                    {restaurants.map(r => <option key={r.id} value={r.id} className="bg-card">{r.name.toUpperCase()}</option>)}
                  </select>
               </div>
               <div className="h-8 md:h-10 w-px bg-border/10 mx-1 md:mx-2" />
               <Button variant="ghost" size="icon" disabled={publishing} onClick={togglePublish} className={cn("h-12 w-12 md:h-14 md:w-14 rounded-xl md:rounded-2xl transition-all", selectedRestaurant?.is_published ? "bg-primary/10 text-primary hover:bg-primary hover:text-white" : "bg-muted text-muted-foreground hover:text-foreground")}>
                 {publishing ? <Loader2 className="animate-spin" /> : selectedRestaurant?.is_published ? <Eye className="h-5 w-5 md:h-6 md:w-6" /> : <EyeOff className="h-5 w-5 md:h-6 md:w-6" />}
               </Button>
             </div>
           )}
           <Button className="w-full sm:w-auto h-14 md:h-16 rounded-xl md:rounded-[2rem] px-8 md:px-10 gap-4 shadow-[0_25px_50px_-12px_rgba(230,57,70,0.4)] bg-primary hover:bg-primary/90 text-white font-black uppercase text-[10px] md:text-xs tracking-[0.2em] transition-all hover:scale-105 active:scale-95" disabled={!categoryId} onClick={() => { setActiveItem(null); setItemDraft({ name: "", description: "", price: "", currency: "USD", is_available: true, images: [] }); setItemPanelOpen(true); }}>
            <Plus className="h-5 w-5" /> Add item
          </Button>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total items", val: stats.total, icon: Utensils, color: "text-blue-400", bg: "bg-blue-400/10" },
          { label: "Available", val: stats.available, icon: CheckCircle2, color: "text-green-400", bg: "bg-green-400/10" },
          { label: "Unavailable", val: stats.unavailable, icon: XCircle, color: "text-red-400", bg: "bg-red-400/10" },
          { label: "Avg. Price", val: `${stats.avgPrice.toFixed(2)}`, icon: DollarSign, color: "text-orange-400", bg: "bg-orange-400/10" },
        ].map((s, i) => (
          <div key={i} className="group relative p-6 rounded-[2rem] bg-card/40 backdrop-blur-3xl border border-border/60 shadow-2xl transition-all duration-500 hover:border-primary/20">
            <div className="flex flex-row items-center justify-between mb-4">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{s.label}</span>
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center border border-border/60", s.bg)}>
                <s.icon className={cn("h-5 w-5", s.color)} />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <div className="text-3xl font-serif font-black tracking-tight text-foreground">{s.val}</div>
              {s.label === "Avg. Price" && <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">ETB</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-start">
        <aside className="lg:col-span-3 space-y-6 md:space-y-8">
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
               <Layers className="h-4 w-4 text-muted-foreground" />
               <h2 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Categories</h2>
            </div>
            <Button variant="ghost" size="icon" className="h-9 w-9 md:h-10 md:w-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-all border border-border/60" onClick={() => { setActiveCategory(null); setCatDraft({ name: "", description: "" }); setAddCatOpen(true); }}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-row lg:flex-col gap-3 px-2 overflow-x-auto pb-4 lg:pb-0 scrollbar-hide">
            {categories.length > 0 ? categories.map((cat) => (
              <div key={cat.id} className={cn("group flex items-center justify-between p-4 md:p-5 rounded-xl md:rounded-[1.5rem] transition-all cursor-pointer border shadow-xl hover:scale-[1.02] shrink-0 min-w-[160px] lg:min-w-0", categoryId === cat.id ? "bg-primary text-white border-primary shadow-[0_20px_40px_-10px_rgba(230,57,70,0.5)]" : "bg-card/40 backdrop-blur-md border-border/60 hover:border-primary/20")} onClick={() => setCategoryId(cat.id)}>
                <div className="flex items-center gap-3 md:gap-4 min-w-0">
                  <div className={cn("h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl flex items-center justify-center shrink-0", categoryId === cat.id ? "bg-white/20" : "bg-muted")}>
                    <LayoutGrid className={cn("h-3.5 w-3.5 md:h-4 md:w-4", categoryId === cat.id ? "text-white" : "text-muted-foreground")} />
                  </div>
                  <span className="font-black text-[10px] md:text-xs tracking-widest uppercase truncate">{cat.name}</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className={cn("h-7 w-7 md:h-8 md:w-8 rounded-lg", categoryId === cat.id ? "hover:bg-white/20 text-white" : "hover:bg-muted text-muted-foreground")} onClick={(e) => { e.stopPropagation(); setActiveCategory(cat); setCatDraft({ name: cat.name, description: cat.description || "" }); setEditCatOpen(true); }}>
                    <Edit2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )) : (
              <div className="p-8 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border-2 border-dashed border-border/60 bg-muted/20 text-center space-y-4 w-full">
                 <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground">No categories defined</p>
                 <Button variant="ghost" className="text-primary text-[9px] md:text-[10px] font-black uppercase tracking-widest" onClick={() => setAddCatOpen(true)}>Add first category</Button>
              </div>
            )}
          </div>
        </aside>

        <section className="lg:col-span-9 space-y-8 md:space-y-10">
          <div className="flex flex-col gap-4 md:gap-6 md:flex-row md:items-center bg-card/60 backdrop-blur-3xl p-3 md:p-4 rounded-2xl md:rounded-[2.5rem] border border-border/60 shadow-3xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 md:left-6 top-1/2 h-4 w-4 md:h-5 md:w-5 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search menu items..." className="pl-12 md:pl-14 border-none bg-transparent h-12 md:h-14 focus-visible:ring-0 text-base md:text-lg font-bold placeholder:text-muted-foreground/30 text-foreground" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <div className="flex items-center gap-4 pr-1 md:pr-2">
              <select className="h-10 md:h-12 w-full md:w-auto rounded-lg md:rounded-[1.25rem] border border-border/50 bg-muted/30 px-4 md:px-6 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all appearance-none cursor-pointer pr-10 md:pr-12 hover:bg-muted/50 text-foreground" style={{ backgroundImage: `url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e\")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.8rem center', backgroundSize: '1em' }} value={availabilityFilter} onChange={(e) => setAvailabilityFilter(e.target.value as any)}>
                <option value="all" className="bg-card text-foreground">All items</option>
                <option value="available" className="bg-card text-foreground">Available</option>
                <option value="unavailable" className="bg-card text-foreground">Unavailable</option>
              </select>
            </div>
          </div>

          <div className="grid gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
            {itemsLoading ? (
               <div className="col-span-full py-48 flex flex-col items-center justify-center gap-8">
                  <div className="relative">
                    <Loader2 className="h-16 w-16 animate-spin text-primary" />
                    <div className="absolute inset-0 bg-primary/20 blur-3xl animate-pulse" />
                  </div>
                  <p className="font-black tracking-[0.4em] text-[10px] uppercase text-muted-foreground">Loading items...</p>
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
                    <Card className="group h-full overflow-hidden bg-card/40 backdrop-blur-3xl border-border/60 shadow-2xl hover:shadow-[0_30px_60px_-15px_rgba(230,57,70,0.3)] hover:border-primary/40 transition-all duration-700 rounded-[3rem] border-2 flex flex-col">
                      <div className="relative aspect-[16/10] overflow-hidden shrink-0">
                        {images[0] && (
                          <Image 
                            src={images[0]} 
                            alt={item.name || "Item"} 
                            fill 
                            className="object-cover group-hover:scale-110 transition-transform duration-1000"
                            unoptimized={images[0].startsWith('http')}
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
                        <div className="absolute top-5 left-5 flex flex-col gap-2">
                           <Badge className="bg-card/80 backdrop-blur-xl border border-border/60 text-primary font-black uppercase text-[10px] tracking-widest px-4 h-8 rounded-xl shadow-2xl">{categoryName.toUpperCase()}</Badge>
                           {isAvailable ? (
                             <div className="flex items-center gap-2 px-3 h-6 bg-secondary/10 backdrop-blur-md rounded-lg border border-secondary/20">
                               <div className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse" />
                               <span className="text-[8px] font-black text-secondary tracking-widest uppercase">Available</span>
                             </div>
                           ) : (
                             <div className="flex items-center gap-2 px-3 h-6 bg-muted/50 backdrop-blur-md rounded-lg border border-border/60">
                               <span className="text-[8px] font-black text-muted-foreground tracking-widest uppercase">Unavailable</span>
                             </div>
                           )}
                        </div>
                        <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-4 group-hover:translate-x-0">
                          <Button variant="secondary" size="icon" className="h-12 w-12 rounded-2xl shadow-3xl bg-background border border-border/60 hover:bg-primary hover:text-white transition-all" onClick={() => { setActiveItem(item); setItemDraft({ name: item.name || "", description: item.description || "", price: item.price?.toString() || "0", currency: item.currency || "USD", is_available: isAvailable, images: getImageUrls(rawImages) }); setItemPanelOpen(true); }}>
                            <Edit2 className="h-5 w-5" />
                          </Button>
                        </div>
                        <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                           <div className="space-y-1">
                              <h3 className="text-2xl font-black text-foreground leading-none tracking-tight group-hover:text-primary transition-colors">{item.name}</h3>
                              <div className="flex items-center gap-2">
                                 <TrendingUp className="h-3 w-3 text-secondary" />
                                 <span className="text-[9px] font-black text-secondary uppercase tracking-[0.2em]">{popularity}% Popularity Factor</span>
                              </div>
                           </div>
                           <span className="text-3xl font-black text-foreground font-serif italic">
                             {item.price !== undefined && item.price !== null 
                               ? `${item.currency === "EUR" ? "€" : "ETB "}${parseFloat(item.price.toString()).toLocaleString()}` 
                               : "N/A"}
                           </span>
                        </div>
                      </div>
                      <CardHeader className="p-8 pb-4">
                        <CardDescription className="line-clamp-2 h-12 text-sm font-medium text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors">
                          {item.description || "No description provided for this item."}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-8 pt-0 mt-auto">
                        <div className="flex items-center justify-between border-t border-border/50 pt-6 mt-2">
                          <div className="flex items-center gap-6">
                             <div className="flex flex-col">
                                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Details</span>
                                <div className="flex items-center gap-4 text-muted-foreground">
                                   <div className="flex items-center gap-1.5"><Flame className="h-3.5 w-3.5 text-primary" /> <span className="text-[10px] font-bold">MILD</span></div>
                                   <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> <span className="text-[10px] font-bold">15M</span></div>
                                </div>
                             </div>
                          </div>
                          <Button variant="ghost" size="icon" className="group-hover:text-primary transition-all text-muted-foreground" onClick={() => { setActiveItem(item); setItemPanelOpen(true); }}>
                             <ChevronRight className="h-6 w-6 transform group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )
              })
            ) : (
              <div className="col-span-full py-60 text-center bg-card/20 rounded-[4rem] border-2 border-dashed border-border/60 group hover:border-primary/20 transition-all">
                <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-[3rem] bg-muted border border-border/60 shadow-3xl mb-12 group-hover:scale-110 transition-transform duration-700">
                  <Utensils className="h-12 w-12 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <h3 className="text-4xl font-black tracking-tight text-foreground mb-4">No menu items found.</h3>
                <p className="text-muted-foreground font-medium max-w-sm mx-auto mb-12 text-lg leading-relaxed">You haven't added any items to this menu yet. Create your first item to get started.</p>
                <Button className="h-16 px-12 rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] shadow-[0_25px_50px_-12px_rgba(230,57,70,0.4)] bg-primary text-white" onClick={() => setItemPanelOpen(true)}>
                  <Plus className="h-5 w-5 mr-4" /> Add your first item
                </Button>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Modal: Category Management */}
      <Dialog open={addCatOpen || editCatOpen} onOpenChange={(open) => { setAddCatOpen(open); setEditCatOpen(open) }}>
        <DialogContent className="rounded-[2.5rem] p-10 sm:max-w-[500px] bg-card/95 backdrop-blur-3xl border border-border/60 shadow-2xl">
          <DialogHeader className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <LayoutGrid className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-black tracking-tight text-foreground">{activeCategory ? "Edit Category" : "New Category"}</DialogTitle>
                <DialogDescription className="font-medium text-muted-foreground">Manage how your menu items are grouped.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-10 py-4">
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground ml-1">Category Name</Label>
              <Input
                className="h-16 rounded-2xl border-border/50 bg-muted/30 focus-visible:ring-primary/20 text-xl font-bold text-foreground placeholder:text-muted-foreground/30 transition-all"
                placeholder="e.g. Main Course"
                value={catDraft.name}
                onChange={e => setCatDraft(p => ({ ...p, name: e.target.value }))}
              />
            </div>
            
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground ml-1">Description</Label>
              <Input
                className="h-16 rounded-2xl border-border/50 bg-muted/30 focus-visible:ring-primary/20 font-medium text-foreground placeholder:text-muted-foreground/30 transition-all"
                placeholder="Optional notes about this category..."
                value={catDraft.description}
                onChange={e => setCatDraft(p => ({ ...p, description: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter className="mt-12 flex flex-col sm:flex-row gap-4">
            <Button 
                variant="ghost" 
                className="flex-1 h-16 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] hover:bg-muted text-muted-foreground hover:text-foreground transition-all" 
                onClick={() => {setAddCatOpen(false); setEditCatOpen(false)}}
            >
                Cancel
            </Button>
            <Button 
                className="flex-1 h-16 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] bg-primary hover:bg-primary/90 text-white shadow-[0_20px_40px_-10px_rgba(230,57,70,0.5)] transition-all" 
                onClick={handleSaveCategory} 
                disabled={!catDraft.name.trim() || savingCat}
            >
               {savingCat ? <Loader2 className="animate-spin h-5 w-5" /> : (activeCategory ? "Save Changes" : "Create Category")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteCatOpen} onOpenChange={setDeleteCatOpen}>
        <AlertDialogContent className="rounded-[3rem] p-12 bg-card/98 backdrop-blur-3xl border border-border/60 shadow-3xl">
          <AlertDialogHeader className="mb-10 text-center">
            <div className="h-24 w-24 bg-primary/10 text-primary rounded-[2.5rem] flex items-center justify-center mb-8 mx-auto border border-primary/20 shadow-[0_0_60px_-15px_rgba(230,57,70,0.4)]">
              <Trash2 className="h-10 w-10" />
            </div>
            <AlertDialogTitle className="text-4xl font-black tracking-tighter text-foreground mb-4">Delete Category?</AlertDialogTitle>
            <AlertDialogDescription className="text-lg font-medium text-muted-foreground/30 leading-relaxed max-w-sm mx-auto">
              This will permanently remove the category and all associated items from your menu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-4">
            <AlertDialogCancel className="flex-1 h-16 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] border-border/50 bg-muted/30 text-muted-foreground/40 hover:bg-muted hover:text-foreground transition-all">Cancel</AlertDialogCancel>
            <AlertDialogAction className="flex-1 h-16 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] bg-primary hover:bg-primary/90 text-white shadow-[0_20px_40px_-10px_rgba(230,57,70,0.5)] transition-all" onClick={handleDeleteCategory}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Item Management Panel */}
      <Sheet open={itemPanelOpen} onOpenChange={setItemPanelOpen}>
        <SheetContent className="w-full sm:max-w-[700px] bg-card border-l border-border/50 p-0 custom-scrollbar overflow-y-auto">
          <div className="relative h-48 bg-muted overflow-hidden">
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
             <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-card to-transparent" />
             <div className="absolute top-10 right-10 flex gap-4">
                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-muted/50 border border-border/60 hover:bg-muted transition-all text-foreground" onClick={() => setItemPanelOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
             </div>
          </div>

          <div className="px-12 -mt-16 relative z-10 space-y-12 pb-24">
             <div className="space-y-4">
                <Badge className="bg-primary/10 text-primary border border-primary/20 font-black text-[10px] uppercase tracking-[0.4em] px-5 py-2 rounded-full">
                   {categories.find(c => c.id === categoryId)?.name || "Uncategorized"}
                </Badge>
                <div className="flex items-end justify-between gap-6">
                   <div className="space-y-2 flex-1">
                      <h2 className="text-5xl font-black tracking-tighter text-foreground uppercase">{activeItem ? "Edit Item" : "Add Item"}</h2>
                      <p className="text-muted-foreground font-medium text-lg italic serif">"Refining your menu with precision and style."</p>
                   </div>
                   <div className="flex flex-col items-center gap-2">
                       <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Popularity</span>
                       <div className="h-16 w-16 rounded-2xl bg-muted/30 border border-border/50 flex items-center justify-center group hover:border-primary/40 transition-all">
                          <Flame className="h-6 w-6 text-primary" />
                       </div>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 gap-12 border-t border-border/50 pt-12">
                <div className="space-y-10">
                   <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground ml-1">Item Name</Label>
                      <Input
                        className="h-16 rounded-2xl border-border/50 bg-muted/30 text-2xl font-black text-foreground uppercase placeholder:text-muted-foreground/30 focus-visible:ring-primary/20"
                        placeholder="e.g. TRUFFLE RISOTTO"
                        value={itemDraft.name}
                        onChange={e => setItemDraft(p => ({ ...p, name: e.target.value }))}
                      />
                   </div>

                   <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground ml-1">Price</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                          <Input
                            type="number"
                            className="h-16 rounded-2xl border-border/50 bg-muted/30 pl-14 text-xl font-black text-foreground focus-visible:ring-primary/20"
                            step="0.01"
                            value={itemDraft.price}
                            onChange={e => setItemDraft(p => ({ ...p, price: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground ml-1">Currency</Label>
                        <select
                          className="h-16 w-full rounded-2xl border-border/50 bg-muted/30 px-6 text-sm font-black text-foreground/80 uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                          value={itemDraft.currency}
                          onChange={e => setItemDraft(p => ({ ...p, currency: e.target.value }))}
                        >
                          <option value="USD">USD - Dollar</option>
                          <option value="EUR">EUR - Euro</option>
                          <option value="ETB">ETB - Birr</option>
                          <option value="GBP">GBP - Pound</option>
                        </select>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground ml-1">Description</Label>
                      <textarea
                        className="w-full min-h-[160px] rounded-[2rem] border-border/50 bg-muted/30 p-8 text-lg font-medium text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none leading-relaxed"
                        placeholder="Provide a compelling description for this item..."
                        value={itemDraft.description}
                        onChange={e => setItemDraft(p => ({ ...p, description: e.target.value }))}
                      />
                   </div>

                   <div className="space-y-6">
                      <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground ml-1">Item Images</Label>
                      <div className="grid grid-cols-4 gap-4">
                         {itemDraft.images.map((img, idx) => (
                           <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-border/50 group/img">
                              <Image 
                                src={img instanceof File ? URL.createObjectURL(img) : img} 
                                alt="Item" 
                                fill 
                                className="object-cover group-hover/img:scale-110 transition-transform duration-700" 
                              />
                              <button 
                                className="absolute inset-0 bg-primary/80 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-all duration-300"
                                onClick={() => setItemDraft(p => ({ ...p, images: p.images.filter((_, i) => i !== idx) }))}
                              >
                                <X className="h-5 w-5 text-white" />
                              </button>
                           </div>
                         ))}
                         <button 
                           className="aspect-square rounded-2xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-2 hover:border-primary/40 hover:bg-muted transition-all group/add"
                           onClick={() => document.getElementById("p-img")?.click()}
                         >
                            <UploadCloud className="h-5 w-5 text-muted-foreground group-hover/add:text-primary transition-colors" />
                         </button>
                         <input id="p-img" type="file" className="hidden" multiple onChange={e => setItemDraft(p => ({ ...p, images: [...p.images, ...Array.from(e.target.files || [])] }))} />
                      </div>
                   </div>
                </div>

                <div className="pt-12 border-t border-border/50 space-y-8">
                   <div className="flex items-center justify-between p-8 rounded-3xl bg-muted/30 border border-border/50">
                      <div className="space-y-1">
                         <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Availability</span>
                         <p className="text-sm font-medium text-muted-foreground">Toggle item visibility on the public menu.</p>
                      </div>
                      <Switch 
                         className="scale-125 data-[state=checked]:bg-primary"
                         checked={itemDraft.is_available}
                         onCheckedChange={checked => setItemDraft(p => ({ ...p, is_available: checked }))}
                      />
                   </div>

                   <div className="flex gap-4">
                      {activeItem && (
                        <Button 
                          variant="ghost" 
                          className="h-20 w-20 rounded-3xl border border-border/50 bg-muted/30 hover:bg-primary/10 hover:border-primary/20 text-muted-foreground hover:text-primary transition-all"
                          onClick={() => { setDeleteItemOpen(true); }}
                        >
                           <Trash2 className="h-6 w-6" />
                        </Button>
                      )}
                      <Button 
                        className="flex-1 h-20 rounded-3xl font-black uppercase text-xs tracking-[0.4em] bg-primary hover:bg-primary/90 text-white shadow-[0_20px_50px_-15px_rgba(230,57,70,0.6)] group transition-all"
                        onClick={handleSaveItem}
                        disabled={savingItem}
                      >
                         {savingItem ? <Loader2 className="animate-spin h-6 w-6" /> : (
                            <span className="flex items-center gap-4">
                               {activeItem ? "Save Changes" : "Save Item"}
                               <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </span>
                         )}
                      </Button>
                   </div>
                </div>
             </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteItemOpen} onOpenChange={setDeleteItemOpen}>
        <AlertDialogContent className="rounded-[3rem] p-12 bg-card/98 backdrop-blur-3xl border border-border/60 shadow-3xl">
          <AlertDialogHeader className="mb-10 text-center">
            <div className="h-24 w-24 bg-primary/10 text-primary rounded-[2.5rem] flex items-center justify-center mb-8 mx-auto border border-primary/20 shadow-[0_0_60px_-15px_rgba(230,57,70,0.4)]">
              <Trash2 className="h-10 w-10" />
            </div>
            <AlertDialogTitle className="text-4xl font-black tracking-tighter text-foreground mb-4">Delete Item?</AlertDialogTitle>
            <AlertDialogDescription className="text-lg font-medium text-muted-foreground leading-relaxed max-w-sm mx-auto">
              This action will permanently remove this item from your menu. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-4">
            <AlertDialogCancel className="flex-1 h-16 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] border-border/50 bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground transition-all">Cancel</AlertDialogCancel>
            <AlertDialogAction className="flex-1 h-16 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] bg-primary hover:bg-primary/90 text-white shadow-[0_20px_40px_-10px_rgba(230,57,70,0.5)] transition-all" onClick={handleDeleteItem}>
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
