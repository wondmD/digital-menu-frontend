"use client"

import RestaurantShowcase from "@/components/restaurant-showcase"

interface HotelMenuClientProps {
  hotelSlug: string
  initialData?: any
}

export default function HotelMenuClient({ hotelSlug, initialData }: HotelMenuClientProps) {
  return <RestaurantShowcase hotelSlug={hotelSlug} initialData={initialData} />
}
