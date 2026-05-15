"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Crown,
  Loader2,
  ShieldCheck,
  TrendingUp,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { apiFetch } from "@/lib/api-client"
import { getUpgradeRequestState } from "@/lib/subscription-upgrade"
import { cn } from "@/lib/utils"

type GenericObj = Record<string, any>

type NormalizedPlan = {
  id: string
  slug: string
  name: string
  priceMonthly: number
  priceAnnual: number
  currency: string
  features: GenericObj
  tierScore: number
}

function extractDataEnvelope<T>(res: any): T {
  return (res?.data?.data || res?.data || res) as T
}

function extractList<T>(res: any): T[] {
  const normalized = extractDataEnvelope<any>(res)
  if (Array.isArray(normalized)) return normalized
  if (Array.isArray(normalized?.items)) return normalized.items
  return []
}

function extractSubscription(res: any): GenericObj | null {
  const normalized = extractDataEnvelope<any>(res)
  if (!normalized) return null
  return normalized.subscription || normalized
}

function toTitle(input: string | undefined | null) {
  if (!input) return "-"
  return input
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ")
}

function formatDate(value: any): string {
  if (!value) return "-"
  const dt = new Date(value)
  if (Number.isNaN(dt.getTime())) return "-"
  return dt.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatCurrency(value: any, currency = "ETB") {
  const n = Number(value)
  if (!Number.isFinite(n)) return "-"
  return `${n.toLocaleString()} ${currency}`
}

function getStatusTone(status: string) {
  const s = status.toLowerCase()
  if (s === "active") return "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
  if (s === "pending" || s.includes("verification") || s === "trial") {
    return "bg-amber-500/10 text-amber-600 border-amber-500/30"
  }
  return "bg-red-500/10 text-red-600 border-red-500/30"
}

function getTierScore(slug: string, name: string, monthly: number) {
  const key = `${slug} ${name}`.toLowerCase()
  if (key.includes("trial") || key.includes("free")) return 0
  if (key.includes("bronze")) return 1
  if (key.includes("silver")) return 2
  if (key.includes("gold")) return 3
  if (monthly <= 0) return 0
  if (monthly < 1000) return 1
  if (monthly < 3000) return 2
  return 3
}

function normalizePlan(raw: GenericObj): NormalizedPlan {
  const slug = String(raw.slug || raw.id || "").toLowerCase()
  const name = String(raw.name || slug || "Plan")
  const priceMonthly = Number(raw.price_monthly ?? raw.price ?? 0)
  const priceAnnual = Number(raw.price_annual ?? 0)
  return {
    id: String(raw.id || slug || name),
    slug,
    name,
    priceMonthly: Number.isFinite(priceMonthly) ? priceMonthly : 0,
    priceAnnual: Number.isFinite(priceAnnual) ? priceAnnual : 0,
    currency: String(raw.currency || "ETB"),
    features: (raw.features || {}) as GenericObj,
    tierScore: getTierScore(slug, name, Number.isFinite(priceMonthly) ? priceMonthly : 0),
  }
}

export default function DashboardSubscriptionPage() {
  const { data: session, status } = useSession()
  const token = (session?.user as any)?.accessToken as string | undefined

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [subscription, setSubscription] = useState<GenericObj | null>(null)
  const [plans, setPlans] = useState<NormalizedPlan[]>([])
  const [restaurants, setRestaurants] = useState<GenericObj[]>([])

  useEffect(() => {
    if (status === "loading") return
    if (!token) {
      setLoading(false)
      return
    }

    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        const [subRes, plansRes, restaurantsRes] = await Promise.all([
          apiFetch<any>("/subscription/me", { token }),
          apiFetch<any>("/subscription/plans").catch(() => null),
          apiFetch<any>("/my-restaurants", { token }).catch(() => null),
        ])

        setSubscription(extractSubscription(subRes))
        setPlans(extractList<GenericObj>(plansRes).map(normalizePlan))
        setRestaurants(extractList<GenericObj>(restaurantsRes))
      } catch (err: any) {
        setError(err?.message || "Could not load subscription details.")
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [token, status])

  const currentPlan = useMemo(() => {
    if (!subscription) return null
    const subSlug = String(subscription.plan_slug || subscription.plan?.slug || "").toLowerCase()
    const subId = String(subscription.plan_id || subscription.plan?.id || "").toLowerCase()
    return (
      plans.find((p) => p.slug === subSlug || p.id.toLowerCase() === subId) ||
      plans.find((p) => p.slug.includes(subSlug) || subSlug.includes(p.slug)) ||
      null
    )
  }, [plans, subscription])

  const features = (currentPlan?.features || subscription?.features || {}) as GenericObj
  const maxRestaurants = Number(features.max_restaurants)
  const usedRestaurants = restaurants.length
  const restaurantLimitLabel =
    Number.isFinite(maxRestaurants) && maxRestaurants >= 0 ? String(maxRestaurants) : "Unlimited"

  const planSlug = String(subscription?.plan_slug || currentPlan?.slug || "silver")
    .toLowerCase()
    .replace(/-(monthly|annual)$/i, "")

  const billingCycle =
    String(subscription?.billing_cycle || "monthly").toLowerCase() === "annual" ? "annual" : "monthly"

  const statusText = String(subscription?.status || "unknown")
  const hasActivePlan = !!(subscription?.plan_slug || subscription?.plan_id || currentPlan)

  const isExpiredSubscription = useMemo(() => {
    const statusLower = statusText.toLowerCase()
    if (statusLower === "expired") return true
    const expiryRaw = subscription?.expires_at || subscription?.end_date
    if (!expiryRaw) return false
    const expiry = new Date(expiryRaw)
    if (Number.isNaN(expiry.getTime())) return false
    return expiry.getTime() <= Date.now()
  }, [statusText, subscription?.expires_at, subscription?.end_date])

  const treatAsNoSubscription = !hasActivePlan || isExpiredSubscription

  const currentTierScore = currentPlan?.tierScore ?? getTierScore(planSlug, String(subscription?.plan_name || ""), Number(subscription?.price_monthly || 0))
  const upgradeRequestState = useMemo(() => getUpgradeRequestState(subscription), [subscription])
  const isUpgradeBlockedByPending = upgradeRequestState.hasPendingUpgrade

  const upgradeCandidates = useMemo(() => {
    return plans
      .filter((p) => {
        const key = `${p.slug} ${p.name}`.toLowerCase()
        const isFreeOrTrial = key.includes("free") || key.includes("trial")
        if (isFreeOrTrial) return false

        if (treatAsNoSubscription) return true

        return p.tierScore > currentTierScore && !key.includes("starter")
      })
      .sort((a, b) => a.tierScore - b.tierScore)
  }, [plans, currentTierScore, treatAsNoSubscription])

  const isOnTopPlan = hasActivePlan && !treatAsNoSubscription && upgradeCandidates.length === 0

  const expiresAt = subscription?.expires_at || subscription?.end_date
  const startsAt = subscription?.start_date || subscription?.starts_at || subscription?.created_at

  const daysRemaining = useMemo(() => {
    const direct = Number(subscription?.days_remaining)
    if (Number.isFinite(direct)) return Math.max(0, direct)
    if (!expiresAt) return null
    const expiry = new Date(expiresAt)
    const now = new Date()
    return Math.max(0, Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
  }, [subscription?.days_remaining, expiresAt])

  const totalDays = useMemo(() => {
    if (startsAt && expiresAt) {
      const start = new Date(startsAt)
      const end = new Date(expiresAt)
      const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      if (Number.isFinite(diff) && diff > 0) return diff
    }

    if (billingCycle === "annual") return 365

    const trialLike = String(subscription?.plan_slug || currentPlan?.slug || "").includes("trial")
    if (trialLike) return 7

    return 30
  }, [startsAt, expiresAt, billingCycle, subscription?.plan_slug, currentPlan?.slug])

  const daysLeftPct = useMemo(() => {
    if (daysRemaining === null || !Number.isFinite(totalDays) || totalDays <= 0) return 0
    return Math.max(0, Math.min(100, (daysRemaining / totalDays) * 100))
  }, [daysRemaining, totalDays])

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading subscription details...
        </div>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="mx-auto max-w-3xl">
        <Card className="border-border/60 bg-card/60">
          <CardHeader>
            <CardTitle>Subscription details unavailable</CardTitle>
            <CardDescription>Please sign in again to view your plan details.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl">
        <Card className="border-red-500/30 bg-red-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" /> Failed to load subscription
            </CardTitle>
            <CardDescription className="text-red-600/80">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/packages">Upgrade Plan</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 md:space-y-10 pb-12">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between border-b border-border/60 pb-6">
        <div className="space-y-3">
          <Badge className="w-fit bg-primary/10 text-primary border border-primary/25 font-bold uppercase tracking-[0.2em]">
            Owner subscription center
          </Badge>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">Subscription Details</h1>
          <p className="text-muted-foreground max-w-2xl">
            {treatAsNoSubscription
              ? "Your previous subscription is expired. Choose any package to continue."
              : "See your current plan health, days left, and available upgrade paths."}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <Link href="/packages">Compare Plans</Link>
          </Button>
          {!isOnTopPlan &&
            (isUpgradeBlockedByPending ? (
              <Button disabled>
                Upgrade pending review
              </Button>
            ) : (
              <Button asChild>
                <Link href="/packages">
                  {treatAsNoSubscription ? "Choose Package" : "Upgrade Plan"} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ))}
        </div>
      </div>

      <Card className="bg-card/40 border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Clock3 className="h-5 w-5 text-primary" /> Upgrade Payment Progress
          </CardTitle>
          <CardDescription>
            Track payment request state and avoid duplicate upgrade submissions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            {[
              {
                title: "Payment submitted",
                done: upgradeRequestState.currentStep !== "idle",
                active:
                  upgradeRequestState.currentStep === "payment_in_progress" ||
                  upgradeRequestState.currentStep === "pending_verification",
              },
              {
                title: "Pending verification",
                done:
                  upgradeRequestState.currentStep === "approved" ||
                  upgradeRequestState.currentStep === "rejected",
                active: upgradeRequestState.currentStep === "pending_verification",
              },
              {
                title:
                  upgradeRequestState.finalResult === "approved"
                    ? "Result: Approved"
                    : upgradeRequestState.finalResult === "rejected"
                      ? "Result: Rejected"
                      : "Result",
                done: upgradeRequestState.finalResult !== "none",
                active:
                  upgradeRequestState.currentStep === "approved" ||
                  upgradeRequestState.currentStep === "rejected",
                rejected: upgradeRequestState.finalResult === "rejected",
              },
            ].map((step) => (
              <div
                key={step.title}
                className={cn(
                  "rounded-xl border p-4 text-sm",
                  step.rejected
                    ? "border-red-500/40 bg-red-500/10"
                    : step.done
                      ? "border-emerald-500/40 bg-emerald-500/10"
                      : step.active
                        ? "border-amber-500/40 bg-amber-500/10"
                        : "border-border/60 bg-card/40",
                )}
              >
                <div className="flex items-center gap-2 font-semibold">
                  {step.rejected ? (
                    <XCircle className="h-4 w-4 text-red-600" />
                  ) : step.done ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : step.active ? (
                    <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                  ) : (
                    <Clock3 className="h-4 w-4 text-muted-foreground" />
                  )}
                  {step.title}
                </div>
              </div>
            ))}
          </div>

          {isUpgradeBlockedByPending ? (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
              You already have a pending upgrade request. Wait for verification result before requesting another package upgrade.
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card className="bg-card/40 border-border/60">
          <CardHeader className="pb-3">
            <CardDescription>Status</CardDescription>
            <CardTitle className="text-base">
              <Badge className={cn("border", getStatusTone(statusText))}>{toTitle(statusText)}</Badge>
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-card/40 border-border/60">
          <CardHeader className="pb-3">
            <CardDescription>Current Plan</CardDescription>
            <CardTitle className="text-base">{subscription?.plan_name || currentPlan?.name || toTitle(planSlug)}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-card/40 border-border/60">
          <CardHeader className="pb-3">
            <CardDescription>Billing Cycle</CardDescription>
            <CardTitle className="text-base">{toTitle(billingCycle)}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-card/40 border-border/60">
          <CardHeader className="pb-3">
            <CardDescription>Renewal / Expiry</CardDescription>
            <CardTitle className="text-base">{formatDate(expiresAt)}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-card/40 border-border/60">
          <CardHeader className="pb-3">
            <CardDescription>Restaurants</CardDescription>
            <CardTitle className="text-base">{usedRestaurants} / {restaurantLimitLabel}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2 bg-card/40 border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <CalendarClock className="h-5 w-5 text-primary" /> Current Plan Progress
            </CardTitle>
            <CardDescription>Days left on the current subscription period.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Days left</span>
              <span className="font-semibold">{daysRemaining ?? "-"} / {totalDays}</span>
            </div>
            <Progress value={daysLeftPct} className="h-3" />
            <p className="text-xs text-muted-foreground">
              {daysRemaining === null
                ? "Could not determine remaining days from the current payload."
                : `${Math.round(daysLeftPct)}% of the current period is remaining.`}
            </p>

            <div className="grid gap-3 sm:grid-cols-2 text-sm pt-2">
              <div className="rounded-lg border border-border/60 p-3"><span className="text-muted-foreground">Subscription ID:</span> {subscription?.id || "-"}</div>
              <div className="rounded-lg border border-border/60 p-3"><span className="text-muted-foreground">Plan Slug:</span> {subscription?.plan_slug || currentPlan?.slug || "-"}</div>
              <div className="rounded-lg border border-border/60 p-3"><span className="text-muted-foreground">Started At:</span> {formatDate(startsAt)}</div>
              <div className="rounded-lg border border-border/60 p-3"><span className="text-muted-foreground">Expires At:</span> {formatDate(expiresAt)}</div>
              <div className="rounded-lg border border-border/60 p-3"><span className="text-muted-foreground">Monthly Price:</span> {formatCurrency(currentPlan?.priceMonthly ?? subscription?.price_monthly, currentPlan?.currency || subscription?.currency || "ETB")}</div>
              <div className="rounded-lg border border-border/60 p-3"><span className="text-muted-foreground">Annual Price:</span> {formatCurrency(currentPlan?.priceAnnual, currentPlan?.currency || subscription?.currency || "ETB")}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-5 w-5 text-primary" /> Features and Limits
            </CardTitle>
            <CardDescription>What your current package includes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-lg border border-border/60 p-3 flex items-center justify-between">
              <span className="text-muted-foreground">Analytics</span>
              <span className="font-semibold">{features.analytics_enabled ? "Enabled" : "Disabled"}</span>
            </div>
            <div className="rounded-lg border border-border/60 p-3 flex items-center justify-between">
              <span className="text-muted-foreground">Activity Logs</span>
              <span className="font-semibold">{features.activity_log_enabled ? "Enabled" : "Disabled"}</span>
            </div>
            <div className="rounded-lg border border-border/60 p-3 flex items-center justify-between">
              <span className="text-muted-foreground">Menu Items Limit</span>
              <span className="font-semibold">{features.max_menu_items === -1 ? "Unlimited" : features.max_menu_items ?? "-"}</span>
            </div>
            <div className="rounded-lg border border-border/60 p-3 flex items-center justify-between">
              <span className="text-muted-foreground">Categories Limit</span>
              <span className="font-semibold">{features.max_categories === -1 ? "Unlimited" : features.max_categories ?? "-"}</span>
            </div>
            <div className="rounded-lg border border-border/60 p-3 flex items-center justify-between">
              <span className="text-muted-foreground">Staff Accounts</span>
              <span className="font-semibold">{features.max_staff_accounts === -1 ? "Unlimited" : features.max_staff_accounts ?? "-"}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/40 border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <TrendingUp className="h-5 w-5 text-primary" /> Possible Upgrades
          </CardTitle>
          <CardDescription>
            {treatAsNoSubscription
              ? "Expired subscription detected. You can buy any package, including lower tiers."
              : isOnTopPlan
                ? "You are already on the highest package."
                : "Plans above your current tier that you can move to."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isOnTopPlan ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-sm text-emerald-700 dark:text-emerald-300">
              <div className="flex items-center gap-2 font-semibold">
                <Crown className="h-4 w-4" /> You are on Gold (top package)
              </div>
              <p className="mt-2">No further upgrade is available. You currently have the maximum package.</p>
            </div>
          ) : upgradeCandidates.length === 0 ? (
            <div className="rounded-xl border border-border/60 p-5 text-sm text-muted-foreground">
              No upgrade candidate found from the current plan mapping.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {upgradeCandidates.map((plan) => (
                <Card key={plan.id} className="border-border/60 bg-card/60">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <CardDescription>
                      {formatCurrency(plan.priceMonthly, plan.currency)} / month
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm rounded-lg border border-border/60 p-3 flex items-center justify-between">
                      <span className="text-muted-foreground">Restaurants</span>
                      <span className="font-semibold">{plan.features?.max_restaurants === -1 ? "Unlimited" : plan.features?.max_restaurants ?? "-"}</span>
                    </div>
                    <div className="text-sm rounded-lg border border-border/60 p-3 flex items-center justify-between">
                      <span className="text-muted-foreground">Menu Items</span>
                      <span className="font-semibold">{plan.features?.max_menu_items === -1 ? "Unlimited" : plan.features?.max_menu_items ?? "-"}</span>
                    </div>
                    {isUpgradeBlockedByPending ? (
                      <Button className="w-full" disabled>
                        Upgrade pending review
                      </Button>
                    ) : (
                      <Button className="w-full" asChild>
                        <Link href={`/payment?plan=${encodeURIComponent(plan.slug.replace(/-(monthly|annual)$/i, ""))}&billing_cycle=${encodeURIComponent(billingCycle)}`}>
                          {treatAsNoSubscription ? "Buy Package" : "Upgrade Plan"} <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-base">See All Plans</CardTitle>
            <CardDescription>Compare all available packages in one place.</CardDescription>
          </CardHeader>
          <CardContent>
            {isUpgradeBlockedByPending ? (
              <Button className="w-full" disabled>
                Upgrade pending review
              </Button>
            ) : (
              <Button className="w-full" asChild>
                <Link href="/packages">{treatAsNoSubscription ? "Buy Package" : "Upgrade Plan"}</Link>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Back to Dashboard</CardTitle>
            <CardDescription>Return to your operational overview.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="ghost" className="w-full" asChild>
              <Link href="/dashboard">
                <Building2 className="h-4 w-4" /> Return to Dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
