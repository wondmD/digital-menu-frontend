"use client"

const PARTNER_ID_KEY = "partner_program_id"
const PARTNER_USERNAME_KEY = "partner_program_username"

export type PartnerSession = {
  partnerId: string
  username: string
}

export function savePartnerSession(partnerId: string, username: string) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(PARTNER_ID_KEY, partnerId.trim())
  window.localStorage.setItem(PARTNER_USERNAME_KEY, username.trim())
}

export function getPartnerSession(): PartnerSession | null {
  if (typeof window === "undefined") return null
  const partnerId = window.localStorage.getItem(PARTNER_ID_KEY)
  const username = window.localStorage.getItem(PARTNER_USERNAME_KEY)

  if (!partnerId || !username) return null
  return { partnerId, username }
}

export function clearPartnerSession() {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(PARTNER_ID_KEY)
  window.localStorage.removeItem(PARTNER_USERNAME_KEY)
}

// Backward-compatible wrappers for any remaining legacy callsites.
export function savePartnerId(partnerId: string) {
  savePartnerSession(partnerId, "partner_user")
}

export function getPartnerId(): string | null {
  return getPartnerSession()?.partnerId || null
}

export function clearPartnerId() {
  clearPartnerSession()
}
