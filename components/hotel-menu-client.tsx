"use client"

import RestaurantShowcase from "@/components/restaurant-showcase"
import type { RestaurantShowcaseBundle } from "@/lib/public-data.server"

interface HotelMenuClientProps {
  hotelSlug: string
  initialData?: any
  initialBundle?: RestaurantShowcaseBundle | null
}

export default function HotelMenuClient({ hotelSlug, initialData, initialBundle }: HotelMenuClientProps) {
  return <RestaurantShowcase hotelSlug={hotelSlug} initialData={initialData} initialBundle={initialBundle || undefined} />
}
