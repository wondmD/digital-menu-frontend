"use client"

import { motion } from "framer-motion"
import { TemplatePatternBackdrop, TemplateFrameOrnament } from "@/components/menu-templates/shared"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Phone, ExternalLink, MessageCircle } from "lucide-react"
import { useIsMounted } from "@/hooks/useIsMounted"

type Restaurant = {
  name: string
  address?: string
  phone?: string
  email?: string
  whatsapp?: string
  opening_hours?: string
}

interface LocationSectionProps {
  hotel: Restaurant
  mapSrc?: string
  mapLink?: string
  templateTheme?: any
  variant?: "restaurant" | "hotel" | "cafe"
}

export function LocationSection({ hotel, mapSrc, mapLink, templateTheme, variant = "restaurant" }: LocationSectionProps) {
  const isMounted = useIsMounted()
  const hasLocation = hotel.address || mapSrc

  if (!hasLocation) return null

  const handleDirectionsClick = () => {
    if (mapLink) {
      window.open(mapLink, '_blank', 'noopener,noreferrer')
    }
  }

  const handlePhoneClick = () => {
    if (hotel.phone) {
      window.open(`tel:${hotel.phone}`, '_self')
    }
  }

  const handleWhatsAppClick = () => {
    const phoneNumber = hotel.whatsapp || hotel.phone
    if (phoneNumber) {
      const message = encodeURIComponent(`Hi! I'd like to inquire about ${hotel.name}.`)
      window.open(`https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}?text=${message}`, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <section id="location" className="relative py-20 md:py-32 bg-linear-to-b from-background via-muted/10 to-background">
      {templateTheme ? <TemplatePatternBackdrop theme={templateTheme} variant={variant} /> : null}
      {templateTheme ? (
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-80 scale-102">
          <TemplatePatternBackdrop theme={templateTheme} variant={variant} />
        </div>
      ) : null}
      {templateTheme ? <TemplateFrameOrnament theme={templateTheme} variant={variant} /> : null}
      <div className="container mx-auto px-6">
        {isMounted ? (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-16 text-center"
          >
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-serif font-bold mb-6">
              Find Us
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-serif">
              Visit us for an unforgettable dining experience in the heart of the city
            </p>
          </motion.div>
        ) : (
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-serif font-bold mb-6">
              Find Us
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-serif">
              Visit us for an unforgettable dining experience in the heart of the city
            </p>
          </div>
        )}

        <div className="grid items-start gap-12 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Map */}
          {isMounted ? (
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative h-80 overflow-hidden rounded-3xl border border-border/50 shadow-2xl sm:h-105 lg:h-150"
            >
              {mapSrc ? (
                <iframe
                  src={mapSrc}
                  className="w-full h-full border-0"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`Map showing location of ${hotel.name}`}
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <MapPin className="h-16 w-16 text-muted-foreground mx-auto" />
                    <p className="text-muted-foreground">Map loading...</p>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="relative h-80 overflow-hidden rounded-3xl shadow-2xl sm:h-105 lg:h-150">
              {mapSrc ? (
                <iframe
                  src={mapSrc}
                  className="w-full h-full border-0"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`Map showing location of ${hotel.name}`}
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <MapPin className="h-16 w-16 text-muted-foreground mx-auto" />
                    <p className="text-muted-foreground">Map loading...</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Contact Information */}
          {isMounted ? (
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="space-y-8"
            >
            {/* Address Card */}
            {hotel.address && (
                <Card className="rounded-3xl border border-border/60 bg-card/80 shadow-lg backdrop-blur-xl transition-shadow duration-300 hover:shadow-xl">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
                        <MapPin className="h-6 w-6 text-primary" />
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-xl font-semibold">Address</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {hotel.address}
                        </p>
                        {mapLink && (
                          <Button
                            onClick={handleDirectionsClick}
                            variant="outline"
                            className="rounded-xl mt-4"
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Open in Google Maps
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Contact Cards */}
            <div className="grid gap-6">
              {hotel.phone && (
                <Card className="rounded-3xl border border-border/60 bg-card/80 shadow-lg backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-green-500/20 bg-green-500/10">
                          <Phone className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold">Phone</h4>
                          <p className="text-muted-foreground">{hotel.phone}</p>
                        </div>
                      </div>
                      <Button
                        onClick={handlePhoneClick}
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                      >
                        Call
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {(hotel.whatsapp || hotel.phone) && (
                <Card className="rounded-3xl border border-border/60 bg-card/80 shadow-lg backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-green-500/20 bg-green-500/10">
                          <MessageCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold">WhatsApp</h4>
                          <p className="text-muted-foreground">
                            {hotel.whatsapp || hotel.phone}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={handleWhatsAppClick}
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                      >
                        Message
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {hotel.email && (
                <Card className="rounded-3xl border border-border/60 bg-card/80 shadow-lg backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-blue-500/20 bg-blue-500/10">
                        <MessageCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Email</h4>
                        <p className="text-muted-foreground">{hotel.email}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Operating Hours */}
            <Card className="rounded-3xl border border-primary/15 bg-linear-to-br from-primary/5 to-primary/10 shadow-lg backdrop-blur-xl">
              <CardContent className="p-8">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Operating Hours</h3>
                  <div className="space-y-2 text-sm">
                    {hotel.opening_hours ? (
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Current Schedule</span>
                        <span className="font-medium text-right">{hotel.opening_hours}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
            </motion.div>
          ) : (
            <div className="space-y-8">
            {/* Address Card */}
            {hotel.address && (
              <Card className="rounded-2xl border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <MapPin className="h-6 w-6 text-primary" />
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-xl font-semibold">Address</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {hotel.address}
                        </p>
                        <Button 
                          onClick={handleDirectionsClick} 
                          variant="outline" 
                          className="rounded-xl"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Get Directions
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Phone Card */}
            {hotel.phone && (
              <Card className="rounded-2xl border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Phone className="h-6 w-6 text-primary" />
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-xl font-semibold">Phone</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {hotel.phone}
                        </p>
                        <Button 
                          onClick={handlePhoneClick} 
                          variant="outline" 
                          className="rounded-xl"
                        >
                          <Phone className="mr-2 h-4 w-4" />
                          Call Now
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* WhatsApp Card */}
            {(hotel.whatsapp || hotel.phone) && (
              <Card className="rounded-2xl border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-100">
                        <MessageCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-xl font-semibold">WhatsApp</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          Chat with us for quick questions and support
                        </p>
                        <Button 
                          onClick={handleWhatsAppClick} 
                          variant="outline" 
                          className="rounded-xl border-green-200 hover:bg-green-50"
                        >
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Chat on WhatsApp
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
