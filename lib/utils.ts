import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getImageUrl(image: any): string | undefined {
  if (!image) return undefined
  if (typeof image === 'string') return image
  if (Array.isArray(image) && image.length > 0) {
    const first = image[0]
    if (typeof first === 'string') return first
    return first?.url || first?.uri || first?.image_url || first?.cover_image_url || first?.logo_image_url || first?.image || first?.path || first?.src
  }
  if (typeof image === 'object') {
    return image.url || image.uri || image.image_url || image.cover_image_url || image.logo_image_url || image.image || image.path || image.src
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
        return [trimmed]
      }
    }
    // Handle comma-separated strings
    if (trimmed.includes(',')) {
      const parts = trimmed.split(',').map(s => s.trim()).filter(Boolean)
      if (parts.length > 1) return parts
    }
    return [trimmed]
  }

  // Handle array input
  if (Array.isArray(image)) {
    return image.map(img => {
      if (typeof img === 'string') return img.trim()
      return (img?.url || img?.uri || img?.image_url || img?.cover_image_url || img?.logo_image_url || img?.image || img?.path || img?.src || "").trim()
    }).filter(url => url !== "")
  }

  // Handle object input
  if (typeof image === 'object') {
    const url = (image.url || image.uri || image.image_url || image.cover_image_url || image.logo_image_url || image.image || image.path || image.src || "").trim()
    return url ? [url] : []
  }
  return []
}
