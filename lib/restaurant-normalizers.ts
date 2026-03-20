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
  social_links?: Record<string, any> | string
  operation_time?: string
  opening_hours?: string
  year_established?: number
  history?: string
  template_number?: number
  theme_settings?: Record<string, any>
  facebook_url?: string
  instagram_url?: string
  twitter_url?: string
  tiktok_url?: string
  telegram_url?: string
  whatsapp?: string
  website_url?: string
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

function parseRecord(value: any): Record<string, any> {
  if (!value) return {}
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value)
      return parsed && typeof parsed === "object" ? parsed : {}
    } catch {
      return {}
    }
  }

  return typeof value === "object" ? value : {}
}

function toNumberOrUndefined(value: any): number | undefined {
  if (value === null || value === undefined || value === "") return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
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

  const socialLinks = parseRecord(raw.social_links)
  const operationTime = raw.operation_time || raw.opening_hours || ""
  const yearEstablished =
    toNumberOrUndefined(raw.year_established) || toNumberOrUndefined(raw.established_year)
  const templateNumber =
    toNumberOrUndefined(raw.template_number) || toNumberOrUndefined(raw.public_template)

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
    social_links: raw.social_links || socialLinks,
    operation_time: operationTime,
    opening_hours: operationTime,
    year_established: yearEstablished,
    history: raw.history || "",
    template_number: templateNumber,
    facebook_url: raw.facebook_url || socialLinks.facebook || socialLinks.facebook_url || "",
    instagram_url: raw.instagram_url || socialLinks.instagram || socialLinks.instagram_url || "",
    twitter_url: raw.twitter_url || socialLinks.twitter || socialLinks.twitter_url || "",
    tiktok_url: raw.tiktok_url || socialLinks.tiktok || socialLinks.tiktok_url || "",
    telegram_url: raw.telegram_url || socialLinks.telegram || socialLinks.telegram_url || "",
    whatsapp: raw.whatsapp || socialLinks.whatsapp || socialLinks.whatsapp_url || "",
    website_url: raw.website_url || socialLinks.website || socialLinks.website_url || raw.website || raw.website_url || "",
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
