import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024

export function getOversizedFiles(files: File[] | FileList, maxBytes = MAX_UPLOAD_SIZE_BYTES): File[] {
  const list = Array.from(files as ArrayLike<File>)
  return list.filter((file) => file.size > maxBytes)
}

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '')
const API_ORIGIN = API_BASE.replace(/\/api\/v\d+\/?$/, '')

function localMediaResolver(mediaId: string): string {
  return `/api/media/${encodeURIComponent(mediaId)}`
}

function normalizeImageCandidate(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined

  let url = value.trim()
  if (!url) return undefined

  // Strip accidental wrapping quotes coming from serialized payloads.
  url = url.replace(/^['"]+|['"]+$/g, '')
  if (!url) return undefined

  if (url.startsWith('data:') || url.startsWith('blob:')) return url
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith('//')) return `https:${url}`

  // Media references can be stored as media:<uuid>.
  if (url.startsWith('media:')) {
    const mediaId = url.slice('media:'.length).trim()
    if (!mediaId) return undefined
    return localMediaResolver(mediaId)
  }

  // Some payloads contain plain media UUIDs in image fields.
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(url)) {
    return localMediaResolver(url)
  }

  if (url.startsWith('media/')) {
    const mediaId = url.slice('media/'.length).trim()
    if (mediaId) return localMediaResolver(mediaId)
  }

  if (url.startsWith('/')) {
    if (API_ORIGIN) return `${API_ORIGIN}${url}`
    return url
  }

  if (url.startsWith('uploads/') || url.startsWith('media/')) {
    if (API_ORIGIN) return `${API_ORIGIN}/${url}`
    return `/${url}`
  }

  return url
}

function pickImageCandidate(image: any): string | undefined {
  if (!image || typeof image !== 'object') return undefined
  return (
    image.url ||
    image.uri ||
    image.image_url ||
    image.cover_image_url ||
    image.logo_image_url ||
    image.thumbnail_url ||
    image.file_url ||
    image.image ||
    image.path ||
    image.src ||
    image.media_url ||
    image.media_ref ||
    image.media_id ||
    image.id
  )
}

export function getImageUrl(image: any): string | undefined {
  if (!image) return undefined
  if (typeof image === 'string') return normalizeImageCandidate(image)
  if (Array.isArray(image) && image.length > 0) {
    const first = image[0]
    if (typeof first === 'string') return normalizeImageCandidate(first)
    return normalizeImageCandidate(pickImageCandidate(first))
  }
  if (typeof image === 'object') {
    return normalizeImageCandidate(pickImageCandidate(image))
  }
  return undefined
}

export function getImageUrls(image: any): string[] {
  if (!image) return []
  
  // Handle string input
  if (typeof image === 'string') {
    const trimmed = image.trim()
    if (!trimmed) return []

    // Check if it's a JSON string representing an array
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed)
        return getImageUrls(parsed)
      } catch (e) {
        const normalized = normalizeImageCandidate(trimmed)
        return normalized ? [normalized] : []
      }
    }
    // Handle comma-separated strings
    if (trimmed.includes(',')) {
      const parts = trimmed
        .split(',')
        .map(s => normalizeImageCandidate(s.trim()))
        .filter((v): v is string => Boolean(v))
      if (parts.length > 1) return parts
    }
    const normalized = normalizeImageCandidate(trimmed)
    return normalized ? [normalized] : []
  }

  // Handle array input
  if (Array.isArray(image)) {
    return image
      .map((img) => {
        if (typeof img === 'string') return normalizeImageCandidate(img)
        return normalizeImageCandidate(pickImageCandidate(img))
      })
      .filter((url): url is string => Boolean(url))
  }

  // Handle object input
  if (typeof image === 'object') {
    const url = normalizeImageCandidate(pickImageCandidate(image))
    return url ? [url] : []
  }
  return []
}
