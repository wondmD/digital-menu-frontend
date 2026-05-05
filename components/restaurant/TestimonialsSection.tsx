"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Star, Quote } from "lucide-react"

type Testimonial = {
  name: string
  text: string
  rating?: number
  avatar?: string
  date?: string
  verified?: boolean
}

interface TestimonialsSectionProps {
  testimonials: Testimonial[]
}

export function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {
  if (!testimonials || testimonials.length === 0) return null

  const renderStars = (rating: number = 5) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-5 w-5 ${
          i < rating
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-300 dark:text-gray-600'
        }`}
      />
    ))
  }

  return (
    <section id="testimonials" className="relative overflow-hidden py-20 md:py-32 bg-linear-to-b from-background via-muted/10 to-background">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-10 h-96 w-96 rounded-full bg-white/35 blur-3xl dark:bg-white/5" />
        <div className="absolute -right-20 bottom-0 h-[28rem] w-[28rem] rounded-full bg-slate-300/25 blur-3xl dark:bg-slate-500/10" />
        <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_1px_1px,rgba(100,116,139,0.18)_1px,transparent_0)] [background-size:24px_24px] dark:opacity-20" />
      </div>
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-serif font-bold mb-6">
            What Our Guests Say
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-serif">
            Real experiences from diners who have discovered our culinary excellence
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
            >
              <Card className="group rounded-4xl border border-border/50 bg-card/80 p-6 shadow-lg backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl sm:p-8">
                <CardContent className="p-0 space-y-6">
                  {/* Quote Icon */}
                  <div className="flex items-start justify-between">
                    <Quote className="h-8 w-8 text-primary/20 group-hover:text-primary/40 transition-colors" />
                    {testimonial.verified && (
                      <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                        <div className="w-2 h-2 rounded-full bg-green-600 dark:bg-green-400" />
                        <span>Verified</span>
                      </div>
                    )}
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1">
                    {renderStars(testimonial.rating)}
                  </div>

                  {/* Testimonial Text */}
                  <blockquote className="text-base sm:text-lg leading-relaxed text-muted-foreground italic">
                    "{testimonial.text}"
                  </blockquote>

                  {/* Author Info */}
                  <div className="flex items-center justify-between border-t border-border/60 pt-4">
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">{testimonial.name}</p>
                      {testimonial.date && (
                        <p className="text-sm text-muted-foreground">
                          {new Date(testimonial.date).toLocaleDateString('en-US', {
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      )}
                    </div>
                    
                    {/* Avatar placeholder */}
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/20 bg-primary/10 shadow-sm">
                      <span className="text-sm font-semibold text-primary">
                        {testimonial.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
}
