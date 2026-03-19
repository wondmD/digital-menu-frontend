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
    const listRes = await apiFetch<any>("/restaurants")
    const rows = extractList(listRes)

    const matched = rows.find((row) => {
      const rowSlug = extractRestaurantSlug(row)
      const rowId = String(row?.id || "").trim().toLowerCase()
      return rowSlug === normalizedIdentifier || rowId === normalizedIdentifier
    })

    if (!matched) return null

    const matchedId = String(matched?.id || "").trim()
    if (!matchedId) return null

    if (matchedId) {
      try {
        const byIdRes = await apiFetch<any>(`/restaurants/${encodeURIComponent(matchedId)}`)
        const byId = byIdRes?.data || byIdRes
        if (isRecord(byId) && byId?.id) return byId
      } catch {
        // Fallback to list row shape only when detail lookup by id fails.
      }
    }

    return matched
  } catch {
    return null
  }
}
