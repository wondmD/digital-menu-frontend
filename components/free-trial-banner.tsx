"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { AlertTriangle, ArrowRight } from "lucide-react"
import { apiFetch } from "@/lib/api-client"

type SubscriptionPayload = Record<string, any>

function extractSubscription(res: any): SubscriptionPayload | null {
  const normalized = res?.data?.data || res?.data || res
  if (!normalized) return null
  return normalized.subscription || normalized
}

export function FreeTrialBanner() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const token = (session?.user as any)?.accessToken as string | undefined

  const [daysLeft, setDaysLeft] = useState<number | null>(null)

  useEffect(() => {
    if (status !== "authenticated" || !token) {
      setDaysLeft(null)
      return
    }

    let cancelled = false

    const load = async () => {
      try {
        const res = await apiFetch<any>("/subscription/me", { token })
        const sub = extractSubscription(res)

        const planSlug = String(sub?.plan_slug || "").toLowerCase()
        const planName = String(sub?.plan_name || sub?.plan?.name || "").toLowerCase()
        const isTrial = planSlug === "free-trial" || planSlug.includes("trial") || planName.includes("trial")

        if (!isTrial) {
          if (!cancelled) setDaysLeft(null)
          return
        }

        const directDays = Number(sub?.days_remaining)
        if (Number.isFinite(directDays)) {
          if (!cancelled) setDaysLeft(Math.max(0, directDays))
          return
        }

        const expiresAt = sub?.expires_at || sub?.end_date
        if (!expiresAt) {
          if (!cancelled) setDaysLeft(0)
          return
        }

        const expiry = new Date(expiresAt)
        const now = new Date()
        const diff = expiry.getTime() - now.getTime()
        const computed = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
        if (!cancelled) setDaysLeft(computed)
      } catch {
        if (!cancelled) setDaysLeft(null)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [status, token])

  const show = useMemo(() => daysLeft !== null, [daysLeft])

  if (!show) return null

  return (
    <div className="w-full border-b border-amber-400/30 bg-amber-500/10 text-amber-700 dark:text-amber-300">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 text-xs sm:text-sm">
        <div className="flex items-center gap-2 font-semibold">
          <AlertTriangle className="h-4 w-4" />
          <span>
            Free trial active: <span className="font-black">{daysLeft} day{daysLeft === 1 ? "" : "s"} left</span>
          </span>
        </div>
        <Link href="/packages" className="inline-flex items-center gap-1 font-bold underline-offset-4 hover:underline">
          Upgrade Plan
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}
