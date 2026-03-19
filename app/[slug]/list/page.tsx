import type { Metadata, ResolvingMetadata } from "next"
import LegacyMenuListPage, { generateMetadata as generateLegacyMetadata } from "@/app/menu/[hotel-slug]/list/page"

type RootSlugListProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata(
  { params }: RootSlugListProps,
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

export default async function RootSlugMenuListPage({ params }: RootSlugListProps) {
  const { slug } = await params
  return LegacyMenuListPage({ params: Promise.resolve({ "hotel-slug": slug }) })
}
