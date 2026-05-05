import { unstable_cache } from "next/cache"
import { apiFetch } from "@/lib/api-client"
import { fetchPublicRestaurantBySlugOrId } from "@/lib/public-restaurant"
import { getImageUrl } from "@/lib/utils"

type DiscountRule = {
  id: string
  discount_type?: "percentage" | "fixed_amount" | string
  discount_value?: number
  applicable_to?: "all_items" | "specific_categories" | "specific_items" | string
  entity_ids?: Array<string | number>
  start_date?: string
  end_date?: string
  is_active?: boolean
}

export type RestaurantShowcaseBundle = {
  restaurant: any
  categories: any[]
  menuItems: any[]
  events: any[]
}

function extractList(payload: any): any[] {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.data?.items)) return payload.data.items
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.results)) return payload.results
  return []
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

  const reduced =
    String(rule.discount_type).toLowerCase() === "percentage"
      ? price - (price * rawValue) / 100
      : price - rawValue

  return Math.max(0, Number(reduced.toFixed(2)))
}

function findBestDiscountForItem(item: any, rules: DiscountRule[]): DiscountRule | null {
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

function applyDiscountToItem(item: any, rules: DiscountRule[]): any {
  const bestRule = findBestDiscountForItem(item, rules)
  if (!bestRule) return item

  const discountedPrice = computeDiscountedPrice(item.price, bestRule)
  if (discountedPrice >= item.price) return item

  return {
    ...item,
    discounted_price: discountedPrice,
    original_price: item.price,
    discount: {
      id: bestRule.id,
      discount_type: bestRule.discount_type,
      discount_value: bestRule.discount_value,
      label:
        String(bestRule.discount_type).toLowerCase() === "percentage"
          ? `${Number(bestRule.discount_value || 0)}% OFF`
          : `${item.currency} ${Number(bestRule.discount_value || 0).toFixed(2)} OFF`,
    },
  }
}

function normalizeMenuItem(item: any, fallbackCategoryId: string): any {
  const resolvedImage =
    getImageUrl(
      item?.image_url ||
        item?.image ||
        item?.images ||
        item?.thumbnail_url ||
        item?.media ||
        item?.media_ref ||
        item?.media_id
    ) || undefined

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
    image_url: resolvedImage,
    image_urls: Array.isArray(item?.image_urls) ? item.image_urls : undefined,
  }
}

async function loadRestaurantShowcaseBundle(identifier: string): Promise<RestaurantShowcaseBundle | null> {
  const restaurant = await fetchPublicRestaurantBySlugOrId(identifier)
  if (!restaurant) return null

  const restaurantId = String(restaurant.id || identifier)

  const categoriesRes = await apiFetch<any>(`/restaurants/${restaurantId}/categories`)
  const categoryRows = extractList(categoriesRes)

  let activeDiscounts: DiscountRule[] = []
  try {
    const discountsRes = await apiFetch<any>(`/restaurants/${restaurantId}/discounts?is_active=true`, { cacheTags: ["public-restaurant-data"], revalidateSeconds: 3600 })
    activeDiscounts = extractList(discountsRes).map(normalizeDiscountRule)
  } catch {
    activeDiscounts = []
  }

  const categories = await Promise.all(
    categoryRows.map(async (category: any) => {
      try {
        const itemsRes = await apiFetch<any>(`/restaurants/${restaurantId}/categories/${category.id}/items`, { cacheTags: ["public-restaurant-data"], revalidateSeconds: 3600 })
        const items = extractList(itemsRes)
        return {
          ...category,
          id: String(category?.id || ""),
          name: String(category?.name || "Category"),
          description: category?.description || "",
          items: items
            .slice(0, 8)
            .map((item: any) => normalizeMenuItem(item, String(category?.id || "")))
            .map((normalizedItem) => applyDiscountToItem(normalizedItem, activeDiscounts)),
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

  const menuItems = categories.flatMap((category: any) => category.items || [])

  const eventPaths = [
    `/restaurants/${restaurantId}/events?is_active=true`,
    `/restaurants/${restaurantId}/events`,
    `/my-restaurants/${restaurantId}/events?is_active=true`,
  ]

  let events: any[] = []
  for (const path of eventPaths) {
    try {
      const response = await apiFetch<any>(path, { cacheTags: ["public-restaurant-data"], revalidateSeconds: 3600 })
      const rows = extractList(response)
      if (rows.length > 0) {
        events = rows
        break
      }
    } catch {
      continue
    }
  }

  return { restaurant, categories, menuItems, events }
}

export const getCachedPublicRestaurantBySlugOrId = unstable_cache(
  async (identifier: string) => fetchPublicRestaurantBySlugOrId(identifier),
  ["public-restaurant-detail"],
  {
    revalidate: 3600,
    tags: ["public-restaurant-data"],
  }
)

export const getCachedRestaurantShowcaseBundle = unstable_cache(
  async (identifier: string) => loadRestaurantShowcaseBundle(identifier),
  ["public-restaurant-showcase-bundle"],
  {
    revalidate: 3600,
    tags: ["public-restaurant-data"],
  }
)
