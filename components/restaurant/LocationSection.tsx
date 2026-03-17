"use client"

import { motion } from "framer-motion"
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
}

interface LocationSectionProps {
  hotel: Restaurant
  mapSrc?: string
  mapLink?: string
}

export function LocationSection({ hotel, mapSrc, mapLink }: LocationSectionProps) {
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
    <section id="location" className="py-20 md:py-32 bg-background">
      <div className="container mx-auto px-6">
        {isMounted ? (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
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

        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-12 items-start">
          {/* Map */}
          {isMounted ? (
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative h-[320px] sm:h-[420px] lg:h-[600px] rounded-3xl overflow-hidden shadow-2xl"
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
            <div className="relative h-[320px] sm:h-[420px] lg:h-[600px] rounded-3xl overflow-hidden shadow-2xl">
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
              <Card className="rounded-2xl border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
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
                <Card className="rounded-2xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
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
                <Card className="rounded-2xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
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
                <Card className="rounded-2xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
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
            <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="p-8">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Operating Hours</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Monday - Friday</span>
                      <span className="font-medium">8:00 AM - 11:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Saturday</span>
                      <span className="font-medium">9:00 AM - 12:00 AM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sunday</span>
                      <span className="font-medium">9:00 AM - 10:00 PM</span>
                    </div>
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
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
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
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
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
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <MessageCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-xl font-semibold">WhatsApp</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          Chat with us for quick reservations and inquiries
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
