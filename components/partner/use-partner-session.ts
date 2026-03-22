"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { getPartnerSession } from "@/lib/partner-auth"

type UsePartnerSessionResult = {
  partnerId: string | null
  username: string | null
  accessToken: string | null
  referralCode: string | null
  email: string | null
  isLoading: boolean
}

export function usePartnerSession(): UsePartnerSessionResult {
  const router = useRouter()
  const pathname = usePathname()
  const [partnerId, setPartnerId] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const session = getPartnerSession()
    const id = session?.partnerId || null
    const name = session?.username || null
    const token = session?.accessToken || null
    const code = session?.referralCode || null
    const sessionEmail = session?.email || null
    setPartnerId(id)
    setUsername(name)
    setAccessToken(token)
    setReferralCode(code)
    setEmail(sessionEmail)
    setIsLoading(false)

    if (!id || !name || !token) {
      router.replace(`/partner/login?next=${encodeURIComponent(pathname || "/partner/dashboard/overview")}`)
    }
  }, [pathname, router])

  return useMemo(
    () => ({ partnerId, username, accessToken, referralCode, email, isLoading }),
    [partnerId, username, accessToken, referralCode, email, isLoading]
  )
}
