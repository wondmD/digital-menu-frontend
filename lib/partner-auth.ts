"use client"

const PARTNER_ID_KEY = "partner_program_id"
const PARTNER_USERNAME_KEY = "partner_program_username"
const PARTNER_ACCESS_TOKEN_KEY = "partner_program_access_token"
const PARTNER_REFRESH_TOKEN_KEY = "partner_program_refresh_token"
const PARTNER_REFERRAL_CODE_KEY = "partner_program_referral_code"
const PARTNER_EMAIL_KEY = "partner_program_email"

export type PartnerSession = {
  partnerId: string
  username: string
  accessToken: string
  refreshToken?: string
  referralCode?: string
  email?: string
}

export function savePartnerSession(payload: {
  partnerId: string
  username: string
  accessToken: string
  refreshToken?: string
  referralCode?: string
  email?: string
}) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(PARTNER_ID_KEY, payload.partnerId.trim())
  window.localStorage.setItem(PARTNER_USERNAME_KEY, payload.username.trim())
  window.localStorage.setItem(PARTNER_ACCESS_TOKEN_KEY, payload.accessToken.trim())

  if (payload.refreshToken) {
    window.localStorage.setItem(PARTNER_REFRESH_TOKEN_KEY, payload.refreshToken.trim())
  } else {
    window.localStorage.removeItem(PARTNER_REFRESH_TOKEN_KEY)
  }

  if (payload.referralCode) {
    window.localStorage.setItem(PARTNER_REFERRAL_CODE_KEY, payload.referralCode.trim())
  } else {
    window.localStorage.removeItem(PARTNER_REFERRAL_CODE_KEY)
  }

  if (payload.email) {
    window.localStorage.setItem(PARTNER_EMAIL_KEY, payload.email.trim())
  } else {
    window.localStorage.removeItem(PARTNER_EMAIL_KEY)
  }
}

export function getPartnerSession(): PartnerSession | null {
  if (typeof window === "undefined") return null
  const partnerId = window.localStorage.getItem(PARTNER_ID_KEY)
  const username = window.localStorage.getItem(PARTNER_USERNAME_KEY)
  const accessToken = window.localStorage.getItem(PARTNER_ACCESS_TOKEN_KEY)
  const refreshToken = window.localStorage.getItem(PARTNER_REFRESH_TOKEN_KEY) || undefined
  const referralCode = window.localStorage.getItem(PARTNER_REFERRAL_CODE_KEY) || undefined
  const email = window.localStorage.getItem(PARTNER_EMAIL_KEY) || undefined

  if (!partnerId || !username || !accessToken) return null
  return { partnerId, username, accessToken, refreshToken, referralCode, email }
}

export function getPartnerAccessToken(): string | null {
  return getPartnerSession()?.accessToken || null
}

export function clearPartnerSession() {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(PARTNER_ID_KEY)
  window.localStorage.removeItem(PARTNER_USERNAME_KEY)
  window.localStorage.removeItem(PARTNER_ACCESS_TOKEN_KEY)
  window.localStorage.removeItem(PARTNER_REFRESH_TOKEN_KEY)
  window.localStorage.removeItem(PARTNER_REFERRAL_CODE_KEY)
  window.localStorage.removeItem(PARTNER_EMAIL_KEY)
}

// Backward-compatible wrappers for any remaining legacy callsites.
export function savePartnerId(partnerId: string) {
  savePartnerSession({
    partnerId,
    username: "partner_user",
    accessToken: "",
  })
}

export function getPartnerId(): string | null {
  return getPartnerSession()?.partnerId || null
}

export function clearPartnerId() {
  clearPartnerSession()
}
