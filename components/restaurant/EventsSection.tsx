"use client"

import Image from "next/image"
import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Calendar, Clock, ArrowRight } from "lucide-react"
import { getImageUrl } from "@/lib/utils"

type EventItem = {
  id?: string
  title: string
  date: string
  end_date?: string
  description?: string
  image_url?: string
  href?: string
  time?: string
  end_time?: string
  price?: string
  location?: string
  timezone?: string
  is_active?: boolean
}

interface EventsSectionProps {
  events: EventItem[]
  coverImage?: string
  templateTheme?: any
  variant?: "restaurant" | "hotel" | "cafe"
}

export function EventsSection({ events, coverImage, templateTheme, variant = "restaurant" }: EventsSectionProps) {
  if (!events || events.length === 0) return null
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null)
  const fallbackImage = coverImage || "/hotel.webp"

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

  const formatDateRange = (startDate: string, endDate?: string) => {
    if (!endDate || startDate === endDate) return formatDate(startDate)
    return `${formatDate(startDate)} - ${formatDate(endDate)}`
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
    <section id="events" className="relative overflow-hidden bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 py-20 text-white md:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-10 h-72 w-72 rounded-full bg-slate-400/12 blur-[140px]" />
        <div className="absolute bottom-0 right-10 h-64 w-64 rounded-full bg-white/8 blur-[120px]" />
        <div className="absolute inset-0 bg-linear-to-b from-white/4 via-transparent to-white/2" />
      </div>
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mx-auto mb-16 max-w-4xl text-center"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-white backdrop-blur-sm">
            Moments & Events
          </div>
          <h2 className="text-3xl font-serif font-bold tracking-tight text-white sm:text-4xl md:text-6xl">
            Upcoming Events
          </h2>
          <p className="mx-auto mt-5 max-w-2xl font-serif text-base text-white/75 sm:text-lg md:text-xl">
            Join us for special occasions, themed dinners, and memorable experiences
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event, index) => (
            <motion.div
              key={event.id || index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
            >
                <Card className="group overflow-hidden rounded-4xl border border-white/10 bg-white/6 shadow-lg shadow-black/20 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:border-amber-400/30 hover:shadow-2xl hover:shadow-black/35">
                {/* Event Image */}
                {(getImageUrl(event.image_url) || fallbackImage) ? (
                  <div className="relative h-48 md:h-56 overflow-hidden">
                    <Image
                      src={getImageUrl(event.image_url) || fallbackImage}
                      alt={event.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      unoptimized
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />

                    {/* Date Badge */}
                    <div className="absolute top-4 left-4">
                      <Badge className="border-0 bg-linear-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-black/30 transition-colors backdrop-blur-sm">
                        <Calendar className="mr-2 h-3 w-3" />
                        {formatDateRange(event.date, event.end_date)}
                      </Badge>
                    </div>

                    {event.is_active && (
                      <div className="absolute bottom-4 right-4">
                        <Badge className="bg-emerald-400/90 text-slate-950 hover:bg-emerald-400">
                          Active
                        </Badge>
                      </div>
                    )}

                    {/* Price Badge */}
                    {event.price && (
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-black/55 text-white border border-white/15 hover:bg-black/70 transition-colors backdrop-blur-sm">
                          {event.price}
                        </Badge>
                      </div>
                    )}
                  </div>
                ) : null}

                {!getImageUrl(event.image_url) && (
                  <div className="px-6 pt-6">
                    <Badge className="border border-slate-200 bg-slate-900/5 text-slate-900 hover:bg-slate-900/10 backdrop-blur-sm">
                      <Calendar className="mr-2 h-3 w-3" />
                      {formatDateRange(event.date, event.end_date)}
                    </Badge>
                    {event.price && (
                      <Badge className="ml-2 bg-slate-900 text-white border border-slate-900/10 hover:bg-slate-800 backdrop-blur-sm">
                        {event.price}
                      </Badge>
                    )}
                    {event.is_active && (
                      <Badge className="ml-2 bg-emerald-500 text-white hover:bg-emerald-400">
                        Active
                      </Badge>
                    )}
                  </div>
                )}

                {/* Event Content */}
                <CardContent className="space-y-4 p-6">
                  <div className="space-y-2">
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-950/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-slate-600 backdrop-blur-sm">
                      Featured moment
                    </div>
                    <h3 className="line-clamp-2 text-xl font-serif font-bold text-slate-950 transition-colors group-hover:text-amber-300">
                      {event.title}
                    </h3>
                    
                    {/* Time and Location */}
                    <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                      {event.time && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>
                            {event.end_time
                              ? `${formatTime(event.time)} - ${formatTime(event.end_time)}`
                              : formatTime(event.time)}
                          </span>
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center gap-1">
                          <span>•</span>
                          <span>{event.location}</span>
                        </div>
                      )}
                      {event.timezone && (
                        <div className="flex items-center gap-1">
                          <span>•</span>
                          <span>{event.timezone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {event.description && (
                    <p className="line-clamp-3 font-serif leading-relaxed text-slate-700">
                      {event.description}
                    </p>
                  )}

                  {/* Call to Action */}
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      className="w-full rounded-full border-white/10 bg-white/10 text-white shadow-lg shadow-black/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/15 hover:text-white"
                      onClick={() => setSelectedEvent(event)}
                    >
                      View Event Details
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      <Dialog open={Boolean(selectedEvent)} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-4xl border border-white/10 bg-white p-0 shadow-2xl sm:max-w-3xl">
          {selectedEvent && (
            <div className="grid gap-0 md:grid-cols-[1.05fr_0.95fr]">
              <div className="relative min-h-64 md:min-h-full">
                <Image
                  src={getImageUrl(selectedEvent.image_url) || fallbackImage}
                  alt={selectedEvent.title}
                  fill
                  sizes="100vw"
                  unoptimized
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute left-5 top-5 flex flex-wrap gap-2">
                  <Badge className="border-0 bg-linear-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-black/20">
                    <Calendar className="mr-2 h-3 w-3" />
                    {formatDateRange(selectedEvent.date, selectedEvent.end_date)}
                  </Badge>
                  {selectedEvent.is_active && (
                    <Badge className="bg-emerald-500 text-white">Active</Badge>
                  )}
                </div>
                {selectedEvent.price && (
                  <div className="absolute bottom-5 left-5">
                    <Badge className="bg-white/90 text-slate-950">{selectedEvent.price}</Badge>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-5 p-6 md:p-8">
                <DialogHeader className="text-left">
                  <DialogTitle className="font-serif text-3xl font-bold tracking-tight text-slate-950">
                    {selectedEvent.title}
                  </DialogTitle>
                  <DialogDescription className="text-base text-slate-600">
                    {selectedEvent.location || selectedEvent.timezone
                      ? [selectedEvent.location, selectedEvent.timezone].filter(Boolean).join(" • ")
                      : "Event details"}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 text-sm text-slate-600">
                  <div className="flex flex-wrap gap-3">
                    {selectedEvent.time && (
                      <div className="flex items-center gap-1 rounded-full bg-slate-100 px-4 py-2">
                        <Clock className="h-4 w-4" />
                        <span>
                          {selectedEvent.end_time
                            ? `${formatTime(selectedEvent.time)} - ${formatTime(selectedEvent.end_time)}`
                            : formatTime(selectedEvent.time)}
                        </span>
                      </div>
                    )}
                    {selectedEvent.location && (
                      <div className="rounded-full bg-slate-100 px-4 py-2">{selectedEvent.location}</div>
                    )}
                  </div>

                  {selectedEvent.description && (
                    <p className="max-h-40 overflow-y-auto pr-2 leading-relaxed text-slate-700 font-serif">
                      {selectedEvent.description}
                    </p>
                  )}
                </div>

                <div className="mt-auto flex flex-col gap-3 pt-2">
                  {selectedEvent.href ? (
                    <Button asChild className="rounded-full bg-slate-950 text-white hover:bg-slate-800">
                      <a href={selectedEvent.href} target="_blank" rel="noopener noreferrer">
                        Learn More
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  ) : null}
                  <Button
                    variant="outline"
                    className="rounded-full border-slate-200 text-slate-950 hover:bg-slate-100"
                    onClick={() => setSelectedEvent(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
