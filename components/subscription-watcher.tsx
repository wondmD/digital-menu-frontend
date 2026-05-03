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

  const goToLogin = () => {
    if (pathname !== "/login") {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`)
    }
  }

  useEffect(() => {
    if (status === "loading") return
    
    // If not logged in, the auth middleware will handle it
    if (status === "unauthenticated") {
      setChecking(false)
      goToLogin()
      return
    }

    const token = (session?.user as any)?.accessToken

    if (!token) {
      setChecking(false)
      return
    }

        const checkSubscription = async () => {
      try {
        const res = await apiFetch<any>("/subscription/me", { token })
        
        // Handle various response wrappers
        const subscription = res?.data?.data || res?.data || res
        
        const status = (subscription?.status || "").toLowerCase()
        const planSlug = (subscription?.plan_slug || "").toLowerCase()
        const planName = (subscription?.name || "").toLowerCase()

        const isActive = status === "active" || status === "pending" || res?.success === true
        const isTrial = planSlug === "free-trial" || planName.includes("trial")
        
        // Use a 24-hour buffer for expiry to avoid timezone/clock drift issues
        const expiryDate = subscription?.expires_at ? new Date(subscription.expires_at) : null
        const now = new Date()
        const isExpired = expiryDate ? (expiryDate.getTime() + 86400000 < now.getTime()) : false
        
        // REDIRECT LOGIC: Only redirect if it's definitively NOT active/trial AND NOT successfully returned
        const shouldRedirect = !isActive && !isTrial
        
        if (shouldRedirect || (isExpired && !isActive)) {
          if (!pathname.startsWith("/packages") && !pathname.startsWith("/payment")) {
             router.push("/packages")
          }
        }
      } catch (err) {
        const message = String((err as any)?.message || "").toLowerCase()
        const isAuthError =
          message.includes("unauthorized") ||
          message.includes("authentication required") ||
          message.includes("invalid token") ||
          message.includes("forbidden")

        if (isAuthError) {
          goToLogin()
        } else if (!pathname.startsWith("/packages") && !pathname.startsWith("/payment")) {
          // Keep true subscription-missing cases on the pricing flow.
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
