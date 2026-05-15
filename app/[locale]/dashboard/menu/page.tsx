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
import { cn, getImageUrl, getImageUrls, getOversizedFiles, MAX_UPLOAD_SIZE_BYTES } from "@/lib/utils"
import Link from "next/link"
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel"

import { motion, AnimatePresence } from "framer-motion"
import { LoadingSignal } from "@/components/ui/loading-signal"
import { Progress } from "@/components/ui/progress"
import { ApiError } from "@/lib/api-client"

type Restaurant = { id: string; name: string; slug?: string; status?: string; is_published?: boolean }
type Category = { id: string; name: string; description?: string }
type MenuItem = {
  id: string
  name: string
  description?: string
  price: number
  currency?: string
  spice_level?: number | string
  calories?: number | string
  calogy?: number | string
  allergens?: string[] | string
  dietary_tags?: string[] | string
  image?: any
  images?: any[]
  image_url?: string
  image_urls?: string[]
  is_available: boolean
  available?: boolean
  category_id: string
  allergy_list?: string[] | string
  dietaryTags?: string[] | string
  ingredients?: string[] | string
  ingredient_list?: string[] | string
  prep_time?: number | string
  prepTime?: number | string
  estimated_prep_time?: number | string
  estimatedPrepTime?: number | string
  prep_minutes?: number | string
  prepMinutes?: number | string
  service_time?: number | string
  serviceTime?: number | string
  chef_notes?: string
  notes?: string
  kitchen_notes?: string
  freshness?: string
  freshly_made?: boolean
  is_fresh?: boolean
  is_featured?: boolean
  is_popular?: boolean
  is_signature?: boolean
  chef_pick?: boolean
  is_chef_pick?: boolean
  chef_choice?: boolean
}

type DiscountRule = {
  id: string
  name?: string
  discount_type?: "percentage" | "fixed_amount" | string
  discount_value?: number
  applicable_to?: "all_items" | "specific_categories" | "specific_items" | string
  entity_ids?: Array<string | number>
  start_date?: string
  end_date?: string
  is_active?: boolean
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

function extractDataEnvelope(payload: any): any {
  return payload?.data?.data || payload?.data || payload
}

function extractSubscription(payload: any): any {
  const normalized = extractDataEnvelope(payload)
  if (!normalized) return null
  return normalized.subscription || normalized
}

function normalizeItem(raw: any): MenuItem {
  return {
    ...raw,
    id: String(raw?.id || raw?.ID || raw?.uuid || `temp-${Math.random()}`),
    name: String(raw?.name || "Untitled Asset"),
    description: raw?.description || "",
    price: Number(raw?.price || 0),
    currency: String(raw?.currency || "ETB"),
    spice_level: raw?.spice_level ?? raw?.spiceLevel,
    calories: raw?.calories,
    calogy: raw?.calogy,
    allergens: raw?.allergens,
    dietary_tags: raw?.dietary_tags ?? raw?.dietaryTags,
    image: raw?.image,
    images: raw?.images,
    image_url: raw?.image_url,
    image_urls: raw?.image_urls,
    category_id: String(raw?.category_id || ""),
    is_available: Boolean(raw?.available ?? raw?.is_available ?? true),
    available: Boolean(raw?.available ?? raw?.is_available ?? true),
  }
}

function normalizeApplicableTo(value: unknown): "all_items" | "specific_categories" | "specific_items" {
  const raw = String(value || "all_items").toLowerCase().replace(/-/g, "_")
  if (raw === "all" || raw === "all_items") return "all_items"
  if (raw === "specific_categories" || raw === "categories") return "specific_categories"
  if (raw === "specific_items" || raw === "items") return "specific_items"
  return "all_items"
}

function normalizeDiscountType(value: unknown): "percentage" | "fixed_amount" {
  const raw = String(value || "").toLowerCase().replace(/-/g, "_")
  if (raw === "fixed_amount" || raw === "fixed") return "fixed_amount"
  return "percentage"
}

function normalizeDiscountRule(raw: any): DiscountRule {
  return {
    id: String(raw?.id || raw?.uuid || ""),
    name: raw?.name,
    discount_type: normalizeDiscountType(raw?.discount_type),
    discount_value: Number(raw?.discount_value || 0),
    applicable_to: normalizeApplicableTo(raw?.applicable_to),
    entity_ids: Array.isArray(raw?.entity_ids)
      ? raw.entity_ids
      : Array.isArray(raw?.entityIds)
      ? raw.entityIds
      : [],
    start_date: raw?.start_date,
    end_date: raw?.end_date,
    is_active: raw?.is_active,
  }
}

function computeDiscountedPrice(price: number, discount?: DiscountRule): number {
  if (!discount) return price
  const value = Number(discount.discount_value || 0)
  if (!Number.isFinite(value) || value <= 0) return price

  const reduced =
    normalizeDiscountType(discount.discount_type) === "percentage"
      ? price - (price * value) / 100
      : price - value

  return Math.max(0, Number(reduced.toFixed(2)))
}

const MULTI_LANGUAGE_SEPARATOR = " | "
const MAX_SECONDARY_NAME_FIELDS = 3

function splitCompositeName(value: string): { primary: string; secondary: string } {
  const parts = String(value || "").split(MULTI_LANGUAGE_SEPARATOR)
  return {
    primary: (parts[0] || "").trim(),
    secondary: parts.slice(1).join(MULTI_LANGUAGE_SEPARATOR).trim(),
  }
}

function joinCompositeName(primary: string, secondary: string, extraNames?: string[]): string {
  const parts = [primary, secondary].map((s) => String(s || "").trim())
  if (Array.isArray(extraNames) && extraNames.length > 0) {
    for (const en of extraNames) {
      const v = String(en || "").trim()
      if (v) parts.push(v)
    }
  }
  return parts.filter(Boolean).join(MULTI_LANGUAGE_SEPARATOR)
}

function toIsoStartOfDay(dateInput: string): string {
  return `${dateInput}T00:00:00Z`
}

function toIsoEndOfDay(dateInput: string): string {
  return `${dateInput}T23:59:59Z`
}

function buildDiscountCode(name: string): string {
  const base = name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, 10)
  const suffix = Date.now().toString(36).toUpperCase().slice(-4)
  return `${base || "DISC"}${suffix}`
}

