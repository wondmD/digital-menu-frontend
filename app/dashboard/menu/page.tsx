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
  ChevronDown,
  Settings2,
  Clock,
  Flame,
  Leaf,
  Camera,
  Loader2,
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
    currency: String(raw?.currency || "ETB"),
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
  const [itemDialogOpen, setItemDialogOpen] = useState(false)
  const [itemStep, setItemStep] = useState<1 | 2>(1)
  const [catPanelOpen, setCatPanelOpen] = useState(false)

  const selectedRestaurant = useMemo(() => 
    restaurants.find(r => r.id === restaurantId), 
    [restaurants, restaurantId]
  )

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === categoryId),
    [categories, categoryId]
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
    name: "", description: "", price: "", currency: "ETB",
    is_available: true, images: [] as (File | string)[]
  })

  const isCreatingItem = savingItem && !activeItem
  const isCreatingCategory = savingCat && !activeCategory

  const openItemDialog = (item: MenuItem | null, startStep: 1 | 2 = 1) => {
    setActiveItem(item)

    if (item) {
      const isAvailable = item.available ?? item.is_available ?? true
      const rawImages = item.image_urls || item.images || item.image || item.image_url
      setItemDraft({
        name: item.name || "",
        description: item.description || "",
        price: item.price?.toString() || "0",
        currency: item.currency || "ETB",
        is_available: isAvailable,
        images: getImageUrls(rawImages),
      })
    } else {
      setItemDraft({
        name: "",
        description: "",
        price: "",
        currency: "ETB",
        is_available: true,
        images: [],
      })
    }

    setItemStep(startStep)
    setItemDialogOpen(true)
  }

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
      const numericPrice = Number(itemDraft.price || 0)
      if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
        toast({ title: "Invalid price", description: "Please enter a valid price greater than 0.", variant: "destructive" })
        return
      }

      const method = activeItem ? "PATCH" : "POST"
      const url = activeItem
        ? `/my-restaurants/${restaurantId}/categories/${categoryId}/items/${activeItem.id}`
        : `/my-restaurants/${restaurantId}/categories/${categoryId}/items`

      const getCreatedItemId = (payload: any): string | null => {
        const candidate =
          payload?.data?.id ||
          payload?.id ||
          payload?.data?.item?.id ||
          payload?.item?.id ||
          payload?.data?.data?.id

        if (!candidate) return null
        return String(candidate)
      }

      const isMultipartUnsupportedError = (value: unknown): boolean => {
        const msg = String((value as any)?.message || value || "").toLowerCase()
        return msg.includes("unsupported file format") || msg.includes("multipart")
      }

      const buildFormData = (minimal: boolean, _useLegacyImageKey = false, includeFiles = true) => {
        const fd = new FormData()
        fd.append("name", itemDraft.name.trim())
        fd.append("price", String(numericPrice))
        fd.append("currency", itemDraft.currency || "ETB")
        fd.append("is_available", String(itemDraft.is_available))
        fd.append("spice_level", "0")
        fd.append("display_order", "0")

        if (!minimal) {
          fd.append("description", itemDraft.description.trim())
        }

        const existingImageUrls = itemDraft.images
          .filter((img): img is string => typeof img === "string")
          .map((img) => img.trim())
          .filter((img) => img.length > 0 && img !== "/placeholder.svg")

        if (existingImageUrls.length > 0) {
          // Backend schema expects `images` as JSON payload metadata, not file parts.
          fd.append("images", JSON.stringify(existingImageUrls))
        }

        if (activeItem) {
          const newFiles = itemDraft.images.filter((img): img is File => img instanceof File)
          if (includeFiles) {
            for (const file of newFiles) {
              // Backend schema: Image []*multipart.FileHeader `form:"image,omitempty"`
              fd.append("image", file, file.name)
            }
          }
        } else if (includeFiles) {
          const newFiles = itemDraft.images.filter((img): img is File => img instanceof File)
          for (const file of newFiles) {
            fd.append("image", file, file.name)
          }
        }

        return fd
      }

      const buildImageOnlyFormData = (_useLegacyImageKey = false) => {
        const fd = new FormData()
        fd.append("name", itemDraft.name.trim())
        fd.append("price", String(numericPrice))
        fd.append("currency", itemDraft.currency || "ETB")
        fd.append("is_available", String(itemDraft.is_available))
        fd.append("spice_level", "0")
        fd.append("display_order", "0")

        const existingImageUrls = itemDraft.images
          .filter((img): img is string => typeof img === "string")
          .map((img) => img.trim())
          .filter((img) => img.length > 0 && img !== "/placeholder.svg")
        if (existingImageUrls.length > 0) {
          fd.append("images", JSON.stringify(existingImageUrls))
        }

        const newFiles = itemDraft.images.filter((img): img is File => img instanceof File)
        for (const file of newFiles) {
          fd.append("image", file, file.name)
        }
        return fd
      }

      const hasNewImageFiles = itemDraft.images.some((img) => img instanceof File)

      const responseIncludesImages = (payload: any): boolean => {
        const candidate =
          payload?.data?.item ||
          payload?.item ||
          payload?.data ||
          payload
        return getImageUrls(candidate?.image_urls || candidate?.images || candidate?.image || candidate?.image_url).length > 0
      }

      const appendNewImagesToCreatedItem = async (itemId: string) => {
        const appendUrl = `/my-restaurants/${restaurantId}/categories/${categoryId}/items/${itemId}`
        try {
          await apiFetchWithProgress(appendUrl, {
            method: "PATCH",
            token,
            // Prefer full multipart payload (same shape as edit) for better backend compatibility.
            body: buildFormData(false, false, true),
            onProgress: (pct) => setUploadProgress(pct),
          })
        } catch (appendErr: any) {
          if (isMultipartUnsupportedError(appendErr)) {
            toast({
              title: "Item created",
              description: "Your backend rejected multipart image upload for items. The item was saved without new images.",
            })
            return
          }

          try {
            await apiFetchWithProgress(appendUrl, {
              method: "PATCH",
              token,
              body: buildFormData(false, true, true),
              onProgress: (pct) => setUploadProgress(pct),
            })
          } catch {
            try {
              await apiFetchWithProgress(appendUrl, {
                method: "PATCH",
                token,
                body: buildImageOnlyFormData(false),
                onProgress: (pct) => setUploadProgress(pct),
              })
            } catch {
              await apiFetchWithProgress(appendUrl, {
                method: "PATCH",
                token,
                body: buildImageOnlyFormData(true),
                onProgress: (pct) => setUploadProgress(pct),
              })
            }
          }
        }
      }

      setUploadProgress(0)
      try {
        const primaryResponse = await apiFetchWithProgress<any>(url, {
          method,
          token,
          body: buildFormData(false, false, true),
          onProgress: (pct) => setUploadProgress(pct),
        })

        if (!activeItem && hasNewImageFiles && !responseIncludesImages(primaryResponse)) {
          const createdItemId = getCreatedItemId(primaryResponse)
          if (createdItemId) {
            await appendNewImagesToCreatedItem(createdItemId)
          } else {
            toast({
              title: "Item created",
              description: "Image upload could not continue automatically because item ID was missing in the create response.",
            })
          }
        }
      } catch (err: any) {
        const msg = String(err?.message || "")
        const shouldRetryMinimalCreate = !activeItem && (msg.includes("SQLSTATE 42601") || msg.includes("more expression than target columns"))
        const shouldRetryLegacyImageKey = Boolean(activeItem)
        const shouldRetryTwoStepCreate = !activeItem && hasNewImageFiles

        if (shouldRetryMinimalCreate) {
          const created = await apiFetchWithProgress<any>(url, {
            method,
            token,
            body: buildFormData(true, false, false),
            onProgress: (pct) => setUploadProgress(pct),
          })

          if (hasNewImageFiles) {
            const createdItemId = getCreatedItemId(created)
            if (!createdItemId) {
              throw new Error("Item created, but image upload could not continue because item ID was missing in response.")
            }
            await appendNewImagesToCreatedItem(createdItemId)
          }
        } else if (shouldRetryTwoStepCreate) {
          // Fallback path: create item first, then append images on the created item.
          const created = await apiFetchWithProgress<any>(url, {
            method,
            token,
            body: buildFormData(false, false, false),
            onProgress: (pct) => setUploadProgress(pct),
          })

          const createdItemId = getCreatedItemId(created)
          if (!createdItemId) {
            throw new Error("Item created but image upload could not continue because item ID was missing in response.")
          }

          await appendNewImagesToCreatedItem(createdItemId)
        } else if (shouldRetryLegacyImageKey) {
          await apiFetchWithProgress(url, {
            method,
            token,
            body: buildFormData(false, true, true),
            onProgress: (pct) => setUploadProgress(pct),
          })
        } else {
          throw err
        }
      }
      toast({ title: activeItem ? "Item updated" : "Item created" })
      setUploadProgress(0)
      setItemDialogOpen(false)
      setItemStep(1)
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
    <div className="dashboard-surface-polish flex flex-col gap-4 md:gap-6 pb-20 px-3 sm:px-4 lg:px-0">
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

      <div className="flex flex-col gap-6 md:gap-8 md:flex-row md:items-end md:justify-between px-2 min-w-0">
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
        
        <div className="flex w-full min-w-0 flex-col items-stretch gap-3 md:gap-4 md:w-auto md:items-end">
          {restaurants.length > 0 && (
            <div className="flex w-full md:w-[420px] lg:w-[460px] min-w-0 flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4 bg-card/70 p-2.5 md:p-3 rounded-2xl border border-border/70 ring-1 ring-border/60 shadow-2xl">
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.35em] text-primary">Managing Restaurant</span>
                <div className="relative group/select">
                  <select
                    className="h-11 md:h-12 w-full min-w-0 bg-muted/40 border border-border/60 rounded-xl px-4 pr-10 text-sm md:text-sm font-black tracking-[0.08em] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 appearance-none cursor-pointer"
                    value={restaurantId}
                    onChange={(e) => {
                      setRestaurantId(e.target.value)
                      setCategoryId("")
                    }}
                  >
                    {restaurants.map(r => <option key={r.id} value={r.id} className="bg-card">{r.name}</option>)}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                    <ChevronDown className="h-4 w-4 text-primary transition-transform group-hover/select:translate-y-0.5" />
                  </div>
                </div>
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground truncate">
                  {selectedRestaurant?.name || "Select restaurant"}
                </span>
              </div>
              <Button variant="ghost" size="icon" disabled={publishing} onClick={togglePublish} className={cn("h-11 w-11 md:h-12 md:w-12 rounded-xl shrink-0 self-end sm:self-auto transition-all", selectedRestaurant?.is_published ? "bg-primary/10 text-primary hover:bg-primary hover:text-white" : "bg-muted text-muted-foreground hover:text-foreground")}>
                {publishing ? <LoadingSignal size="sm" className="h-4 w-4" /> : selectedRestaurant?.is_published ? <Eye className="h-5 w-5 md:h-6 md:w-6" /> : <EyeOff className="h-5 w-5 md:h-6 md:w-6" />}
              </Button>
            </div>
          )}
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
              <h2 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Categories</h2>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-all border border-border/60" disabled={isCreatingCategory} onClick={() => { setActiveCategory(null); setCatDraft({ name: "", description: "" }); setAddCatOpen(true); }}>
              {isCreatingCategory ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>
          <div className="flex flex-row lg:flex-col gap-2.5 px-2 overflow-x-auto pb-4 lg:pb-0 scrollbar-hide">
            {categories.length > 0 ? categories.map((cat) => (
              <div key={cat.id} className={cn("group flex items-center justify-between p-3.5 md:p-4 rounded-xl transition-all cursor-pointer border shadow-lg hover:translate-x-1 shrink-0 min-w-[120px] lg:min-w-0", categoryId === cat.id ? "bg-primary text-white border-primary shadow-[0_15px_30px_-10px_rgba(230,57,70,0.4)]" : "bg-card/40 backdrop-blur-md border-border/70 hover:border-primary/30")} onClick={() => setCategoryId(cat.id)}>
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
                 <Button variant="ghost" className="text-primary text-[9px] font-black uppercase tracking-widest h-auto p-0" disabled={isCreatingCategory} onClick={() => setAddCatOpen(true)}>
                   {isCreatingCategory ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Add first"}
                 </Button>
              </div>
            )}
          </div>
        </aside>

        <section className="lg:col-span-9 space-y-6 md:space-y-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center bg-card/60 backdrop-blur-3xl p-2 rounded-2xl border border-border/70 ring-1 ring-border/60 shadow-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/40" />
              <Input placeholder="Search Ethiopian dishes..." className="pl-12 border-none bg-transparent h-11 focus-visible:ring-0 text-sm font-bold placeholder:text-muted-foreground/20 text-foreground" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <div className="flex w-full md:w-auto items-center gap-3 pr-0 md:pr-2">
              <select className="h-11 w-full sm:w-52 rounded-xl border border-border/50 bg-muted/40 px-4 text-[9px] font-black uppercase tracking-[0.16em] focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all appearance-none cursor-pointer pr-10 hover:bg-muted/60 text-foreground" style={{ backgroundImage: `url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e\")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.8rem center', backgroundSize: '1em' }} value={availabilityFilter} onChange={(e) => setAvailabilityFilter(e.target.value as any)}>
                <option value="all" className="bg-card text-foreground">All items</option>
                <option value="available" className="bg-card text-foreground">Available</option>
                <option value="unavailable" className="bg-card text-foreground">Unavailable</option>
              </select>
              <Button className="h-11 shrink-0 rounded-xl px-4 md:px-5 gap-2.5 justify-center shadow-[0_20px_40px_-12px_rgba(230,57,70,0.3)] bg-primary hover:bg-primary/90 text-white font-black uppercase text-[9px] md:text-[10px] tracking-[0.12em] whitespace-nowrap transition-all hover:scale-105 active:scale-95" disabled={!categoryId || isCreatingItem} onClick={() => openItemDialog(null, 1)}>
                {isCreatingItem ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} {isCreatingItem ? "Adding..." : "Add item"}
              </Button>
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
                
                return (
                  <div key={item.id} className="h-full">
                    <Card className="group h-full gap-0 overflow-hidden rounded-3xl border border-border/70 bg-card/40 backdrop-blur-3xl ring-1 ring-border/60 shadow-xl transition-all duration-500 hover:border-primary/40 hover:shadow-[0_20px_40px_-10px_rgba(230,57,70,0.2)] flex flex-col">
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
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-80" />
                        <div className="absolute top-4 left-4 flex max-w-[70%] flex-col gap-2">
                          <Badge className="max-w-full truncate bg-card/80 backdrop-blur-md border border-border/60 text-primary font-black uppercase text-[8px] tracking-widest px-3 h-7 rounded-lg shadow-xl">{categoryName.toUpperCase()}</Badge>
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
                        <div className="absolute top-4 right-4 opacity-0 transition-all duration-300 group-hover:opacity-100">
                          <Button variant="secondary" size="icon" className="h-9 w-9 rounded-xl shadow-xl bg-background border border-border/60 hover:bg-primary hover:text-white transition-all" onClick={() => openItemDialog(item, 1)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardHeader className="p-5 pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <CardTitle className="min-w-0 truncate text-lg font-black tracking-tight text-foreground group-hover:text-primary transition-colors">
                            {item.name}
                          </CardTitle>
                          <span className="shrink-0 whitespace-nowrap text-lg font-black font-serif italic text-foreground">
                            {item.price !== undefined && item.price !== null
                              ? `${item.currency === "EUR" ? "€" : "ETB "}${parseFloat(item.price.toString()).toLocaleString()}`
                              : "N/A"}
                          </span>
                        </div>
                        <CardDescription className="mt-2 line-clamp-2 min-h-[2.5rem] text-xs font-medium leading-relaxed text-muted-foreground/90 transition-colors group-hover:text-foreground">
                          {item.description || "No description provided."}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-5 pt-0 mt-auto">
                        <div className="flex items-center gap-2 min-w-0 border-t border-border/40 pt-3 overflow-hidden">
                            <Badge
                              className={cn(
                                "h-6 shrink-0 rounded-md px-2 text-[8px] font-black uppercase tracking-widest border",
                                isAvailable
                                  ? "bg-secondary/10 text-secondary border-secondary/20"
                                  : "bg-muted/40 text-muted-foreground border-border/60"
                              )}
                            >
                              {isAvailable ? "Available" : "Unavailable"}
                            </Badge>
                            <span className="truncate max-w-full text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                              {categoryName}
                            </span>
                        </div>
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 min-w-0">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-full min-w-0 rounded-md border-border/60 px-2 text-[9px] font-black uppercase tracking-[0.12em]"
                              onClick={() => openItemDialog(item, 2)}
                            >
                              <Camera className="mr-1.5 h-3 w-3 shrink-0" />
                              <span className="truncate">Add image</span>
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="h-8 w-full min-w-0 rounded-md px-2 text-[9px] font-black uppercase tracking-[0.12em]"
                              onClick={() => openItemDialog(item, 1)}
                            >
                              <Edit2 className="mr-1.5 h-3 w-3 shrink-0" />
                              <span className="truncate">Edit</span>
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="h-8 w-full min-w-0 rounded-md px-2 text-[9px] font-black uppercase tracking-[0.12em]"
                              onClick={() => {
                                setActiveItem(item)
                                setDeleteItemOpen(true)
                              }}
                            >
                              <Trash2 className="mr-1.5 h-3 w-3 shrink-0" />
                              <span className="truncate">Delete</span>
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
                <Button className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-[0.3em] shadow-lg bg-primary text-white" disabled={isCreatingItem} onClick={() => openItemDialog(null, 1)}>
                  {isCreatingItem ? <Loader2 className="h-4 w-4 mr-3 animate-spin" /> : <Plus className="h-4 w-4 mr-3" />} {isCreatingItem ? "Adding..." : "Add item"}
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
                placeholder="e.g. Beyaynetu"
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
              {savingCat ? <Loader2 className="h-4 w-4 animate-spin" /> : (activeCategory ? "Save Changes" : "Create")}
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

      {/* Item Management Modal */}
      <Dialog open={itemDialogOpen} onOpenChange={(open) => { setItemDialogOpen(open); if (!open) setItemStep(1) }}>
        <DialogContent className="bg-card border-border text-foreground rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 max-w-2xl w-[95vw] md:w-full overflow-y-auto max-h-[90vh]">
          <DialogHeader className="mb-6 md:mb-8">
            <div className="flex items-center justify-between mb-2">
              <DialogTitle className="text-2xl md:text-3xl font-black">
                {activeItem ? "Edit Menu Item" : "Add Menu Item"}
              </DialogTitle>
              <div className="flex items-center gap-2">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1.5 w-8 rounded-full transition-all duration-500",
                      itemStep === i ? "bg-primary w-12" : "bg-muted"
                    )}
                  />
                ))}
              </div>
            </div>
            <DialogDescription className="text-muted-foreground font-medium italic text-sm">
              {itemStep === 1 ? "Step 1: Item information" : "Step 2: Item images"}
            </DialogDescription>
            <div className="mt-4 rounded-xl border border-border/60 bg-muted/40 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Adding to category</p>
              <p className="mt-1 text-sm font-black text-foreground">
                {selectedCategory?.name || "No category selected"}
              </p>
            </div>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {itemStep === 1 ? (
              <motion.div
                key="item-step-1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Name</Label>
                  <Input
                    className="bg-muted border-border/50 h-12 rounded-xl focus:ring-primary/20"
                    placeholder="e.g. Doro Wat"
                    value={itemDraft.name}
                    onChange={e => setItemDraft(p => ({ ...p, name: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Price</Label>
                    <Input
                      type="number"
                      className="bg-muted border-border/50 h-12 rounded-xl"
                      step="0.01"
                      value={itemDraft.price}
                      onChange={e => setItemDraft(p => ({ ...p, price: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Currency</Label>
                    <Input
                      className="bg-muted border-border/50 h-12 rounded-xl font-mono"
                      value={itemDraft.currency}
                      onChange={e => setItemDraft(p => ({ ...p, currency: e.target.value.toUpperCase() }))}
                      placeholder="ETB"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description</Label>
                  <textarea
                    className="w-full min-h-30 rounded-xl border border-border/50 bg-muted p-4 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 resize-y"
                    placeholder="Describe this menu item..."
                    value={itemDraft.description}
                    onChange={e => setItemDraft(p => ({ ...p, description: e.target.value }))}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-muted border border-border/50">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Availability</span>
                    <p className="text-xs text-muted-foreground">Visible to guests when enabled.</p>
                  </div>
                  <Switch
                    checked={itemDraft.is_available}
                    onCheckedChange={checked => setItemDraft(p => ({ ...p, is_available: checked }))}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="item-step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Images</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {itemDraft.images.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-border/50 group/img">
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
                      className="aspect-square rounded-xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-1.5 hover:border-primary/40 hover:bg-muted transition-all"
                      onClick={() => document.getElementById("item-image-upload")?.click()}
                    >
                      <UploadCloud className="h-5 w-5 text-muted-foreground/40" />
                    </button>
                    <input
                      id="item-image-upload"
                      type="file"
                      className="hidden"
                      multiple
                      onChange={e => setItemDraft(p => ({ ...p, images: [...p.images, ...Array.from(e.target.files || [])] }))}
                    />
                  </div>
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
              </motion.div>
            )}
          </AnimatePresence>

          <DialogFooter className="mt-8 md:mt-10 flex-col md:flex-row gap-3">
            {itemStep === 2 && (
              <Button
                type="button"
                variant="ghost"
                className="w-full md:w-auto h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest text-muted-foreground"
                onClick={() => setItemStep(1)}
              >
                Back
              </Button>
            )}
            {itemStep === 1 ? (
              <Button
                type="button"
                className="w-full md:w-auto h-12 px-10 rounded-xl bg-foreground text-background font-black uppercase text-[10px] tracking-widest"
                onClick={() => setItemStep(2)}
                disabled={!itemDraft.name.trim()}
              >
                Next Step
              </Button>
            ) : (
              <Button
                type="button"
                className="w-full md:w-auto h-12 px-10 rounded-xl bg-primary text-white font-black uppercase text-[10px] tracking-widest"
                onClick={handleSaveItem}
                disabled={savingItem}
              >
                {savingItem ? <Loader2 className="h-4 w-4 animate-spin" /> : (activeItem ? "Save Item" : "Create Item")}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
