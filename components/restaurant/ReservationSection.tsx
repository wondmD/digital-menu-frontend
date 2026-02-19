"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, Users, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

type Restaurant = {
  name: string
  phone?: string
  email?: string
}

interface ReservationSectionProps {
  hotel: Restaurant
}

interface ReservationForm {
  name: string
  phone: string
  email: string
  guests: string
  date: string
  time: string
  specialRequests?: string
}

export function ReservationSection({ hotel }: ReservationSectionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [formData, setFormData] = useState<ReservationForm>({
    name: "",
    phone: "",
    email: "",
    guests: "",
    date: "",
    time: "",
    specialRequests: "",
  })

  const timeSlots = [
    "11:30 AM", "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM",
    "5:30 PM", "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM", "9:00 PM"
  ]

  const guestOptions = Array.from({ length: 10 }, (_, i) => (i + 1).toString())

  const handleInputChange = (field: keyof ReservationForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    if (!formData.name || !formData.phone || !formData.guests || !formData.date || !formData.time) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)

    try {
      // Simulate API call - replace with actual reservation API
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setIsSubmitted(true)
      toast.success("Reservation request submitted successfully!")
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setIsSubmitted(false)
        setFormData({
          name: "",
          phone: "",
          email: "",
          guests: "",
          date: "",
          time: "",
          specialRequests: "",
        })
      }, 3000)
    } catch (error) {
      toast.error("Failed to submit reservation. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <section id="reservation" className="py-20 md:py-32 bg-gradient-to-b from-muted/20 to-background">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto text-center"
          >
            <Card className="rounded-3xl border-0 shadow-2xl overflow-hidden">
              <CardContent className="p-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="space-y-6"
                >
                  <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-3xl font-bold">Reservation Confirmed!</h2>
                    <p className="text-muted-foreground text-lg">
                      Thank you, {formData.name}! Your reservation request has been received.
                    </p>
                    <div className="bg-muted/50 rounded-2xl p-6 text-left space-y-2">
                      <p><strong>Date:</strong> {formData.date}</p>
                      <p><strong>Time:</strong> {formData.time}</p>
                      <p><strong>Guests:</strong> {formData.guests}</p>
                      <p><strong>Phone:</strong> {formData.phone}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      We'll send you a confirmation message shortly. For any changes, please call us directly.
                    </p>
                  </div>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    )
  }

  return (
    <section id="reservation" className="py-20 md:py-32 bg-gradient-to-b from-muted/20 to-background">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-serif font-bold mb-6">
            Reserve Your Table
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-serif">
            Book a table for an unforgettable dining experience at {hotel.name}
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Card className="rounded-3xl border-0 shadow-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 pb-8">
                <CardTitle className="text-2xl text-center font-serif">Make a Reservation</CardTitle>
              </CardHeader>
              <CardContent className="p-6 sm:p-8 md:p-12">
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Name */}
                    <div className="space-y-3">
                      <Label htmlFor="name" className="text-base font-medium">
                        Full Name *
                      </Label>
                      <div className="relative">
                        <Users className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="name"
                          type="text"
                          placeholder="John Doe"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          className="pl-12 h-12 rounded-xl text-base"
                          required
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="space-y-3">
                      <Label htmlFor="phone" className="text-base font-medium">
                        Phone Number *
                      </Label>
                      <div className="relative">
                        <Users className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+1 234 567 8900"
                          value={formData.phone}
                          onChange={(e) => handleInputChange("phone", e.target.value)}
                          className="pl-12 h-12 rounded-xl text-base"
                          required
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-3">
                      <Label htmlFor="email" className="text-base font-medium">
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className="h-12 rounded-xl text-base"
                      />
                    </div>

                    {/* Number of Guests */}
                    <div className="space-y-3">
                      <Label htmlFor="guests" className="text-base font-medium">
                        Number of Guests *
                      </Label>
                      <Select value={formData.guests} onValueChange={(value) => handleInputChange("guests", value)}>
                        <SelectTrigger className="h-12 rounded-xl text-base">
                          <SelectValue placeholder="Select guests" />
                        </SelectTrigger>
                        <SelectContent>
                          {guestOptions.map((num) => (
                            <SelectItem key={num} value={num}>
                              {num} {num === "1" ? "Guest" : "Guests"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Date */}
                    <div className="space-y-3">
                      <Label htmlFor="date" className="text-base font-medium">
                        Date *
                      </Label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="date"
                          type="date"
                          value={formData.date}
                          onChange={(e) => handleInputChange("date", e.target.value)}
                          className="pl-12 h-12 rounded-xl text-base"
                          min={new Date().toISOString().split('T')[0]}
                          required
                        />
                      </div>
                    </div>

                    {/* Time */}
                    <div className="space-y-3">
                      <Label htmlFor="time" className="text-base font-medium">
                        Preferred Time *
                      </Label>
                      <div className="relative">
                        <Clock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Select value={formData.time} onValueChange={(value) => handleInputChange("time", value)}>
                          <SelectTrigger className="pl-12 h-12 rounded-xl text-base">
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                          <SelectContent>
                            {timeSlots.map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Special Requests */}
                  <div className="space-y-3">
                    <Label htmlFor="specialRequests" className="text-base font-medium">
                      Special Requests (Optional)
                    </Label>
                    <textarea
                      id="specialRequests"
                      placeholder="Any dietary restrictions, special occasions, or preferences..."
                      value={formData.specialRequests}
                      onChange={(e) => handleInputChange("specialRequests", e.target.value)}
                      className="w-full p-4 rounded-xl border border-border bg-background text-base resize-none h-24 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-14 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          Processing...
                        </div>
                      ) : (
                        "Confirm Reservation"
                      )}
                    </Button>
                  </div>

                  {/* Note */}
                  <p className="text-sm text-muted-foreground text-center">
                    By submitting this form, you agree to be contacted by {hotel.name} regarding your reservation.
                  </p>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
