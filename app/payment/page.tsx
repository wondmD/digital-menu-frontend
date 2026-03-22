"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { ArrowLeft, ArrowRight, Clock, Loader2, ReceiptText, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { apiFetch } from "@/lib/api-client"
import { useToast } from "@/components/ui/use-toast"

type Receiver = {
  id: string
  provider: string
  receiver_account?: string
  receiver_name?: string
  is_active?: boolean
}

type Plan = {
  id?: string
  slug?: string
  name?: string
  currency?: string
  price_monthly?: number
  price_annual?: number
}

const DEFAULT_PAYMENT_METHOD = "bank_transfer"

function extractDataEnvelope<T>(res: any): T {
  return (res?.data?.data || res?.data || res) as T
}

function extractList(res: any): any[] {
  const normalized = extractDataEnvelope<any>(res)
  if (Array.isArray(normalized)) return normalized
  if (Array.isArray(normalized?.items)) return normalized.items
  return []
}

export default function PaymentPage({
}: {}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { data: session, status } = useSession()

  const token = (session?.user as any)?.accessToken as string | undefined

  const planSlug = (searchParams.get("plan") || "silver").toLowerCase().replace(/-(monthly|annual)$/i, "")
  const queryBillingCycle = (searchParams.get("billing_cycle") || "monthly").toLowerCase()
  const initialBillingCycle = queryBillingCycle === "annual" ? "annual" : "monthly"

  const [receivers, setReceivers] = useState<Receiver[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(initialBillingCycle)
  const [provider, setProvider] = useState("")
  const [paymentMethod, setPaymentMethod] = useState(DEFAULT_PAYMENT_METHOD)
  const [transactionRef, setTransactionRef] = useState("")
  const [payerName, setPayerName] = useState("")
  const [channel, setChannel] = useState("bank_transfer")
  const [slipUploaded, setSlipUploaded] = useState(false)

  useEffect(() => {
    if (status === "loading") return

    if (status === "unauthenticated" || !token) {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/payment?plan=${planSlug}&billing_cycle=${initialBillingCycle}`)}`)
      return
    }

    const loadData = async () => {
      try {
        setLoading(true)
        const [plansRes, receiversRes] = await Promise.all([
          apiFetch<any>("/subscription/plans").catch(() => null),
          apiFetch<any>("/subscription/payment-receivers", { token }).catch(() => null),
        ])

        const fetchedPlans = extractList(plansRes)
        const fetchedReceivers = extractList(receiversRes)

        setPlans(fetchedPlans)
        setReceivers(fetchedReceivers)

        const firstProvider = fetchedReceivers[0]?.provider
        if (firstProvider) {
          setProvider(String(firstProvider))
        }
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [status, token, router, planSlug, initialBillingCycle])

  const selectedPlan = useMemo(() => {
    return plans.find((p) => {
      const slug = String(p.slug || p.id || "").toLowerCase().replace(/-(monthly|annual)$/i, "")
      return slug === planSlug
    })
  }, [plans, planSlug])

  const selectedReceiver = useMemo(
    () => receivers.find((item) => String(item.provider).toLowerCase() === provider.toLowerCase()),
    [provider, receivers],
  )

  const displayPlanName = selectedPlan?.name || planSlug.charAt(0).toUpperCase() + planSlug.slice(1)
  const currency = selectedPlan?.currency || "ETB"
  const amount =
    billingCycle === "annual"
      ? selectedPlan?.price_annual ?? selectedPlan?.price_monthly ?? 0
      : selectedPlan?.price_monthly ?? selectedPlan?.price_annual ?? 0

  const submitUpgrade = async () => {
    if (!token) return

    if (!provider) {
      toast({ title: "Provider required", description: "Please select a payment provider.", variant: "destructive" })
      return
    }

    if (!paymentMethod.trim()) {
      toast({ title: "Payment method required", description: "Please provide the payment method.", variant: "destructive" })
      return
    }

    if (!transactionRef.trim() || transactionRef.trim().length < 4) {
      toast({
        title: "Transaction reference required",
        description: "Enter a valid transaction reference used in your payment.",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        plan_slug: planSlug,
        billing_cycle: billingCycle,
        provider,
        payment_method: paymentMethod.trim(),
        transaction_ref: transactionRef.trim(),
        verification: {
          extra: {
            payer_name: payerName.trim() || "N/A",
            channel: channel.trim() || "bank_transfer",
            slip_uploaded: !!slipUploaded,
          },
        },
      }

      const response = await apiFetch<any>("/subscription/upgrade", {
        method: "POST",
        token,
        body: payload,
      })

      const data = extractDataEnvelope<any>(response)

      toast({
        title: "Payment submitted",
        description:
          data?.message || "Your transaction was submitted successfully and is pending verification by our team.",
      })

      router.push("/dashboard?subscription_status=pending_verification")
    } catch (err: any) {
      toast({
        title: "Submission failed",
        description: err?.message || "Unable to submit your payment reference. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading payment details...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <div className="container mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <Badge variant="secondary" className="mb-4 border-primary/30 bg-primary/15 text-primary">
          Step 3 of 3 - Submit Transaction Reference
        </Badge>
        <h1 className="text-3xl font-serif font-normal text-primary tracking-tight sm:text-4xl md:text-5xl">Manual subscription verification</h1>
        <p className="mt-3 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Complete your payment using one of our receiver accounts, then submit the transaction reference below.
          Our system will validate it and activate your subscription.
        </p>

        <div className="mt-8 grid items-start gap-6 lg:mt-10 lg:grid-cols-[2fr_1fr]">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <ReceiptText className="h-5 w-5" />
                Transaction details
              </CardTitle>
              <CardDescription>
                Use exactly the same transaction reference generated by your bank or wallet app.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="provider" className="text-sm font-semibold text-foreground">Provider *</Label>
                  <select
                    id="provider"
                    aria-label="Payment provider"
                    className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                  >
                    <option value="">Select provider</option>
                    {receivers.map((item) => (
                      <option key={item.id || item.provider} value={item.provider}>
                        {String(item.provider).toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billingCycle" className="text-sm font-semibold text-foreground">Billing cycle *</Label>
                  <select
                    id="billingCycle"
                    aria-label="Billing cycle"
                    className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    value={billingCycle}
                    onChange={(e) => setBillingCycle(e.target.value === "annual" ? "annual" : "monthly")}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="transactionRef" className="text-sm font-semibold text-foreground">Transaction reference *</Label>
                  <Input
                    id="transactionRef"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    className="h-11 border-border bg-background text-foreground placeholder:text-muted-foreground/80"
                    placeholder="e.g. CBE239847239"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod" className="text-sm font-semibold text-foreground">Payment method *</Label>
                  <Input
                    id="paymentMethod"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-11 border-border bg-background text-foreground placeholder:text-muted-foreground/80"
                    placeholder="bank_transfer"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="payerName" className="text-sm font-semibold text-foreground">Payer name</Label>
                  <Input
                    id="payerName"
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                    className="h-11 border-border bg-background text-foreground placeholder:text-muted-foreground/80"
                    placeholder="Abebe Kebede"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="channel" className="text-sm font-semibold text-foreground">Channel</Label>
                  <Input
                    id="channel"
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                    className="h-11 border-border bg-background text-foreground placeholder:text-muted-foreground/80"
                    placeholder="bank_transfer"
                  />
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3">
                <Checkbox id="slipUploaded" checked={slipUploaded} onCheckedChange={(checked) => setSlipUploaded(checked === true)} />
                <Label htmlFor="slipUploaded" className="text-sm text-muted-foreground">
                  I have uploaded/kept payment evidence and can provide it if verification requests it.
                </Label>
              </div>

              {selectedReceiver ? (
                <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm">
                  <p className="font-semibold text-primary">Receiver account</p>
                  <p className="mt-1 text-foreground">{selectedReceiver.receiver_name || "Subscription Collection"}</p>
                  <p className="text-muted-foreground">{selectedReceiver.receiver_account || "Account not available"}</p>
                </div>
              ) : null}
            </CardContent>
            <CardFooter className="flex flex-col gap-3 border-t border-border bg-muted/20">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Transaction references are validated before activation.
              </div>
              <div className="grid w-full gap-2 sm:grid-cols-2">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/packages">
                    <ArrowLeft className="h-4 w-4" />
                    Back to packages
                  </Link>
                </Button>
                <Button className="w-full gap-2" onClick={submitUpgrade} disabled={submitting || !provider}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Submit transaction
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>

          <Card className="border-border bg-card shadow-sm lg:sticky lg:top-6">
            <CardHeader>
              <CardTitle className="text-lg">Order summary</CardTitle>
              <CardDescription className="text-muted-foreground">Review before submitting the reference.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">{displayPlanName} plan</p>
                  <p className="text-sm text-muted-foreground">Renews {billingCycle}. Change anytime.</p>
                </div>
                <div className="text-right text-primary font-bold">
                  {Number(amount).toLocaleString()} {currency}
                  <span className="text-sm font-medium text-muted-foreground"> / {billingCycle}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-sm text-primary">
                <Clock className="h-4 w-4" />
                Activation starts after successful transaction verification.
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Provider</span>
                <span className="text-foreground">{provider ? provider.toUpperCase() : "Not selected"}</span>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-lg font-bold text-foreground">
                <span>Total submitted</span>
                <span>{Number(amount).toLocaleString()} {currency}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/packages">
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Link>
                </Button>
                <Button className="w-full" onClick={submitUpgrade} disabled={submitting || !provider}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Submit
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
