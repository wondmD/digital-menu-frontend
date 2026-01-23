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
  Settings2,
  Clock,
  Flame,
  Leaf,
  Camera,
  UploadCloud,
  Eye,
  EyeOff
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

  const selectedRestaurant = useMemo(() => 
    restaurants.find(r => r.id === restaurantId), 
    [restaurants, restaurantId]
  )

  const togglePublish = async () => {
    if (!token || !selectedRestaurant) return
    try {
      setPublishing(true)
      const newStatus = !selectedRestaurant.is_published
      
      // Use JSON for simple status updates as per Postman docs
      await apiFetch(`/my-restaurants/${selectedRestaurant.id}`, {
        method: "PATCH",
        token,
        body: { is_published: newStatus },
      })
      
      setRestaurants(prev => prev.map(r => r.id === selectedRestaurant.id ? { ...r, is_published: newStatus } : r))
      toast({
        title: newStatus ? "Menu Published" : "Menu Unpublished",
        description: `${selectedRestaurant.name} is now ${newStatus ? 'live' : 'in draft'}.`,
      })
    } catch (err: any) {
      toast({ title: "Failed to update status", description: err.message, variant: "destructive" })
    } finally {
      setPublishing(false)
    }
  }
  
  // Dialog States
  const [addCatOpen, setAddCatOpen] = useState(false)
  const [editCatOpen, setEditCatOpen] = useState(false)
  const [deleteCatOpen, setDeleteCatOpen] = useState(false)
  
  const [addItemOpen, setAddItemOpen] = useState(false)
  const [editItemOpen, setEditItemOpen] = useState(false)
  const [deleteItemOpen, setDeleteItemOpen] = useState(false)
  
  // Action States
  const [savingCat, setSavingCat] = useState(false)
  const [savingItem, setSavingItem] = useState(false)
  
  const [activeCategory, setActiveCategory] = useState<Category | null>(null)
  const [catDraft, setCatDraft] = useState({ name: "", description: "" })
  
  const [activeItem, setActiveItem] = useState<MenuItem | null>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [itemDraft, setItemDraft] = useState({
    name: "",
    description: "",
    price: "",
    currency: "USD",
    is_available: true,
    images: [] as (File | string)[]
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
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const isAvailable = (item.available ?? item.is_available)
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
        const list = Array.isArray(res) ? res : (res?.data || [])
        setRestaurants(list)
        
        if (list.length) {
          const found = initialRestaurantId && list.find((r: any) => r.id === initialRestaurantId)
          if (found) {
            setRestaurantId(initialRestaurantId as string)
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
        const list = Array.isArray(res) ? res : (res?.data || [])
        setCategories(list)
        
        if (initialCategoryId && list.find((c: any) => c.id === initialCategoryId)) {
          setCategoryId(initialCategoryId as string)
        } else if (list.length && !categoryId) {
          setCategoryId(list[0].id)
        }
      } catch (err: any) {
        toast({ title: "Failed to load categories", description: err?.message, variant: "destructive" })
      }
    }
    loadCategories()
  }, [ready, restaurantId, token, initialCategoryId])

  // Load Items when category changes
  useEffect(() => {
    if (!ready || !restaurantId || !categoryId) {
      setItems([])
      return
    }
    const loadItems = async () => {
      try {
        setItemsLoading(true)
        const res = await apiFetch<any>(`/my-restaurants/${restaurantId}/categories/${categoryId}/items`, { token })
        setItems(Array.isArray(res) ? res : (res?.data || []))
      } catch (err: any) {
        setItems([])
      } finally {
        setItemsLoading(false)
      }
    }
    loadItems()
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
      setItems(Array.isArray(res) ? res : (res?.data || []))
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
      setItems(Array.isArray(res) ? res : (res?.data || []))
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
        <p className="text-muted-foreground animate-pulse">Initializing menu management...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Plan Usage Banner */}
      {subscription && (
        <div className="bg-primary/5 border border-primary/20 rounded-3xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white">
              <Utensils className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-primary/60">Dishes Usage</p>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">
                  {stats.total} / {subscription.features?.max_menu_items === -1 ? '∞' : subscription.features?.max_menu_items} Items
                </span>
                <Badge variant="outline" className="text-[10px] uppercase border-primary/20 text-primary">
                  {subscription.plan_name}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex-1 max-w-xs w-full flex flex-col gap-1.5">
             <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">
                <span>Menu Capacity</span>
                <span>{subscription.features?.max_menu_items === -1 ? '100' : Math.round((stats.total / subscription.features?.max_menu_items) * 100)}%</span>
             </div>
             <div className="h-2 w-full bg-primary/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-1000" 
                  style={{ width: `${subscription.features?.max_menu_items === -1 ? 0 : Math.min(100, (stats.total / subscription.features?.max_menu_items) * 100)}%` }}
                />
             </div>
          </div>

          <Button variant="ghost" size="sm" className="rounded-xl text-primary font-bold hover:bg-primary/10" asChild>
            <Link href="/dashboard/settings">Upgrade Plan</Link>
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-extrabold tracking-tight">Menu Studio</h1>
          <p className="text-muted-foreground">Manage your categories and dishes in one place.</p>
        </div>
        <div className="flex items-center gap-3">
          {restaurants.length > 0 ? (
            <div className="flex items-center gap-2">
              <div className="flex flex-col gap-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Current Restaurant</Label>
                <select
                  className="h-11 rounded-xl border-2 border-primary/10 bg-background px-4 text-sm font-semibold shadow-sm focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                  value={restaurantId}
                  onChange={(e) => {
                    setRestaurantId(e.target.value)
                    setCategoryId("")
                  }}
                >
                  {restaurants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>

              {selectedRestaurant && (
                <div className="flex flex-col gap-1">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Visibility</Label>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={publishing}
                    onClick={togglePublish}
                    className={cn(
                      "h-11 w-11 rounded-xl border-2 transition-all",
                      selectedRestaurant.is_published 
                        ? "border-green-500/20 bg-green-50 text-green-600 hover:bg-green-100" 
                        : "border-primary/10 bg-muted/30 text-muted-foreground hover:bg-primary/5 hover:text-primary"
                    )}
                  >
                    {publishing ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : selectedRestaurant.is_published ? (
                      <Eye className="h-5 w-5" />
                    ) : (
                      <EyeOff className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <Button asChild variant="outline" className="h-11 rounded-xl border-dashed border-2">
              <Link href="/dashboard">
                <Plus className="h-4 w-4 mr-2" /> Create Restaurant
              </Link>
            </Button>
          )}

          {restaurants.length > 0 && (
            <Button 
              className="h-11 rounded-xl px-6 gap-2 shadow-lg shadow-primary/20"
              disabled={!categoryId}
              onClick={() => {
                setActiveItem(null)
                setItemDraft({ name: "", description: "", price: "", currency: "USD", is_available: true, images: [] })
                setAddItemOpen(true)
              }}
            >
              <Plus className="h-5 w-5" /> Add Dish
            </Button>
          )}
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Dishes", val: stats.total, icon: Utensils, color: "text-blue-500" },
          { label: "Live on Menu", val: stats.available, icon: CheckCircle2, color: "text-green-500" },
          { label: "Out of Stock", val: stats.unavailable, icon: XCircle, color: "text-destructive" },
          { label: "Avg. Price", val: `$${stats.avgPrice.toFixed(2)}`, icon: DollarSign, color: "text-orange-500" },
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-sm bg-muted/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{s.label}</CardTitle>
              <s.icon className={cn("h-4 w-4", s.color)} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black tracking-tight">{s.val}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar: Categories */}
        <aside className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">Categories</h2>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
              onClick={() => {
                setActiveCategory(null)
                setCatDraft({ name: "", description: "" })
                setAddCatOpen(true)
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex flex-col gap-1 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {categories.length > 0 ? categories.map((cat) => (
              <div 
                key={cat.id}
                className={cn(
                  "group flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer border-2",
                  categoryId === cat.id 
                    ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20 scale-[1.02]" 
                    : "bg-background border-transparent hover:border-primary/20 hover:bg-primary/5"
                )}
                onClick={() => setCategoryId(cat.id)}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <LayoutGrid className={cn("h-4 w-4 shrink-0", categoryId === cat.id ? "text-primary-foreground" : "text-muted-foreground")} />
                  <span className="font-bold text-sm truncate">{cat.name}</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn("h-7 w-7 rounded-lg", categoryId === cat.id ? "hover:bg-white/20 text-white" : "hover:bg-primary/10 text-primary")}
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveCategory(cat)
                      setCatDraft({ name: cat.name, description: cat.description || "" })
                      setEditCatOpen(true)
                    }}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn("h-7 w-7 rounded-lg", categoryId === cat.id ? "hover:bg-red-500/20 text-white" : "hover:bg-destructive/10 text-destructive")}
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveCategory(cat)
                      setDeleteCatOpen(true)
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )) : (
              <Button 
                variant="outline" 
                className="w-full h-32 rounded-3xl border-dashed border-2 flex flex-col gap-2 bg-primary/5 border-primary/20 text-primary hover:bg-primary/10 transition-all shadow-inner"
                onClick={() => {
                  setActiveCategory(null)
                  setCatDraft({ name: "", description: "" })
                  setAddCatOpen(true)
                }}
              >
                <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                  <Plus className="h-5 w-5" />
                </div>
                <span className="font-bold text-[10px] uppercase tracking-[0.2em]">Add Category</span>
              </Button>
            )}
          </div>
        </aside>

        {/* Main: Items */}
        <section className="lg:col-span-9 space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center bg-card p-2 rounded-2xl border shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Find a dish..." 
                className="pl-11 border-none bg-transparent h-11 focus-visible:ring-0 text-base" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 pr-2">
              <Badge variant="outline" className="h-9 px-3 gap-2 bg-muted/50 border-none font-bold text-[10px] uppercase">
                <Filter className="h-3 w-3" /> Filter
              </Badge>
              <select
                className="h-9 rounded-lg border-2 border-transparent bg-muted/50 px-3 text-xs font-bold focus:outline-none transition-all"
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value as any)}
              >
                <option value="all">Status: All</option>
                <option value="available">Status: Live</option>
                <option value="unavailable">Status: Hidden</option>
              </select>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {itemsLoading ? (
               <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4 text-muted-foreground">
                 <Loader2 className="h-10 w-10 animate-spin text-primary" />
                 <p className="font-bold tracking-widest text-xs uppercase animate-pulse">Syncing items...</p>
               </div>
            ) : filteredItems.length > 0 ? filteredItems.map((item) => {
              const available = item.available ?? item.is_available ?? true
              const categoryName = categories.find((c) => c.id === item.category_id)?.name
              const images = getImageUrls(item.image_urls || item.images || item.image || item.image_url)
              if (images.length === 0) images.push("/placeholder.svg")
              
              return (
                <Card key={item.id} className="group overflow-hidden bg-card border shadow-sm hover:shadow-xl hover:border-primary/50 transition-all duration-300 rounded-3xl">
                  <div className="relative aspect-[16/10]">
                    {images.length > 1 ? (
                      <Carousel className="h-full w-full group/carousel">
                        <CarouselContent className="h-full -ml-0">
                          {images.map((url, idx) => (
                            <CarouselItem key={idx} className="h-full pl-0">
                              <div className="relative h-full w-full">
                                <Image src={url} alt={`${item.name} ${idx + 1}`} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                              </div>
                            </CarouselItem>
                          ))}
                        </CarouselContent>
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                          {images.map((_, idx) => (
                            <div key={idx} className="h-1.5 w-1.5 rounded-full bg-white/70 shadow-sm" />
                          ))}
                        </div>
                      </Carousel>
                    ) : (
                      <Image src={images[0]} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    )}
                    <div className="absolute right-3 top-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-10 w-10 rounded-2xl shadow-xl bg-background/80 backdrop-blur-xl border-2 border-white/20"
                          >
                            <MoreVertical className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-2xl p-2 border-2 shadow-2xl">
                          <DropdownMenuItem
                            className="gap-3 rounded-xl p-3 font-bold"
                            onClick={() => {
                              setActiveItem(item)
                              setItemDraft({
                                name: item.name,
                                description: item.description || "",
                                price: item.price?.toString() || "",
                                currency: item.currency || "USD",
                                is_available: item.available ?? item.is_available ?? true,
                                images: getImageUrls(item.image_urls || item.images || item.image || item.image_url)
                              })
                              setEditItemOpen(true)
                            }}
                          >
                            <Edit2 className="h-4 w-4 text-blue-500" /> Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-3 rounded-xl p-3 font-bold text-destructive"
                            onClick={() => {
                              setActiveItem(item)
                              setDeleteItemOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4" /> Remove Item
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {!available && (
                      <div className="absolute inset-0 bg-background/40 backdrop-blur-md flex items-center justify-center">
                        <Badge className="bg-destructive text-white border-none py-1.5 px-4 rounded-full font-black uppercase tracking-tighter">Out of Stock</Badge>
                      </div>
                    )}
                  </div>
                  <CardHeader className="p-6 pb-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                         <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest text-primary border-primary/20 bg-primary/5 py-0 px-2 rounded-md">
                           {categoryName}
                         </Badge>
                         <CardTitle className="text-xl font-black line-clamp-1 group-hover:text-primary transition-colors">{item.name}</CardTitle>
                      </div>
                      <span className="text-2xl font-black text-primary">
                        {item.price ? `${item.currency === "EUR" ? "€" : "$"}${parseFloat(item.price.toString()).toFixed(2)}` : "—"}
                      </span>
                    </div>
                    <CardDescription className="line-clamp-2 h-10 text-sm font-medium mt-1">
                      {item.description || "No description provided."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 pt-2">
                    <div className="flex items-center justify-between border-t pt-4">
                      <div className="flex items-center gap-4">
                         <div className="flex items-center gap-1.5 text-orange-500" title="Spicy level">
                           <Flame className="h-4 w-4" />
                           <span className="text-xs font-bold">Mild</span>
                         </div>
                         <div className="flex items-center gap-1.5 text-green-600" title="Preparation time">
                           <Clock className="h-4 w-4" />
                           <span className="text-xs font-bold">15m</span>
                         </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            }) : (
              <div className="col-span-full py-32 text-center bg-muted/10 rounded-[3rem] border-4 border-dashed border-muted/50">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-background shadow-2xl mb-8">
                  <Utensils className="h-10 w-10 text-muted-foreground/40" />
                </div>
                <h3 className="text-3xl font-black tracking-tight mb-2">Empty Category</h3>
                <p className="text-muted-foreground font-medium max-w-xs mx-auto mb-8">
                  No dishes found here. Ready to create your first masterpiece?
                </p>
                <div className="flex justify-center gap-4">
                  <Button variant="outline" className="h-12 px-8 rounded-2xl font-bold" onClick={() => setAddItemOpen(true)}>
                    <Plus className="h-5 w-5 mr-2" /> New Dish
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* MODALS: Category */}
      <Dialog open={addCatOpen || editCatOpen} onOpenChange={(open) => { setAddCatOpen(open); setEditCatOpen(open) }}>
        <DialogContent className="rounded-[2.5rem] p-8 sm:max-w-[450px]">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-3xl font-black">{activeCategory ? "Update Category" : "New Category"}</DialogTitle>
            <DialogDescription className="font-medium text-muted-foreground">
              Define how your menu is structured.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-black uppercase tracking-widest ml-1">Category Name</Label>
              <Input
                className="h-14 rounded-2xl border-2 bg-muted/20 focus-visible:ring-primary/20 text-lg font-bold"
                placeholder="e.g. Signature Cocktails"
                value={catDraft.name}
                onChange={e => setCatDraft(p => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-black uppercase tracking-widest ml-1">Notes (Internal)</Label>
              <Input
                className="h-14 rounded-2xl border-2 bg-muted/20 focus-visible:ring-primary/20 font-medium"
                placeholder="Optional description"
                value={catDraft.description}
                onChange={e => setCatDraft(p => ({ ...p, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter className="mt-8 flex flex-row gap-3">
            <Button variant="ghost" className="flex-1 h-14 rounded-2xl font-black uppercase text-xs tracking-widest" onClick={() => {setAddCatOpen(false); setEditCatOpen(false)}}>Cancel</Button>
            <Button className="flex-1 h-14 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20" onClick={handleSaveCategory} disabled={!catDraft.name.trim() || savingCat}>
               {savingCat ? <Loader2 className="animate-spin h-5 w-5" /> : (activeCategory ? "Update" : "Launch")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteCatOpen} onOpenChange={setDeleteCatOpen}>
        <AlertDialogContent className="rounded-[2.5rem] p-10">
          <AlertDialogHeader className="mb-6">
            <div className="h-16 w-16 bg-destructive/10 text-destructive rounded-3xl flex items-center justify-center mb-6">
              <Trash2 className="h-8 w-8" />
            </div>
            <AlertDialogTitle className="text-3xl font-black">Archive Category?</AlertDialogTitle>
            <AlertDialogDescription className="text-lg font-medium text-muted-foreground">
              This will remove the category and all associated metadata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row gap-3">
            <AlertDialogCancel className="flex-1 h-14 rounded-2xl font-black uppercase text-xs tracking-widest border-2">Keep it</AlertDialogCancel>
            <AlertDialogAction className="flex-1 h-14 rounded-2xl font-black uppercase text-xs tracking-widest bg-destructive hover:bg-destructive/90 text-white" onClick={handleDeleteCategory}>
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* MODALS: Items */}
      <Dialog open={addItemOpen || editItemOpen} onOpenChange={(open) => { setAddItemOpen(open); setEditItemOpen(open) }}>
        <DialogContent className="rounded-[2.5rem] p-8 sm:max-w-[600px] gap-0">
          <DialogHeader className="mb-2">
             <div className="flex items-center gap-3 mb-2">
                <Badge className="bg-primary/10 text-primary border-none font-black text-[10px] uppercase tracking-widest">
                  {categories.find(c => c.id === categoryId)?.name || "Master Menu"}
                </Badge>
             </div>
            <DialogTitle className="text-3xl font-black">{activeItem ? "Edit Recipe" : "New Creation"}</DialogTitle>
             <DialogDescription className="font-medium text-muted-foreground mt-1">
               Fill in the details for your masterpiece.
             </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-y my-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Dish Images</Label>
                <div 
                   className="relative group min-h-[120px] rounded-3xl border-4 border-dashed border-muted/50 bg-muted/20 p-2 hover:border-primary/30 transition-all cursor-pointer"
                   onClick={() => document.getElementById("item-images")?.click()}
                >
                  {itemDraft.images.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {itemDraft.images.map((img, idx) => (
                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group/img">
                          <Image 
                            src={img instanceof File ? URL.createObjectURL(img) : img} 
                            alt="Preview" 
                            fill 
                            className="object-cover" 
                          />
                          <button 
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              setItemDraft(p => ({
                                ...p,
                                images: p.images.filter((_, i) => i !== idx)
                              }));
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-white" />
                          </button>
                        </div>
                      ))}
                      <div className="aspect-square rounded-xl border-2 border-dashed border-muted flex items-center justify-center">
                        <Plus className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ) : (
                    <div className="h-24 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <div className="h-10 w-10 rounded-xl bg-background shadow-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <UploadCloud className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-center px-4">Upload Multiple Images</span>
                    </div>
                  )}
                  <input 
                    id="item-images" 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    multiple
                    onChange={e => {
                      const files = Array.from(e.target.files || [])
                      if (files.length > 0) {
                        setItemDraft(p => ({ 
                          ...p, 
                          images: [...p.images, ...files] 
                        }))
                      }
                    }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Dish Name</Label>
                <Input
                  className="h-12 rounded-xl border-2 bg-muted/20 font-bold"
                  placeholder="e.g. Wagyu Truffle Burger"
                  value={itemDraft.name}
                  onChange={e => setItemDraft(p => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Presentation Description</Label>
                <textarea
                  className="w-full min-h-[120px] rounded-xl border-2 bg-muted/20 p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                  placeholder="Tell a story about this dish..."
                  value={itemDraft.description}
                  onChange={e => setItemDraft(p => ({ ...p, description: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Price</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        className="h-12 rounded-xl border-2 bg-muted/20 pl-9 font-black"
                        step="0.01"
                        value={itemDraft.price}
                        onChange={e => setItemDraft(p => ({ ...p, price: e.target.value }))}
                      />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Currency</Label>
                    <select
                      className="h-12 w-full rounded-xl border-2 bg-muted/20 px-3 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      value={itemDraft.currency}
                      onChange={e => setItemDraft(p => ({ ...p, currency: e.target.value }))}
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                 </div>
              </div>
              
              <div className="space-y-4 pt-4 border-t border-dashed">
                 <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Preferences & Flags</Label>
                 <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between bg-muted/30 p-3 rounded-2xl">
                       <div className="flex items-center gap-3">
                          <Flame className="h-4 w-4 text-orange-500" />
                          <span className="text-sm font-bold">Spicy Level</span>
                       </div>
                       <Badge variant="outline" className="rounded-lg font-black bg-white border-2">Mild</Badge>
                    </div>
                    <div className="flex items-center justify-between bg-muted/30 p-3 rounded-2xl">
                       <div className="flex items-center gap-3">
                          <Leaf className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-bold">Vegetarian</span>
                       </div>
                       <Switch className="data-[state=checked]:bg-green-500" />
                    </div>
                 </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-row gap-4">
            <Button variant="ghost" className="h-14 flex-1 rounded-2xl font-black uppercase text-xs tracking-[0.2em]" onClick={() => { setAddItemOpen(false); setEditItemOpen(false) }}>Cancel</Button>
            <Button className="h-14 flex-1 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-primary/20" onClick={handleSaveItem} disabled={!itemDraft.name.trim() || savingItem}>
               {savingItem ? <Loader2 className="animate-spin h-5 w-5" /> : (activeItem ? "Update Recipe" : "Launch Creation")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteItemOpen} onOpenChange={setDeleteItemOpen}>
        <AlertDialogContent className="rounded-[2.5rem] p-10">
          <AlertDialogHeader className="mb-6">
            <div className="h-20 w-20 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-destructive/5">
              <Trash2 className="h-8 w-8 animate-pulse" />
            </div>
            <AlertDialogTitle className="text-3xl font-black text-center">Permanently Remove?</AlertDialogTitle>
            <AlertDialogDescription className="text-lg font-medium text-muted-foreground text-center">
              This action cannot be undone. All data for <span className="text-foreground font-bold">{activeItem?.name}</span> will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row gap-4 sm:justify-center">
            <AlertDialogCancel className="h-14 flex-1 rounded-2xl font-black uppercase text-xs tracking-widest">Keep it</AlertDialogCancel>
            <AlertDialogAction className="h-14 flex-1 rounded-2xl font-black uppercase text-xs tracking-widest bg-destructive hover:bg-destructive/90 text-white" onClick={handleDeleteItem}>
              Remove
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
