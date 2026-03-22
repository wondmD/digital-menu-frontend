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
    description: "Experience all features. No credit card required for trial.",
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
    description: "Ideal for boutique cafes and small bistros.",
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
    description: "Built for scaling restaurant groups and busy venues.",
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
    description: "Complete control and unlimited scale for enterprise chains.",
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
  const [currentPlanSlug, setCurrentPlanSlug] = useState<string | null>(null)
  const [hasUsedTrial, setHasUsedTrial] = useState(false)
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null)
  const router = useRouter()
  const { data: session, status } = useSession()
  const { toast } = useToast()

  const trialPlan = useMemo(() => plans.find(p => p.slug === 'free-trial' || p.name.toLowerCase().includes('trial')), [plans])
  const paidPlans = useMemo(() => plans.filter(p => !p.slug?.includes('trial') && !p.id?.includes('trial')), [plans])

  const hasActivePaidPlan = useMemo(() => {
    if (!currentPlanId && !currentPlanSlug) return false
    return paidPlans.some(p => p.id === currentPlanId || p.slug === currentPlanSlug)
  }, [currentPlanId, currentPlanSlug, paidPlans])

  const isCurrentlyTrialling = useMemo(() => {
    if (currentPlanSlug === 'free-trial') return true;
    if (!currentPlanId && !currentPlanSlug) return false;
    return (trialPlan && (currentPlanId === trialPlan.id || currentPlanSlug === trialPlan.slug));
  }, [currentPlanId, currentPlanSlug, trialPlan]);

  const showTrialButton = !hasActivePaidPlan

  const token = (session?.user as any)?.accessToken

  // Load current usage, subscription and plans
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const endpoints = [
          token ? apiFetch<any>("/subscription/me", { token }).catch(err => {
            return null
          }) : Promise.resolve(null),
          token ? apiFetch<any>("/my-restaurants", { token }).catch(err => {
            return []
          }) : Promise.resolve([]),
          apiFetch<any>("/subscription/plans").catch(err => {
            return null
          })
        ]

        const [subRes, restRes, plansRes] = await Promise.all(endpoints)
        
        if (subRes) {
          const sub = subRes?.data || subRes
          setCurrentPlanId(sub?.plan_id || null)
          setCurrentPlanSlug(sub?.plan_slug || null)
          
          // Check if trial has been used or if they are currently on a trial/expired trial
          const trialUsed = sub?.has_trialed === true || 
                           sub?.trial_used === true || 
                           sub?.status === "expired" || 
                           sub?.plan_slug === "free-trial";
          setHasUsedTrial(trialUsed)

          // Calculate trial days left if currently trialling
          if (sub?.plan_slug === "free-trial" && sub?.expires_at) {
             const expiry = new Date(sub.expires_at)
             const now = new Date()
             const diff = expiry.getTime() - now.getTime()
             const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
             setTrialDaysLeft(days > 0 ? days : 0)
          } else {
             setTrialDaysLeft(null)
          }
        }

        const restaurants = restRes?.data || restRes || []
        setUsage({ restaurants: restaurants.length, items: 0, staff: 0 })

        const rawPlans = plansRes?.data || plansRes
        
        if (rawPlans && Array.isArray(rawPlans)) {
          const fetchedPlans = rawPlans.map((p: any) => {
            // Transform backend features object into a readable display array
            const displayFeatures = []
            if (p.features && typeof p.features === 'object') {
              const f = p.features
              if (f.max_restaurants === -1) displayFeatures.push("Unlimited restaurants")
              else if (typeof f.max_restaurants === 'number') displayFeatures.push(`${f.max_restaurants} restaurant${f.max_restaurants !== 1 ? 's' : ''}`)
              
              if (f.max_menu_items === -1) displayFeatures.push("Unlimited items")
              else if (typeof f.max_menu_items === 'number') displayFeatures.push(`${f.max_menu_items} items`)

              if (typeof f.max_staff_accounts === 'number') {
                if (f.max_staff_accounts > 0) displayFeatures.push(`${f.max_staff_accounts} staff accounts`)
                else if (f.max_staff_accounts === -1) displayFeatures.push("Unlimited staff")
              }
              
              if (f.analytics_enabled) displayFeatures.push("Advanced analytics")
              if (f.activity_log_enabled) displayFeatures.push("Activity logs")
            }

            return {
               id: p.id,
               slug: p.slug || p.id,
               name: p.name,
               price: (p.price_monthly ?? p.price ?? 0).toLocaleString(),
               currency: p.currency || "ETB",
               cadence: p.cadence || (p.billing_cycle === 'monthly' ? 'per month' : p.billing_cycle) || "per month",
               description: p.description,
               features: displayFeatures.length > 0 ? displayFeatures : (Array.isArray(p.features) ? p.features : []),
               limits: {
                 restaurants: p.features?.max_restaurants ?? p.limits?.restaurants ?? -1,
                 items: p.features?.max_menu_items ?? p.limits?.items ?? -1,
                 staff: p.features?.max_staff_accounts ?? p.limits?.staff ?? -1
               },
               highlighted: p.name.toLowerCase() === 'silver' || p.is_popular || p.highlighted || false,
               icon: p.name.toLowerCase().includes('gold') ? Crown : 
                     p.name.toLowerCase().includes('silver') ? Gem : 
                     p.name.toLowerCase().includes('trial') ? Zap : Star
            }
          })
          setPlans(fetchedPlans)
          
          const filteredForSelection = fetchedPlans.filter(p => p.slug !== 'free-trial' && !p.name.toLowerCase().includes('trial'))
          if (!filteredForSelection.find((p: any) => p.slug === selectedPlan)) {
            setSelectedPlan(filteredForSelection.find((p: any) => p.highlighted)?.slug || filteredForSelection[0]?.slug || "silver-monthly")
          }
        }
      } catch (err) {
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [token])

  const isDowngradePossible = (planSlug: string) => {
    const targetPlan = plans.find(p => p.slug === planSlug)
    if (!targetPlan) return true
    if (targetPlan.limits.restaurants !== -1 && usage.restaurants > targetPlan.limits.restaurants) {
      return false
    }
    return true
  }

  const handlePlanClick = (planSlug: string) => {
    if (!isDowngradePossible(planSlug)) {
      toast({
        title: "Location Limit Reached",
        description: `Your account has ${usage.restaurants} locations. This tier only accommodates ${plans.find(p => p.slug === planSlug)?.limits.restaurants}. Please upgrade to a higher tier to add more restaurants.`,
        variant: "destructive"
      })
      return
    }
    setSelectedPlan(planSlug)
  }

  const handleContinue = async (planIdOverride?: string) => {
    const planToProcess = planIdOverride || selectedPlan
    if (!planToProcess) return

    const selected = plans.find((p: any) => p.slug === planToProcess || p.id === planToProcess)
    const rawPlanSlug = String(selected?.slug || selected?.id || planToProcess)
    const inferredBillingCycle = rawPlanSlug.includes("annual") ? "annual" : "monthly"
    const normalizedPlanSlug = rawPlanSlug.replace(/-(monthly|annual)$/i, "")
    const isTrialPlan = normalizedPlanSlug === "free-trial" || selected?.name?.toLowerCase().includes("trial")
    
    if (!token) {
      router.push("/login")
      return
    }

    // Prevent re-using trial if already marked as trialed
    if (isTrialPlan && hasUsedTrial) {
       toast({
         title: "Free Trial Used",
         description: "Your free trial has already been claimed or has expired. Please upgrade to a membership plan to continue.",
         variant: "destructive"
       })
       return
    }

    if (!isTrialPlan) {
      router.push(`/payment?plan=${encodeURIComponent(normalizedPlanSlug)}&billing_cycle=${encodeURIComponent(inferredBillingCycle)}`)
      return
    }

    setProcessing(true)
    try {
      const res = await apiFetch<any>("/payment/initiate", {
        method: "POST",
        token,
        body: { 
          plan: normalizedPlanSlug,
          // If free trial, the backend might handle it differently
          type: "trial"
        }
      })

      const checkoutUrl = res?.data?.checkout_url || res?.checkout_url
      
      // If it's a free trial OR if there's no checkout URL returned (implicit activation)
      if (isTrialPlan || !checkoutUrl) {
         toast({ title: "Welcome to Agelgil (አገልግል)!", description: "Your membership has been activated successfully." })
         
         // Give the backend a moment to process the update before redirecting
         setTimeout(() => {
           router.push("/dashboard")
         }, 1000)
         return
      }

      window.location.href = checkoutUrl
    } catch (err: any) {
      toast({
        title: "Payment Error",
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
        <p className="text-muted-foreground font-serif italic">Loading plans...</p>
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
            Membership Plans
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-serif tracking-tight leading-none mb-8">
            Choose Your <span className="italic text-primary">Plan.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-medium max-w-2xl mx-auto">
            Select the plan that fits your business needs. All plans include 24/7 priority support.
          </p>
        </div>

        {showTrialButton && (
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className={cn(
               "max-w-3xl mx-auto mb-16 p-1 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 rounded-[2.5rem]",
               hasUsedTrial && !isCurrentlyTrialling && "opacity-50 grayscale"
             )}
           >
             <div className="p-8 rounded-[2.4rem] bg-card/60 backdrop-blur-3xl flex flex-col md:flex-row items-center justify-between gap-8 group transition-all duration-500">
                <div className="flex items-center gap-6 text-left w-full">
                   <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20 shrink-0">
                      <Zap className={cn("h-8 w-8", !hasUsedTrial && "animate-pulse")} />
                   </div>
                   <div className="text-left">
                      <h3 className="text-2xl font-serif font-bold text-foreground">
                        {isCurrentlyTrialling ? "You are on Free Trial" : "Begin Your Journey"}
                      </h3>
                      <p className="text-muted-foreground font-medium leading-relaxed">
                        {isCurrentlyTrialling 
                          ? `You have ${trialDaysLeft !== null ? `${trialDaysLeft} day${trialDaysLeft !== 1 ? 's' : ''}` : 'some time'} remaining on your trial. Access your dashboard or upgrade to keep your data.`
                          : "Experience Agelgil (አገልግል) with a 7-day free trial. No commitment, cancel anytime."}
                      </p>
                   </div>
                </div>
                <Button 
                  onClick={() => {
                    if (isCurrentlyTrialling) router.push("/dashboard");
                    else handleContinue('free-trial');
                  }}
                  disabled={processing || (hasUsedTrial && !isCurrentlyTrialling)}
                  size="lg"
                  className="h-14 px-10 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest transition-all shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
                >
                   {processing ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                     <>
                       {isCurrentlyTrialling ? "Continue to Dashboard" : 
                        (hasUsedTrial ? "Trial Used" : "Start Free Trial")}
                       <ArrowRight className="ml-2 h-5 w-5" />
                     </>
                   )}
                </Button>
             </div>
           </motion.div>
        )}

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 items-stretch mb-16">
          <AnimatePresence>
            {paidPlans.map((plan, idx) => {
              const isMatchesCurrent = currentPlanId === plan.id || currentPlanId === plan.slug
              const isTrialPlan = plan.slug === 'free-trial' || plan.name.toLowerCase().includes('trial')
              const isTrialUnavailable = isTrialPlan && hasUsedTrial && !isMatchesCurrent
              
              const possible = isDowngradePossible(plan.slug) && !isTrialUnavailable
              const isSelected = selectedPlan === plan.slug
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
                      (!possible || isTrialUnavailable) && "opacity-50 grayscale cursor-not-allowed pointer-events-none"
                    )}
                    onClick={() => possible && handlePlanClick(plan.slug)}
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
                        {isMatchesCurrent && (
                          <Badge className="bg-green-500 text-[10px] font-black uppercase tracking-widest px-3">Current</Badge>
                        )}
                        {plan.highlighted && !isMatchesCurrent && (
                          <Badge className="bg-primary text-[10px] font-black uppercase tracking-widest px-3">Most Popular</Badge>
                        )}
                      </div>
                      
                      <CardTitle className="text-3xl font-serif text-foreground mb-2 tracking-tight">{plan.name}</CardTitle>
                      <CardDescription className="text-muted-foreground text-sm font-medium leading-relaxed min-h-[40px]">
                        {plan.description}
                        {isTrialUnavailable && (
                          <span className="block mt-2 text-destructive font-bold text-[10px] uppercase">Trial no longer available</span>
                        )}
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
                        disabled={processing || !possible || isMatchesCurrent}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (possible) {
                            setSelectedPlan(plan.slug)
                            handleContinue(plan.slug)
                          }
                        }}
                        className={cn(
                          "w-full h-14 mt-8 rounded-2xl text-md font-bold transition-all border-none relative overflow-hidden group/btn",
                          isSelected ? "bg-primary text-white shadow-xl shadow-primary/20" : "bg-muted/30 border border-border/10 text-foreground hover:bg-muted/50",
                          isMatchesCurrent && "bg-green-500/10 text-green-500 cursor-default"
                        )}
                      >
                         <AnimatePresence mode="wait">
                            {processing && isMatchesCurrent ? (
                              <motion.div key="loading" className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Processing...
                              </motion.div>
                            ) : (
                              <motion.div key="text" className="flex items-center gap-2">
                                {isMatchesCurrent ? "Active Plan" : 
                                 (isTrialUnavailable ? "Already Used" : 
                                  (plan.price === "0" ? "Start Free Trial" : "Select Plan"))}
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
              <p className="text-xs font-bold uppercase tracking-widest leading-none mt-1 text-muted-foreground">7-Day Free Trial</p>
           </div>
           <div className="h-4 w-px bg-border/10 hidden md:block" />
           <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-primary" />
              <p className="text-xs font-bold uppercase tracking-widest leading-none mt-1 text-muted-foreground">Transaction Reference Verification</p>
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
