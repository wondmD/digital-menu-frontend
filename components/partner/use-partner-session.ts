"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { getPartnerSession } from "@/lib/partner-auth"

type UsePartnerSessionResult = {
  partnerId: string | null
  username: string | null
  isLoading: boolean
}

export function usePartnerSession(): UsePartnerSessionResult {
  const router = useRouter()
  const pathname = usePathname()
  const [partnerId, setPartnerId] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const session = getPartnerSession()
    const id = session?.partnerId || null
    const name = session?.username || null
    setPartnerId(id)
    setUsername(name)
    setIsLoading(false)

    if (!id || !name) {
      router.replace(`/partner/login?next=${encodeURIComponent(pathname || "/partner/dashboard/overview")}`)
    }
  }, [pathname, router])

  return useMemo(() => ({ partnerId, username, isLoading }), [partnerId, username, isLoading])
}
