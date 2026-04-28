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

export async function fetchPublicRestaurantBySlugOrId(identifier: string): Promise<any | null> {
  const normalizedIdentifier = normalizeSlug(identifier)
  if (!normalizedIdentifier) return null

  try {
    const directRes = await apiFetch<any>(`/restaurants/${encodeURIComponent(normalizedIdentifier)}`)
    const direct = directRes?.data || directRes
    if (isRecord(direct) && direct?.id) return direct
  } catch {
    // Ignore and try the public catalog search fallback below.
  }

  try {
    const listRes = await apiFetch<any>(`/restaurants?page=1&page_size=100&search=${encodeURIComponent(normalizedIdentifier)}`)
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

  return null
}
