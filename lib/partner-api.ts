import { apiFetch } from "@/lib/api-client"
import {
  MOCK_PARTNER_ANALYTICS,
  MOCK_PARTNER_CHECKLIST,
  MOCK_PARTNER_COMMISSIONS,
  MOCK_PARTNER_NOTIFICATIONS,
  MOCK_PARTNER_PROFILE,
  MOCK_PARTNER_REFERRALS,
  MOCK_PARTNER_TOOLKIT,
  PartnerAnalyticsPoint,
  PartnerChecklistItem,
  PartnerCommission,
  PartnerLevel,
  PartnerNotification,
  PartnerProfile,
  PartnerReferral,
  ToolkitAsset,
} from "@/lib/mock-data"
import { getPartnerSession, savePartnerSession } from "@/lib/partner-auth"

function getPartnerLevel(totalReferrals: number): PartnerLevel {
  if (totalReferrals >= 20) return "Elite"
  if (totalReferrals >= 6) return "Pro"
  return "Starter"
}

function getNextLevelThreshold(level: PartnerLevel): number {
  if (level === "Starter") return 6
  if (level === "Pro") return 21
  return 21
}

export type PartnerOverview = {
  totalRestaurantsReferred: number
  activeSubscriptions: number
  totalEarnings: number
  monthlyEarnings: number
  conversionRate: number
  avgRevenuePerRestaurant: number
  level: PartnerLevel
  progress: number
  nextLevelTarget: number
  referralCode?: string
}

function extractDataEnvelope(payload: any): any {
  return payload?.data?.data || payload?.data || payload
}

function extractList(payload: any): any[] {
  const normalized = extractDataEnvelope(payload)
  if (Array.isArray(normalized)) return normalized
  if (Array.isArray(normalized?.items)) return normalized.items
  if (Array.isArray(normalized?.results)) return normalized.results
  if (Array.isArray(normalized?.rows)) return normalized.rows
  if (Array.isArray(normalized?.ledger)) return normalized.ledger
  if (Array.isArray(normalized?.entries)) return normalized.entries
  if (Array.isArray(normalized?.records)) return normalized.records
  if (Array.isArray(normalized?.commissions)) return normalized.commissions
  return []
}

function toNumber(value: any, fallback = 0): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function parseMoney(value: any, fallback = 0): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback
  const raw = String(value ?? "").trim()
  if (!raw) return fallback
  const normalized = raw.replace(/,/g, "").replace(/[^0-9.-]/g, "")
  const n = Number(normalized)
  return Number.isFinite(n) ? n : fallback
}

function toStatus(value: any): "pending" | "active" | "churned" {
  const v = String(value || "").toLowerCase()
  if (v === "active" || v === "converted" || v === "completed") return "active"
  if (v === "pending" || v === "trial") return "pending"
  return "churned"
}

function toSubscriptionStatus(value: any): "trial" | "active" | "past_due" | "canceled" {
  const v = String(value || "").toLowerCase()
  if (v === "active" || v === "paid" || v === "succeeded" || v === "completed") return "active"
  if (v === "trial" || v === "pending" || v === "incomplete") return "trial"
  if (v === "past_due" || v === "overdue" || v === "failed" || v === "unpaid") return "past_due"
  if (v === "canceled" || v === "cancelled" || v === "churned") return "canceled"
  return "trial"
}

function toPaymentStatus(value: any): "paid" | "pending" {
  const v = String(value || "").toLowerCase()
  if (v === "paid" || v === "succeeded" || v === "completed") return "paid"
  return "pending"
}

function getPartnerAuth() {
  const session = getPartnerSession()
  if (!session?.accessToken) {
    throw new Error("Partner session not found. Please login again.")
  }
  return session
}

async function fetchPartnerEndpoint<T>(path: string): Promise<T> {
  const session = getPartnerAuth()
  const response = await apiFetch<any>(path, { token: session.accessToken })
  return extractDataEnvelope(response) as T
}

function patchSessionFromProfile(profile: any) {
  const current = getPartnerSession()
  if (!current) return

  const nextReferral = String(profile?.referral_code || profile?.marketer_referral_code || "").trim()
  if (!nextReferral || nextReferral === current.referralCode) return

  savePartnerSession({
    partnerId: current.partnerId,
    username: current.username,
    accessToken: current.accessToken,
    refreshToken: current.refreshToken,
    email: current.email,
    referralCode: nextReferral,
  })
}

export async function fetchPartnerProfile(partnerId: string): Promise<PartnerProfile> {
  try {
    const profile = await fetchPartnerEndpoint<any>("/partners/me/profile")
    patchSessionFromProfile(profile)

    return {
      id: String(profile?.id || partnerId || MOCK_PARTNER_PROFILE.id),
      fullName: String(profile?.full_name || profile?.name || MOCK_PARTNER_PROFILE.fullName),
      email: String(profile?.email || MOCK_PARTNER_PROFILE.email),
      company: profile?.company || profile?.organization || undefined,
      joinedAt: String(profile?.created_at || profile?.joined_at || MOCK_PARTNER_PROFILE.joinedAt),
    }
  } catch {
    return { ...MOCK_PARTNER_PROFILE, id: partnerId || MOCK_PARTNER_PROFILE.id }
  }
}

