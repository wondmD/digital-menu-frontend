import Link from "next/link"
import { CreditCard, ShieldCheck, Clock, ArrowLeft, ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const PLAN_LABELS: Record<string, { name: string; price: string; cadence: string }> = {
  starter: { name: "Starter", price: "$9", cadence: "/ month" },
  pro: { name: "Pro", price: "$19", cadence: "/ month" },
  enterprise: { name: "Enterprise", price: "Custom", cadence: "" },
}

export default function PaymentPage({
  searchParams,
}: {
  searchParams?: { plan?: string }
}) {
  const planKey = searchParams?.plan || "pro"
  const plan = PLAN_LABELS[planKey] || PLAN_LABELS.pro
  const trialActive = true

  return (
    <div className="min-h-screen bg-[#FDFCF8] font-sans">
      <div className="container mx-auto px-6 py-16 max-w-4xl">
        <Badge variant="secondary" className="mb-4 bg-primary/10 text-primary border-primary/10">
          Step 3 of 3 — Payment (optional during 14-day free trial)
        </Badge>
        <h1 className="text-4xl font-serif font-normal text-primary tracking-tight sm:text-5xl">Secure checkout</h1>
        <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
          You are on a 14-day free trial. Start now without paying, or add payment details to continue seamlessly.
          You can change or cancel anytime.
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-[2fr_1fr]">
          <Card className="shadow-sm border-primary/10 bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <CreditCard className="h-5 w-5" />
                Payment details (optional)
              </CardTitle>
              <CardDescription>
                Start your trial without paying. Add a card now only if you want uninterrupted access after 14 days.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Cardholder name</label>
                  <input
                    className="h-11 w-full rounded-lg border border-primary/10 bg-white/70 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Avery Green"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Email for receipts</label>
                  <input
                    className="h-11 w-full rounded-lg border border-primary/10 bg-white/70 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="manager@venue.com"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium text-foreground">Card number</label>
                  <input
                    className="h-11 w-full rounded-lg border border-primary/10 bg-white/70 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="4242 4242 4242 4242"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">CVC</label>
                  <input
                    className="h-11 w-full rounded-lg border border-primary/10 bg-white/70 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="123"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Expiry</label>
                  <input
                    className="h-11 w-full rounded-lg border border-primary/10 bg-white/70 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="MM / YY"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">ZIP / Postal code</label>
                  <input
                    className="h-11 w-full rounded-lg border border-primary/10 bg-white/70 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="10001"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 border-t border-primary/10 bg-white/60">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                PCI compliant. Cancel anytime.
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" className="flex-1" asChild>
                  <Link href={`/dashboard?plan=${planKey}&trial=14`}>
                    <Sparkles className="h-4 w-4" />
                    Start 14-day free trial
                  </Link>
                </Button>
                <Button className="flex-1 gap-2" asChild>
                  <Link href="/dashboard">
                    Pay and go to dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardFooter>
          </Card>

          <Card className="border-primary/10 bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Order summary</CardTitle>
              <CardDescription className="text-muted-foreground">Review before paying.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">{plan.name} plan</p>
                  <p className="text-sm text-muted-foreground">Renews monthly. Change anytime.</p>
                </div>
                <div className="text-right text-primary font-bold">
                  {plan.price}
                  <span className="text-sm font-medium text-muted-foreground"> {plan.cadence}</span>
                </div>
              </div>
              {trialActive ? (
                <div className="flex items-center gap-2 rounded-xl bg-primary/5 px-3 py-2 text-sm text-primary">
                  <Clock className="h-4 w-4" />
                  14-day free trial active. You won’t be charged today.
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-xl bg-primary/5 px-3 py-2 text-sm text-primary">
                  <Clock className="h-4 w-4" />
                  First charge occurs after your free setup window.
                </div>
              )}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Discount</span>
                <span className="text-primary">-$0</span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>VAT</span>
                <span className="text-foreground">Calculated at checkout</span>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-lg font-bold text-foreground">
                <span>Total due now</span>
                <span>{trialActive ? "$0 during trial" : plan.price === "Custom" ? "Contact sales" : plan.price}</span>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/packages">
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Link>
                </Button>
                <Button className="w-full" asChild>
                  <Link href="/dashboard">Pay now</Link>
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
