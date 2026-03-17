export type ManagedRestaurant = {
  id: string
  owner_id?: string
  slug?: string
  name?: string
  description?: string
  cuisine_type?: string
  phone?: string
  email?: string
  website?: string
  address?: string
  city?: string
  country?: string
  timezone?: string
  logo_url?: string
  cover_image_url?: string
  gallery?: any
  theme_settings?: Record<string, any>
  is_published?: boolean
  is_featured?: boolean
  view_count?: number
  rank_score?: number | string
  created_at?: string
  updated_at?: string
  [key: string]: any
}

export const DEFAULT_TIMEZONE = "UTC"

function toArray(value: any): any[] {
  return Array.isArray(value) ? value : []
}

export function extractApiList(input: any): any[] {
  if (Array.isArray(input)) return input

  const data = input?.data
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.items)) return data.items

  if (Array.isArray(input?.items)) return input.items

  // Some endpoints may return a single object in data.
  if (data && typeof data === "object") return [data]

  return []
}

export function normalizeRestaurant(raw: any): ManagedRestaurant {
  if (!raw) return { id: "" }

  return {
    ...raw,
    id: String(raw.id || ""),
    slug: raw.slug || "",
    name: raw.name || "",
    description: raw.description || "",
    cuisine_type: raw.cuisine_type || "",
    phone: raw.phone || "",
    email: raw.email || "",
    website: raw.website || raw.website_url || "",
    address: raw.address || "",
    city: raw.city || "",
    country: raw.country || "",
    timezone: raw.timezone || DEFAULT_TIMEZONE,
    logo_url: raw.logo_url || raw.logo_image_url || raw.logo || "",
    cover_image_url: raw.cover_image_url || raw.cover_url || raw.cover || "",
    gallery:
      raw.gallery ||
      raw.gallery_urls ||
      raw.gallery_image_urls ||
      raw.gallery_images ||
      [],
    theme_settings: raw.theme_settings || {},
    is_published: raw.is_published === true || String(raw.is_published) === "true",
    is_featured: raw.is_featured === true || String(raw.is_featured) === "true",
    view_count: Number(raw.view_count || 0),
    rank_score: raw.rank_score,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  }
}

export function normalizeRestaurantList(input: any): ManagedRestaurant[] {
  return toArray(extractApiList(input)).map(normalizeRestaurant)
}

export function findRestaurantById(input: any, restaurantId: string): ManagedRestaurant | null {
  return normalizeRestaurantList(input).find((item) => item.id === restaurantId) || null
}
