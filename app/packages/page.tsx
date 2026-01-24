"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Check, ArrowRight, Shield, Sparkles, Loader2, AlertCircle, Zap, Crown, Star, Gem } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useSession } from "next-auth/react"
import { apiFetch } from "@/lib/api-client"
import { useToast } from "@/components/ui/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

const DEFAULT_PLANS = [
  {
    id: "free-trial",
    name: "Free Trial",
    price: "0",
    currency: "ETB",
    cadence: "7 days",
    description: "Sample the registry. 7 days of full-access ritual trial.",
    features: ["1 restaurant", "20 items", "5 categories", "Basic analytics"],
    limits: { restaurants: 1, items: 20, staff: 0 },
    icon: Zap
  },
  {
    id: "bronze-monthly",
    name: "Bronze",
    price: "500",
    currency: "ETB",
    cadence: "per month",
    description: "For the boutique cafe seeking digital elegance.",
    features: ["Up to 2 restaurants", "50 menu items", "10 categories", "1 staff account", "Basic analytics"],
    limits: { restaurants: 2, items: 50, staff: 1 },
    icon: Star
  },
  {
    id: "silver-monthly",
    name: "Silver",
    price: "1,500",
    currency: "ETB",
    cadence: "per month",
    description: "The golden mean for growing culinary empires.",
    features: ["Up to 3 restaurants", "200 menu items", "Unlimited categories", "5 staff accounts", "Advanced analytics"],
    highlighted: true,
    limits: { restaurants: 3, items: 200, staff: 5 },
    icon: Gem
  },
  {
    id: "gold-monthly",
    name: "Gold",
    price: "3,000",
    currency: "ETB",
    cadence: "per month",
    description: "Pure sovereign power for enterprises and chains.",
    features: ["Unlimited restaurants", "Unlimited menu items", "Unlimited categories", "10 staff accounts", "Custom branding", "Full analytics"],
    limits: { restaurants: -1, items: -1, staff: 10 },
    icon: Crown
  },
]

