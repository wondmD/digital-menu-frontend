import { apiFetch } from "@/lib/api-client"
import { getImageUrl } from "@/lib/utils"
import { fetchPublicRestaurantBySlugOrIdServer } from "@/lib/public-restaurant-server"
import { cache } from "react"
import type { Category, MenuItem, Restaurant } from "@/components/menu-templates/types"

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

function extractList(payload: any): any[] {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.data?.items)) return payload.data.items
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.results)) return payload.results
  return []
}

function normalizeMenuItem(item: any, fallbackCategoryId: string): MenuItem {
  const resolvedImage = getImageUrl(
    item?.image_url ||
    item?.image ||
    item?.images ||
    item?.thumbnail_url ||
    item?.media ||
    item?.media_ref ||
    item?.media_id
  )

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
    image_url: item?.image_url || item?.image?.url || item?.images?.[0]?.url || resolvedImage,
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

  const reduced = String(rule.discount_type).toLowerCase() === "percentage"
    ? price - (price * rawValue) / 100
    : price - rawValue

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
    if (scope === "specific_items") return targets.includes(itemId)
    if (scope === "specific_categories") return targets.includes(categoryId)
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
    return { ...item, discounted_price: undefined, original_price: undefined, discount: undefined }
  }

  const discountedPrice = computeDiscountedPrice(item.price, bestRule)
  if (discountedPrice >= item.price) {
    return { ...item, discounted_price: undefined, original_price: undefined, discount: undefined }
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

export type MenuPageData = {
  hotel: Restaurant | null
  categories: Category[]
}

export const fetchMenuPageData = cache(async (hotelSlug: string): Promise<MenuPageData> => {
  try {
    const hotel = (await fetchPublicRestaurantBySlugOrIdServer(hotelSlug)) as Restaurant | null
    if (!hotel?.id) {
      return { hotel, categories: [] }
    }

    const restaurantId = String(hotel.id)

    const [categoryRes, discountRes] = await Promise.all([
      apiFetch<any>(`/restaurants/${restaurantId}/categories`, { revalidateSeconds: 60, cacheTags: ["public-restaurant-data"] }),
      apiFetch<any>(`/restaurants/${restaurantId}/discounts?is_active=true`, { revalidateSeconds: 60, cacheTags: ["public-restaurant-data"] }).catch(() => null),
    ])

    const categoryRows = extractList(categoryRes)
    const activeDiscounts = extractList(discountRes).map(normalizeDiscountRule)

    const categories = await Promise.all(
      categoryRows.map(async (category: any) => {
        try {
          const itemsRes = await apiFetch<any>(`/restaurants/${restaurantId}/categories/${category.id}/items`, {
            revalidateSeconds: 60,
            cacheTags: ["public-restaurant-data"],
          })
          const items = extractList(itemsRes)

          return {
            ...category,
            id: String(category?.id || ""),
            name: String(category?.name || "Category"),
            description: category?.description || "",
            items: items
              .map((item: any) => normalizeMenuItem(item, String(category?.id || "")))
              .map((item: MenuItem) => applyDiscountToItem(item, activeDiscounts)),
          }
        } catch {
          return {
            ...category,
            id: String(category?.id || ""),
            name: String(category?.name || "Category"),
            description: category?.description || "",
            items: [],
          }
        }
      })
    )

    return { hotel, categories }
  } catch {
    const hotel = (await fetchPublicRestaurantBySlugOrIdServer(hotelSlug).catch(() => null)) as Restaurant | null
    return { hotel, categories: [] }
  }
})