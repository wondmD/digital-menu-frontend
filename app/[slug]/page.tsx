import type { Metadata, ResolvingMetadata } from "next"
import LegacyRestaurantPage, { generateMetadata as generateLegacyMetadata } from "@/app/menu/[hotel-slug]/page"

type RootSlugProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata(
  { params }: RootSlugProps,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { slug } = await params
  return generateLegacyMetadata(
    {
      params: Promise.resolve({ "hotel-slug": slug }),
    },
    parent,
  )
}

export default async function RootSlugRestaurantPage({ params }: RootSlugProps) {
  const { slug } = await params
  return LegacyRestaurantPage({ params: Promise.resolve({ "hotel-slug": slug }) })
}