export async function fetchPartnerReferrals(_: string): Promise<PartnerReferral[]> {
  try {
    const rows = extractList(await fetchPartnerEndpoint<any>("/partners/me/referrals?page=1&page_size=100"))
    if (!rows.length) return []

    return rows.map((row: any, index: number) => ({
      id: String(row?.id || row?.owner_id || `ref_${index}`),
      restaurantName: String(row?.restaurant_name || row?.restaurant?.name || row?.owner_name || row?.business_name || row?.name || "Unknown"),
      status: toStatus(row?.status || row?.referral_status),
      joinedAt: String(row?.joined_at || row?.attributed_at || row?.created_at || row?.updated_at || new Date().toISOString()),
      subscriptionStatus: toSubscriptionStatus(
        row?.subscription_status ||
          row?.owner_subscription_status ||
          row?.current_subscription_status ||
          row?.latest_subscription_status ||
          row?.plan_status ||
          row?.subscription?.status ||
          row?.subscription?.payment_status ||
          row?.owner_subscription?.status ||
          row?.owner_subscription?.payment_status ||
          row?.payment_status
      ),
    }))
  } catch {
    return MOCK_PARTNER_REFERRALS
  }
}

export async function fetchPartnerCommissions(_: string): Promise<PartnerCommission[]> {
  try {
    const rows = extractList(await fetchPartnerEndpoint<any>("/partners/me/ledger?page=1&page_size=100"))
    if (!rows.length) return []

    return rows.map((row: any, index: number) => {
      const entryType = String(
        row?.entry_type || row?.type || row?.event_type || row?.commission_type || ""
      ).toLowerCase()

      const firstExplicit = parseMoney(
        row?.first_payment_commission ?? row?.commission_first ?? row?.first_commission,
        0
      )
      const recurringExplicit = parseMoney(
        row?.recurring_commission ?? row?.commission_recurring ?? row?.recurring_amount,
        0
      )

      const genericAmount = parseMoney(
        row?.amount ??
          row?.commission_amount ??
          row?.net_amount ??
          row?.gross_amount ??
          row?.value ??
          row?.total_commission,
        0
      )

      let firstPaymentCommission = firstExplicit
      let recurringCommission = recurringExplicit

      // Some backends emit a single `amount` per ledger row, classify by entry/event type.
      if (firstPaymentCommission === 0 && recurringCommission === 0 && genericAmount > 0) {
        if (/(first|signup|activation|activated|initial)/.test(entryType)) {
          firstPaymentCommission = genericAmount
        } else {
          recurringCommission = genericAmount
        }
      }

      return {
        id: String(row?.id || row?.commission_id || row?.ledger_id || `com_${index}`),
        restaurantName: String(
          row?.restaurant_name ||
            row?.restaurant?.name ||
            row?.owner_name ||
            row?.business_name ||
            row?.name ||
            "Unknown"
        ),
        firstPaymentCommission,
        recurringCommission,
        status: toPaymentStatus(row?.status || row?.payment_status || row?.entry_status),
        paidAt: row?.paid_at || row?.payout_at || row?.created_at || undefined,
      }
    })
  } catch {
    return MOCK_PARTNER_COMMISSIONS
  }
}

export async function fetchPartnerAnalytics(_: string): Promise<PartnerAnalyticsPoint[]> {
  try {
    const referrals = await fetchPartnerReferrals("")
    const buckets = new Map<string, { signups: number; conversions: number }>()

    referrals.forEach((row) => {
      const date = new Date(row.joinedAt)
      const month = date.toLocaleString("en-US", { month: "short" })
      const existing = buckets.get(month) || { signups: 0, conversions: 0 }
      existing.signups += 1
      if (row.status === "active") existing.conversions += 1
      buckets.set(month, existing)
    })

    const points = Array.from(buckets.entries()).map(([month, value]) => ({
      month,
      signups: value.signups,
      conversions: value.conversions,
    }))

    return points.length ? points : MOCK_PARTNER_ANALYTICS
  } catch {
    return MOCK_PARTNER_ANALYTICS
  }
}

export async function fetchPartnerNotifications(_: string): Promise<PartnerNotification[]> {
  try {
    const referrals = await fetchPartnerReferrals("")
    return referrals.slice(0, 5).map((row, index) => ({
      id: `notif_ref_${row.id}_${index}`,
      title: "Referral update",
      description: `${row.restaurantName} is currently ${row.status}.`,
      createdAt: row.joinedAt,
      kind: "signup",
    }))
  } catch {
    return MOCK_PARTNER_NOTIFICATIONS
  }
}

