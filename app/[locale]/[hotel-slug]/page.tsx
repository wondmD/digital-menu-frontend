import type { Metadata, ResolvingMetadata } from "next"
import LegacyRestaurantPage, { generateMetadata as generateLegacyMetadata } from "@/app/[locale]/menu/[hotel-slug]/page"

type RootSlugProps = {
  params: Promise<{ "hotel-slug": string }>
}

export async function generateMetadata(
  { params }: RootSlugProps,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { "hotel-slug": hotelSlug } = await params
  return generateLegacyMetadata(
    {
      params: Promise.resolve({ "hotel-slug": hotelSlug }),
    },
    parent,
  )
}

export default async function RootSlugRestaurantPage({ params }: RootSlugProps) {
  const { "hotel-slug": hotelSlug } = await params
  return LegacyRestaurantPage({ params: Promise.resolve({ "hotel-slug": hotelSlug }) })
}