function getMenuErrorMessage(error: unknown, fallback = "Could not complete this action."): string {
  const defaultMessage = fallback

  if (error instanceof ApiError) {
    const body = error.body
    const bodyMessage =
      typeof body === "string"
        ? body
        : String(body?.message || body?.error || body?.detail || "").trim()
    const message = String(error.message || bodyMessage || defaultMessage).trim() || defaultMessage
    const lowerMessage = message.toLowerCase()

    if (error.status === 401) {
      return "Your session expired. Please sign in again and retry the action."
    }

    if (error.status === 403) {
      if (lowerMessage.includes("no active subscription") || lowerMessage.includes("inactive subscription")) {
        return "Subscription check failed: the API did not recognize an active subscription. Refresh the dashboard or open Subscription details if the plan is already active."
      }

      return `Permission denied: ${message}`
    }

    if (error.status === 404) {
      return `Not found: ${message}`
    }

    if (error.status === 422 || lowerMessage.includes("validation")) {
      return `Validation error: ${message}`
    }

    if ([500, 502, 503, 504].includes(Number(error.status))) {
      return `Server error (${error.status}): ${message}`
    }

    return message
  }

  if (error instanceof Error) {
    return error.message || defaultMessage
  }

  return defaultMessage
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
  const [discounts, setDiscounts] = useState<DiscountRule[]>([])
  
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
  const [deletingItem, setDeletingItem] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStage, setUploadStage] = useState<"idle" | "uploading_media" | "saving_item">("idle")
  
  const [activeCategory, setActiveCategory] = useState<Category | null>(null)
  const [catDraft, setCatDraft] = useState({ name: "", description: "" })
  
  const [activeItem, setActiveItem] = useState<MenuItem | null>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [itemDraft, setItemDraft] = useState({
    name: "", name_secondary: "", description: "", price: "", currency: "ETB",
    category_id: "",
    is_available: true,
    spice_level: "0",
    calories: "",
    images: [] as (File | string)[],
    discount_enabled: false,
    discount_type: "percentage" as "percentage" | "fixed_amount",
    discount_value: "",
    discount_name: "",
    discount_start_date: "",
    discount_end_date: "",
    // Backend fields
    allergens: [] as string[] | string,
    dietary_tags: [] as string[] | string,
    ingredients: [] as string[] | string,
    prep_time: "",
    estimated_prep_time: "",
    prep_minutes: "",
    service_time: "",
    chef_notes: "",
    notes: "",
    kitchen_notes: "",
    freshness: "",
    freshly_made: false,
    is_featured: false,
    is_popular: false,
    is_signature: false,
    chef_pick: false,
    chef_choice: false,
    // multi-language extra names (beyond primary + one secondary)
    extra_names: [] as string[],
  })

  const isCreatingItem = savingItem && !activeItem
  const isCreatingCategory = savingCat && !activeCategory

  const appendAllowedItemImages = (files: File[]) => {
    const oversized = getOversizedFiles(files)
    if (oversized.length > 0) {
      toast({
        title: "Some files were skipped",
        description: "Each upload must be 5MB or less.",
        variant: "destructive",
      })
    }

    const allowed = files.filter((file) => file.size <= MAX_UPLOAD_SIZE_BYTES)
    if (allowed.length === 0) return

    setItemDraft((prev) => ({ ...prev, images: [...prev.images, ...allowed] }))
  }

  const getItemSpecificDiscount = (itemId: string): DiscountRule | undefined => {
    return discounts.find((discount) => {
      if (discount.is_active === false) return false
      if (normalizeApplicableTo(discount.applicable_to) !== "specific_items") return false
      const targets = (discount.entity_ids || []).map((entry) => String(entry))
      return targets.includes(String(itemId))
    })
  }

  const requireCategoryBeforeAddingItem = (): boolean => {
    if (categories.length > 0) return true
    toast({
      title: "Add a category first",
      description: "Create at least one category before adding menu items.",
      variant: "destructive",
    })
    setAddCatOpen(true)
    return false
  }

  const openItemDialog = (item: MenuItem | null, startStep: 1 | 2 = 1) => {
    if (!item && !requireCategoryBeforeAddingItem()) return

    setActiveItem(item)

    if (item) {
      const isAvailable = item.available ?? item.is_available ?? true
      const rawImages = item.image_urls || item.images || item.image || item.image_url
      const linkedDiscount = getItemSpecificDiscount(item.id)
      // parse multilingual name parts (primary | secondary | extra...)
      const nameParts = String(item.name || "").split(MULTI_LANGUAGE_SEPARATOR).map(s => s.trim()).filter(Boolean)
      const secondaryParts = nameParts.slice(1, 1 + MAX_SECONDARY_NAME_FIELDS)
      setItemDraft({
        name: nameParts[0] || item.name || "",
        name_secondary: secondaryParts[0] || "",
        extra_names: secondaryParts.slice(1),
        description: item.description || "",
        price: item.price?.toString() || "0",
        currency: item.currency || "ETB",
        category_id: String(item.category_id || categoryId || categories[0]?.id || ""),
        is_available: isAvailable,
        spice_level: String(item.spice_level ?? "0"),
        calories: item.calories !== undefined && item.calories !== null ? String(item.calories) : String(item.calogy ?? ""),
        images: getImageUrls(rawImages),
        discount_enabled: Boolean(linkedDiscount),
        discount_type: normalizeDiscountType(linkedDiscount?.discount_type),
        discount_value: linkedDiscount?.discount_value ? String(linkedDiscount.discount_value) : "",
        discount_name: linkedDiscount?.name || "",
        discount_start_date: linkedDiscount?.start_date ? String(linkedDiscount.start_date).slice(0, 10) : "",
        discount_end_date: linkedDiscount?.end_date ? String(linkedDiscount.end_date).slice(0, 10) : "",
        // backend fields
        allergens: item.allergens ?? item.allergy_list ?? [],
        dietary_tags: item.dietary_tags ?? item.dietaryTags ?? [],
        ingredients: item.ingredients ?? item.ingredient_list ?? [],
        prep_time: item.prep_time !== undefined && item.prep_time !== null
          ? String(item.prep_time)
          : item.prepTime !== undefined && item.prepTime !== null
          ? String(item.prepTime)
          : "",
        estimated_prep_time: item.estimated_prep_time !== undefined && item.estimated_prep_time !== null
          ? String(item.estimated_prep_time)
          : item.estimatedPrepTime !== undefined && item.estimatedPrepTime !== null
          ? String(item.estimatedPrepTime)
          : "",
        prep_minutes: item.prep_minutes !== undefined && item.prep_minutes !== null
          ? String(item.prep_minutes)
          : item.prepMinutes !== undefined && item.prepMinutes !== null
          ? String(item.prepMinutes)
          : "",
        service_time: item.service_time !== undefined && item.service_time !== null
          ? String(item.service_time)
          : item.serviceTime !== undefined && item.serviceTime !== null
          ? String(item.serviceTime)
          : "",
        chef_notes: item.chef_notes ?? item.notes ?? item.kitchen_notes ?? "",
        notes: item.notes ?? "",
        kitchen_notes: item.kitchen_notes ?? "",
        freshness: item.freshness ?? "",
        freshly_made: Boolean(item.freshly_made ?? item.is_fresh),
        is_featured: Boolean(item.is_featured),
        is_popular: Boolean(item.is_popular),
        is_signature: Boolean(item.is_signature),
        chef_pick: Boolean(item.chef_pick ?? item.is_chef_pick),
        chef_choice: Boolean(item.chef_choice),
      })
    } else {
      setItemDraft({
        name: "",
        name_secondary: "",
        description: "",
        price: "",
        currency: "ETB",
        category_id: String(categoryId || categories[0]?.id || ""),
        is_available: true,
        spice_level: "0",
        calories: "",
        images: [],
        discount_enabled: false,
        discount_type: "percentage",
        discount_value: "",
        discount_name: "",
        discount_start_date: "",
        discount_end_date: "",
        // backend fields defaults
        allergens: [],
        extra_names: [],
        dietary_tags: [],
        ingredients: [],
        prep_time: "",
        estimated_prep_time: "",
        prep_minutes: "",
        service_time: "",
        chef_notes: "",
        notes: "",
        kitchen_notes: "",
        freshness: "",
        freshly_made: false,
        is_featured: false,
        is_popular: false,
        is_signature: false,
        chef_pick: false,
        chef_choice: false,
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

  const refreshDiscounts = async (targetRestaurantId: string) => {
    if (!token || !targetRestaurantId) {
      setDiscounts([])
      return
    }

    try {
      const discountRes = await apiFetch<any>(`/my-restaurants/${targetRestaurantId}/discounts`, { token })
      const discountList = extractList(discountRes).map(normalizeDiscountRule)
      setDiscounts(discountList)
    } catch {
      setDiscounts([])
    }
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
            setSubscription(extractSubscription(subRes))
          } catch {}
        }
      } catch (err: any) {
        toast({ title: "Failed to load restaurants", description: getMenuErrorMessage(err, "Unable to load your restaurants right now."), variant: "destructive" })
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
        toast({ title: "Failed to load categories", description: getMenuErrorMessage(err, "Unable to load categories for this restaurant."), variant: "destructive" })
      }
    }
    loadCategories()
  }, [ready, restaurantId, token, initialCategoryId])

  useEffect(() => {
    if (!ready || !restaurantId) {
      setDiscounts([])
      return
    }

    refreshDiscounts(restaurantId)
  }, [ready, restaurantId, token])

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
      toast({ title: "Category save failed", description: getMenuErrorMessage(err, "Unable to save this category."), variant: "destructive" })
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
      toast({ title: "Category delete failed", description: getMenuErrorMessage(err, "Unable to delete this category."), variant: "destructive" })
    } finally {
      setSavingCat(false)
    }
  }

  // Item Handlers
  const handleSaveItem = async () => {
    if (!token || !itemDraft.name.trim() || !restaurantId) return
    try {
      setSavingItem(true)
      const targetCategoryId = String(itemDraft.category_id || categoryId || "")
      if (!targetCategoryId) {
        toast({ title: "Category required", description: "Please select a category for this item.", variant: "destructive" })
        return
      }

      const newImageFiles = itemDraft.images.filter((img): img is File => img instanceof File)
      const existingImageUrlsSnapshot = itemDraft.images
        .filter((img): img is string => typeof img === "string")
        .map((img) => img.trim())
        .filter((img) => img.length > 0 && img !== "/placeholder.svg")
      const oversized = getOversizedFiles(newImageFiles)
      if (oversized.length > 0) {
        toast({
          title: "Upload too large",
          description: "Each upload must be 5MB or less.",
          variant: "destructive",
        })
        return
      }

      const numericPrice = Number(itemDraft.price || 0)
      if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
        toast({ title: "Invalid price", description: "Please enter a valid price greater than 0.", variant: "destructive" })
        return
      }

      const numericDiscountValue = Number(itemDraft.discount_value || 0)
      if (itemDraft.discount_enabled) {
        if (!Number.isFinite(numericDiscountValue) || numericDiscountValue <= 0) {
          toast({
            title: "Invalid discount",
            description: "Discount value must be greater than 0.",
            variant: "destructive",
          })
          return
        }

        if (itemDraft.discount_type === "percentage" && numericDiscountValue >= 100) {
          toast({
            title: "Invalid percentage",
            description: "Percentage discount must be less than 100.",
            variant: "destructive",
          })
          return
        }

        const hasStart = Boolean(itemDraft.discount_start_date)
        const hasEnd = Boolean(itemDraft.discount_end_date)
        if (hasStart !== hasEnd) {
          toast({
            title: "Invalid discount period",
            description: "Please provide both start and end dates, or leave both empty.",
            variant: "destructive",
          })
          return
        }

        if (hasStart && hasEnd && itemDraft.discount_end_date < itemDraft.discount_start_date) {
          toast({
            title: "Invalid discount period",
            description: "End date must be on or after the start date.",
            variant: "destructive",
          })
          return
        }
      }

      const method = activeItem ? "PATCH" : "POST"
      const url = activeItem
        ? `/my-restaurants/${restaurantId}/categories/${targetCategoryId}/items/${activeItem.id}`
        : `/my-restaurants/${restaurantId}/categories/${targetCategoryId}/items`

      const normalizedExtraNames = (itemDraft.extra_names || [])
        .map((part) => String(part || "").trim())
        .filter(Boolean)
        .slice(0, Math.max(0, MAX_SECONDARY_NAME_FIELDS - 1))

      const buildFormData = (minimal: boolean, mediaIds: string[], keepImageUrls: string[] = []) => {
        const fd = new FormData()

        fd.append("name", joinCompositeName(itemDraft.name, itemDraft.name_secondary, normalizedExtraNames))
        fd.append("price", String(numericPrice))
        fd.append("currency", itemDraft.currency || "ETB")
        fd.append("is_available", String(itemDraft.is_available))

        if (!minimal) {
          fd.append("description", itemDraft.description.trim())
        }

        // Append extended backend fields when present
        const normalizeListField = (val: any) => {
          if (Array.isArray(val)) return val.map(String)
          if (typeof val === "string") return val.split(",").map(s => s.trim()).filter(Boolean)
          return []
        }

        const allergensList = normalizeListField(itemDraft.allergens)
        if (allergensList.length > 0) fd.append("allergens", JSON.stringify(allergensList))

        const dietaryList = normalizeListField(itemDraft.dietary_tags)
        if (dietaryList.length > 0) fd.append("dietary_tags", JSON.stringify(dietaryList))

        const ingredientsList = normalizeListField(itemDraft.ingredients)
        if (ingredientsList.length > 0) fd.append("ingredients", JSON.stringify(ingredientsList))

        if (itemDraft.prep_time) fd.append("prep_time", String(itemDraft.prep_time))
        if (itemDraft.estimated_prep_time) fd.append("estimated_prep_time", String(itemDraft.estimated_prep_time))
        if (itemDraft.prep_minutes) fd.append("prep_minutes", String(itemDraft.prep_minutes))
        if (itemDraft.service_time) fd.append("service_time", String(itemDraft.service_time))

        if (itemDraft.chef_notes) fd.append("chef_notes", String(itemDraft.chef_notes))
        if (itemDraft.notes) fd.append("notes", String(itemDraft.notes))
        if (itemDraft.kitchen_notes) fd.append("kitchen_notes", String(itemDraft.kitchen_notes))

        if (itemDraft.freshness) fd.append("freshness", String(itemDraft.freshness))
        fd.append("freshly_made", String(Boolean(itemDraft.freshly_made)))

        fd.append("is_featured", String(Boolean(itemDraft.is_featured)))
        fd.append("is_popular", String(Boolean(itemDraft.is_popular)))
        fd.append("is_signature", String(Boolean(itemDraft.is_signature)))
        fd.append("chef_pick", String(Boolean(itemDraft.chef_pick)))
        fd.append("chef_choice", String(Boolean(itemDraft.chef_choice)))

        if (keepImageUrls && keepImageUrls.length > 0) {
          for (const url of keepImageUrls) {
            fd.append("keep_image_urls", url)
          }
        }

        if (mediaIds.length > 0) {
          fd.append("images", JSON.stringify(mediaIds))
        }

        return fd
      }

      const uploadMenuItemImages = async (files: File[]) => {
        if (files.length === 0) return { urls: [] as string[], mediaIds: [] as string[] }

        const urls: string[] = []
        const mediaIds: string[] = []

        setUploadStage("uploading_media")
        setUploadProgress(0)

        for (let index = 0; index < files.length; index += 1) {
          const file = files[index]
          const fd = new FormData()
          fd.append("file", file, file.name)
          fd.append("key_prefix", `restaurants/${restaurantId}/items`)

          const mediaRes = await apiFetchWithProgress<any>("/media/upload", {
            method: "POST",
            token,
            body: fd,
            onProgress: (pct) => {
              const overall = ((index + pct / 100) / files.length) * 100
              setUploadProgress(Math.max(1, Math.min(95, Math.round(overall))))
            },
          })

          const mediaData = mediaRes?.data || mediaRes
          const uploadedUrl = String(mediaData?.url || mediaData?.public_url || "").trim()
          const uploadedId = String(mediaData?.id || mediaData?.media_id || "").trim()

          if (uploadedUrl) urls.push(uploadedUrl)
          if (uploadedId) mediaIds.push(uploadedId)
        }

        return { urls, mediaIds }
      }

      const syncItemDiscount = async (itemId: string) => {
        const existingItemDiscount = getItemSpecificDiscount(itemId)

        if (!itemDraft.discount_enabled) {
          if (existingItemDiscount?.id) {
            const currentTargets = (existingItemDiscount.entity_ids || []).map((entry) => String(entry))
            const remainingTargets = currentTargets.filter((entry) => entry !== String(itemId))

            if (remainingTargets.length > 0) {
              await apiFetch(`/my-restaurants/${restaurantId}/discounts/${existingItemDiscount.id}`, {
                method: "PATCH",
                token,
                body: {
                  entity_ids: remainingTargets,
                  applicable_to: "specific_items",
                },
              })
            } else {
              await apiFetch(`/my-restaurants/${restaurantId}/discounts/${existingItemDiscount.id}`, {
                method: "DELETE",
                token,
              })
            }
          }
          return
        }

        const payload: Record<string, any> = {
          name: itemDraft.discount_name.trim() || `${itemDraft.name.trim()} Discount`,
          code: buildDiscountCode(itemDraft.discount_name.trim() || itemDraft.name.trim()),
          description: `Item-level discount for ${itemDraft.name.trim()}`,
          discount_type: itemDraft.discount_type,
          discount_value: numericDiscountValue,
          applicable_to: "specific_items",
          entity_ids: [String(itemId)],
          minimum_order_amount: 0,
          max_uses: 0,
          stackable: false,
          is_active: true,
        }

        if (itemDraft.discount_start_date && itemDraft.discount_end_date) {
          payload.start_date = toIsoStartOfDay(itemDraft.discount_start_date)
          payload.end_date = toIsoEndOfDay(itemDraft.discount_end_date)
        }

        if (existingItemDiscount?.id) {
          await apiFetch(`/my-restaurants/${restaurantId}/discounts/${existingItemDiscount.id}`, {
            method: "PATCH",
            token,
            body: payload,
          })
        } else {
          await apiFetch(`/my-restaurants/${restaurantId}/discounts`, {
            method: "POST",
            token,
            body: payload,
          })
        }
      }

      setUploadProgress(0)
      const uploadedMedia = await uploadMenuItemImages(newImageFiles)
      setUploadStage("saving_item")
      const saveRes = await apiFetchWithProgress<any>(url, {
        method,
        token,
        body: buildFormData(false, uploadedMedia.mediaIds, existingImageUrlsSnapshot),
        onProgress: (pct) => setUploadProgress(Math.max(95, Math.min(100, pct))),
      })

      const createdItemId = String(saveRes?.data?.id || saveRes?.id || activeItem?.id || "").trim()

      if (!activeItem && uploadedMedia.urls.length > 0) {
        const optimisticItem = normalizeItem({
          id: createdItemId || `temp-${Date.now()}`,
          name: joinCompositeName(itemDraft.name, itemDraft.name_secondary, normalizedExtraNames),
          description: itemDraft.description.trim(),
          price: numericPrice,
          currency: itemDraft.currency || "ETB",
          category_id: targetCategoryId,
          is_available: itemDraft.is_available,
          available: itemDraft.is_available,
          spice_level: itemDraft.spice_level,
          calories: itemDraft.calories || itemDraft.prep_minutes || itemDraft.prep_time || itemDraft.estimated_prep_time,
          image_urls: uploadedMedia.urls,
          images: uploadedMedia.urls,
        })

        setItems((prev) => [optimisticItem, ...prev.filter((entry) => entry.id !== optimisticItem.id)])
      }

      if (createdItemId) {
        for (let attempt = 0; attempt < 3; attempt += 1) {
          if (attempt > 0) {
            await new Promise((resolve) => setTimeout(resolve, 500 * attempt))
          }

          const res = await apiFetch<any>(`/my-restaurants/${restaurantId}/categories/${targetCategoryId}/items`, { token })
          const itemsList = extractList(res).map(normalizeItem)
          const createdItem = itemsList.find((entry) => String(entry.id) === createdItemId)
          const createdImages = createdItem ? getImageUrls(createdItem.image_urls || createdItem.images || createdItem.image || createdItem.image_url) : []

          if (createdItem && createdImages.length > 0) {
            setItems(itemsList)
            break
          }
        }
      }

      const savedItemId = activeItem ? String(activeItem.id) : null

      if (savedItemId) {
        try {
          await syncItemDiscount(savedItemId)
        } catch (discountErr: any) {
          toast({
            title: "Item saved, discount failed",
            description: String(discountErr?.message || "Could not save discount for this item."),
            variant: "destructive",
          })
        }
      }

      toast({ title: activeItem ? "Item updated" : "Item created" })
      setUploadProgress(0)
      setUploadStage("idle")
      setItemDialogOpen(false)
      setItemStep(1)
      setActiveItem(null)
      setCategoryId(targetCategoryId)
      await refreshItems(restaurantId, targetCategoryId)
      await refreshDiscounts(restaurantId)
    } catch (err: any) {
      toast({ title: activeItem ? "Item update failed" : "Item create failed", description: getMenuErrorMessage(err, activeItem ? "Unable to update this menu item." : "Unable to create this menu item."), variant: "destructive" })
    } finally {
      setUploadStage("idle")
      setSavingItem(false)
    }
  }

  const handleDeleteItem = async () => {
    if (!token || !activeItem || !restaurantId || !categoryId) return
    try {
      setDeletingItem(true)
      await apiFetch(`/my-restaurants/${restaurantId}/categories/${categoryId}/items/${activeItem.id}`, {
        method: "DELETE",
        token,
      })
      toast({ title: "Item deleted" })
      setDeleteItemOpen(false)
      await refreshItems(restaurantId, categoryId)
    } catch (err: any) {
      toast({ title: "Item delete failed", description: getMenuErrorMessage(err, "Unable to delete this menu item."), variant: "destructive" })
    } finally {
      setDeletingItem(false)
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
    <div className="dashboard-surface-polish flex flex-col gap-4 md:gap-6 pt-1 sm:pt-2 pb-20 px-3 sm:px-4 lg:px-0 overflow-x-hidden">
       {/* Menu management */}
      <div className="bg-card/40 backdrop-blur-3xl border border-border/60 rounded-3xl p-4 md:p-6 flex flex-col lg:flex-row items-center justify-between gap-6 md:gap-8 shadow-3xl relative overflow-visible group">
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

      <div className="relative z-20 flex flex-col gap-6 md:gap-8 md:flex-row md:items-end md:justify-between px-2 min-w-0">
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
            <div className="relative z-30 flex w-full md:w-full md:max-w-115 min-w-0 flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4 bg-card/70 p-2.5 md:p-3 rounded-2xl border border-border/70 ring-1 ring-border/60 shadow-2xl">
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.35em] text-primary">Managing Restaurant</span>
                <div className="relative z-40 group/select">
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
              <div key={cat.id} className={cn("group flex items-center justify-between p-3.5 md:p-4 rounded-xl transition-all cursor-pointer border shadow-lg hover:translate-x-1 shrink-0 min-w-30 lg:min-w-0", categoryId === cat.id ? "bg-primary text-white border-primary shadow-[0_15px_30px_-10px_rgba(230,57,70,0.4)]" : "bg-card/40 backdrop-blur-md border-border/70 hover:border-primary/30")} onClick={() => setCategoryId(cat.id)}>
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
          <div className="relative z-10 flex flex-col gap-3 md:flex-row md:items-center bg-card/60 backdrop-blur-3xl p-2 rounded-2xl border border-border/70 ring-1 ring-border/60 shadow-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/40" />
              <Input placeholder="Search Ethiopian dishes..." className="pl-12 border-none bg-transparent h-11 focus-visible:ring-0 text-sm font-bold placeholder:text-muted-foreground/20 text-foreground" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <div className="relative z-20 flex w-full md:w-auto items-center gap-3 pr-0 md:pr-2">
              <select className="h-11 w-full sm:w-52 rounded-xl border border-border/50 bg-muted/40 px-4 text-[9px] font-black uppercase tracking-[0.16em] focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all appearance-none cursor-pointer pr-10 hover:bg-muted/60 text-foreground" style={{ backgroundImage: `url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e\")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.8rem center', backgroundSize: '1em' }} value={availabilityFilter} onChange={(e) => setAvailabilityFilter(e.target.value as any)}>
                <option value="all" className="bg-card text-foreground">All items</option>
                <option value="available" className="bg-card text-foreground">Available</option>
                <option value="unavailable" className="bg-card text-foreground">Unavailable</option>
              </select>
              <Button className="h-11 shrink-0 rounded-xl px-4 md:px-5 gap-2.5 justify-center shadow-[0_20px_40px_-12px_rgba(230,57,70,0.3)] bg-primary hover:bg-primary/90 text-white font-black uppercase text-[9px] md:text-[10px] tracking-[0.12em] whitespace-nowrap transition-all hover:scale-105 active:scale-95" disabled={isCreatingItem} onClick={() => openItemDialog(null, 1)}>
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
                const linkedDiscount = getItemSpecificDiscount(item.id)
                const discountedPrice = computeDiscountedPrice(Number(item.price || 0), linkedDiscount)
                const hasDiscount = Boolean(linkedDiscount) && discountedPrice < Number(item.price || 0)
                // Robust category lookup
                const category = categories.find((c) => String(c.id) === String(item.category_id))
                const categoryName = category?.name || "Uncategorized"
                
                const rawImages = item.image_urls || item.images || item.image || item.image_url
                const images = getImageUrls(rawImages)
                if (images.length === 0) images.push("/placeholder.svg")
                
                return (
                  <div key={item.id} className="h-full">
                    <Card className="group h-full gap-0 overflow-hidden rounded-3xl border border-border/70 bg-card/40 backdrop-blur-3xl ring-1 ring-border/60 shadow-xl transition-all duration-500 hover:border-primary/40 hover:shadow-[0_20px_40px_-10px_rgba(230,57,70,0.2)] flex flex-col">
                      <div className="relative aspect-16/10 overflow-hidden shrink-0">
                        {images[0] && (
                          <Image 
                            src={images[0]} 
                            alt={item.name || "Item"} 
                            fill 
                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                            unoptimized={images[0].startsWith('http')}
                          />
                        )}
                        <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent opacity-80" />
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
                          {hasDiscount && (
                            <div className="flex items-center gap-1.5 px-2 h-5 bg-primary/90 backdrop-blur-md rounded-md border border-primary/60">
                              <span className="text-[7px] font-black text-white tracking-widest uppercase">
                                {normalizeDiscountType(linkedDiscount?.discount_type) === "percentage"
                                  ? `${Number(linkedDiscount?.discount_value || 0)}% OFF`
                                  : `ETB ${Number(linkedDiscount?.discount_value || 0)} OFF`}
                              </span>
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
                            {item.price !== undefined && item.price !== null ? (
                              hasDiscount ? (
                                <span className="inline-flex flex-col items-end leading-tight">
                                  <span>
                                    {item.currency === "EUR" ? "€" : "ETB "}
                                    {discountedPrice.toLocaleString()}
                                  </span>
                                  <span className="text-[11px] font-bold text-muted-foreground line-through not-italic">
                                    {item.currency === "EUR" ? "€" : "ETB "}
                                    {parseFloat(item.price.toString()).toLocaleString()}
                                  </span>
                                </span>
                              ) : (
                                `${item.currency === "EUR" ? "€" : "ETB "}${parseFloat(item.price.toString()).toLocaleString()}`
                              )
                            ) : "N/A"}
                          </span>
                        </div>
                        <CardDescription className="mt-2 line-clamp-2 min-h-10 text-xs font-medium leading-relaxed text-muted-foreground/90 transition-colors group-hover:text-foreground">
                          {item.description || "No description provided."}
                        </CardDescription>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {String(item.spice_level || "0") !== "0" ? (
                            <Badge className="rounded-md border border-orange-400/20 bg-orange-500/10 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-orange-500">
                              Spice {item.spice_level}
                            </Badge>
                          ) : null}
                          {item.calories || item.calogy ? (
                            <Badge className="rounded-md border border-blue-400/20 bg-blue-500/10 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-blue-500">
                              {Number(item.calories || item.calogy || 0).toLocaleString()} cal
                            </Badge>
                          ) : null}
                        </div>
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
                        <div className="mt-3 grid grid-cols-2 md:grid-cols-2 gap-2 min-w-0">
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
                              variant="outline"
                              size="sm"
                              className="h-8 w-full min-w-0 rounded-md border-primary/40 text-primary px-2 text-[9px] font-black uppercase tracking-[0.12em] hover:bg-primary/10"
                              onClick={() => openItemDialog(item, 1)}
                            >
                              <TrendingUp className="mr-1.5 h-3 w-3 shrink-0" />
                              <span className="truncate">Discount</span>
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
        <DialogContent className="bg-card border-border text-foreground rounded-4xl p-6 md:p-10 max-w-2xl w-[95vw] md:w-full overflow-y-auto max-h-[90vh]">
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

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Name in other language(s)</Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-lg px-2 text-[10px] font-black uppercase tracking-widest"
                      disabled={(itemDraft.name_secondary ? 1 : 0) + itemDraft.extra_names.length >= MAX_SECONDARY_NAME_FIELDS}
                      onClick={() => {
                        setItemDraft((p) => {
                          const usedSlots = (p.name_secondary ? 1 : 0) + p.extra_names.length
                          if (usedSlots >= MAX_SECONDARY_NAME_FIELDS) return p
                          if (!p.name_secondary.trim()) return { ...p, name_secondary: "" }
                          return { ...p, extra_names: [...p.extra_names, ""] }
                        })
                      }}
                    >
                      <Plus className="mr-1 h-3 w-3" /> Add language
                    </Button>
                  </div>

                  <Input
                    className="bg-muted border-border/50 h-12 rounded-xl focus:ring-primary/20"
                    placeholder="e.g. ዶሮ ወጥ"
                    value={itemDraft.name_secondary}
                    onChange={e => setItemDraft(p => ({ ...p, name_secondary: e.target.value }))}
                  />

                  {itemDraft.extra_names.map((value, index) => (
                    <div key={`extra-name-${index}`} className="flex items-center gap-2">
                      <Input
                        className="bg-muted border-border/50 h-12 rounded-xl focus:ring-primary/20"
                        placeholder={`Additional language ${index + 2}`}
                        value={value}
                        onChange={(e) =>
                          setItemDraft((p) => {
                            const next = [...p.extra_names]
                            next[index] = e.target.value
                            return { ...p, extra_names: next }
                          })
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 shrink-0 rounded-lg"
                        onClick={() =>
                          setItemDraft((p) => ({
                            ...p,
                            extra_names: p.extra_names.filter((_, i) => i !== index),
                          }))
                        }
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  <p className="text-[10px] text-muted-foreground">
                    Up to {MAX_SECONDARY_NAME_FIELDS} secondary languages are saved to the backend as one string with {MULTI_LANGUAGE_SEPARATOR}.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Category</Label>
                  <select
                    className="h-12 w-full rounded-xl border border-border/50 bg-muted px-4 text-sm font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                    value={itemDraft.category_id}
                    onChange={(e) => setItemDraft((p) => ({ ...p, category_id: e.target.value }))}
                  >
                    <option value="" disabled>Select category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Spice level</Label>
                    <select
                      className="h-12 w-full rounded-xl border border-border/50 bg-muted px-4 text-sm font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                      value={itemDraft.spice_level}
                      onChange={(e) => setItemDraft((p) => ({ ...p, spice_level: e.target.value }))}
                    >
                      <option value="0">Not specified</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Calories</Label>
                    <Input
                      type="number"
                      min="0"
                      className="bg-muted border-border/50 h-12 rounded-xl"
                      value={itemDraft.calories}
                      onChange={(e) => setItemDraft((p) => ({ ...p, calories: e.target.value }))}
                      placeholder="550"
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

                {/* additional details moved to step 2 for compactness */}

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

                <div className="space-y-4 rounded-xl border border-border/50 bg-muted/30 p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Item Discount</span>
                      <p className="text-xs text-muted-foreground">Apply a discount rule only to this item.</p>
                    </div>
                    <Switch
                      checked={itemDraft.discount_enabled}
                      onCheckedChange={(checked) =>
                        setItemDraft((p) => ({ ...p, discount_enabled: checked }))
                      }
                    />
                  </div>

                  {itemDraft.discount_enabled && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Discount name</Label>
                        <Input
                          className="bg-muted border-border/50 h-11 rounded-xl"
                          placeholder="e.g. Weekend Offer"
                          value={itemDraft.discount_name}
                          onChange={(e) => setItemDraft((p) => ({ ...p, discount_name: e.target.value }))}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Type</Label>
                          <select
                            className="h-11 w-full rounded-xl border border-border/50 bg-muted px-4 text-sm font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                            value={itemDraft.discount_type}
                            onChange={(e) =>
                              setItemDraft((p) => ({ ...p, discount_type: normalizeDiscountType(e.target.value) }))
                            }
                          >
                            <option value="percentage">Percentage</option>
                            <option value="fixed_amount">Fixed amount</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            Value {itemDraft.discount_type === "percentage" ? "(%)" : `(${itemDraft.currency || "ETB"})`}
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            className="bg-muted border-border/50 h-11 rounded-xl"
                            value={itemDraft.discount_value}
                            onChange={(e) => setItemDraft((p) => ({ ...p, discount_value: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Start date</Label>
                          <Input
                            type="date"
                            className="bg-muted border-border/50 h-11 rounded-xl"
                            value={itemDraft.discount_start_date}
                            onChange={(e) => setItemDraft((p) => ({ ...p, discount_start_date: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">End date</Label>
                          <Input
                            type="date"
                            className="bg-muted border-border/50 h-11 rounded-xl"
                            value={itemDraft.discount_end_date}
                            onChange={(e) => setItemDraft((p) => ({ ...p, discount_end_date: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>
                  )}
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
                      onChange={e => {
                        const files = Array.from(e.target.files || [])
                        appendAllowedItemImages(files)
                        e.currentTarget.value = ""
                      }}
                    />
                    <span className="block text-[10px] text-muted-foreground mt-1">(max size 5MB)</span>
                  </div>
                </div>

                {/* moved additional details from step 1 here */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Additional details</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ingredients (comma separated)</Label>
                      <Input
                        className="bg-muted border-border/50 h-11 rounded-xl"
                        placeholder="e.g. chicken, onion, garlic"
                        value={Array.isArray(itemDraft.ingredients) ? (itemDraft.ingredients as string[]).join(", ") : String(itemDraft.ingredients || "")}
                        onChange={(e) => setItemDraft(p => ({ ...p, ingredients: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Allergens (comma separated)</Label>
                      <Input
                        className="bg-muted border-border/50 h-11 rounded-xl"
                        placeholder="e.g. peanuts, dairy"
                        value={Array.isArray(itemDraft.allergens) ? (itemDraft.allergens as string[]).join(", ") : String(itemDraft.allergens || "")}
                        onChange={(e) => setItemDraft(p => ({ ...p, allergens: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Dietary tags (comma separated)</Label>
                      <Input
                        className="bg-muted border-border/50 h-11 rounded-xl"
                        placeholder="e.g. vegan, gluten-free"
                        value={Array.isArray(itemDraft.dietary_tags) ? (itemDraft.dietary_tags as string[]).join(", ") : String(itemDraft.dietary_tags || "")}
                        onChange={(e) => setItemDraft(p => ({ ...p, dietary_tags: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Prep time / Estimated / Minutes</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <Input className="bg-muted border-border/50 h-11 rounded-xl" placeholder="15 min" value={itemDraft.prep_time} onChange={e => setItemDraft(p => ({ ...p, prep_time: e.target.value }))} />
                        <Input className="bg-muted border-border/50 h-11 rounded-xl" placeholder="15-20 min" value={itemDraft.estimated_prep_time} onChange={e => setItemDraft(p => ({ ...p, estimated_prep_time: e.target.value }))} />
                        <Input className="bg-muted border-border/50 h-11 rounded-xl" placeholder="15" value={itemDraft.prep_minutes} onChange={e => setItemDraft(p => ({ ...p, prep_minutes: e.target.value }))} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Service time</Label>
                      <Input className="bg-muted border-border/50 h-11 rounded-xl" placeholder="e.g. 20 min" value={itemDraft.service_time} onChange={e => setItemDraft(p => ({ ...p, service_time: e.target.value }))} />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Chef notes / Kitchen notes</Label>
                      <Input className="bg-muted border-border/50 h-11 rounded-xl" placeholder="Short note for chefs" value={itemDraft.chef_notes} onChange={e => setItemDraft(p => ({ ...p, chef_notes: e.target.value }))} />
                      <Input className="bg-muted border-border/50 h-11 rounded-xl mt-2" placeholder="Public notes" value={itemDraft.notes} onChange={e => setItemDraft(p => ({ ...p, notes: e.target.value }))} />
                      <Input className="bg-muted border-border/50 h-11 rounded-xl mt-2" placeholder="Kitchen-only notes" value={itemDraft.kitchen_notes} onChange={e => setItemDraft(p => ({ ...p, kitchen_notes: e.target.value }))} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-muted border border-border/50 min-w-0">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Freshly made</span>
                        <p className="text-xs text-muted-foreground">Mark as freshly prepared</p>
                      </div>
                      <Switch className="shrink-0" checked={itemDraft.freshly_made} onCheckedChange={checked => setItemDraft(p => ({ ...p, freshly_made: checked }))} />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-muted border border-border/50 min-w-0">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Featured</span>
                      </div>
                      <Switch className="shrink-0" checked={itemDraft.is_featured} onCheckedChange={checked => setItemDraft(p => ({ ...p, is_featured: checked }))} />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-muted border border-border/50 min-w-0">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Popular</span>
                      </div>
                      <Switch className="shrink-0" checked={itemDraft.is_popular} onCheckedChange={checked => setItemDraft(p => ({ ...p, is_popular: checked }))} />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-muted border border-border/50 min-w-0">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Signature</span>
                      </div>
                      <Switch className="shrink-0" checked={itemDraft.is_signature} onCheckedChange={checked => setItemDraft(p => ({ ...p, is_signature: checked }))} />
                    </div>
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
                        <span>
                          {uploadStage === "uploading_media" ? "Uploading media" : uploadStage === "saving_item" ? "Saving item" : "Processing"}
                        </span>
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
                disabled={!itemDraft.name.trim() || !itemDraft.category_id}
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
            <AlertDialogAction
              className="flex-1 h-12 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest"
              onClick={(event) => {
                event.preventDefault()
                void handleDeleteItem()
              }}
              disabled={deletingItem}
            >
              {deletingItem ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
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
