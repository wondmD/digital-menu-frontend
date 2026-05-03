import { cache } from "react"
import { apiFetch } from "@/lib/api-client"

function extractList(payload: any): any[] {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.data?.items)) return payload.data.items
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.results)) return payload.results
  return []
}

function normalizeSlug(value: any): string {
  return String(value || "").trim().toLowerCase()
}

function extractRestaurantSlug(row: any): string {
  return normalizeSlug(row?.slug || row?.restaurant_slug || row?.restaurantSlug)
}

function isRecord(value: any): boolean {
  return Boolean(value && typeof value === "object")
}

function looksLikeRestaurantId(identifier: string): boolean {
  const value = normalizeSlug(identifier)
  if (!value) return false
  if (/^\d+$/.test(value)) return true
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) return true
  return false
}

export const fetchPublicRestaurantBySlugOrIdServer = cache(async (identifier: string): Promise<any | null> => {
  const normalizedIdentifier = normalizeSlug(identifier)
  if (!normalizedIdentifier) return null

  try {
    const listRes = await apiFetch<any>(`/restaurants?page=1&page_size=100&search=${encodeURIComponent(normalizedIdentifier)}`, {
      revalidateSeconds: 60,
      cacheTags: ["public-restaurant-data"],
    })
    const rows = extractList(listRes)

    const matched = rows.find((row) => {
      const rowSlug = extractRestaurantSlug(row)
      const rowId = String(row?.id || "").trim().toLowerCase()
      const rowName = normalizeSlug(row?.name)
      return rowSlug === normalizedIdentifier || rowId === normalizedIdentifier || rowName === normalizedIdentifier
    })

    if (matched && isRecord(matched)) {
      return matched
    }
  } catch {
    // If the catalog endpoint is unavailable, fall through to null so the UI can
    // render its existing not-found state.
  }

  if (!looksLikeRestaurantId(normalizedIdentifier)) {
    return null
  }

  try {
    const directRes = await apiFetch<any>(`/restaurants/${encodeURIComponent(normalizedIdentifier)}`, {
      revalidateSeconds: 60,
      cacheTags: ["public-restaurant-data"],
    })
    const direct = directRes?.data || directRes
    if (isRecord(direct) && direct?.id) return direct
  } catch {
    // Direct lookup is only a fallback for ID-like identifiers.
  }

  return null
})