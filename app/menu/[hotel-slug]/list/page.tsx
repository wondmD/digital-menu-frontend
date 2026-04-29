import { Metadata, ResolvingMetadata } from "next"
import { fetchPublicRestaurantBySlugOrId } from "@/lib/public-restaurant"
import MenuListClient from "@/components/menu-list-client"
import { getImageUrl } from "@/lib/utils"
import { getSiteUrl } from "@/lib/site-url"

interface Props {
  params: Promise<{ "hotel-slug": string }>
}

const siteUrl = getSiteUrl()

// Use ISR to avoid blocking requests on slow external API; revalidate every 60s
export const revalidate = 60

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

    const ogImageUrl = new URL("/api/og", siteUrl)
    ogImageUrl.searchParams.set("name", hotel.name)
    if (hotel.description) ogImageUrl.searchParams.set("description", hotel.description)
    if (hotel.logo_url || hotel.logo_image_url) {
      ogImageUrl.searchParams.set("logo", getImageUrl(hotel.logo_url || hotel.logo_image_url) || "")
    }

    return {
      title: `Menu | ${hotel.name}`,
      description: `Browse our full menu at ${hotel.name}. Categories include various signature dishes and seasonal specialties.`,
      openGraph: {
        title: `Menu | ${hotel.name}`,
        description: hotel.description,
        images: [
          {
            url: ogImageUrl.toString(),
            width: 1200,
            height: 630,
            alt: hotel.name,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        images: [ogImageUrl.toString()],
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
