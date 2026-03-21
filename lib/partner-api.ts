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

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

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
}

export async function fetchPartnerProfile(partnerId: string): Promise<PartnerProfile> {
  await wait(250)
  return { ...MOCK_PARTNER_PROFILE, id: partnerId }
}

export async function fetchPartnerReferrals(_: string): Promise<PartnerReferral[]> {
  await wait(300)
  return MOCK_PARTNER_REFERRALS
}

export async function fetchPartnerCommissions(_: string): Promise<PartnerCommission[]> {
  await wait(350)
  return MOCK_PARTNER_COMMISSIONS
}

export async function fetchPartnerAnalytics(_: string): Promise<PartnerAnalyticsPoint[]> {
  await wait(320)
  return MOCK_PARTNER_ANALYTICS
}

export async function fetchPartnerNotifications(_: string): Promise<PartnerNotification[]> {
  await wait(220)
  return MOCK_PARTNER_NOTIFICATIONS
}

export async function fetchPartnerChecklist(_: string): Promise<PartnerChecklistItem[]> {
  await wait(200)
  return MOCK_PARTNER_CHECKLIST
}

export async function fetchPartnerToolkit(_: string): Promise<ToolkitAsset[]> {
  await wait(220)
  return MOCK_PARTNER_TOOLKIT
}

export async function fetchPartnerOverview(partnerId: string): Promise<PartnerOverview> {
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
  }
}
