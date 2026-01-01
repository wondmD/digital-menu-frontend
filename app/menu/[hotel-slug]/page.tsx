import { Button } from "@/components/ui/button"
import { MOCK_HOTEL } from "@/lib/mock-data"
import { Coffee, MapPin, Phone, Instagram, Facebook, ArrowRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { use } from "react"

export default function HotelMenuLandingPage({ params }: { params: Promise<{ "hotel-slug": string }> }) {
  const resolvedParams = use(params)
  const hotelSlug = resolvedParams["hotel-slug"]

  return (
    <div className="flex min-h-screen flex-col bg-[#FDFCF8] font-sans">
      <main className="flex-1">
        <div className="relative h-[45vh] w-full overflow-hidden">
            <Image
              src="/hotel.webp"
              alt="Hotel exterior"
              fill
              className="object-cover brightness-[0.7] scale-105"
              priority
            />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FDFCF8] via-transparent to-black/30" />
        </div>

        <div className="container relative -mt-24 px-6 pb-24 mx-auto max-w-lg">
          <div className="flex flex-col items-center text-center">
            <div className="mb-8 h-32 w-32 overflow-hidden rounded-3xl border-[6px] border-[#FDFCF8] bg-white shadow-2xl animate-in zoom-in duration-500">
              <Image
                src="/cafe-logo.png"
                alt={MOCK_HOTEL.name}
                width={128}
                height={128}
                className="object-contain p-2"
              />
            </div>

            <h1 className="text-4xl font-serif text-primary tracking-tight sm:text-5xl mb-3">
              {MOCK_HOTEL.name}
            </h1>
            <p className="max-w-md text-balance text-muted-foreground font-medium leading-relaxed">
              {MOCK_HOTEL.description}
            </p>

            <div className="mt-10 flex flex-col w-full gap-4">
              <Button
                size="lg"
                className="h-16 rounded-2xl text-xl font-bold shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] group"
                asChild
              >
                <Link href={`/menu/${hotelSlug}/list`} className="flex items-center justify-center gap-3">
                  Explore the Menu <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>

            <div className="mt-12 grid w-full gap-5 text-sm">
              <div className="flex items-center justify-center gap-3 text-muted-foreground font-medium bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-primary/5">
                <MapPin className="h-5 w-5 text-primary shrink-0" />
                <span className="text-left">{MOCK_HOTEL.address}</span>
              </div>
              <div className="flex items-center justify-center gap-3 text-muted-foreground font-medium bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-primary/5">
                <Phone className="h-5 w-5 text-primary shrink-0" />
                <span>{MOCK_HOTEL.phone}</span>
              </div>
            </div>

            <div className="mt-12 flex items-center justify-center gap-8 text-primary">
              <Link
                href={`https://instagram.com/${MOCK_HOTEL.socials.instagram}`}
                className="group flex flex-col items-center gap-2"
              >
                <div className="rounded-full bg-primary/5 p-4 text-primary group-hover:bg-primary/10 transition-all duration-300">
                  <Instagram className="h-7 w-7" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Instagram</span>
              </Link>
              <Link
                href={`https://facebook.com/${MOCK_HOTEL.socials.facebook}`}
                className="group flex flex-col items-center gap-2"
              >
                <div className="rounded-full bg-primary/5 p-4 text-primary group-hover:bg-primary/10 transition-all duration-300">
                  <Facebook className="h-7 w-7" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Facebook</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-primary/5 py-10 text-center bg-white/30">
          <div className="flex items-center justify-center gap-2 text-xs text-primary font-medium uppercase tracking-widest">
          <span>Curated by</span>
          <div className="flex items-center gap-1.5 font-bold text-primary-foreground">
            <Coffee className="h-4 w-4 text-primary" /> MenuQR
          </div>
        </div>
      </footer>
    </div>
  )
}
