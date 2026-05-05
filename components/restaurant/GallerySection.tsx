"use client"

import { useState } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { X, ZoomIn, ChevronLeft, ChevronRight, Camera, Share2, ChevronDown } from "lucide-react"
import { cn, getImageUrl } from "@/lib/utils"
import { useIsMounted } from "@/hooks/useIsMounted"

type GalleryImage = {
  id: string
  url: string
  alt: string
  caption?: string
}

interface GallerySectionProps {
  images: GalleryImage[]
  className?: string
  // Optional template theme to enable decorative backdrops/frames
  templateTheme?: any
  variant?: "restaurant" | "hotel" | "cafe"
}

export function GallerySection({ images, className, templateTheme, variant = "restaurant" }: GallerySectionProps) {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const isMounted = useIsMounted()

  if (!images || images.length === 0) return null

  const openLightbox = (image: GalleryImage, index: number) => {
    setSelectedImage(image)
    setCurrentIndex(index)
  }

  const closeLightbox = () => {
    setSelectedImage(null)
  }

  const navigateImage = (direction: "prev" | "next") => {
    if (direction === "prev") {
      const newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1
      setCurrentIndex(newIndex)
      setSelectedImage(images[newIndex])
    } else {
      const newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0
      setCurrentIndex(newIndex)
      setSelectedImage(images[newIndex])
    }
  }

  // Likes removed — gallery images are for display only.

  return (
    <>
      <section id="gallery" className={cn("relative overflow-hidden py-20 md:py-28 bg-linear-to-b from-background via-muted/10 to-background", className)}>
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-8%] top-0 h-120 w-120 rounded-full bg-white/35 blur-3xl dark:bg-white/5" />
          <div className="absolute right-[-10%] top-40 h-144 w-144 rounded-full bg-slate-300/30 blur-3xl dark:bg-slate-500/10" />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.05),transparent_40%,rgba(15,23,42,0.03))] dark:bg-[linear-gradient(to_bottom,rgba(255,255,255,0.02),transparent_40%,rgba(255,255,255,0.01))]" />
        </div>
        <div className="container mx-auto px-6">
          {/* Section Header */}
          {isMounted ? (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mx-auto mb-16 max-w-4xl text-center"
            >
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/20 bg-primary/10 shadow-sm backdrop-blur-sm">
                  <Camera className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm uppercase tracking-[0.6em] text-muted-foreground font-serif">Gallery</p>
              </div>
              <h2 className="text-4xl font-serif font-bold tracking-tight text-foreground md:text-6xl">
                Visual Journey
              </h2>
              <p className="mx-auto mt-5 max-w-3xl font-serif text-lg leading-relaxed text-muted-foreground md:text-xl">
                Immerse yourself in our world through carefully curated moments. From culinary masterpieces to ambient spaces, 
                each image tells a story of passion and excellence.
              </p>
            </motion.div>
          ) : (
            <div className="mx-auto mb-16 max-w-4xl text-center">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/20 bg-primary/10 shadow-sm backdrop-blur-sm">
                  <Camera className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm uppercase tracking-[0.6em] text-muted-foreground font-serif">Gallery</p>
              </div>
              <h2 className="text-4xl font-serif font-bold tracking-tight text-foreground md:text-6xl">
                Visual Journey
              </h2>
              <p className="mx-auto mt-5 max-w-3xl font-serif text-lg leading-relaxed text-muted-foreground md:text-xl">
                Immerse yourself in our world through carefully curated moments. From culinary masterpieces to ambient spaces, 
                each image tells a story of passion and excellence.
              </p>
            </div>
          )}

          {/* Gallery Grid */}
          <div className="mx-auto mb-12 max-w-7xl">
            <div className="overflow-y-auto max-h-[60vh] md:max-h-[70vh] p-2 no-scrollbar rounded-3xl border border-border/60 bg-card/35 backdrop-blur-sm">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-12">
            {images.map((image, index) => (
              <div
                key={image.id}
                className={cn(
                  "group relative",
                  index === 0 && "lg:col-span-7 lg:row-span-2",
                  index === 1 && "lg:col-span-5",
                  index === 2 && "lg:col-span-5",
                  index === 3 && "lg:col-span-7",
                  index > 3 && "lg:col-span-4"
                )}
              >
                {/* Main Image Frame */}
                <div
                  className={cn(
                    "relative overflow-hidden rounded-3xl cursor-pointer border border-border/50 bg-card/70 shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_24px_80px_rgba(0,0,0,0.18)]",
                    index === 0 ? "aspect-[4/5] lg:min-h-[34rem]" : index === 1 ? "aspect-[4/5] lg:min-h-[34rem]" : "aspect-4/3"
                  )}
                  onClick={() => openLightbox(image, index)}
                >
                  <Image
                    src={getImageUrl(image.url) || "/hotel.webp"}
                    alt={image.alt}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  
                  {/* Action Buttons */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="flex items-center gap-4">
                        <div className="bg-white/90 backdrop-blur-sm rounded-full p-4 shadow-lg">
                          <ZoomIn className="h-6 w-6 text-foreground" />
                        </div>
                      </div>
                  </div>

                  {/* Image Caption */}
                  {image.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent p-6">
                      <p className="text-white text-lg font-medium">{image.caption}</p>
                    </div>
                  )}

                  {/* Decorative Frame */}
                  <div className="absolute inset-0 rounded-3xl border-2 border-white/20 pointer-events-none" />
                  <div className="absolute inset-0 rounded-3xl border border-white/10 pointer-events-none" />
                </div>

                {/* Image Number Badge */}
                <div className="absolute -right-3 -top-3 flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-primary to-primary/80 text-sm font-bold text-white shadow-lg">
                  {index + 1}
                </div>
              </div>
            ))}
              </div>
            </div>

            {/* Scroll hint */}
            <div className="pointer-events-none absolute left-1/2 bottom-4 -translate-x-1/2 z-20 flex items-center justify-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/6 backdrop-blur-md text-white/90 shadow-lg animate-pulse">
                <ChevronDown className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Gallery Stats */}
          <div className="text-center">
            <div className="inline-flex items-center gap-6 rounded-full border border-border/60 bg-card/80 px-8 py-4 shadow-sm backdrop-blur-md">
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" />
                <span className="font-semibold">{images.length} Photos</span>
              </div>
              <div className="w-px h-6 bg-border" />
              {/* Likes removed — no like counts shown */}
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
            onClick={closeLightbox}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-6xl max-h-[90vh] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Main Image */}
              <div className="relative aspect-video md:aspect-auto md:h-[85vh] rounded-3xl overflow-hidden shadow-2xl">
                <Image
                  src={getImageUrl(selectedImage.url) || "/hotel.webp"}
                  alt={selectedImage.alt}
                  fill
                  className="object-contain"
                  sizes="100vw"
                />
                
                {/* Image Frame */}
                <div className="absolute inset-0 rounded-3xl border-2 border-white/20 pointer-events-none" />
                <div className="absolute inset-0 rounded-3xl border border-white/10 pointer-events-none" />
              </div>
              
              {/* Controls */}
              <button
                onClick={closeLightbox}
                className="absolute top-6 right-6 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors border border-white/20"
              >
                <X className="h-6 w-6" />
              </button>

              {/* Navigation */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => navigateImage("prev")}
                    className="absolute left-6 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors border border-white/20"
                  >
                    <ChevronLeft className="h-7 w-7" />
                  </button>
                  <button
                    onClick={() => navigateImage("next")}
                    className="absolute right-6 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors border border-white/20"
                  >
                    <ChevronRight className="h-7 w-7" />
                  </button>
                </>
              )}

              {/* Image Info */}
              <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent p-8">
                <div className="flex items-center justify-between">
                  <div>
                    {selectedImage.caption && (
                      <h3 className="text-white text-2xl font-semibold mb-2">{selectedImage.caption}</h3>
                    )}
                    <p className="text-white/80 text-sm">
                      Image {currentIndex + 1} of {images.length}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Like button removed from lightbox */}
                    <button className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors border border-white/20">
                      <Share2 className="h-6 w-6" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
