"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { apiFetch } from "@/lib/api-client"

export function SubscriptionWatcher({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (status === "loading") return
    
    // If not logged in, the auth middleware will handle it
    if (status === "unauthenticated") {
      setChecking(false)
      return
    }

    const token = (session?.user as any)?.accessToken

    if (!token) {
      setChecking(false)
      return
    }

    const checkSubscription = async () => {
      try {
        // According to Postman: GET /subscription/me
        const res = await apiFetch<any>("/subscription/me", { token })
        
        // Subscription check logic: 
        // If data is null or status is not 'active', they need to subscribe.
        // We'll be lenient: if the API returns a successful response with an active subscription, we're good.
        const subscription = res?.data || res
        
        // If data is null or status is not 'active', they need to subscribe.
        // We'll allow active subscriptions AND active free trials.
        const isActive = subscription?.status === "active"
        const isTrial = subscription?.plan_slug === "free-trial" || subscription?.name?.toLowerCase().includes("trial")
        const isExpired = subscription?.status === "expired" || (subscription?.expires_at && new Date(subscription.expires_at) < new Date())
        
        if (!subscription || (!isActive && !isTrial) || isExpired) {
          // No active subscription or trial, redirect to packages
          // But only if we're not already on the packages or payment pages
          if (!pathname.startsWith("/packages") && !pathname.startsWith("/payment")) {
             router.push("/packages")
          }
        }
      } catch (err) {
        // If the subscription is missing (404), redirect to packages
        console.error("Subscription check failed:", err)
        if (!pathname.startsWith("/packages") && !pathname.startsWith("/payment")) {
           router.push("/packages")
        }
      } finally {
        setChecking(false)
      }
    }

    checkSubscription()
  }, [session, status, router, pathname])

  // While checking, we could show a loader or just nothing
  // For the dashboard, it's safer to show nothing or a skeleton until we know they can be there
  if (checking && status === "authenticated") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-secondary/10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return <>{children}</>
}
