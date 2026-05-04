"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, X, Flame, Clock, Star, Sparkles } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { cn, getImageUrl, getImageUrls } from "@/lib/utils"
import { apiFetch, apiFetchOrNull } from "@/lib/api-client"
import { fetchPublicRestaurantBySlugOrId } from "@/lib/public-restaurant"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer"

import { LoadingSignal } from "@/components/ui/loading-signal"
import { ThemeToggle } from "@/components/theme-toggle"

// Template Imports
import { MenuItem, Category, Restaurant } from "./menu-templates/types"
import Template1 from "./menu-templates/Template1"
import Template2 from "./menu-templates/Template2"
import Template3 from "./menu-templates/Template3"

function resolveMenuTheme(hotel: Restaurant | null) {
  const themeSource = (hotel as any)?.theme || hotel || {}
  return {
    primaryColor:
      (themeSource as any)?.primaryColor ||
      (themeSource as any)?.primary_color ||
      (themeSource as any)?.brand_primary_color,
    secondaryColor:
      (themeSource as any)?.secondaryColor ||
      (themeSource as any)?.secondary_color ||
      (themeSource as any)?.brand_secondary_color,
    fontFamily:
      (themeSource as any)?.fontFamily ||
      (themeSource as any)?.font_family ||
      (themeSource as any)?.brand_font_family,
  }
}

type DiscountRule = {
  id: string
  name?: string
  code?: string
  description?: string
  discount_type?: "percentage" | "fixed_amount" | string
  discount_value?: number
  applicable_to?: "all_items" | "specific_categories" | "specific_items" | string
  entity_ids?: Array<string | number>
  start_date?: string
  end_date?: string
  is_active?: boolean
}

interface MenuListClientProps {
    hotelSlug: string
    initialHotel?: Restaurant | null
    initialCategories?: Category[]
    initialItems?: MenuItem[]
}

function extractList(payload: any): any[] {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.data?.items)) return payload.data.items
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.results)) return payload.results
  return []
}

function normalizeMenuItem(item: any, fallbackCategoryId: string): MenuItem {
  const resolvedImageUrls = getImageUrls(
    item?.image_urls ||
    item?.images ||
    item?.image ||
    item?.image_url ||
    item?.thumbnail_url ||
    item?.media ||
    item?.media_ref ||
    item?.media_id
  )

  const resolvedPrimaryImage =
    getImageUrl(
      item?.image_url ||
      item?.image ||
      item?.images ||
      item?.thumbnail_url ||
      item?.media ||
      item?.media_ref ||
      item?.media_id
    ) || resolvedImageUrls[0]

  return {
    ...item,
    id: String(item?.id || item?.ID || item?.uuid || `item-${Math.random()}`),
    name: String(item?.name || "Menu Item"),
    description: String(item?.description || ""),
    price: Number(item?.price || 0),
    currency: String(item?.currency || "ETB"),
    category_id: String(item?.category_id || fallbackCategoryId || ""),
    is_available: Boolean(item?.available ?? item?.is_available ?? true),
    available: Boolean(item?.available ?? item?.is_available ?? true),
    image: item?.image,
    images: item?.images,
    image_url: item?.image_url || item?.image?.url || item?.images?.[0]?.url || resolvedPrimaryImage,
    image_urls: Array.isArray(item?.image_urls) ? item.image_urls : undefined,
    rating: Number(item?.rating || 0),
    rating_count: Number(item?.rating_count || 0),
    prep_time: String(item?.prep_time || item?.prepTime || ""),
    estimated_prep_time: String(item?.estimated_prep_time || item?.estimatedPrepTime || ""),
    prep_minutes: item?.prep_minutes ?? item?.prepMinutes,
    service_time: String(item?.service_time || item?.serviceTime || ""),
    calories: item?.calories ?? item?.calory ?? item?.calogy,
    calogy: item?.calogy ?? item?.calories ?? item?.calory,
    spice_level: item?.spice_level ?? item?.spiceLevel,
    allergens: parseTextList(item?.allergens ?? item?.allergy_list ?? item?.allergyList),
    dietary_tags: parseTextList(item?.dietary_tags ?? item?.dietaryTags),
    ingredients: parseTextList(item?.ingredients ?? item?.ingredient_list ?? item?.ingredientList),
    chef_notes: String(item?.chef_notes || ""),
    notes: String(item?.notes || ""),
    kitchen_notes: String(item?.kitchen_notes || ""),
    freshness: String(item?.freshness || ""),
    freshly_made: item?.freshly_made,
    is_fresh: Boolean(item?.is_fresh),
    is_featured: Boolean(item?.is_featured),
    is_popular: Boolean(item?.is_popular),
    is_signature: Boolean(item?.is_signature),
    chef_pick: Boolean(item?.chef_pick),
    chef_choice: Boolean(item?.chef_choice),
    is_chef_pick: Boolean(item?.is_chef_pick),
    discounted_price: Number(item?.discounted_price || item?.final_price || item?.price_after_discount || 0) || undefined,
    original_price: Number(item?.original_price || 0) || undefined,
    discount: item?.discount,
  }
}

