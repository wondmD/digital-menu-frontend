/**
 * Centralize site absolute URL configuration for SEO.
 * Uses `NEXT_PUBLIC_SITE_URL` so it can be available in Edge runtime too.
 */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL

  if (raw) {
    const trimmed = raw.trim().replace(/\/+$/, "")
    try {
      const url = new URL(trimmed)
      // Only allow http(s) URLs for SEO outputs.
      if (url.protocol === "http:" || url.protocol === "https:") return url.toString().replace(/\/+$/, "")
    } catch {
      // Fall through to dev fallback.
    }
  }

  // Safe dev fallback for local builds.
  return "http://localhost:3000"
}

