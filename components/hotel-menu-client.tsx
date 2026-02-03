"use client"

import { Button } from "@/components/ui/button"
import { MapPin, Phone, Instagram, Facebook, ArrowRight, Loader2, Globe, Utensils, Star, Clock, Twitter, MessageCircle, Heart, Quote, Mail, ExternalLink, ChefHat } from "lucide-react"
import { Logo } from "@/components/logo"
import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/api-client"
import { cn, getImageUrl, getImageUrls } from "@/lib/utils"
import { LoadingSignal } from "@/components/ui/loading-signal"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"

type Restaurant = {
  id: string
  name: string
  slug: string
  description?: string
  address?: string
  phone?: string
  logo_url?: string
  cover_url?: string
  gallery_urls?: string[]
  is_published?: boolean
  cuisine_type?: string
  email?: string
  instagram_url?: string
  facebook_url?: string
  twitter_url?: string
  tiktok_url?: string
  website_url?: string
  opening_hours?: string
  rating?: number
  review_count?: number
}

interface HotelMenuClientProps {
  hotelSlug: string
  initialData?: Restaurant
}

export default function HotelMenuClient({ hotelSlug, initialData }: HotelMenuClientProps) {
  const [hotel, setHotel] = useState<Restaurant | null>(initialData || null)
  const [loading, setLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)
  
  // Gallery Slide Show State
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()

  useEffect(() => {
    if (initialData) return

    const load = async () => {
      try {
        setLoading(true)
        const res = await apiFetch<any>(`/restaurants/${hotelSlug}`)
        setHotel(res?.data || res)
      } catch (err: any) {
        setError(err.message || "Failed to load restaurant details")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [hotelSlug, initialData])

  if (loading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-[#0a0a0a]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center gap-6"
        >
          <LoadingSignal className="h-20 w-20" />
          <p className="text-2xl font-serif text-white/80 tracking-widest animate-pulse">AGELGIL</p>
        </motion.div>
      </div>
    )
  }

  const isPublished = hotel?.is_published === true || String(hotel?.is_published) === "true"

  if (error || !hotel || !isPublished) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background gap-8 p-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="mx-auto w-24 h-24 rounded-full bg-secondary flex items-center justify-center">
            <Utensils className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-4xl font-serif text-foreground">
            {!hotel || !isPublished ? "Closed For Refurbishment" : "Menu Not Found"}
          </h1>
          <p className="text-muted-foreground max-w-sm mx-auto text-lg">
            {hotel && !isPublished 
              ? "We are currently curating our masterpiece. Please check back soon for an exquisite dining experience."
              : (error || "The culinary destination you're looking for has moved.")}
          </p>
          <Button asChild size="lg" variant="outline" className="rounded-full px-8">
            <Link href="/">Return to Entrance</Link>
          </Button>
        </motion.div>
      </div>
    )
  }

  const coverImage = getImageUrl(
    hotel.cover_url || 
    (hotel as any).cover_image_url || 
    (hotel as any).cover_image || 
    (hotel as any).cover
  ) || "/hotel.webp"
  
  const logoImage = getImageUrl(
    hotel.logo_url || 
    (hotel as any).logo_image_url || 
    (hotel as any).logo_image || 
    (hotel as any).logo
  )
  
  // Robust gallery lookup: find the first non-empty image source
  const gallerySource = 
    (hotel.gallery_urls?.length ? hotel.gallery_urls : null) || 
    ((hotel as any).gallery_image_urls?.length ? (hotel as any).gallery_image_urls : null) || 
    ((hotel as any).gallery_images?.length ? (hotel as any).gallery_images : null) ||
    ((hotel as any).gallery?.length ? (hotel as any).gallery : null) ||
    ((hotel as any).gallery_url) ||
    ((hotel as any).gallery_image) ||
    ((hotel as any).photos?.length ? (hotel as any).photos : null) ||
    ((hotel as any).images?.length ? (hotel as any).images : null) ||
    null

  const gallery = getImageUrls(gallerySource)

  // Scroll to selected image when dialog opens
  useEffect(() => {
    if (carouselApi && selectedImageIndex !== null) {
      carouselApi.scrollTo(selectedImageIndex, true)
    }
  }, [carouselApi, selectedImageIndex])

  // Sync index with carousel selection
  useEffect(() => {
    if (!carouselApi) return
    
    carouselApi.on("select", () => {
      setSelectedImageIndex(carouselApi.selectedScrollSnap())
    })
  }, [carouselApi])

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans overflow-x-hidden">
      <main className="flex-1">
        {/* Elite Hero Section */}
        <section className="relative h-screen w-full flex items-center justify-center">
          <motion.div 
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0"
          >
            <Image
              src={coverImage}
              alt={hotel.name}
              fill
              className="object-cover"
              priority
            />
            {/* Multiple overlays to ensure text visibility on any image background */}
            <div className="absolute inset-0 bg-black/60 md:bg-black/40" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
            <div className="absolute inset-0 backdrop-blur-[2px]" />
          </motion.div>

          <div className="relative z-10 container px-6 flex flex-col items-center text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="space-y-6"
            >
              {logoImage ? (
                <div className="relative w-32 h-32 mx-auto mb-8 p-1 bg-white/20 backdrop-blur-2xl rounded-full border border-white/30 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                  <Image 
                    src={logoImage} 
                    alt={hotel.name} 
                    fill 
                    className="object-contain p-4"
                  />
                </div>
              ) : null}
              
              <div className="space-y-2">
                {hotel.cuisine_type && (
                  <span className="text-primary font-bold uppercase tracking-[0.3em] text-xs drop-shadow-[0_2px_10px_rgba(0,0,0,1)]">
                    {hotel.cuisine_type}
                  </span>
                )}
                <h1 className="text-6xl md:text-8xl font-serif text-white tracking-tight drop-shadow-[0_10px_20px_rgba(0,0,0,1)]">
                  {hotel.name}
                </h1>
              </div>

              <p className="text-xl md:text-2xl text-white font-medium max-w-2xl mx-auto italic leading-relaxed drop-shadow-[0_5px_15px_rgba(0,0,0,1)]">
                {hotel.description || "A culinary journey like no other."}
              </p>

              {/* Cover Socials */}
              <div className="flex items-center justify-center gap-6 pt-4">
                <Link href={hotel.instagram_url || "#"} target="_blank" className="w-14 h-14 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-xl border border-primary/50 text-white hover:bg-primary hover:border-primary transition-all duration-500 shadow-[0_10px_30px_rgba(0,0,0,0.5)] group">
                  <Instagram className="h-6 w-6 transition-transform group-hover:scale-110" />
                </Link>
                <Link href={hotel.tiktok_url || "#"} target="_blank" className="w-14 h-14 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-xl border border-primary/50 text-white hover:bg-primary hover:border-primary transition-all duration-500 shadow-[0_10px_30px_rgba(0,0,0,0.5)] group">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 transition-transform group-hover:scale-110">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z"/>
                  </svg>
                </Link>
                <Link href={hotel.email ? `mailto:${hotel.email}` : "#"} className="w-14 h-14 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-xl border border-primary/50 text-white hover:bg-primary hover:border-primary transition-all duration-500 shadow-[0_10px_30px_rgba(0,0,0,0.5)] group">
                  <Mail className="h-6 w-6 transition-transform group-hover:scale-110" />
                </Link>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6 pt-6 text-white font-bold drop-shadow-[0_2px_10px_rgba(0,0,0,1)]">
                {hotel.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{hotel.address.split(',')[0]}</span>
                  </div>
                )}
                <div className="h-1 w-1 bg-white/20 rounded-full" />
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-primary fill-primary" />
                  <span className="text-sm font-medium">{hotel.rating ? `${hotel.rating}/5` : "Top Rated"}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Info & Scattering Gallery Section */}
        <section className="relative py-24 bg-background">
          <div className="container px-6 mx-auto">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              {/* Content Box */}
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-12"
              >
                <div className="space-y-4">
                  <Badge variant="outline" className="border-primary/50 text-primary rounded-none px-4 py-1">
                    OUR HERITAGE
                  </Badge>
                  <h2 className="text-4xl md:text-5xl font-serif tracking-tight">
                    Crafting perfection in every <span className="text-primary italic">detail.</span>
                  </h2>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    At {hotel.name}, we believe that dining is an art form. From our hand-picked ingredients to the curated atmosphere, every element is designed to elevate your senses.
                  </p>
                </div>

                <div className="grid gap-8">
                  <div className="flex items-start gap-6 group">
                    <div className="w-12 h-12 rounded-full border border-primary/20 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">Open Daily</h3>
                      <p className="text-muted-foreground">{hotel.opening_hours || "08:00 AM — 11:00 PM"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-6 group">
                    <div className="w-12 h-12 rounded-full border border-primary/20 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">Find Us</h3>
                      <p className="text-muted-foreground">{hotel.address || "Location details coming soon"}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-4">
                  {hotel.instagram_url && (
                    <Link href={hotel.instagram_url} target="_blank" className="h-12 w-12 rounded-full border border-primary/20 flex items-center justify-center hover:bg-primary/10 hover:border-primary/40 transition-all duration-300">
                      <Instagram className="h-5 w-5" />
                    </Link>
                  )}
                  {hotel.facebook_url && (
                    <Link href={hotel.facebook_url} target="_blank" className="h-12 w-12 rounded-full border border-primary/20 flex items-center justify-center hover:bg-primary/10 hover:border-primary/40 transition-all duration-300">
                      <Facebook className="h-5 w-5" />
                    </Link>
                  )}
                  {hotel.twitter_url && (
                    <Link href={hotel.twitter_url} target="_blank" className="h-12 w-12 rounded-full border border-primary/20 flex items-center justify-center hover:bg-primary/10 hover:border-primary/40 transition-all duration-300">
                      <Twitter className="h-5 w-5 text-foreground" />
                    </Link>
                  )}
                  {hotel.tiktok_url && (
                    <Link href={hotel.tiktok_url} target="_blank" className="h-12 w-12 rounded-full border border-primary/20 flex items-center justify-center hover:bg-primary/10 hover:border-primary/40 transition-all duration-300">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                      </svg>
                    </Link>
                  )}
                  {(hotel.website_url || hotel.email) && (
                    <Link href={hotel.website_url || `mailto:${hotel.email}`} target="_blank" className="h-12 w-12 rounded-full border border-primary/20 flex items-center justify-center hover:bg-primary/10 hover:border-primary/40 transition-all duration-300">
                      <Globe className="h-5 w-5" />
                    </Link>
                  )}
                </div>
              </motion.div>

              {/* Modern Grid Gallery */}
              <div className="w-full hidden md:block">
                {gallery.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4 h-[600px]">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      onClick={() => setSelectedImageIndex(0)}
                      className="relative h-full rounded-3xl overflow-hidden shadow-2xl border border-border/50 cursor-pointer group"
                    >
                      <Image src={gallery[0]} alt="Gallery 1" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                    </motion.div>
                    <div className="grid grid-rows-2 gap-4 h-full">
                      {gallery[1] && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          onClick={() => setSelectedImageIndex(1)}
                          transition={{ delay: 0.2 }}
                          className="relative h-full rounded-3xl overflow-hidden shadow-2xl border border-border/50 cursor-pointer group"
                        >
                          <Image src={gallery[1]} alt="Gallery 2" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                        </motion.div>
                      )}
                      <div className="grid grid-cols-2 gap-4 h-full">
                        {gallery[2] && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            onClick={() => setSelectedImageIndex(2)}
                            transition={{ delay: 0.3 }}
                            className="relative h-full rounded-3xl overflow-hidden shadow-2xl border border-border/50 cursor-pointer group"
                          >
                            <Image src={gallery[2]} alt="Gallery 3" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                          </motion.div>
                        )}
                        {gallery[3] ? (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            onClick={() => setSelectedImageIndex(3)}
                            transition={{ delay: 0.4 }}
                            className="relative h-full rounded-3xl overflow-hidden shadow-2xl border border-border/50 cursor-pointer group"
                          >
                            <Image src={gallery[3]} alt="Gallery 4" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                          </motion.div>
                        ) : gallery[2] && (
                           <div className="bg-secondary/20 rounded-3xl flex items-center justify-center border border-dashed border-border/50">
                             <Utensils className="h-8 w-8 text-muted-foreground/20" />
                           </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-[600px] w-full bg-secondary/10 rounded-[2rem] border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                    <span className="text-muted-foreground font-medium italic tracking-wide">Our gallery is coming soon</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Mobile Gallery (Horizontal Scroll) */}
        {gallery.length > 0 && (
          <div className="md:hidden px-6 pb-20 overflow-x-auto no-scrollbar flex gap-4 snap-x snap-mandatory">
            {gallery.map((img, i) => (
              <div 
                key={i} 
                onClick={() => setSelectedImageIndex(i)}
                className="relative min-w-[300px] h-[400px] rounded-[2.5rem] overflow-hidden shadow-2xl snap-center border border-border/50 cursor-pointer"
              >
                <Image src={img} alt={`Gallery ${i}`} fill className="object-cover" />
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
            ))}
          </div>
        )}

        {/* Featured Specials Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="container px-6 mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
              <div className="space-y-4">
                <Badge className="bg-primary/10 text-primary border-none rounded-full px-4 py-1">
                  CHEF'S SELECTION
                </Badge>
                <h2 className="text-4xl md:text-5xl font-serif">Signature <span className="italic text-primary">Masterpieces</span></h2>
                <p className="text-muted-foreground max-w-xl">
                  Hand-selected by our executive chef, these dishes represent the pinnacle of our culinary philosophy.
                </p>
              </div>
              <Button asChild variant="ghost" className="group text-primary hover:text-primary hover:bg-primary/5">
                <Link href={`/menu/${hotelSlug}/list`}>
                  Explore Full Menu <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { name: "Symphony of Flavors", desc: "A seasonal arrangement of hand-picked ingredients.", price: "Premium" },
                { name: "The Artisan's Catch", desc: "Freshly sourced seafood prepared with traditional techniques.", price: "Market Price" },
                { name: "Heritage Fusion", desc: "A modern twist on timeless classics from our heritage.", price: "Exclusive" }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -10 }}
                  className="group relative bg-secondary/10 rounded-[2rem] p-8 border border-border/50 hover:border-primary/30 transition-all duration-500"
                >
                  <div className="mb-6 w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <ChefHat className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{item.name}</h3>
                  <p className="text-muted-foreground mb-6 line-clamp-2">{item.desc}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold tracking-widest uppercase text-primary/80">{item.price}</span>
                    <div className="h-8 w-8 rounded-full border border-primary/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-24 bg-secondary/5">
          <div className="container px-6 mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
              <div className="flex justify-center gap-1 text-primary">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-primary" />
                ))}
              </div>
              <h2 className="text-4xl font-serif">What our <span className="italic text-primary">Guests</span> say</h2>
              <p className="text-muted-foreground">Stories of unforgettable dining experiences from our community.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { author: "Elias T.", text: "The atmosphere is unmatched. Every dish tells a story of passion and excellence. A truly elevated experience." },
                { author: "Selam W.", text: "Exceptional service and the fusion of flavors in their signature dishes is something I've never tasted before." },
                { author: "Dawit K.", text: "A masterpiece in every sense. From the presentation to the last bite, it was pure culinary magic." }
              ].map((review, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -5 }}
                  className="bg-background border border-border/50 p-8 rounded-3xl relative"
                >
                  <Quote className="absolute top-6 right-8 h-12 w-12 text-primary/5 -scale-x-100" />
                  <p className="text-lg italic leading-relaxed mb-6 text-foreground/80">"{review.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                      {review.author[0]}
                    </div>
                    <span className="font-medium">{review.author}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features / Why Us Section */}
        <section className="py-24 border-y border-border/50">
          <div className="container px-6 mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
              {[
                { icon: Utensils, title: "Artisanal Cuisine", desc: "Hand-crafted dishes using traditional methods." },
                { icon: MapPin, title: "Prime Location", desc: "Situated in the heart of the city with stunning views." },
                { icon: Heart, title: "Made with Love", desc: "Every ingredient is chosen with the utmost care." },
                { icon: Star, title: "Elite Service", desc: "A world-class team dedicated to your experience." }
              ].map((feature, i) => (
                <div key={i} className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Reservation / Contact CTA */}
        <section className="py-24 bg-background relative overflow-hidden">
          <div className="container px-6 mx-auto">
            <div className="bg-primary/5 rounded-[3rem] p-12 md:p-20 relative overflow-hidden border border-primary/10">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Utensils className="h-64 w-64 rotate-12" />
              </div>
              
              <div className="relative z-10 grid lg:grid-cols-2 gap-16 items-center">
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h2 className="text-4xl md:text-5xl font-serif">Plan an <span className="italic text-primary">Experience</span></h2>
                    <p className="text-lg text-muted-foreground">
                      Whether it's an intimate dinner or a grand celebration, we're here to make it unforgettable.
                    </p>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Phone className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Call Us</p>
                        <p className="font-medium">{hotel.phone || "Coming Soon"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Email Us</p>
                        <p className="font-medium">{hotel.email || "hello@restaurant.com"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <Button size="lg" className="rounded-full px-8 h-14 text-base shadow-xl shadow-primary/20">
                      Reserve a Table
                    </Button>
                    <Button variant="outline" size="lg" className="rounded-full px-8 h-14 text-base border-primary/20 hover:bg-primary/5">
                      Get Directions <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="relative h-[400px] rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 group">
                  <Image 
                    src={coverImage}
                    alt="Map Preview"
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-1000"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-2xl">
                      <MapPin className="h-8 w-8 text-white animate-bounce" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter / Join Club Section */}
        <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-64 h-64 border-4 border-white rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 border-4 border-white rounded-full translate-x-1/3 translate-y-1/3" />
          </div>
          
          <div className="container px-6 mx-auto relative z-10 text-center space-y-8">
            <div className="space-y-4 max-w-2xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-serif">Join the <span className="italic opacity-80 underline decoration-white/30 underline-offset-8">Connoisseurs Club</span></h2>
              <p className="text-primary-foreground/80 text-lg">
                Be the first to know about our seasonal menus, exclusive events, and culinary secrets.
              </p>
            </div>
            
            <form className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="Your email address" 
                className="flex-1 h-14 rounded-full bg-white/10 border border-white/20 px-6 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
              />
              <Button className="h-14 rounded-full px-8 bg-white text-primary hover:bg-white/90 font-bold transition-transform active:scale-95">
                JOIN NOW
              </Button>
            </form>
            <p className="text-xs text-primary-foreground/40 uppercase tracking-widest font-bold">Privacy Guaranteed. No Spam.</p>
          </div>
        </section>

        <Dialog open={selectedImageIndex !== null} onOpenChange={(open) => !open && setSelectedImageIndex(null)}>
          <DialogContent className="max-w-[95vw] sm:max-w-[70vw] h-[80vh] p-0 bg-transparent border-none shadow-none flex items-center justify-center">
            <DialogHeader className="sr-only">
               <DialogTitle>Restaurant Gallery</DialogTitle>
            </DialogHeader>
            <Carousel setApi={setCarouselApi} className="w-full h-full group">
              <CarouselContent className="h-[80vh]">
                {gallery.map((img, i) => (
                  <CarouselItem key={i} className="flex items-center justify-center h-full">
                    <div className="relative w-full h-full flex items-center justify-center p-4">
                      <Image 
                        src={img} 
                        alt={`Gallery ${i}`} 
                        width={1200}
                        height={800}
                        className="object-contain max-h-full rounded-2xl shadow-2xl"
                        priority
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2 z-20">
                 {gallery.map((_, i) => (
                   <button
                     key={i}
                     onClick={() => carouselApi?.scrollTo(i)}
                     className={cn(
                       "w-2 h-2 rounded-full transition-all duration-300",
                       selectedImageIndex === i ? "bg-white w-6" : "bg-white/30"
                     )}
                   />
                 ))}
              </div>
              <CarouselPrevious className="left-4 bg-black/20 border-white/20 text-white hover:bg-black/40 hover:scale-110 transition-all opacity-0 group-hover:opacity-100" />
              <CarouselNext className="right-4 bg-black/20 border-white/20 text-white hover:bg-black/40 hover:scale-110 transition-all opacity-0 group-hover:opacity-100" />
            </Carousel>
          </DialogContent>
        </Dialog>
      </main>

      {/* Exquisite Footer */}
      <footer className="bg-secondary/20 pt-20 pb-40">
        <div className="container px-6 mx-auto flex flex-col items-center text-center space-y-12">
          <div className="space-y-4">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.5em]">POWERED BY</span>
            <div className="flex flex-col items-center">
              <Logo width={160} height={50} />
              <span className="text-2xl font-serif text-primary italic mt-2">አገልግል</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground max-w-md">
            The next generation of dining technology. Revolutionizing the way you experience menus.
          </p>
        </div>
      </footer>

      {/* Floating CTA */}
      <div className="fixed bottom-0 inset-x-0 p-6 z-50 pointer-events-none">
        <div className="container max-w-lg mx-auto">
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            transition={{ delay: 1, type: "spring", stiffness: 100 }}
            className="pointer-events-auto"
          >
            <Button
              size="lg"
              className="h-20 w-full rounded-3xl text-xl font-medium shadow-[0_20px_50px_rgba(var(--primary-rgb),0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] group flex items-center justify-center gap-4 bg-primary text-primary-foreground border-none"
              asChild
            >
              <Link href={`/menu/${hotelSlug}/list`}>
                VIEW OUR MENU <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

