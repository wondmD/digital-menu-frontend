import type { Metadata, ResolvingMetadata } from "next"
import LegacyMenuListPage, { generateMetadata as generateLegacyMetadata } from "@/app/[locale]/menu/[hotel-slug]/list/page"

type RootSlugListProps = {
  params: Promise<{ "hotel-slug": string }>
}

export async function generateMetadata(
  { params }: RootSlugListProps,
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

export default async function RootSlugMenuListPage({ params }: RootSlugListProps) {
  const { "hotel-slug": hotelSlug } = await params
  return LegacyMenuListPage({ params: Promise.resolve({ "hotel-slug": hotelSlug }) })
}