export async function fetchPartnerChecklist(_: string): Promise<PartnerChecklistItem[]> {
  try {
    const [profile, referrals] = await Promise.all([fetchPartnerProfile(""), fetchPartnerReferrals("")])
    const hasProfile = Boolean(profile.fullName && profile.email)
    const hasReferral = referrals.length > 0
    const hasActiveReferral = referrals.some((row) => row.status === "active")

    return [
      { id: "chk_1", title: "Complete partner profile", completed: hasProfile },
      { id: "chk_2", title: "Copy and share referral link", completed: true },
      { id: "chk_3", title: "Refer your first restaurant", completed: hasReferral },
      { id: "chk_4", title: "Convert at least one referral", completed: hasActiveReferral },
      { id: "chk_5", title: "Track commission performance", completed: true },
    ]
  } catch {
    return MOCK_PARTNER_CHECKLIST
  }
}

export async function fetchPartnerToolkit(_: string): Promise<ToolkitAsset[]> {
  // No dedicated partner toolkit endpoint exists in the current API contract.
  // Keep curated static assets until backend provides toolkit content.
  return MOCK_PARTNER_TOOLKIT
}

export async function fetchPartnerOverview(partnerId: string): Promise<PartnerOverview> {
  try {
    const [dashboardRaw, profileRaw, referrals, commissions] = await Promise.all([
      fetchPartnerEndpoint<any>("/partners/me/dashboard"),
      fetchPartnerEndpoint<any>("/partners/me/profile").catch(() => null),
      fetchPartnerReferrals(partnerId),
      fetchPartnerCommissions(partnerId),
    ])

    patchSessionFromProfile(profileRaw)

    const totalRestaurantsReferred = toNumber(
      dashboardRaw?.total_referrals ?? dashboardRaw?.referrals_count,
      referrals.length
    )
    const activeSubscriptions = toNumber(
      dashboardRaw?.active_subscriptions ?? dashboardRaw?.active_referrals,
      referrals.filter((ref) => ref.subscriptionStatus === "active").length
    )
    const totalEarnings = toNumber(
      dashboardRaw?.total_earnings ?? dashboardRaw?.total_commission,
      commissions.reduce((sum, row) => sum + row.firstPaymentCommission + row.recurringCommission, 0)
    )
    const monthlyEarnings = toNumber(
      dashboardRaw?.monthly_earnings ?? dashboardRaw?.current_month_earnings,
      commissions
        .filter((row) => row.status === "paid")
        .reduce((sum, row) => sum + row.firstPaymentCommission + row.recurringCommission, 0)
    )
    const conversionRate = toNumber(
      dashboardRaw?.conversion_rate,
      totalRestaurantsReferred ? Number(((activeSubscriptions / totalRestaurantsReferred) * 100).toFixed(1)) : 0
    )
    const avgRevenuePerRestaurant = activeSubscriptions
      ? Number((totalEarnings / activeSubscriptions).toFixed(2))
      : 0

    const level = getPartnerLevel(totalRestaurantsReferred)
    const nextLevelTarget = getNextLevelThreshold(level)
    const progress =
      level === "Elite"
        ? 100
        : Math.min(100, Math.round((totalRestaurantsReferred / (nextLevelTarget - 1)) * 100))

    const referralCode = String(
      profileRaw?.referral_code ||
      profileRaw?.marketer_referral_code ||
      getPartnerSession()?.referralCode ||
      ""
    )

    return {
      totalRestaurantsReferred,
      activeSubscriptions,
      totalEarnings,
      monthlyEarnings,
      conversionRate,
      avgRevenuePerRestaurant,
      level,
      progress,
      nextLevelTarget,
      referralCode: referralCode || undefined,
    }
  } catch {
    const [referrals, commissions] = await Promise.all([
      fetchPartnerReferrals(partnerId),
      fetchPartnerCommissions(partnerId),
    ])

    const totalRestaurantsReferred = referrals.length
    const activeSubscriptions = referrals.filter((ref) => ref.subscriptionStatus === "active").length
    const totalEarnings = commissions.reduce(
      (sum, row) => sum + row.firstPaymentCommission + row.recurringCommission,
      0
    )
    const monthlyEarnings = commissions
      .filter((row) => row.status === "paid")
      .reduce((sum, row) => sum + row.firstPaymentCommission + row.recurringCommission, 0)

    const converted = referrals.filter((row) => row.status === "active").length
    const conversionRate = totalRestaurantsReferred
      ? Number(((converted / totalRestaurantsReferred) * 100).toFixed(1))
      : 0

    const avgRevenuePerRestaurant = activeSubscriptions
      ? Number((totalEarnings / activeSubscriptions).toFixed(2))
      : 0

    const level = getPartnerLevel(totalRestaurantsReferred)
    const nextLevelTarget = getNextLevelThreshold(level)
    const progress =
      level === "Elite"
        ? 100
        : Math.min(100, Math.round((totalRestaurantsReferred / (nextLevelTarget - 1)) * 100))

    return {
      totalRestaurantsReferred,
      activeSubscriptions,
      totalEarnings,
      monthlyEarnings,
      conversionRate,
      avgRevenuePerRestaurant,
      level,
      progress,
      nextLevelTarget,
      referralCode: getPartnerSession()?.referralCode,
    }
  }
}
