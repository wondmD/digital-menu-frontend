"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, ArrowRight } from "lucide-react"
import { getImageUrl } from "@/lib/utils"

type EventItem = {
  id?: string
  title: string
  date: string
  description?: string
  image_url?: string
  href?: string
  time?: string
  price?: string
  location?: string
}

interface EventsSectionProps {
  events: EventItem[]
}

export function EventsSection({ events }: EventsSectionProps) {
  if (!events || events.length === 0) return null

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const formatTime = (timeString?: string) => {
    if (!timeString) return ""
    try {
      const [hours, minutes] = timeString.split(':')
      const hour = parseInt(hours)
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const displayHour = hour > 12 ? hour - 12 : hour
      return `${displayHour}:${minutes} ${ampm}`
    } catch {
      return timeString
    }
  }

  return (
    <section id="events" className="relative py-20 md:py-32 bg-muted/20">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-10 h-72 w-72 rounded-full bg-primary/10 blur-[140px]" />
        <div className="absolute bottom-0 right-10 h-64 w-64 rounded-full bg-amber-500/10 blur-[120px]" />
      </div>
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-6">
            Moments & Events
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-serif font-bold mb-6">
            Upcoming Events
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-serif">
            Join us for special occasions, themed dinners, and memorable experiences
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((event, index) => (
            <motion.div
              key={event.id || index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
            >
              <Card className="group rounded-2xl overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]">
                {/* Event Image */}
                <div className="relative h-48 md:h-56 overflow-hidden">
                  <Image
                    src={getImageUrl(event.image_url) || "/hotel.webp"}
                    alt={event.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  
                  {/* Date Badge */}
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-white/90 text-black hover:bg-white transition-colors">
                      <Calendar className="mr-2 h-3 w-3" />
                      {formatDate(event.date)}
                    </Badge>
                  </div>

                  {/* Price Badge */}
                  {event.price && (
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-primary/90 text-white hover:bg-primary transition-colors">
                        {event.price}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Event Content */}
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold line-clamp-2 group-hover:text-primary transition-colors">
                      {event.title}
                    </h3>
                    
                    {/* Time and Location */}
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      {event.time && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatTime(event.time)}</span>
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center gap-1">
                          <span>•</span>
                          <span>{event.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {event.description && (
                    <p className="text-muted-foreground line-clamp-3 leading-relaxed">
                      {event.description}
                    </p>
                  )}

                  {/* Call to Action */}
                  <div className="pt-2">
                    {event.href ? (
                      <Button
                        asChild
                        variant="outline"
                        className="w-full rounded-xl group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300"
                      >
                        <a href={event.href} target="_blank" rel="noopener noreferrer">
                          Learn More
                          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </a>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full rounded-xl group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300"
                        onClick={() => {
                          // Handle event registration or details
                          console.log('Event clicked:', event.title)
                        }}
                      >
                        Learn More
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* View All Events CTA */}
        {events.length >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-center mt-12"
          >
            <Button
              variant="outline"
              size="lg"
              className="rounded-xl px-8 group"
            >
              View All Events
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  )
}
