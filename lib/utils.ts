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
    return first?.url || first?.uri || first?.image_url
  }
  if (typeof image === 'object') return image.url || image.uri || image.image_url
  return undefined
}

export function getImageUrls(image: any): string[] {
  if (!image) return []
  if (typeof image === 'string') return [image]
  if (Array.isArray(image)) {
    return image.map(img => {
      if (typeof img === 'string') return img
      return img?.url || img?.uri || img?.image_url || ""
    }).filter(url => url !== "")
  }
  if (typeof image === 'object') {
    const url = image.url || image.uri || image.image_url
    return url ? [url] : []
  }
  return []
}
