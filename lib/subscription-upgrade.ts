type GenericObj = Record<string, any>

export type UpgradeRequestState = {
  hasPendingUpgrade: boolean
  currentStep: "idle" | "payment_in_progress" | "pending_verification" | "approved" | "rejected"
  finalResult: "approved" | "rejected" | "none"
  summaryLabel: string
}

function toLower(value: any): string {
  return String(value || "").trim().toLowerCase()
}

function valueAtPath(source: GenericObj | null | undefined, path: string): any {
  if (!source) return undefined
  return path.split(".").reduce<any>((acc, key) => {
    if (acc === null || acc === undefined) return undefined
    return acc[key]
  }, source)
}

function collectStatusEntries(subscription: GenericObj | null | undefined): Array<{ path: string; value: string }> {
  if (!subscription) return []

  const paths = [
    "status",
    "subscription_status",
    "payment_status",
    "verification_status",
    "upgrade_status",
    "request_status",
    "latest_payment_status",
    "latest_upgrade_status",
    "latest_request_status",
    "payment.status",
    "payment.payment_status",
    "verification.status",
    "latest_payment.status",
    "latest_payment.payment_status",
    "latest_upgrade_request.status",
    "latest_upgrade_request.payment_status",
    "pending_upgrade.status",
    "pending_upgrade.payment_status",
    "current_request.status",
    "current_request.payment_status",
  ]

  return paths
    .map((path) => ({ path, value: toLower(valueAtPath(subscription, path)) }))
    .filter((row) => row.value.length > 0)
}

function includesAny(value: string, needles: string[]): boolean {
  return needles.some((needle) => value.includes(needle))
}

export function getUpgradeRequestState(subscriptionPayload: any): UpgradeRequestState {
  const subscription = (subscriptionPayload?.subscription || subscriptionPayload) as GenericObj | null
  const statusEntries = collectStatusEntries(subscription)

  const pendingHints = ["pending", "verification", "processing", "review", "in_progress", "awaiting", "submitted", "incomplete"]
  const successHints = ["active", "approved", "completed", "paid", "succeeded", "success"]
  const rejectedHints = ["failed", "rejected", "declined", "canceled", "cancelled", "expired", "unpaid"]

  const hasBooleanPending =
    subscription?.has_pending_upgrade === true ||
    subscription?.has_pending_request === true ||
    subscription?.pending_upgrade === true ||
    subscription?.pending_request === true

  const hasPendingStatus = statusEntries.some((entry) => includesAny(entry.value, pendingHints))
  const hasSuccessStatus = statusEntries.some((entry) => includesAny(entry.value, successHints))
  const hasRejectedStatus = statusEntries.some((entry) => includesAny(entry.value, rejectedHints))

  const hasRequestContext =
    Boolean(subscription?.transaction_ref) ||
    Boolean(subscription?.payment_reference) ||
    Boolean(subscription?.latest_upgrade_request) ||
    Boolean(subscription?.pending_upgrade) ||
    Boolean(subscription?.pending_request) ||
    statusEntries.some(
      (entry) => includesAny(entry.path, ["payment", "verification", "request", "upgrade"]),
    )

  const hasPendingUpgrade = hasBooleanPending || hasPendingStatus

  if (hasPendingUpgrade) {
    const hasVerificationPending = statusEntries.some(
      (entry) => includesAny(entry.path, ["verification", "request", "upgrade", "payment"]) && includesAny(entry.value, pendingHints),
    )

    return {
      hasPendingUpgrade: true,
      currentStep: hasVerificationPending ? "pending_verification" : "payment_in_progress",
      finalResult: "none",
      summaryLabel: "Pending verification",
    }
  }

  if (hasRejectedStatus && hasRequestContext) {
    return {
      hasPendingUpgrade: false,
      currentStep: "rejected",
      finalResult: "rejected",
      summaryLabel: "Rejected",
    }
  }

  if (hasSuccessStatus && hasRequestContext) {
    return {
      hasPendingUpgrade: false,
      currentStep: "approved",
      finalResult: "approved",
      summaryLabel: "Approved",
    }
  }

  return {
    hasPendingUpgrade: false,
    currentStep: "idle",
    finalResult: "none",
    summaryLabel: "No request",
  }
}
