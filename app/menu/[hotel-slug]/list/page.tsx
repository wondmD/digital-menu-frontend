import { Metadata, ResolvingMetadata } from "next"
import { fetchPublicRestaurantBySlugOrId } from "@/lib/public-restaurant"
import MenuListClient from "@/components/menu-list-client"

interface Props {
  params: Promise<{ "hotel-slug": string }>
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params
  const hotelSlug = resolvedParams["hotel-slug"]

  try {
    const hotel = await fetchPublicRestaurantBySlugOrId(hotelSlug)

    if (!hotel) {
      return {
        title: "Menu Not Found",
      }
    }

    return {
      title: `Menu | ${hotel.name}`,
      description: `Browse our full menu at ${hotel.name}. Categories include various signature dishes and seasonal specialties.`,
      openGraph: {
        title: `Menu | ${hotel.name}`,
        description: hotel.description,
      },
    }
  } catch (error) {
    return {
      title: "Menu",
    }
  }
}

export default async function MenuListViewPage({ params }: Props) {
  const resolvedParams = await params
  const hotelSlug = resolvedParams["hotel-slug"]
  
  let hotel = null
  try {
    hotel = await fetchPublicRestaurantBySlugOrId(hotelSlug)
  } catch (err) {}

  return <MenuListClient hotelSlug={hotelSlug} initialHotel={hotel} />
}
