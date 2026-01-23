"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, ArrowRight, Shield, Sparkles, Leaf, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useSession } from "next-auth/react"
import { apiFetch } from "@/lib/api-client"
import { useToast } from "@/components/ui/use-toast"

const PLANS = [
  {
    id: "free-trial",
    name: "Free Trial",
    price: "0",
    currency: "ETB",
    cadence: "7 days",
    description: "7-day full access trial to explore all features.",
    features: ["1 restaurant", "20 items", "5 categories", "Basic analytics"],
    limits: { restaurants: 1, items: 20, staff: 0 }
  },
  {
    id: "bronze-monthly",
    name: "Bronze",
    price: "500",
    currency: "ETB",
    cadence: "per month",
    description: "Perfect for small cafes and restaurants.",
    features: ["Up to 2 restaurants", "50 menu items", "10 categories", "1 staff account", "Basic analytics"],
    limits: { restaurants: 2, items: 50, staff: 1 }
  },
  {
    id: "silver-monthly",
    name: "Silver",
    price: "1,500",
    currency: "ETB",
    cadence: "per month",
    description: "Ideal for growing businesses with multiple locations.",
    features: ["Up to 3 restaurants", "200 menu items", "Unlimited categories", "5 staff accounts", "Advanced analytics"],
    highlighted: true,
    limits: { restaurants: 3, items: 200, staff: 5 }
  },
  {
    id: "gold-monthly",
    name: "Gold",
    price: "3,000",
    currency: "ETB",
    cadence: "per month",
    description: "Unlimited power for large enterprises and chains.",
    features: ["Unlimited restaurants", "Unlimited menu items", "Unlimited categories", "10 staff accounts", "Custom branding", "Full analytics"],
    limits: { restaurants: -1, items: -1, staff: 10 }
  },
]

export default function PackageSelectionPage() {
  const [selectedPlan, setSelectedPlan] = useState<string>("silver-monthly")
  const [loading, setLoading] = useState(false)
  const [usage, setUsage] = useState({ restaurants: 0, items: 0, staff: 0 })
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null)
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()

  const token = (session?.user as any)?.accessToken

  // Load current usage and subscription
  useEffect(() => {
    if (!token) return
    const loadData = async () => {
      try {
        const [subRes, restRes] = await Promise.all([
          apiFetch<any>("/subscription/me", { token }),
          apiFetch<any>("/my-restaurants", { token })
        ])
        
        const sub = subRes?.data || subRes
        setCurrentPlanId(sub?.plan_id || null)

        const restaurants = restRes?.data || restRes || []
        
        setUsage({
          restaurants: restaurants.length,
          items: 0,
          staff: 0
        })
      } catch (err) {
        console.error("Failed to load usage data", err)
      }
    }
    loadData()
  }, [token])

  const isDowngradePossible = (planId: string) => {
    const targetPlan = PLANS.find(p => p.id === planId)
    if (!targetPlan) return true
    
    // Check constraints - cannot downgrade if usage exceeds target plan limits
    if (targetPlan.limits.restaurants !== -1 && usage.restaurants > targetPlan.limits.restaurants) {
      return false
    }
    
    return true
  }

  const handlePlanClick = (planId: string) => {
    if (!isDowngradePossible(planId)) {
      toast({
        title: "Downgrade Restricted",
        description: `You have ${usage.restaurants} restaurants. This plan only supports ${PLANS.find(p => p.id === planId)?.limits.restaurants}. Please remove some restaurants first.`,
        variant: "destructive"
      })
      return
    }
    setSelectedPlan(planId)
  }

  const handleContinue = async () => {
    if (!selectedPlan) return
    const token = (session?.user as any)?.accessToken

    if (!token) {
      router.push("/login")
      return
    }

    setLoading(true)
    try {
      const res = await apiFetch<any>("/payment/initiate", {
        method: "POST",
        token,
        body: {
          plan: selectedPlan,
          type: "upgrade" // Or "subscription" depending on backend
        }
      })

      const checkoutUrl = res?.data?.checkout_url || res?.checkout_url
      if (checkoutUrl) {
        window.location.href = checkoutUrl
      } else {
        // Fallback if no checkout URL (e.g. for free plans or trial)
        toast({ title: "Plan selected", description: "Your subscription has been updated." })
        router.push("/dashboard")
      }
    } catch (err: any) {
      toast({
        title: "Payment failed",
        description: err?.message || "Could not initiate payment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const startTrial = () => {
    if (!selectedPlan) return
    router.push(`/dashboard?plan=${selectedPlan}&trial=7`)
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
              Step 2 of 3 — Choose a package (7-day free trial, no card required)
            </Badge>
            <h1 className="text-4xl font-serif font-normal text-primary tracking-tight sm:text-5xl">
              Choose the package that fits your venue
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground">
              Pick a plan now; you can upgrade or downgrade anytime. Start your 7-day free trial with no payment, then
              decide if you want to continue.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {PLANS.map((plan) => {
              const possible = isDowngradePossible(plan.id)
              return (
                <Card
                  key={plan.id}
                  className={`relative h-full transition-all duration-200 cursor-pointer border-primary/10 ${
                    possible ? "hover:-translate-y-1 hover:shadow-lg" : "opacity-60 grayscale cursor-not-allowed"
                  } ${
                    selectedPlan === plan.id ? "ring-2 ring-primary shadow-xl" : ""
                  } ${plan.highlighted ? "bg-primary/5" : "bg-white/70 backdrop-blur"}`}
                  onClick={() => handlePlanClick(plan.id)}
                >
                  <CardHeader className="space-y-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-2xl font-serif text-primary">{plan.name}</CardTitle>
                      {plan.highlighted ? (
                        <Badge className="bg-primary text-white shadow-primary/40 shadow">Popular</Badge>
                      ) : !possible && (
                        <Badge variant="destructive" className="animate-pulse">Limit Exceeded</Badge>
                      )}
                    </div>
                    <CardDescription className="text-muted-foreground text-base">
                      {plan.description}
                      {!possible && (
                         <div className="mt-2 flex items-center gap-1.5 text-destructive font-bold text-[10px] uppercase">
                            <AlertCircle className="h-3 w-3" />
                            <span>Remove {usage.restaurants - plan.limits.restaurants} restaurants to pick this</span>
                         </div>
                      )}
                    </CardDescription>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-primary">{plan.price}</span>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-primary/70 tracking-tighter">{plan.currency}</span>
                      <span className="text-muted-foreground text-[10px] leading-tight font-medium uppercase tracking-widest">{plan.cadence}</span>
                    </div>
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
                    disabled={loading || !possible}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (possible) {
                        setSelectedPlan(plan.id)
                        handleContinue()
                      }
                    }}
                  >
                    {loading && selectedPlan === plan.id ? <Loader2 className="h-4 w-4 animate-spin" /> : (possible ? "Continue to payment" : "Incompatible Plan")}
                    {!loading && possible && <ArrowRight className="h-4 w-4" />}
                  </Button>
                </CardContent>
              </Card>
            )})}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              Start with a 7-day free trial—no card needed.
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <Button variant="secondary" className="w-full sm:w-auto" onClick={startTrial} disabled={loading}>
                Start 7-day free trial
              </Button>
              <Button variant="ghost" className="w-full sm:w-auto gap-2" onClick={handleContinue} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Skip trial and pay now"}
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
