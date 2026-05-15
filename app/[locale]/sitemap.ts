import { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/site-url'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl()
  
  // Static routes
  const staticRoutes = [
    '',
    '/login',
    '/register',
    '/packages',
    '/verify-email',
    '/forgot-password',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }))

  // You can fetch public restaurant slugs here if you have a public list API
  // Example:
  /*
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/restaurants`)
  const restaurants = await res.json()
  const dynamicRoutes = restaurants.map((r: any) => ({
    url: `${baseUrl}/menu/${r.slug}`,
    lastModified: new Date(r.updated_at || new Date()),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))
  */

  return [...staticRoutes]
}
