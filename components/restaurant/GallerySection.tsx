"use client"

import { useState } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { X, ZoomIn, ChevronLeft, ChevronRight, Camera, Heart, Share2 } from "lucide-react"
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
}

export function GallerySection({ images, className }: GallerySectionProps) {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [likedImages, setLikedImages] = useState<Set<string>>(new Set())
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

  const toggleLike = (imageId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setLikedImages(prev => {
      const newSet = new Set(prev)
      if (newSet.has(imageId)) {
        newSet.delete(imageId)
      } else {
        newSet.add(imageId)
      }
      return newSet
    })
  }

  return (
    <>
      <section id="gallery" className={cn("py-20 md:py-28 bg-gradient-to-b from-background via-muted/10 to-muted/20", className)}>
        <div className="container mx-auto px-6">
          {/* Section Header */}
          {isMounted ? (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <Camera className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm uppercase tracking-[0.6em] text-muted-foreground font-serif">Gallery</p>
              </div>
              <h2 className="text-4xl md:text-6xl font-serif font-bold text-foreground mb-6">
                Visual Journey
              </h2>
              <p className="text-muted-foreground mt-4 max-w-3xl mx-auto font-serif text-lg leading-relaxed">
                Immerse yourself in our world through carefully curated moments. From culinary masterpieces to ambient spaces, 
                each image tells a story of passion and excellence.
              </p>
            </motion.div>
          ) : (
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <Camera className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm uppercase tracking-[0.6em] text-muted-foreground font-serif">Gallery</p>
              </div>
              <h2 className="text-4xl md:text-6xl font-serif font-bold text-foreground mb-6">
                Visual Journey
              </h2>
              <p className="text-muted-foreground mt-4 max-w-3xl mx-auto font-serif text-lg leading-relaxed">
                Immerse yourself in our world through carefully curated moments. From culinary masterpieces to ambient spaces, 
                each image tells a story of passion and excellence.
              </p>
            </div>
          )}

          {/* Gallery Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {images.map((image, index) => (
              <div key={image.id} className="group relative">
                {/* Main Image Frame */}
                <div className="relative aspect-[4/3] overflow-hidden rounded-3xl cursor-pointer shadow-2xl hover:shadow-3xl transition-all duration-500"
                     onClick={() => openLightbox(image, index)}>
                  <Image
                    src={getImageUrl(image.url) || "/hotel.webp"}
                    alt={image.alt}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Action Buttons */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="flex items-center gap-4">
                      <div className="bg-white/90 backdrop-blur-sm rounded-full p-4 shadow-lg">
                        <ZoomIn className="h-6 w-6 text-foreground" />
                      </div>
                      <div
                        onClick={(e) => toggleLike(image.id, e)}
                        className="bg-white/90 backdrop-blur-sm rounded-full p-4 shadow-lg"
                      >
                        <Heart className={`h-6 w-6 ${likedImages.has(image.id) ? 'fill-red-500 text-red-500' : 'text-foreground'}`} />
                      </div>
                    </div>
                  </div>

                  {/* Image Caption */}
                  {image.caption && (
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                      <p className="text-white text-lg font-medium">{image.caption}</p>
                    </div>
                  )}

                  {/* Decorative Frame */}
                  <div className="absolute inset-0 rounded-3xl border-2 border-white/20 pointer-events-none" />
                  <div className="absolute inset-0 rounded-3xl border border-white/10 pointer-events-none" />
                </div>

                {/* Image Number Badge */}
                <div className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>

          {/* Gallery Stats */}
          <div className="text-center">
            <div className="inline-flex items-center gap-6 bg-card rounded-2xl px-8 py-4 border border-border shadow-sm">
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" />
                <span className="font-semibold">{images.length} Photos</span>
              </div>
              <div className="w-px h-6 bg-border" />
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                <span className="font-semibold">{likedImages.size} Liked</span>
              </div>
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
              <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent">
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
                    <button
                      onClick={(e) => toggleLike(selectedImage.id, e)}
                      className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors border border-white/20"
                    >
                      <Heart className={`h-6 w-6 ${likedImages.has(selectedImage.id) ? 'fill-red-500 text-red-500' : ''}`} />
                    </button>
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