export default function PackageSelectionPage() {
  const [plans, setPlans] = useState(DEFAULT_PLANS)
  const [selectedPlan, setSelectedPlan] = useState<string>("silver-monthly")
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [usage, setUsage] = useState({ restaurants: 0, items: 0, staff: 0 })
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null)
  const router = useRouter()
  const { data: session, status } = useSession()
  const { toast } = useToast()

  const token = (session?.user as any)?.accessToken

  // Load current usage, subscription and plans
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const endpoints = [
          token ? apiFetch<any>("/subscription/me", { token }).catch(() => null) : Promise.resolve(null),
          token ? apiFetch<any>("/my-restaurants", { token }).catch(() => []) : Promise.resolve([]),
          apiFetch<any>("/subscription/plans", { token }).catch(() => null)
        ]

        const [subRes, restRes, plansRes] = await Promise.all(endpoints)
        
        if (subRes) {
          const sub = subRes?.data || subRes
          setCurrentPlanId(sub?.plan_id || null)
        }

        const restaurants = restRes?.data || restRes || []
        setUsage({ restaurants: restaurants.length, items: 0, staff: 0 })

        if (plansRes?.data && Array.isArray(plansRes.data)) {
          const fetchedPlans = plansRes.data.map((p: any) => ({
             id: p.slug || p.id,
             name: p.name,
             price: p.price?.toString() || "0",
             currency: p.currency || "ETB",
             cadence: p.cadence || (p.billing_cycle === 'monthly' ? 'per month' : p.billing_cycle) || "per month",
             description: p.description,
             features: Array.isArray(p.features) ? p.features : [],
             limits: p.limits || { restaurants: -1, items: -1, staff: -1 },
             highlighted: p.name.toLowerCase() === 'silver' || p.is_popular || p.highlighted || false,
             icon: p.name.toLowerCase().includes('gold') ? Crown : 
                   p.name.toLowerCase().includes('silver') ? Gem : 
                   p.name.toLowerCase().includes('trial') ? Zap : Star
          }))
          setPlans(fetchedPlans)
          
          if (!fetchedPlans.find((p: any) => p.id === selectedPlan)) {
            setSelectedPlan(fetchedPlans.find((p: any) => p.highlighted)?.id || fetchedPlans[0]?.id || "silver-monthly")
          }
        }
      } catch (err) {
        console.error("Failed to load data", err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [token])

  const isDowngradePossible = (planId: string) => {
    const targetPlan = plans.find(p => p.id === planId)
    if (!targetPlan) return true
    if (targetPlan.limits.restaurants !== -1 && usage.restaurants > targetPlan.limits.restaurants) {
      return false
    }
    return true
  }

  const handlePlanClick = (planId: string) => {
    if (!isDowngradePossible(planId)) {
      toast({
        title: "Empire Too Large",
        description: `Your empire spans ${usage.restaurants} locations. This tier only accommodates ${plans.find(p => p.id === planId)?.limits.restaurants}. Consolidate your holdings first.`,
        variant: "destructive"
      })
      return
    }
    setSelectedPlan(planId)
  }

  const handleContinue = async (planIdOverride?: string) => {
    const planToProcess = planIdOverride || selectedPlan
    if (!planToProcess) return
    
    if (!token) {
      router.push("/login")
      return
    }

    setProcessing(true)
    try {
      const res = await apiFetch<any>("/payment/initiate", {
        method: "POST",
        token,
        body: { plan: planToProcess }
      })

      const checkoutUrl = res?.data?.checkout_url || res?.checkout_url
      
      if (planToProcess === "free-trial" || !checkoutUrl) {
         toast({ title: "Portal Opened", description: "Your digital kitchen ritual has begun." })
         router.push("/dashboard")
         return
      }

      window.location.href = checkoutUrl
    } catch (err: any) {
      toast({
        title: "Conjunction Failed",
        description: err?.message || "The payment gateway is currently undergoing maintenance. Please try again soon.",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-foreground">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground font-serif italic">Consulting the Registry...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 relative overflow-hidden font-sans">
      {/* BACKGROUND ELEMENTS */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(230,57,70,0.1),transparent_60%)]" />
        <div className="absolute top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute -bottom-[20%] left-[10%] w-[500px] h-[500px] rounded-full bg-secondary/5 blur-[100px]" />
      </div>

      <div className="container relative z-10 mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-8"
          >
            <Shield className="h-3 w-3" />
            Establishment Selection
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-serif tracking-tight leading-none mb-8">
            Choose Your <span className="italic text-primary">Ambition.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-medium max-w-2xl mx-auto">
            Select a tier that reflects the scale of your culinary empire. All deployments include our signature concierge support.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 items-stretch mb-16">
          <AnimatePresence>
            {plans.map((plan, idx) => {
              const possible = isDowngradePossible(plan.id)
              const isSelected = selectedPlan === plan.id
              const PlanIcon = plan.icon || Star

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="h-full"
                >
                  <Card
                    className={cn(
                      "relative h-full flex flex-col bg-card/40 backdrop-blur-2xl border border-border/10 rounded-[2.5rem] p-3 transition-all duration-500 overflow-hidden group cursor-pointer",
                      isSelected && "border-primary/50 shadow-[0_30px_60px_-15px_rgba(230,57,70,0.25)] bg-card/60",
                      !possible && "opacity-50 grayscale cursor-not-allowed"
                    )}
                    onClick={() => possible && handlePlanClick(plan.id)}
                  >
                    {plan.highlighted && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
                    )}

                    <CardHeader className="p-8 pb-4">
                      <div className="flex items-center justify-between mb-6">
                        <div className={cn(
                          "h-12 w-12 rounded-2xl flex items-center justify-center transition-colors shadow-xl",
                          isSelected ? "bg-primary text-white" : "bg-muted/30 text-muted-foreground"
                        )}>
                          <PlanIcon className="h-6 w-6" />
                        </div>
                        {plan.highlighted && (
                          <Badge className="bg-primary text-[10px] font-black uppercase tracking-widest px-3">Most Regal</Badge>
                        )}
                      </div>
                      
                      <CardTitle className="text-3xl font-serif text-foreground mb-2 tracking-tight">{plan.name}</CardTitle>
                      <CardDescription className="text-muted-foreground text-sm font-medium leading-relaxed min-h-[40px]">
                        {plan.description}
                      </CardDescription>

                      <div className="pt-6 flex items-baseline gap-2">
                        <span className="text-4xl font-serif font-bold text-foreground tracking-tighter">
                          {plan.price}
                        </span>
                        <div className="flex flex-col">
                           <span className="text-[10px] font-black text-primary uppercase tracking-widest">{plan.currency}</span>
                           <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{plan.cadence}</span>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-8 pt-0 flex-1 flex flex-col">
                      <div className="h-px w-full bg-border/10 my-6" />
                      
                      <ul className="space-y-4 flex-1">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                            <Check className={cn("h-4 w-4 shrink-0 mt-0.5", isSelected ? "text-primary" : "text-muted-foreground")} />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        size="lg"
                        disabled={processing || !possible}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (possible) {
                            setSelectedPlan(plan.id)
                            handleContinue(plan.id)
                          }
                        }}
                        className={cn(
                          "w-full h-14 mt-8 rounded-2xl text-md font-bold transition-all border-none relative overflow-hidden group/btn",
                          isSelected ? "bg-primary text-white shadow-xl shadow-primary/20" : "bg-muted/30 border border-border/10 text-foreground hover:bg-muted/50"
                        )}
                      >
                         <AnimatePresence mode="wait">
                            {processing && isSelected ? (
                              <motion.div key="loading" className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Processing...
                              </motion.div>
                            ) : (
                              <motion.div key="text" className="flex items-center gap-2">
                                {plan.price === "0" ? "Initiate Trial" : "Secure Tier"}
                                <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                              </motion.div>
                            )}
                         </AnimatePresence>
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* FOOTER DISCLOSURES */}
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-center gap-12 py-8 border-t border-border/10">
           <div className="flex items-center gap-3">
              <Zap className="h-4 w-4 text-primary" />
              <p className="text-xs font-bold uppercase tracking-widest leading-none mt-1 text-muted-foreground">7-Day Free Ritual</p>
           </div>
           <div className="h-4 w-px bg-border/10 hidden md:block" />
           <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-primary" />
              <p className="text-xs font-bold uppercase tracking-widest leading-none mt-1 text-muted-foreground">Stripe Secure Encryption</p>
           </div>
           <div className="h-4 w-px bg-border/10 hidden md:block" />
           <div className="flex items-center gap-3">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-xs font-bold uppercase tracking-widest leading-none mt-1 text-muted-foreground">Cancel Subscription Anytime</p>
           </div>
        </div>
      </div>
    </div>
  )
}
