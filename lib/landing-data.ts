import { getImageUrl } from "@/lib/utils"
import { apiFetch } from "@/lib/api-client"

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "")

type RawRestaurant = Record<string, any>

export type LandingRestaurantPreview = {
  id: string
  name: string
  slug: string
  description?: string
  logo_url?: string
  cover_url?: string
  cuisine_type?: string
  latitude?: number
  longitude?: number
  address?: string
}

function extractList(payload: any): any[] {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.data?.items)) return payload.data.items
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.results)) return payload.results
  return []
}

function resolveCoordinates(row: RawRestaurant): { lat: number; lng: number } | null {
  const lat = Number(row?.latitude ?? row?.lat)
  const lng = Number(row?.longitude ?? row?.lng)

  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return { lat, lng }
  }

  const address = typeof row?.address === "string" ? row.address : ""
  const match = address.match(/^\s*([-+]?\d*\.?\d+)\s*,\s*([-+]?\d*\.?\d+)\s*$/)
  if (!match) return null

  const parsedLat = Number(match[1])
  const parsedLng = Number(match[2])

  if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) return null
  return { lat: parsedLat, lng: parsedLng }
}

function normalizeRestaurant(row: RawRestaurant): LandingRestaurantPreview | null {
  const slug = String(row?.slug || row?.restaurant_slug || row?.hotel_slug || "").trim()
  if (!slug || !row?.name) return null

  const coordinates = resolveCoordinates(row)

  return {
    id: String(row?.id || slug),
    name: String(row.name),
    slug,
    description: typeof row?.description === "string" ? row.description : undefined,
    logo_url: getImageUrl(row?.logo_url || row?.logo_image_url),
    cover_url: getImageUrl(row?.cover_url || row?.cover_image_url),
    cuisine_type: typeof row?.cuisine_type === "string" ? row.cuisine_type : undefined,
    latitude: coordinates?.lat,
    longitude: coordinates?.lng,
    address: typeof row?.address === "string" ? row.address : undefined,
  }
}

export async function fetchLandingRestaurantsPreview(limit = 8): Promise<LandingRestaurantPreview[]> {
  if (!API_BASE) return []

  const safeLimit = Math.max(1, limit)
  const pageSize = Math.max(safeLimit, 24)

  try {
    const payload = await apiFetch<any>(`/restaurants?page=1&page_size=${pageSize}`, {
      revalidateSeconds: 3600,
      cacheTags: ["public-landing-data"],
    })
    return extractList(payload)
      .map(normalizeRestaurant)
      .filter((restaurant): restaurant is LandingRestaurantPreview => restaurant !== null)
      .slice(0, safeLimit)
  } catch {
    return []
  }
}