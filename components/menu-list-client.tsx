"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, X, Flame, Clock, Star, Sparkles } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { cn, getImageUrl, getImageUrls } from "@/lib/utils"
import { apiFetch } from "@/lib/api-client"
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

export default function MenuListClient({ hotelSlug, initialHotel, initialCategories = [], initialItems = [] }: MenuListClientProps) {
  const [hotel, setHotel] = useState<Restaurant | null>(initialHotel || null)
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [activeCategory, setActiveCategory] = useState(initialCategories.length > 0 ? initialCategories[0].id : "")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(!initialHotel)
  const [error, setError] = useState<string | null>(null)
  const [itemsLoading, setItemsLoading] = useState(false)
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  // Determine template (1, 2, or 3) from backend-compatible fields.
  const selectedTemplate = Number(
    (hotel as any)?.template_number || hotel?.public_template || (hotel as any)?.template || 1
  )

  useEffect(() => {
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
            const rRes = await apiFetch<any>("/restaurants/" + hotelSlug)
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
  }, [hotelSlug, initialHotel])

  const templateProps = {
    hotel: hotel || { name: "Restaurant", slug: hotelSlug },
    categories,
    activeCategory,
    onCategoryChange: setActiveCategory,
    onItemClick: setSelectedItem,
    searchQuery,
    onSearchChange: setSearchQuery,
    itemsLoading
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
          <Link href={`/${hotelSlug}`} className="inline-flex items-center gap-2">
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
        <DrawerContent className="max-h-[96vh] md:max-h-[90vh] md:w-[92%] md:max-w-6xl md:mx-auto md:mb-6 rounded-t-4xl md:rounded-4xl border border-border/60 bg-background p-0 overflow-hidden shadow-2xl">
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-muted rounded-full z-50 md:hidden" />
          {selectedItem && (
            <div className="flex flex-col md:flex-row h-full bg-background">
              {/* Image Gallery Section */}
              <div className="flex flex-col md:flex-[1.05] bg-secondary/15 overflow-hidden">
                <div className="relative aspect-square md:aspect-auto md:flex-1 w-full overflow-hidden">
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
                    <div className="p-4 md:p-6 bg-secondary/10 border-t border-border">
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
                            <Image src={url} alt={`${selectedItem.name} thumbnail ${idx}`} fill className="object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Detail Content Section */}
              <div className="flex-1 md:flex-[1.2] overflow-y-auto bg-background relative">
                <div className="hidden md:block absolute top-8 right-8 z-30">
                  <DrawerClose asChild>
                    <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground">
                      <X className="h-6 w-6" />
                    </Button>
                  </DrawerClose>
                </div>

                 <div className="px-5 py-8 md:px-12 md:py-12 flex flex-col gap-8 md:gap-10">
                      <div className="space-y-5">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="bg-primary/5 text-primary px-3 py-1 rounded-lg text-[10px] font-black tracking-[0.2em] uppercase border border-primary/10">
                           {categories.find(c => String(c.id) === String(selectedItem.category_id))?.name || "Selection"}
                        </span>
                        {(selectedItem.is_available === false || selectedItem.available === false) && (
                          <span className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 px-3 py-1 rounded-lg text-[10px] font-black tracking-[0.2em] uppercase border border-rose-100 dark:border-rose-900/30">
                             Sold Out
                          </span>
                        )}
                        <div className="flex-1 md:hidden" />
                        <div className="md:hidden text-right">
                          {typeof selectedItem.discounted_price === "number" && selectedItem.discounted_price < selectedItem.price ? (
                            <>
                              <div className="text-2xl font-black text-primary">
                                {formatPrice(selectedItem.discounted_price, selectedItem.currency)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                <span className="line-through mr-1">{formatPrice(selectedItem.price, selectedItem.currency)}</span>
                                {selectedItem.discount?.label || "Offer"}
                              </div>
                            </>
                          ) : (
                            <div className="text-2xl font-black text-primary">
                              {formatPrice(selectedItem.price, selectedItem.currency)}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <DrawerTitle className="text-3xl md:text-5xl font-serif text-foreground leading-tight tracking-tight">
                        {selectedItem.name}
                      </DrawerTitle>

                      <div className="hidden md:flex items-center gap-4">
                        <div className="h-px w-12 bg-primary/20" />
                        {typeof selectedItem.discounted_price === "number" && selectedItem.discounted_price < selectedItem.price ? (
                          <div className="flex items-end gap-3">
                            <div className="text-4xl font-serif text-primary">
                              <span className="text-xl font-sans font-bold vertical-super mr-1 opacity-80">{selectedItem.currency}</span>
                              {selectedItem.discounted_price.toFixed(2)}
                            </div>
                            <div className="pb-1 text-sm text-muted-foreground">
                              <span className="line-through mr-2">{formatPrice(selectedItem.price, selectedItem.currency)}</span>
                              {selectedItem.discount?.label || "Offer"}
                            </div>
                          </div>
                        ) : (
                          <div className="text-4xl font-serif text-primary">
                            <span className="text-xl font-sans font-bold vertical-super mr-1 opacity-80">{selectedItem.currency}</span>
                            {Number.isFinite(selectedItem.price) ? selectedItem.price.toFixed(2) : "0.00"}
                          </div>
                        )}
                      </div>

                      {selectedItem.description ? (
                        <DrawerDescription className="text-lg md:text-xl text-muted-foreground leading-relaxed font-medium max-w-2xl">
                          {selectedItem.description}
                        </DrawerDescription>
                      ) : null}

                      <div className="flex flex-wrap items-center gap-2.5">
                        {Number(selectedItem.rating) > 0 && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/20 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                            <Star className="h-3.5 w-3.5 text-amber-500" />
                            {Number(selectedItem.rating).toFixed(1)} rating
                          </span>
                        )}

                        {((selectedItem as any).prep_time || (selectedItem as any).estimated_prep_time || (selectedItem as any).prep_minutes) && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/20 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                            <Clock className="h-3.5 w-3.5 text-sky-500" />
                            {((selectedItem as any).prep_time && String((selectedItem as any).prep_time)) || ((selectedItem as any).estimated_prep_time && String((selectedItem as any).estimated_prep_time)) || (((selectedItem as any).prep_minutes && `${(selectedItem as any).prep_minutes} min`) || "")}
                          </span>
                        )}

                        {((selectedItem as any).freshness || (selectedItem as any).freshly_made || (selectedItem as any).is_fresh) && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/20 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                            <Flame className="h-3.5 w-3.5 text-orange-500" />
                            {(selectedItem as any).freshness || (selectedItem as any).freshly_made || "Freshly made"}
                          </span>
                        )}
                      </div>
                   </div>

                   {/* Modern Info Tiles */}
                   <div className="grid grid-cols-2 gap-3 md:gap-5">
                      <div className="flex flex-col gap-3 p-5 md:p-7 rounded-4xl bg-secondary/20 border border-border transition-all hover:bg-secondary/30">
                         <div className="h-11 w-11 rounded-2xl bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
                            <Flame className="h-5 w-5" />
                         </div>
                         <div className="space-y-0.5">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Flavor Profile</p>
                            <p className="text-base font-bold text-foreground">Signature Selection</p>
                         </div>
                      </div>
                      <div className="flex flex-col gap-3 p-5 md:p-7 rounded-4xl bg-secondary/20 border border-border transition-all hover:bg-secondary/30">
                         <div className="h-11 w-11 rounded-2xl bg-sky-100 dark:bg-sky-900/20 flex items-center justify-center text-sky-600 dark:text-sky-400">
                            <Clock className="h-5 w-5" />
                         </div>
                         <div className="space-y-0.5">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Est. Arrival</p>
                            <p className="text-base font-bold text-foreground">15 - 20 Mins</p>
                         </div>
                      </div>
                   </div>

                   {((selectedItem as any).chef_notes || (selectedItem as any).notes || (selectedItem as any).kitchen_notes) && (
                     <div className="rounded-3xl border border-border/70 bg-linear-to-br from-card to-secondary/10 p-5 md:p-7">
                       <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Chef Notes</p>
                       <p className="mt-2 text-sm md:text-base text-foreground/90 leading-relaxed">
                         {(selectedItem as any).chef_notes || (selectedItem as any).notes || (selectedItem as any).kitchen_notes}
                       </p>
                     </div>
                   )}

                   <div className="mt-2 md:hidden sticky bottom-0 bg-linear-to-t from-background via-background to-transparent pt-4 pb-2">
                      <Button className="w-full h-14 rounded-2xl text-base font-bold shadow-2xl shadow-primary/20" onClick={() => setSelectedItem(null)}>
                        Continue Browsing
                      </Button>
                   </div>
                </div>
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  )
}