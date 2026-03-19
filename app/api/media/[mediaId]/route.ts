import { NextResponse } from "next/server"

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "")
const API_ORIGIN = API_BASE.replace(/\/api\/v\d+\/?$/, "")

function isHttpUrl(value: unknown): value is string {
  return typeof value === "string" && /^https?:\/\//i.test(value)
}

function extractUrl(payload: any): string | undefined {
  if (!payload || typeof payload !== "object") return undefined

  const candidates = [
    payload?.url,
    payload?.file_url,
    payload?.image_url,
    payload?.data?.url,
    payload?.data?.file_url,
    payload?.data?.image_url,
  ]

  for (const candidate of candidates) {
    if (isHttpUrl(candidate)) return candidate
  }

  const nestedData = payload?.data
  if (Array.isArray(nestedData)) {
    for (const entry of nestedData) {
      if (isHttpUrl(entry?.url)) return entry.url
      if (isHttpUrl(entry?.file_url)) return entry.file_url
      if (isHttpUrl(entry?.image_url)) return entry.image_url
    }
  }

  // Some backends return key-value map of id -> url/object.
  if (nestedData && typeof nestedData === "object") {
    for (const value of Object.values(nestedData)) {
      if (isHttpUrl(value)) return value
      if (value && typeof value === "object") {
        if (isHttpUrl((value as any).url)) return (value as any).url
        if (isHttpUrl((value as any).file_url)) return (value as any).file_url
        if (isHttpUrl((value as any).image_url)) return (value as any).image_url
      }
    }
  }

  return undefined
}

function buildMediaGetCandidates(mediaId: string): string[] {
  const encoded = encodeURIComponent(mediaId)
  const candidates = new Set<string>()
  if (API_BASE) candidates.add(`${API_BASE}/media/${encoded}`)
  if (API_ORIGIN) {
    candidates.add(`${API_ORIGIN}/api/v1/media/${encoded}`)
    candidates.add(`${API_ORIGIN}/api/media/${encoded}`)
    candidates.add(`${API_ORIGIN}/media/${encoded}`)
  }
  return Array.from(candidates)
}

function buildMediaResolveCandidates(): string[] {
  const candidates = new Set<string>()
  if (API_BASE) candidates.add(`${API_BASE}/media/resolve`)
  if (API_ORIGIN) {
    candidates.add(`${API_ORIGIN}/api/v1/media/resolve`)
    candidates.add(`${API_ORIGIN}/api/media/resolve`)
    candidates.add(`${API_ORIGIN}/media/resolve`)
  }
  return Array.from(candidates)
}

function placeholderSvg(mediaId: string): string {
  const safeId = mediaId.replace(/[^a-zA-Z0-9-]/g, "")
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800" role="img" aria-label="Image unavailable">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f3f4f6" />
      <stop offset="100%" stop-color="#e5e7eb" />
    </linearGradient>
  </defs>
  <rect width="1200" height="800" fill="url(#g)" />
  <g fill="#6b7280" font-family="Arial, sans-serif" text-anchor="middle">
    <text x="600" y="380" font-size="38" font-weight="700">Image unavailable</text>
    <text x="600" y="430" font-size="20">Media ID: ${safeId || "unknown"}</text>
  </g>
</svg>`
}

export async function GET(
  _request: Request,
  context: { params: { mediaId: string } | Promise<{ mediaId: string }> }
) {
  const params = context.params instanceof Promise ? await context.params : context.params
  const mediaId = String(params?.mediaId || "").trim()

  if (!mediaId) {
    return NextResponse.json({ error: "mediaId is required" }, { status: 400 })
  }

  if (API_BASE) {
    try {
      for (const endpoint of buildMediaGetCandidates(mediaId)) {
        const directResponse = await fetch(endpoint, {
          method: "GET",
          headers: { Accept: "image/*,application/json,text/plain,*/*" },
          cache: "no-store",
        })

        if (!directResponse.ok) continue

        const contentType = directResponse.headers.get("content-type") || ""

        if (contentType.toLowerCase().startsWith("image/")) {
          return new NextResponse(directResponse.body, {
            status: 200,
            headers: {
              "Content-Type": contentType,
              "Cache-Control": "public, max-age=300",
            },
          })
        }

        const text = await directResponse.text()
        let parsed: any = null
        try {
          parsed = JSON.parse(text)
        } catch {
          parsed = null
        }

        const resolvedUrl = extractUrl(parsed)
        if (resolvedUrl) {
          return NextResponse.redirect(resolvedUrl, 307)
        }
      }

      // Fallback for backends that only support batch media id resolution.
      for (const endpoint of buildMediaResolveCandidates()) {
        const resolveResponse = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ media_ids: [mediaId] }),
          cache: "no-store",
        })

        if (!resolveResponse.ok) continue
        const payload = await resolveResponse.json().catch(() => null)
        const resolvedUrl = extractUrl(payload)
        if (resolvedUrl) {
          return NextResponse.redirect(resolvedUrl, 307)
        }
      }
    } catch {
      // Fall through to placeholder to keep UI stable if upstream is unavailable.
    }
  }

  return new NextResponse(placeholderSvg(mediaId), {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=60",
    },
  })
}