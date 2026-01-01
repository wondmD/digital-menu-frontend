"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, ArrowRight, Shield, Sparkles, Leaf } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "$9",
    cadence: "per month",
    description: "For small cafés validating digital menus.",
    features: ["Up to 2 menus", "Basic QR customization", "Email support"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$19",
    cadence: "per month",
    description: "For growing hotels needing flexibility.",
    features: ["Unlimited menus", "Brand colors & logos", "Analytics dashboard", "Priority support"],
    highlighted: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    cadence: "Talk to us",
    description: "For multi-location groups with concierge onboarding.",
    features: ["Dedicated success manager", "SSO & advanced controls", "Custom integrations"],
  },
]

export default function PackageSelectionPage() {
  const [selectedPlan, setSelectedPlan] = useState<string>("pro")
  const router = useRouter()

  const handleContinue = () => {
    if (!selectedPlan) return
    router.push(`/payment?plan=${selectedPlan}`)
  }

  const startTrial = () => {
    if (!selectedPlan) return
    router.push(`/dashboard?plan=${selectedPlan}&trial=14`)
  }

  return (
    <div className="min-h-screen bg-[#FDFCF8] pb-20 font-sans">
      <div className="relative isolate overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-white" />
        <div className="container relative mx-auto px-6 py-16">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Shield className="h-4 w-4" />
            Secure onboarding
          </div>
          <div className="mt-6 flex flex-col gap-4">
            <Badge variant="secondary" className="self-start bg-primary/10 text-primary border-primary/10">
              Step 2 of 3 — Choose a package (14-day free trial, no card required)
            </Badge>
            <h1 className="text-4xl font-serif font-normal text-primary tracking-tight sm:text-5xl">
              Choose the package that fits your venue
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground">
              Pick a plan now; you can upgrade or downgrade anytime. Start your 14-day free trial with no payment, then
              decide if you want to continue.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {PLANS.map((plan) => (
              <Card
                key={plan.id}
                className={`relative h-full transition-all duration-200 cursor-pointer border-primary/10 hover:-translate-y-1 hover:shadow-lg ${
                  selectedPlan === plan.id ? "ring-2 ring-primary shadow-xl" : ""
                } ${plan.highlighted ? "bg-primary/5" : "bg-white/70 backdrop-blur"}`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl font-serif text-primary">{plan.name}</CardTitle>
                    {plan.highlighted && (
                      <Badge className="bg-primary text-white shadow-primary/40 shadow">Popular</Badge>
                    )}
                  </div>
                  <CardDescription className="text-muted-foreground text-base">{plan.description}</CardDescription>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-primary">{plan.price}</span>
                    <span className="text-muted-foreground text-sm">{plan.cadence}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={selectedPlan === plan.id ? "default" : "outline"}
                    className="w-full gap-2"
                    onClick={() => {
                      setSelectedPlan(plan.id)
                      handleContinue()
                    }}
                  >
                    Continue to payment
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              Start with a 14-day free trial—no card needed.
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <Button variant="secondary" className="w-full sm:w-auto" onClick={startTrial}>
                Start 14-day free trial
              </Button>
              <Button variant="ghost" className="w-full sm:w-auto" onClick={handleContinue}>
                Skip trial and pay now
              </Button>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>No hidden fees, cancel anytime. You won’t be charged during the trial.</span>
            <span className="inline-flex items-center gap-1 text-primary font-semibold">
              <Leaf className="h-4 w-4" />
              Sustainable by default
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
