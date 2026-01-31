import { Metadata, ResolvingMetadata } from "next"
import { apiFetch } from "@/lib/api-client"
import HotelMenuClient from "@/components/hotel-menu-client"
import { getImageUrl } from "@/lib/utils"

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
    const res = await apiFetch<any>(`/restaurants/${hotelSlug}`)
    const hotel = res?.data || res

    if (!hotel) {
      return {
        title: "Restaurant Not Found",
      }
    }

    const previousImages = (await parent).openGraph?.images || []
    
    // Check all possible image fields for social share images
    const shareImage = getImageUrl(
      hotel.cover_image_url || 
      hotel.cover_url || 
      hotel.logo_url || 
      hotel.logo_image_url
    )

    // Dynamic OG Image from our internal API
    const ogImageUrl = new URL("https://digital-menu-frontend-nine.vercel.app/api/og")
    ogImageUrl.searchParams.set("name", hotel.name)
    if (hotel.description) ogImageUrl.searchParams.set("description", hotel.description)
    if (hotel.logo_url || hotel.logo_image_url) {
      ogImageUrl.searchParams.set("logo", getImageUrl(hotel.logo_url || hotel.logo_image_url) || "")
    }

    return {
      title: `${hotel.name} | Digital Menu`,
      description: hotel.description || `View the elegant digital menu for ${hotel.name}. Explore our dishes and seasonal specialties.`,
      openGraph: {
        title: `${hotel.name} | Digital Menu`,
        description: hotel.description,
        images: [
          {
            url: ogImageUrl.toString(),
            width: 1200,
            height: 630,
            alt: hotel.name,
          },
          ...(shareImage ? [{ url: shareImage }] : []),
          ...previousImages,
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: `${hotel.name} | Digital Menu`,
        description: hotel.description,
        images: [ogImageUrl.toString()],
      },
    }
  } catch (error) {
    return {
      title: "Digital Menu",
    }
  }
}

export default async function HotelMenuLandingPage({ params }: Props) {
  const resolvedParams = await params
  const hotelSlug = resolvedParams["hotel-slug"]
  
  // Fetch initial data on the server for faster load and better SEO
  let initialData = null
  try {
    const res = await apiFetch<any>(`/restaurants/${hotelSlug}`)
    initialData = res?.data || res
  } catch (err) {
    console.error("Failed to fetch hotel data on server:", err)
  }

  return (
    <>
      {initialData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Restaurant",
              name: initialData.name,
              description: initialData.description,
              image: getImageUrl(
                initialData.cover_image_url || 
                initialData.cover_url || 
                initialData.logo_url || 
                initialData.logo_image_url
              ),
              address: {
                "@type": "PostalAddress",
                streetAddress: initialData.address,
              },
              telephone: initialData.phone,
              url: `https://digital-menu-frontend-nine.vercel.app/menu/${hotelSlug}`,
            }),
          }}
        />
      )}
      <HotelMenuClient hotelSlug={hotelSlug} initialData={initialData} />
    </>
  )
}
