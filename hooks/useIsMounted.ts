"use client"

import { useState, useEffect } from "react"

/**
 * Hook to handle SSR hydration issues
 * Returns true only after component has mounted on client
 */
export function useIsMounted() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return isMounted
}