function normalizeApplicableTo(value: unknown): "all_items" | "specific_categories" | "specific_items" {
  const raw = String(value || "all_items").toLowerCase().replace(/-/g, "_")
  if (raw === "all" || raw === "all_items") return "all_items"
  if (raw === "specific_categories" || raw === "categories") return "specific_categories"
  if (raw === "specific_items" || raw === "items") return "specific_items"
  return "all_items"
}

function normalizeDiscountRule(raw: any): DiscountRule {
  return {
    id: String(raw?.id || raw?.uuid || ""),
    name: raw?.name,
    code: raw?.code,
    description: raw?.description,
    discount_type: String(raw?.discount_type || "").toLowerCase(),
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

function isRuleWithinDateRange(rule: DiscountRule): boolean {
  const now = new Date()
  if (rule.start_date) {
    const start = new Date(rule.start_date)
    if (!Number.isNaN(start.getTime()) && now < start) return false
  }
  if (rule.end_date) {
    const end = new Date(rule.end_date)
    if (!Number.isNaN(end.getTime()) && now > end) return false
  }
  return true
}

function computeDiscountedPrice(price: number, rule: DiscountRule): number {
  const rawValue = Number(rule.discount_value || 0)
  if (!Number.isFinite(rawValue) || rawValue <= 0) return price

  let reduced = price
  if (String(rule.discount_type).toLowerCase() === "percentage") {
    reduced = price - (price * rawValue) / 100
  } else {
    reduced = price - rawValue
  }

  return Math.max(0, Number(reduced.toFixed(2)))
}

function findBestDiscountForItem(item: MenuItem, rules: DiscountRule[]): DiscountRule | null {
  const itemId = String(item.id)
  const categoryId = String(item.category_id)

  const candidates = rules.filter((rule) => {
    if (rule.is_active === false) return false
    if (!isRuleWithinDateRange(rule)) return false

    const scope = normalizeApplicableTo(rule.applicable_to)
    if (scope === "all_items") return true

    const targets = (rule.entity_ids || []).map((entry) => String(entry))
    if (scope === "specific_items") {
      return targets.includes(itemId)
    }
    if (scope === "specific_categories") {
      return targets.includes(categoryId)
    }
    return false
  })

  if (candidates.length === 0) return null

  let best: DiscountRule | null = null
  let bestSavings = 0
  for (const candidate of candidates) {
    const discounted = computeDiscountedPrice(item.price, candidate)
    const savings = item.price - discounted
    if (savings > bestSavings) {
      bestSavings = savings
      best = candidate
    }
  }

  return best
}

function applyDiscountToItem(item: MenuItem, rules: DiscountRule[]): MenuItem {
  const bestRule = findBestDiscountForItem(item, rules)
  if (!bestRule) {
    return {
      ...item,
      discounted_price: undefined,
      original_price: undefined,
      discount: undefined,
    }
  }

  const discountedPrice = computeDiscountedPrice(item.price, bestRule)
  if (discountedPrice >= item.price) {
    return {
      ...item,
      discounted_price: undefined,
      original_price: undefined,
      discount: undefined,
    }
  }

  const savingsAmount = Number((item.price - discountedPrice).toFixed(2))
  const discountLabel =
    String(bestRule.discount_type).toLowerCase() === "percentage"
      ? `${Number(bestRule.discount_value || 0)}% OFF`
      : `${item.currency} ${Number(bestRule.discount_value || 0).toFixed(2)} OFF`

  return {
    ...item,
    discounted_price: discountedPrice,
    original_price: item.price,
    discount: {
      id: bestRule.id,
      name: bestRule.name,
      code: bestRule.code,
      discount_type: bestRule.discount_type,
      discount_value: bestRule.discount_value,
      label: discountLabel,
      savings_amount: savingsAmount,
    },
  }
}

function formatPrice(value: number, currency: string) {
  const safe = Number.isFinite(value) ? value : 0
  return `${currency} ${safe.toFixed(2)}`
}

function parseTextList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean)
  }

  if (typeof value === "string") {
    const trimmed = value.trim()
    if (!trimmed) return []

    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed.map((entry) => String(entry).trim()).filter(Boolean)
      }
    } catch {
      // Fall back to delimiter splitting.
    }

    return trimmed.split(/[,|]/).map((entry) => entry.trim()).filter(Boolean)
  }

  if (value === null || value === undefined || value === false) {
    return []
  }

  return [String(value).trim()].filter(Boolean)
}

function pickFirstText(...values: unknown[]) {
  for (const value of values) {
    if (Array.isArray(value)) {
      const parsed = parseTextList(value)
      if (parsed.length > 0) return parsed.join(", ")
      continue
    }

    if (value === null || value === undefined || value === "") {
      continue
    }

    const text = String(value).trim()
    if (text) return text
  }

  return ""
}

function toNumberOrNull(value: unknown) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : null
}

function getItemDetails(item: MenuItem) {
  return {
    calories: pickFirstText((item as any).calories, (item as any).calogy),
    spiceLevel: toNumberOrNull((item as any).spice_level),
    prepTime: pickFirstText((item as any).prep_time, (item as any).estimated_prep_time, (item as any).prep_minutes ? `${(item as any).prep_minutes} min` : ""),
    serviceTime: pickFirstText((item as any).service_time),
    dietaryTags: parseTextList((item as any).dietary_tags),
    allergens: parseTextList((item as any).allergens),
    ingredients: parseTextList((item as any).ingredients),
    freshness: pickFirstText((item as any).freshness, (item as any).freshly_made, (item as any).is_fresh ? "Freshly made" : ""),
    chefNotes: pickFirstText((item as any).chef_notes, (item as any).notes, (item as any).kitchen_notes),
  }
}

export default function MenuListClient({ hotelSlug, initialHotel, initialCategories = [], initialItems = [] }: MenuListClientProps) {
  const [hotel, setHotel] = useState<Restaurant | null>(initialHotel || null)
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [activeCategory, setActiveCategory] = useState(initialCategories.length > 0 ? initialCategories[0].id : "")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(!initialHotel && initialCategories.length === 0)
  const [error, setError] = useState<string | null>(null)
  const [itemsLoading, setItemsLoading] = useState(false)
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const menuTheme = resolveMenuTheme(hotel)

  // Determine template (1, 2, or 3) from backend-compatible fields.
  const selectedTemplate = Number(
    (hotel as any)?.template_number || hotel?.public_template || (hotel as any)?.template || 1
  )

  useEffect(() => {
    if (initialHotel && initialCategories.length > 0) {
      setLoading(false)
      setItemsLoading(false)
      return
    }

    const loadData = async () => {
      try {
        if (!initialHotel) setLoading(true)
        setError(null)

        let currentHotel = hotel

        // 1. Refresh restaurant details to keep template/style in sync with latest backend state.
        try {
          const refreshedHotel = await fetchPublicRestaurantBySlugOrId(hotelSlug)
          if (refreshedHotel) {
            currentHotel = refreshedHotel
            setHotel(refreshedHotel)
          }
        } catch {
          // We'll fall back to direct API fetch below if needed.
        }

        // 1. Load Restaurant if missing
        if (!currentHotel || !currentHotel.id) {
          try {
              const rRes = await apiFetchOrNull<any>("/restaurants/" + hotelSlug)
              const rData = rRes?.data || rRes
            const rList = extractList(rData)
            currentHotel = Array.isArray(rData) ? rData[0] : (rData || rList[0])
            if (currentHotel) {
              setHotel(currentHotel)
            } else {
              throw new Error("No restaurant data found")
            }
          } catch (err) {
            setError("Restaurant details could not be loaded.")
            setLoading(false)
            return
          }
        }

        // 2. Load Categories and their items
        const restaurantIdForMenu = currentHotel?.id || hotelSlug 
        
        if (!restaurantIdForMenu || restaurantIdForMenu === "[hotel-slug]") {
          setLoading(false)
          return
        }

        try {
          setItemsLoading(true)
          const cRes = await apiFetch<any>("/restaurants/" + restaurantIdForMenu + "/categories")
          const categoryRows = extractList(cRes)

          let activeDiscounts: DiscountRule[] = []
          try {
            const discountsRes = await apiFetch<any>(
              "/restaurants/" + restaurantIdForMenu + "/discounts?is_active=true"
            )
            activeDiscounts = extractList(discountsRes).map(normalizeDiscountRule)
          } catch {
            activeDiscounts = []
          }

          const categoriesWithItems = await Promise.all(
            categoryRows.map(async (cat: any) => {
              try {
                const itRes = await apiFetch<any>("/restaurants/" + restaurantIdForMenu + "/categories/" + cat.id + "/items")
                const itData = extractList(itRes)
                return {
                  ...cat,
                  id: String(cat?.id || ""),
                  name: String(cat?.name || "Category"),
                  description: cat?.description || "",
                  items: itData
                    .map((it: any) => normalizeMenuItem(it, String(cat?.id || "")))
                    .map((normalizedItem) => applyDiscountToItem(normalizedItem, activeDiscounts)),
                }
              } catch {
                return {
                  ...cat,
                  id: String(cat?.id || ""),
                  name: String(cat?.name || "Category"),
                  description: cat?.description || "",
                  items: [],
                }
              }
            })
          )

          setCategories(categoriesWithItems)
          if (categoriesWithItems.length > 0 && !activeCategory) {
            setActiveCategory(categoriesWithItems[0].id)
          }
        } catch (err) {
        } finally {
          setItemsLoading(false)
        }

      } catch (err: any) {
        setError(err.message || "An unexpected error occurred")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [hotelSlug, initialHotel, initialCategories])

  const templateProps = {
    hotel: hotel || { name: "Restaurant", slug: hotelSlug },
    categories,
    activeCategory,
    onCategoryChange: setActiveCategory,
    onItemClick: setSelectedItem,
    searchQuery,
    onSearchChange: setSearchQuery,
    itemsLoading,
    theme: menuTheme,
  }

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background gap-4">
        <LoadingSignal />
        <p className="text-muted-foreground font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Setting the table...</p>
      </div>
    )
  }

  if (error || !hotel) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background gap-6 text-center p-6">
        <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
          <X className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="text-muted-foreground max-w-xs">{error || "We couldn't load the menu."}</p>
        </div>
        <Button asChild variant="outline" className="rounded-full">
          <Link href={`/${hotelSlug}`}>Try Again</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="fixed top-4 left-4 z-50">
        <Button asChild variant="secondary" className="h-11 rounded-full border border-border/60 bg-background/80 px-4 backdrop-blur-md shadow-lg">
          <Link href={`/${hotelSlug}`} className="inline-flex items-center gap-2 text-foreground">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em]">Back to website</span>
          </Link>
        </Button>
      </div>

      <div className="fixed top-4 right-4 z-50 rounded-xl border border-border/60 bg-background/80 backdrop-blur-md shadow-lg">
        <ThemeToggle />
      </div>

      {/* Template Switcher Logic */}
      {selectedTemplate === 1 && <Template1 {...templateProps} />}
      {selectedTemplate === 2 && <Template2 {...templateProps} />}
      {selectedTemplate === 3 && <Template3 {...templateProps} />}
      {[1, 2, 3].includes(selectedTemplate) ? null : <Template1 {...templateProps} />}

      {/* Shared Item Detail Drawer */}
      <Drawer open={!!selectedItem} onOpenChange={(open) => {
        if (!open) {
          setSelectedItem(null)
          setActiveImageIndex(0)
        }
      }}>
        <DrawerContent
            className="h-dvh max-h-dvh md:h-[92dvh] md:max-h-[92dvh] md:w-[94%] md:max-w-6xl md:mx-auto md:mb-6 rounded-none md:rounded-[36px] border border-border/70 p-0 overflow-hidden shadow-2xl backdrop-blur-xl"
          style={{ backgroundColor: menuTheme.surfaceColor, borderColor: menuTheme.borderColor }}
        >
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-muted rounded-full z-50 md:hidden" />
          {selectedItem && (
            <div className="relative flex h-full min-h-0 flex-col md:flex-row">
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -left-20 top-0 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(216,194,164,0.16),transparent_70%)] blur-3xl" />
                <div className="absolute -right-16 top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(138,90,60,0.12),transparent_70%)] blur-3xl" />
              </div>
              {/* Image Gallery Section */}
              <div className="relative z-10 flex shrink-0 flex-col md:flex-[1.05] overflow-hidden border-b md:border-b-0 md:border-r" style={{ backgroundColor: menuTheme.mutedSurfaceColor, borderColor: menuTheme.borderColor }}>
                <div className="relative aspect-4/3 sm:aspect-square md:aspect-auto md:flex-1 w-full overflow-hidden">
                  {(() => {
                    const images = getImageUrls(selectedItem.image_urls || selectedItem.images || selectedItem.image || selectedItem.image_url);
                    const validImages = images.length > 0 ? images : ["/placeholder.svg"];
                    const currentImg = validImages[activeImageIndex] || validImages[0];
                    
                    return (
                      <div className="h-full w-full relative group">
                        <Image 
                          src={currentImg} 
                          alt={selectedItem.name} 
                          fill 
                          sizes="(max-width: 768px) 100vw, 60vw"
                          className="object-cover transition-all duration-700 ease-in-out" 
                          priority
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/45 via-black/5 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 p-5 md:p-7">
                          {(selectedItem.is_featured || (selectedItem as any).chef_pick || (selectedItem as any).is_chef_pick) && (
                            <div className="inline-flex items-center gap-2 rounded-full bg-black/50 text-white backdrop-blur-md px-3 py-1.5 border border-white/15">
                              <Sparkles className="h-3.5 w-3.5" />
                              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Chef Pick</span>
                            </div>
                          )}
                        </div>
                        
                        {validImages.length > 1 && (
                          <div className="absolute bottom-6 right-6 z-10 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-xs font-bold tracking-widest flex items-center gap-2 border border-white/10 md:hidden">
                            <span>{activeImageIndex + 1}</span>
                            <span className="opacity-40">/</span>
                            <span className="opacity-60">{validImages.length}</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  <div className="absolute top-6 right-6 z-30 md:hidden">
                     <DrawerClose asChild>
                        <Button variant="secondary" size="icon" className="h-10 w-10 rounded-full bg-background/90 backdrop-blur-xl border-none shadow-xl">
                          <X className="h-5 w-5 text-foreground" />
                        </Button>
                     </DrawerClose>
                  </div>
                </div>

                {/* Thumbnail Strip */}
                {(() => {
                  const images = getImageUrls(selectedItem.image_urls || selectedItem.images || selectedItem.image || selectedItem.image_url);
                  if (images.length <= 1) return null;
                  
                  return (
                    <div className="p-4 md:p-6 border-t" style={{ backgroundColor: menuTheme.surfaceColor, borderColor: menuTheme.borderColor }}>
                      <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar justify-center">
                        {images.map((url, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveImageIndex(idx)}
                            className={cn(
                              "relative shrink-0 h-16 w-16 md:h-20 md:w-20 rounded-xl overflow-hidden transition-all duration-300 ring-offset-2",
                              activeImageIndex === idx 
                                ? "ring-2 ring-primary scale-105 shadow-lg" 
                                : "opacity-40 hover:opacity-80 scale-95"
                            )}
                          >
                            <Image src={url} alt={`${selectedItem.name} thumbnail ${idx}`} fill sizes="80px" className="object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Detail Content Section */}
              <div className="relative z-10 min-h-0 flex-1 md:flex-[1.2] overflow-y-auto">
                <div className="hidden md:block absolute top-8 right-8 z-30">
                  <DrawerClose asChild>
                    <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground">
                      <X className="h-6 w-6" />
                    </Button>
                  </DrawerClose>
                </div>

                 <div className="px-5 py-8 md:px-12 md:py-12 flex flex-col gap-8 md:gap-10">
                      {(() => {
                        const itemDetails = getItemDetails(selectedItem)

                        return (
                          <>
                            <div className="space-y-5">
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className="rounded-lg border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em]" style={{ backgroundColor: menuTheme.mutedSurfaceColor, borderColor: menuTheme.borderColor, color: menuTheme.primaryColor }}>
                                  {categories.find((c) => String(c.id) === String(selectedItem.category_id))?.name || "Selection"}
                                </span>
                                {(selectedItem.is_available === false || selectedItem.available === false) && (
                                  <span className="rounded-lg border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-rose-600 dark:text-rose-400" style={{ backgroundColor: "rgba(244, 63, 94, 0.08)", borderColor: "rgba(244, 63, 94, 0.15)" }}>
                                    Sold Out
                                  </span>
                                )}
                                <div className="flex-1 md:hidden" />
                                <div className="md:hidden text-right">
                                  {typeof selectedItem.discounted_price === "number" && selectedItem.discounted_price < selectedItem.price ? (
                                    <>
                                      <div className="text-2xl font-black" style={{ color: menuTheme.primaryColor }}>
                                        {formatPrice(selectedItem.discounted_price, selectedItem.currency)}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        <span className="line-through mr-1">{formatPrice(selectedItem.price, selectedItem.currency)}</span>
                                        {selectedItem.discount?.label || "Offer"}
                                      </div>
                                    </>
                                  ) : (
                                    <div className="text-2xl font-black" style={{ color: menuTheme.primaryColor }}>
                                      {formatPrice(selectedItem.price, selectedItem.currency)}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <DrawerTitle className="text-3xl md:text-5xl font-serif leading-tight tracking-tight" style={{ color: menuTheme.textColor }}>
                                {selectedItem.name}
                              </DrawerTitle>

                              <div className="hidden md:flex items-center gap-4">
                                <div className="h-px w-12" style={{ backgroundColor: menuTheme.borderColor }} />
                                {typeof selectedItem.discounted_price === "number" && selectedItem.discounted_price < selectedItem.price ? (
                                  <div className="flex items-end gap-3">
                                    <div className="text-4xl font-serif" style={{ color: menuTheme.primaryColor }}>
                                      <span className="text-xl font-sans font-bold vertical-super mr-1 opacity-80">{selectedItem.currency}</span>
                                      {selectedItem.discounted_price.toFixed(2)}
                                    </div>
                                    <div className="pb-1 text-sm text-muted-foreground">
                                      <span className="line-through mr-2">{formatPrice(selectedItem.price, selectedItem.currency)}</span>
                                      {selectedItem.discount?.label || "Offer"}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-4xl font-serif" style={{ color: menuTheme.primaryColor }}>
                                    <span className="text-xl font-sans font-bold vertical-super mr-1 opacity-80">{selectedItem.currency}</span>
                                    {Number.isFinite(selectedItem.price) ? selectedItem.price.toFixed(2) : "0.00"}
                                  </div>
                                )}
                              </div>

                              {selectedItem.description ? (
                                <DrawerDescription className="text-lg md:text-xl leading-relaxed font-medium max-w-2xl" style={{ color: menuTheme.mutedTextColor }}>
                                  {selectedItem.description}
                                </DrawerDescription>
                              ) : null}

                              <div className="flex flex-wrap items-center gap-2.5">
                                {Number(selectedItem.rating) > 0 && (
                                  <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold" style={{ borderColor: menuTheme.borderColor, backgroundColor: menuTheme.mutedSurfaceColor, color: menuTheme.mutedTextColor }}>
                                    <Star className="h-3.5 w-3.5 text-amber-500" />
                                    {Number(selectedItem.rating).toFixed(1)} rating
                                  </span>
                                )}

                                {itemDetails.prepTime && (
                                  <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold" style={{ borderColor: menuTheme.borderColor, backgroundColor: menuTheme.mutedSurfaceColor, color: menuTheme.mutedTextColor }}>
                                    <Clock className="h-3.5 w-3.5 text-sky-500" />
                                    {itemDetails.prepTime}
                                  </span>
                                )}

                                {itemDetails.freshness && (
                                  <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold" style={{ borderColor: menuTheme.borderColor, backgroundColor: menuTheme.mutedSurfaceColor, color: menuTheme.mutedTextColor }}>
                                    <Flame className="h-3.5 w-3.5 text-orange-500" />
                                    {itemDetails.freshness}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="rounded-2xl border px-4 py-3 md:px-5 md:py-4" style={{ backgroundColor: menuTheme.mutedSurfaceColor, borderColor: menuTheme.borderColor }}>
                              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm md:text-[15px]">
                                <span className="inline-flex items-center gap-1.5" style={{ color: menuTheme.mutedTextColor }}>
                                  <span className="text-[10px] uppercase tracking-[0.18em] font-black text-muted-foreground">Calories</span>
                                  <span className="font-semibold" style={{ color: menuTheme.textColor }}>{itemDetails.calories || "Not listed"}</span>
                                </span>
                                <span className="hidden md:inline h-4 w-px" style={{ backgroundColor: menuTheme.borderColor }} />
                                <span className="inline-flex items-center gap-1.5" style={{ color: menuTheme.mutedTextColor }}>
                                  <span className="text-[10px] uppercase tracking-[0.18em] font-black text-muted-foreground">Spice</span>
                                  <span className="font-semibold" style={{ color: menuTheme.textColor }}>{itemDetails.spiceLevel !== null ? `${itemDetails.spiceLevel}/5` : "Not listed"}</span>
                                </span>
                                <span className="hidden md:inline h-4 w-px" style={{ backgroundColor: menuTheme.borderColor }} />
                                <span className="inline-flex items-center gap-1.5" style={{ color: menuTheme.mutedTextColor }}>
                                  <span className="text-[10px] uppercase tracking-[0.18em] font-black text-muted-foreground">Prep</span>
                                  <span className="font-semibold" style={{ color: menuTheme.textColor }}>{itemDetails.prepTime || "Not listed"}</span>
                                </span>
                                <span className="hidden md:inline h-4 w-px" style={{ backgroundColor: menuTheme.borderColor }} />
                                <span className="inline-flex items-center gap-1.5" style={{ color: menuTheme.mutedTextColor }}>
                                  <span className="text-[10px] uppercase tracking-[0.18em] font-black text-muted-foreground">Service</span>
                                  <span className="font-semibold" style={{ color: menuTheme.textColor }}>{itemDetails.serviceTime || "Not listed"}</span>
                                </span>
                              </div>
                            </div>

                            {(itemDetails.dietaryTags.length > 0 || itemDetails.allergens.length > 0 || itemDetails.ingredients.length > 0) && (
                              <div className="rounded-3xl border p-5 md:p-7" style={{ backgroundColor: menuTheme.mutedSurfaceColor, borderColor: menuTheme.borderColor }}>
                                <div className="space-y-4">
                                  {itemDetails.dietaryTags.length > 0 && (
                                    <div className="space-y-2">
                                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Dietary tags</p>
                                      <div className="flex flex-wrap gap-2">
                                        {itemDetails.dietaryTags.map((tag) => (
                                          <span key={tag} className="rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: menuTheme.borderColor, backgroundColor: menuTheme.surfaceColor, color: menuTheme.textColor }}>
                                            {tag}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {itemDetails.allergens.length > 0 && (
                                    <div className="space-y-2">
                                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Allergens</p>
                                      <div className="flex flex-wrap gap-2">
                                        {itemDetails.allergens.map((allergen) => (
                                          <span key={allergen} className="rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: menuTheme.borderColor, backgroundColor: menuTheme.surfaceColor, color: menuTheme.textColor }}>
                                            {allergen}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {itemDetails.ingredients.length > 0 && (
                                    <div className="space-y-2">
                                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Ingredients</p>
                                      <div className="flex flex-wrap gap-2">
                                        {itemDetails.ingredients.map((ingredient) => (
                                          <span key={ingredient} className="rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: menuTheme.borderColor, backgroundColor: menuTheme.surfaceColor, color: menuTheme.textColor }}>
                                            {ingredient}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {itemDetails.chefNotes && (
                              <div className="rounded-3xl border p-5 md:p-7" style={{ backgroundColor: menuTheme.surfaceColor, borderColor: menuTheme.borderColor }}>
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Chef Notes</p>
                                <p className="mt-2 text-sm md:text-base leading-relaxed" style={{ color: menuTheme.textColor }}>
                                  {itemDetails.chefNotes}
                                </p>
                              </div>
                            )}

                            <div className="mt-2 md:hidden sticky bottom-0 bg-linear-to-t from-background via-background to-transparent pt-4 pb-2">
                              <Button className="w-full h-14 rounded-2xl text-base font-bold shadow-2xl shadow-primary/20" onClick={() => setSelectedItem(null)}>
                                Continue Browsing
                              </Button>
                            </div>
                          </>
                        )
                      })()}
                </div>
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  )
}