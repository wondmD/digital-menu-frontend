"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { signOut, useSession } from "next-auth/react"
import { apiFetch } from "@/lib/api-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Shield,
  Activity,
  Building2,
  Users,
  Wallet,
  AlertTriangle,
  RefreshCw,
  Search,
  LineChart,
  Clock3,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Settings,
  Layers,
  Loader2,
  Handshake,
} from "lucide-react"

type AdminSnapshot = {
  stats: Record<string, any> | null
  logs: any[]
  restaurants: any[]
  users: any[]
  partners: any[]
  payments: any[]
  plans: any[]
  receivers: any[]
  verificationSettings: Record<string, any> | null
}

type ReferralStatus = "pending" | "active" | "churned"

type AdminReferralRow = {
  id: string
  partnerId: string
  partnerName: string
  restaurantName: string
  status: ReferralStatus
  joinedAt: string
  subscriptionStatus: string
}

function resolvePartnerId(value: any): string {
  return String(
    value?.id ||
      value?.partner_id ||
      value?.partnerId ||
      value?.user_id ||
      value?.userId ||
      ""
  ).trim()
}

function resolvePartnerName(value: any, fallback = ""): string {
  return String(
    value?.full_name ||
      value?.partner_full_name ||
      value?.name ||
      value?.partner_name ||
      fallback ||
      ""
  ).trim()
}

function resolvePartnerReferralCount(value: any): number {
  const direct = Number(
    value?.total_referrals ||
      value?.referrals_count ||
      value?.referral_count ||
      value?.totalReferred ||
      value?.total_referred ||
      value?.stats?.total_referrals ||
      value?.stats?.referrals_count ||
      0
  )

  if (Number.isFinite(direct) && direct > 0) return direct
  return 0
}

function normalizeSubscriptionStatusLabel(value: any): string {
  const raw = String(value || "").trim().toLowerCase()
  if (!raw) return "pending"
  if (["active", "paid", "succeeded", "completed"].includes(raw)) return "active"
  if (["trial", "pending", "incomplete"].includes(raw)) return "trial"
  if (["past_due", "overdue", "failed", "unpaid"].includes(raw)) return "past_due"
  if (["canceled", "cancelled", "churned", "expired"].includes(raw)) return "canceled"
  return raw
}

function normalizeReferralStatus(value: any): ReferralStatus {
  const normalized = String(value || "").trim().toLowerCase()
  if (["active", "converted", "approved", "completed", "paid", "success", "succeeded"].includes(normalized)) {
    return "active"
  }
  if (["churned", "cancelled", "canceled", "inactive", "rejected", "failed", "expired"].includes(normalized)) {
    return "churned"
  }
  return "pending"
}

function normalizeAdminReferralRow(row: any, partner: any, fallbackIndex: number): AdminReferralRow {
  const partnerId =
    resolvePartnerId(row) ||
    resolvePartnerId(partner) ||
    `partner_${fallbackIndex + 1}`
  const partnerName = resolvePartnerName(row, resolvePartnerName(partner, `Partner ${fallbackIndex + 1}`))

  const subscriptionRaw =
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

  return {
    id: String(row?.id || row?.owner_id || row?.user_id || `${partnerId}_ref_${fallbackIndex + 1}`),
    partnerId,
    partnerName,
    restaurantName:
      String(
        row?.restaurant_name ||
          row?.restaurant?.name ||
          row?.restaurant?.title ||
          row?.owner_name ||
          row?.business_name ||
          row?.name ||
          "-"
      ).trim() || "-",
    status: normalizeReferralStatus(row?.status || row?.referral_status),
    joinedAt: String(row?.joined_at || row?.created_at || row?.attributed_at || row?.updated_at || ""),
    subscriptionStatus: normalizeSubscriptionStatusLabel(subscriptionRaw),
  }
}

function resolvePartnerReferralCode(value: any): string {
  return String(
    value?.referral_code ||
      value?.marketer_referral_code ||
      value?.partner_referral_code ||
      ""
  )
    .trim()
    .toLowerCase()
}

function extractEmbeddedPartnerReferrals(payload: any): any[] {
  const source = payload?.data && typeof payload.data === "object" ? payload.data : payload
  if (!source || typeof source !== "object") return []

  const candidates = [
    source?.referrals,
    source?.referral_rows,
    source?.referred_restaurants,
    source?.referredRestaurants,
    source?.restaurants,
    source?.owners,
    source?.items,
    source?.results,
  ]

  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length) {
      return candidate
    }
  }

  return []
}

function dedupeAdminReferrals(rows: AdminReferralRow[]): AdminReferralRow[] {
  const seen = new Set<string>()
  const deduped: AdminReferralRow[] = []

  for (const row of rows) {
    const key = `${row.partnerId}::${row.id}::${row.restaurantName}`.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(row)
  }

  return deduped
}

function normalizeLooseString(value: any): string {
  return String(value || "")
    .trim()
    .toLowerCase()
}

function parseReferralCodeToken(value: any): string {
  const raw = String(value || "").trim()
  if (!raw) return ""

  const lowered = raw.toLowerCase()
  if (!lowered.includes("http://") && !lowered.includes("https://") && !lowered.includes("marketer_referral_code=")) {
    return normalizeLooseString(raw)
  }

  try {
    const url = lowered.startsWith("http://") || lowered.startsWith("https://") ? new URL(raw) : new URL(`https://dummy.local/?${raw}`)
    const qp =
      url.searchParams.get("marketer_referral_code") ||
      url.searchParams.get("referral_code") ||
      url.searchParams.get("ref") ||
      ""
    return normalizeLooseString(qp || raw)
  } catch {
    const maybe = raw.match(/(?:marketer_referral_code|referral_code|ref)=([^&\s]+)/i)?.[1]
    return normalizeLooseString(maybe || raw)
  }
}

function findFirstValueByKeyNames(payload: any, keyNames: string[]): any {
  const wanted = new Set(keyNames.map((key) => key.toLowerCase()))
  const nodes = collectObjectNodes(payload)

  for (const node of nodes) {
    for (const [key, value] of Object.entries(node || {})) {
      if (!wanted.has(String(key).toLowerCase())) continue
      if (value === undefined || value === null || value === "") continue
      return value
    }
  }

  return undefined
}

function resolvePartnerFromSignals(
  rawPartnerId: string,
  rawReferralCode: string,
  partnerById: Map<string, any>,
  partnerByCode: Map<string, any>,
  allPartnerCodes: string[]
): any {
  if (rawPartnerId && partnerById.has(rawPartnerId)) {
    return partnerById.get(rawPartnerId)
  }

  if (rawReferralCode && partnerByCode.has(rawReferralCode)) {
    return partnerByCode.get(rawReferralCode)
  }

  if (rawReferralCode) {
    const looseCode = allPartnerCodes.find((code) => rawReferralCode.includes(code))
    if (looseCode) {
      return partnerByCode.get(looseCode)
    }
  }

  return null
}

function deriveReferralsFromAdminData(partners: any[], users: any[], restaurants: any[]): AdminReferralRow[] {
  const partnerById = new Map<string, any>()
  const partnerByCode = new Map<string, any>()
  const allPartnerCodes: string[] = []

  partners.forEach((partner) => {
    const partnerId = resolvePartnerId(partner)
    if (partnerId) partnerById.set(partnerId, partner)

    const code = resolvePartnerReferralCode(partner)
    if (code) {
      partnerByCode.set(code, partner)
      allPartnerCodes.push(code)
    }
  })

  const candidateRows = [...restaurants, ...users]
  const out: AdminReferralRow[] = []

  candidateRows.forEach((row: any, index: number) => {
    const rawCode = parseReferralCodeToken(
      findFirstValueByKeyNames(row, [
        "marketer_referral_code",
        "referral_code",
        "referred_by_code",
        "partner_referral_code",
        "ref",
        "referral",
      ])
    )

    const rawPartnerId = normalizeLooseString(
      findFirstValueByKeyNames(row, [
        "partner_id",
        "referred_by_partner_id",
        "marketer_partner_id",
        "partnerId",
      ])
    )

    const partner = resolvePartnerFromSignals(rawPartnerId, rawCode, partnerById, partnerByCode, allPartnerCodes)
    if (!partner) return

    out.push(normalizeAdminReferralRow(row, partner, index))
  })

  return out
}

function collectObjectNodes(input: any, out: any[] = []): any[] {
  if (!input || typeof input !== "object") return out
  if (Array.isArray(input)) {
    input.forEach((item) => collectObjectNodes(item, out))
    return out
  }

  out.push(input)
  Object.values(input).forEach((value) => collectObjectNodes(value, out))
  return out
}

function deriveReferralsFromLogs(logs: any[], partners: any[]): AdminReferralRow[] {
  const partnerById = new Map<string, any>()
  const partnerByCode = new Map<string, any>()
  const allPartnerCodes: string[] = []

  partners.forEach((partner) => {
    const partnerId = resolvePartnerId(partner)
    if (partnerId) partnerById.set(partnerId, partner)

    const code = resolvePartnerReferralCode(partner)
    if (code) {
      partnerByCode.set(code, partner)
      allPartnerCodes.push(code)
    }
  })

  const rows: AdminReferralRow[] = []
  let index = 0

  logs.forEach((log) => {
    const nodes = collectObjectNodes(log)
    nodes.forEach((node: any) => {
      const rawPartnerId = normalizeLooseString(
        findFirstValueByKeyNames(node, ["partner_id", "marketer_partner_id", "referred_by_partner_id", "partnerId"])
      )
      const rawCode = parseReferralCodeToken(
        findFirstValueByKeyNames(node, ["marketer_referral_code", "referral_code", "referred_by_code", "ref", "referral"])
      )

      const partner = resolvePartnerFromSignals(rawPartnerId, rawCode, partnerById, partnerByCode, allPartnerCodes)
      if (!partner) return

      const eventType = String(node?.event_type || node?.type || node?.action || "").toLowerCase()
      const looksLikeReferral =
        Boolean(node?.restaurant_id || node?.restaurant_name || node?.owner_id || node?.owner_name) ||
        eventType.includes("referr") ||
        eventType.includes("signup")

      if (!looksLikeReferral) return

      const normalized = normalizeAdminReferralRow(
        {
          id: node?.id || node?.event_id || node?.owner_id || node?.restaurant_id || `log_ref_${index + 1}`,
          restaurant_name:
            node?.restaurant_name ||
            node?.restaurant?.name ||
            node?.owner_name ||
            node?.business_name ||
            node?.name ||
            node?.restaurant_id ||
            "-",
          status: node?.status || node?.referral_status || node?.event_status || "pending",
          joined_at: node?.joined_at || node?.attributed_at || node?.created_at || node?.timestamp || log?.created_at,
          subscription_status:
            node?.subscription_status ||
            node?.owner_subscription_status ||
            node?.payment_status ||
            node?.subscription?.status,
          partner_id: rawPartnerId || resolvePartnerId(partner),
          partner_name: resolvePartnerName(partner),
        },
        partner,
        index
      )

      rows.push(normalized)
      index += 1
    })
  })

  return rows
}

function deriveReferralsFromPartnerCounts(partners: any[]): AdminReferralRow[] {
  const rows: AdminReferralRow[] = []

  partners.forEach((partner: any, partnerIndex: number) => {
    const count = resolvePartnerReferralCount(partner)
    if (!count) return

    const partnerId = resolvePartnerId(partner) || `partner_${partnerIndex + 1}`
    const partnerName = resolvePartnerName(partner, `Partner ${partnerIndex + 1}`)

    for (let i = 0; i < count; i += 1) {
      rows.push({
        id: `${partnerId}_count_ref_${i + 1}`,
        partnerId,
        partnerName,
        restaurantName: `Referral ${i + 1}`,
        status: "pending",
        joinedAt: String(partner?.updated_at || partner?.created_at || ""),
        subscriptionStatus: "pending",
      })
    }
  })

  return rows
}

async function fetchAdminRestaurants(token: string, maxPages = 10, pageSize = 100): Promise<any[]> {
  const out: any[] = []
  for (let page = 1; page <= maxPages; page += 1) {
    const res = await apiFetch<any>(`/admin/restaurants?page=${page}&page_size=${pageSize}`, { token }).catch(() => null)
    const rows = extractList(res)
    if (!rows.length) break
    out.push(...rows)
    if (rows.length < pageSize) break
  }
  return out
}

async function fetchAdminUsers(token: string, maxPages = 10, limit = 100): Promise<any[]> {
  const out: any[] = []
  for (let page = 0; page < maxPages; page += 1) {
    const offset = page * limit
    const res = await apiFetch<any>(`/admin/users?limit=${limit}&offset=${offset}`, { token }).catch(() => null)
    const rows = extractList(res)
    if (!rows.length) break
    out.push(...rows)
    if (rows.length < limit) break
  }
  return out
}

function extractList(payload: any): any[] {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.data?.items)) return payload.data.items
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.results)) return payload.results
  return []
}

function extractObject(payload: any): Record<string, any> | null {
  if (!payload) return null
  if (payload?.data && typeof payload.data === "object" && !Array.isArray(payload.data)) return payload.data
  if (typeof payload === "object" && !Array.isArray(payload)) return payload
  return null
}

function formatDate(value: any): string {
  if (!value) return "-"
  try {
    return new Date(value).toLocaleString()
  } catch {
    return String(value)
  }
}

function metricValue(value: any): string {
  if (value === null || value === undefined || value === "") return "-"
  if (typeof value === "number") return value.toLocaleString()
  return String(value)
}

function normalizeRole(value: any): string {
  return String(value || "").toLowerCase()
}

function toJson(value: any): string {
  try {
    return JSON.stringify(value ?? {}, null, 2)
  } catch {
    return "{}"
  }
}

function parseJsonSafe(value: string): any {
  if (!value.trim()) return {}
  return JSON.parse(value)
}

function omitEmpty(obj: Record<string, any>): Record<string, any> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined && value !== null && value !== "")
  )
}

type CrudDialogState = {
  open: boolean
  title: string
  description: string
  endpoint: string
  method: "POST" | "PATCH" | "PUT"
  payload: Record<string, any>
}

type DetailDialogState = {
  open: boolean
  title: string
  data: any
}

const EMPTY_CRUD_DIALOG: CrudDialogState = {
  open: false,
  title: "",
  description: "",
  endpoint: "",
  method: "POST",
  payload: {},
}

type CrudFieldType = "text" | "number" | "boolean" | "multiline"

function inferCrudFieldType(value: any): CrudFieldType {
  if (typeof value === "boolean") return "boolean"
  if (typeof value === "number") return "number"
  if (typeof value === "string" && value.length > 80) return "multiline"
  return "text"
}

function formatFieldLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function isPrimitive(value: any): boolean {
  return value === null || ["string", "number", "boolean"].includes(typeof value)
}

function DetailValue({ value }: { value: any }) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground">-</span>
  }

  if (typeof value === "boolean") {
    return <Badge variant={value ? "secondary" : "outline"}>{value ? "Yes" : "No"}</Badge>
  }

  if (typeof value === "number") {
    return <span className="font-medium">{value.toLocaleString()}</span>
  }

  if (typeof value === "string") {
    return <span className="break-all font-medium">{value}</span>
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-muted-foreground">No items</span>
    }

    return (
      <div className="space-y-2">
        {value.map((item, index) => (
          <div key={index} className="rounded-md border border-border/50 bg-muted/20 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Item {index + 1}</p>
            <DetailObjectView data={item} />
          </div>
        ))}
      </div>
    )
  }

  return <DetailObjectView data={value} />
}

function DetailObjectView({ data }: { data: any }) {
  if (!data || typeof data !== "object") {
    return <DetailValue value={data} />
  }

  const entries = Object.entries(data)
  if (entries.length === 0) {
    return <span className="text-muted-foreground">No data</span>
  }

  return (
    <div className="space-y-2">
      {entries.map(([key, value]) => (
        <div key={key} className="rounded-md border border-border/50 bg-card p-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{formatFieldLabel(key)}</p>
          {isPrimitive(value) ? (
            <DetailValue value={value} />
          ) : (
            <div className="mt-2 rounded-md border border-border/40 bg-muted/20 p-2">
              <DetailValue value={value} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const token = (session?.user as any)?.accessToken as string | undefined
  const [resolvedRole, setResolvedRole] = useState<string>(normalizeRole((session?.user as any)?.role))
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [snapshotLoading, setSnapshotLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [verificationSettingsSaving, setVerificationSettingsSaving] = useState(false)
  const [activeOperations, setActiveOperations] = useState<string[]>([])
  const [lastCompletedAction, setLastCompletedAction] = useState<string>("No operation completed yet.")
  const [partnerApiAvailable, setPartnerApiAvailable] = useState<boolean>(true)
  const [savingDialog, setSavingDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [verifyingPaymentId, setVerifyingPaymentId] = useState<string | null>(null)
  const [verifyingAction, setVerifyingAction] = useState<"approve" | "reject" | null>(null)
  const [autoVerifyLoading, setAutoVerifyLoading] = useState(false)
  const [searchRestaurants, setSearchRestaurants] = useState("")
  const [searchUsers, setSearchUsers] = useState("")
  const [searchPartners, setSearchPartners] = useState("")
  const [searchReferrals, setSearchReferrals] = useState("")
  const [searchPlans, setSearchPlans] = useState("")
  const [searchReceivers, setSearchReceivers] = useState("")
  const [adminReferrals, setAdminReferrals] = useState<AdminReferralRow[]>([])
  const [referralsLoading, setReferralsLoading] = useState(false)
  const [updatingReferralId, setUpdatingReferralId] = useState<string | null>(null)
  const [verificationSettingsDraft, setVerificationSettingsDraft] = useState("{}")
  const [activeAdminTab, setActiveAdminTab] = useState("overview")
  const [crudDialog, setCrudDialog] = useState<CrudDialogState>(EMPTY_CRUD_DIALOG)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; endpoint: string; label: string }>({
    open: false,
    endpoint: "",
    label: "",
  })
  const [verificationDialog, setVerificationDialog] = useState<{
    open: boolean
    payment: any | null
    approve: boolean
    note: string
  }>({
    open: false,
    payment: null,
    approve: true,
    note: "",
  })
  const [detailDialog, setDetailDialog] = useState<DetailDialogState>({
    open: false,
    title: "",
    data: null,
  })
  const [snapshot, setSnapshot] = useState<AdminSnapshot>({
    stats: null,
    logs: [],
    restaurants: [],
    users: [],
    partners: [],
    payments: [],
    plans: [],
    receivers: [],
    verificationSettings: null,
  })

  const isAdmin = resolvedRole === "admin"

  const startOperation = (label: string) => {
    setActiveOperations((prev) => (prev.includes(label) ? prev : [...prev, label]))
  }

  const endOperation = (label: string, completedMessage?: string) => {
    setActiveOperations((prev) => prev.filter((item) => item !== label))
    if (completedMessage) {
      setLastCompletedAction(`${completedMessage} at ${new Date().toLocaleTimeString()}`)
    }
  }

  const loadAdminData = async (operationLabel = "Loading admin snapshot") => {
    if (!token) return

    let success = false
    try {
      startOperation(operationLabel)
      setSnapshotLoading(true)
      setError(null)
      const [statsRes, logsRes, restaurantsAll, usersAll, partnersRes, paymentsRes, plansRes, receiversRes, verificationSettingsRes] = await Promise.all([
        apiFetch<any>("/admin/stats", { token }).catch(() => null),
        apiFetch<any>("/admin/logs?limit=200", { token }).catch(() => null),
        fetchAdminRestaurants(token),
        fetchAdminUsers(token),
        apiFetch<any>("/admin/partners?page=1&page_size=50", { token }).catch((err) => ({ __error: err })),
        apiFetch<any>("/admin/payments?limit=20&offset=0", { token }).catch(() => null),
        apiFetch<any>("/admin/subscription/plans", { token }).catch(() => null),
        apiFetch<any>("/admin/payment-receivers", { token }).catch(() => null),
        apiFetch<any>("/admin/verification/settings", { token }).catch(() => null),
      ])

      const verificationSettings = extractObject(verificationSettingsRes)
      const partnersError = (partnersRes as any)?.__error
      const partnersErrorMessage = String(partnersError?.message || "").toLowerCase()
      const partnerModuleMissing =
        partnersErrorMessage.includes("404") ||
        partnersErrorMessage.includes("not found") ||
        partnersErrorMessage.includes("404 page not found")

      setPartnerApiAvailable(!partnerModuleMissing)
      const partners = partnerModuleMissing ? [] : extractList(partnersRes)
      const logs = extractList(logsRes)
      const users = Array.isArray(usersAll) ? usersAll : []
      const restaurants = Array.isArray(restaurantsAll) ? restaurantsAll : []

      setReferralsLoading(true)
      const embeddedFromPartnerList = partners.flatMap((partner: any, partnerIndex: number) =>
        extractEmbeddedPartnerReferrals(partner).map((row, rowIndex) =>
          normalizeAdminReferralRow(row, partner, partnerIndex * 1000 + rowIndex)
        )
      )

      let embeddedFromPartnerDetail: AdminReferralRow[] = []
      if (!embeddedFromPartnerList.length && partners.length > 0) {
        const detailReferralsByPartner = await Promise.all(
          partners.map(async (partner: any, partnerIndex: number) => {
            const partnerId = resolvePartnerId(partner)
            if (!partnerId) return [] as AdminReferralRow[]

            const detailRes = await apiFetch<any>(`/admin/partners/${partnerId}`, { token }).catch(() => null)
            const detail = extractObject(detailRes) || detailRes
            const rows = extractEmbeddedPartnerReferrals(detail)

            return rows.map((row, rowIndex) => normalizeAdminReferralRow(row, partner, partnerIndex * 1000 + rowIndex))
          })
        )
        embeddedFromPartnerDetail = detailReferralsByPartner.flat()
      }

      const derivedReferrals = deriveReferralsFromAdminData(partners, users, restaurants)
      const derivedReferralsFromLogs = deriveReferralsFromLogs(logs, partners)
      let mergedReferrals = dedupeAdminReferrals([
        ...embeddedFromPartnerList,
        ...embeddedFromPartnerDetail,
        ...derivedReferrals,
        ...derivedReferralsFromLogs,
      ])

      if (!mergedReferrals.length) {
        mergedReferrals = deriveReferralsFromPartnerCounts(partners)
      }

      setAdminReferrals(mergedReferrals)

      setSnapshot({
        stats: extractObject(statsRes),
        logs,
        restaurants,
        users,
        partners,
        payments: extractList(paymentsRes),
        plans: extractList(plansRes),
        receivers: extractList(receiversRes),
        verificationSettings,
      })

      setVerificationSettingsDraft(toJson(verificationSettings || {}))
      success = true
    } catch (err: any) {
      setError(err?.message || "Failed to load admin data")
    } finally {
      setSnapshotLoading(false)
      setReferralsLoading(false)
      endOperation(operationLabel, success ? "Admin snapshot updated" : undefined)
    }
  }

  const executeCrudAction = async () => {
    if (!token) return

    const operationLabel = "Saving resource changes"
    try {
      startOperation(operationLabel)
      setSavingDialog(true)
      const payload = crudDialog.payload || {}

      const tryEndpoint = async (endpoint: string) => {
        return apiFetch<any>(endpoint, {
          method: crudDialog.method,
          token,
          body: payload,
        })
      }

      const tryEndpointWithMethod = async (endpoint: string, method: "POST" | "PUT") => {
        return apiFetch<any>(endpoint, {
          method,
          token,
          body: payload,
        })
      }

      const isPartnerCreateAction =
        crudDialog.method === "POST" &&
        ["/admin/partners", "/admin/partners/", "/admin/partner", "/admin/partners/create"].includes(
          crudDialog.endpoint
        )

      if (isPartnerCreateAction) {
        if (!partnerApiAvailable) {
          throw new Error("Partner Program endpoints are not available on this backend deployment.")
        }

        const candidateAttempts: Array<{ endpoint: string; method: "POST" | "PUT" }> = [
          { endpoint: "/admin/partners", method: "POST" },
          { endpoint: "/admin/partners/", method: "POST" },
          { endpoint: "/admin/partner", method: "POST" },
          { endpoint: "/admin/partners/create", method: "POST" },
          { endpoint: "/admin/partner/create", method: "POST" },
          { endpoint: "/admin/partners/new", method: "POST" },
          { endpoint: "/admin/partners", method: "PUT" },
          { endpoint: "/admin/partners/", method: "PUT" },
        ]

        let created = false
        let lastError: any = null

        for (const attempt of candidateAttempts) {
          try {
            await tryEndpointWithMethod(attempt.endpoint, attempt.method)
            created = true
            break
          } catch (err) {
            lastError = err
          }
        }

        if (!created) {
          throw lastError || new Error("Partner create endpoint not available on this backend deployment.")
        }
      } else {
        await tryEndpoint(crudDialog.endpoint)
      }

      setCrudDialog(EMPTY_CRUD_DIALOG)
      toast({ title: "Success", description: "Operation completed successfully." })
      await loadAdminData("Refreshing snapshot after save")
    } catch (err: any) {
      toast({ title: "Operation failed", description: err?.message || "Request failed", variant: "destructive" })
    } finally {
      setSavingDialog(false)
      endOperation(operationLabel, "Save operation finished")
    }
  }

  const executeDeleteAction = async () => {
    if (!token || !deleteDialog.endpoint) return

    const operationLabel = "Deleting resource"
    try {
      startOperation(operationLabel)
      setDeleting(true)
      await apiFetch<any>(deleteDialog.endpoint, { method: "DELETE", token })
      setDeleteDialog({ open: false, endpoint: "", label: "" })
      toast({ title: "Deleted", description: "Resource deleted successfully." })
      await loadAdminData("Refreshing snapshot after delete")
    } catch (err: any) {
      toast({ title: "Delete failed", description: err?.message || "Request failed", variant: "destructive" })
    } finally {
      setDeleting(false)
      endOperation(operationLabel, "Delete operation finished")
    }
  }

  const openCrudDialog = (state: Partial<CrudDialogState>) => {
    const rawPayload = state.payload ?? {}
    const normalizedPayload =
      typeof rawPayload === "string"
        ? parseJsonSafe(rawPayload)
        : rawPayload && typeof rawPayload === "object"
        ? rawPayload
        : {}

    setCrudDialog({
      ...EMPTY_CRUD_DIALOG,
      ...state,
      open: true,
      payload: normalizedPayload,
      title: state.title ?? "Admin Operation",
      description: state.description ?? "Review payload before execution.",
      endpoint: state.endpoint ?? "",
      method: state.method ?? "POST",
    })
  }

  const openDetailDialog = (title: string, content: any) => {
    setDetailDialog({
      open: true,
      title,
      data: content,
    })
  }

  const loadAndShowDetail = async (title: string, endpoint: string) => {
    if (!token) return
    const operationLabel = "Loading detail payload"
    try {
      startOperation(operationLabel)
      setDetailLoading(true)
      const res = await apiFetch<any>(endpoint, { token })
      openDetailDialog(title, res?.data || res)
    } catch (err: any) {
      toast({ title: "Failed to load detail", description: err?.message || "Request failed", variant: "destructive" })
    } finally {
      setDetailLoading(false)
      endOperation(operationLabel, "Detail payload loaded")
    }
  }

  const loadAndShowPartnerDetail = async (partner: any) => {
    if (!token) return
    const partnerId = resolvePartnerId(partner)
    if (!partnerId) return

    const operationLabel = "Loading partner detail payload"
    try {
      startOperation(operationLabel)
      setDetailLoading(true)

      const [detailRes, referralsRes, restaurantsRes, ledgerRes] = await Promise.all([
        apiFetch<any>(`/admin/partners/${partnerId}`, { token }).catch(() => null),
        Promise.resolve(null),
        apiFetch<any>(`/admin/partners/${partnerId}/restaurants?page=1&page_size=100`, { token }).catch(() => null),
        apiFetch<any>(`/admin/partners/${partnerId}/ledger?page=1&page_size=100`, { token }).catch(() => null),
      ])

      const detail = extractObject(detailRes) || detailRes || partner
      const referralsFromDetail = extractEmbeddedPartnerReferrals(detail)
      const referralsFromState = adminReferrals
        .filter((row) => row.partnerId === partnerId)
        .map((row) => ({
          id: row.id,
          restaurant_name: row.restaurantName,
          status: row.status,
          subscription_status: row.subscriptionStatus,
          joined_at: row.joinedAt,
          partner_id: row.partnerId,
          partner_name: row.partnerName,
        }))
      const referrals = referralsFromDetail.length ? referralsFromDetail : referralsFromState
      const referredRestaurants = extractList(restaurantsRes)
      const ledger = extractList(ledgerRes)

      openDetailDialog(`Partner Detail: ${partner?.full_name || partner?.name || partnerId}`, {
        ...detail,
        referrals,
        referred_restaurants: referredRestaurants,
        commission_ledger: ledger,
      })
    } catch (err: any) {
      toast({ title: "Failed to load partner detail", description: err?.message || "Request failed", variant: "destructive" })
    } finally {
      setDetailLoading(false)
      endOperation(operationLabel, "Partner detail loaded")
    }
  }

  const verifyPayment = async (payment: any, approve: boolean, adminNote?: string) => {
    if (!token) return
    const paymentId = String(payment?.id || "")
    if (!paymentId) return

    const sourceReceiver = payment?.verification?.receiver_account || payment?.receiver_account || payment?.receiver_profile || {}
    const receiverAccount = omitEmpty({
      account_name: sourceReceiver?.account_name || sourceReceiver?.receiver_name || payment?.receiver_name,
      account_number: sourceReceiver?.account_number || sourceReceiver?.receiver_account || payment?.receiver_account,
      bank_name: sourceReceiver?.bank_name,
      phone: sourceReceiver?.phone,
      wallet_id: sourceReceiver?.wallet_id,
      note: sourceReceiver?.note || "Owner submitted transfer recipient details",
    })

    const payload: any = {
      override_success: approve,
      admin_note:
        (adminNote || "").trim() ||
        (approve
          ? "Receipt amount mismatch resolved after manual review."
          : "Payment rejected after manual review."),
      verification: {
        extra: {
          reviewed_by: "admin",
          proof_checked: approve,
        },
      },
    }

    if (Object.keys(receiverAccount).length > 0) {
      payload.verification.receiver_account = receiverAccount
    }

    const operationLabel = approve ? "Approving payment" : "Rejecting payment"
    try {
      startOperation(operationLabel)
      setVerifyingPaymentId(paymentId)
      setVerifyingAction(approve ? "approve" : "reject")
      await apiFetch<any>(`/admin/payments/${paymentId}/verify`, {
        method: "POST",
        token,
        body: payload,
      })
      toast({ title: "Payment updated", description: approve ? "Payment approved." : "Payment rejected." })
      setVerificationDialog({ open: false, payment: null, approve: true, note: "" })
      await loadAdminData()
    } catch (err: any) {
      toast({ title: "Verification failed", description: err?.message || "Request failed", variant: "destructive" })
    } finally {
      setVerifyingPaymentId(null)
      setVerifyingAction(null)
      endOperation(operationLabel, approve ? "Payment approved" : "Payment rejected")
    }
  }

  useEffect(() => {
    const run = async () => {
      if (status === "loading") return
      if (!token) {
        setLoading(false)
        return
      }

      const sessionRole = normalizeRole((session?.user as any)?.role)
      if (sessionRole) {
        setResolvedRole(sessionRole)
      } else {
        try {
          const profileRes = await apiFetch<any>("/profile", { token })
          const profile = profileRes?.data || profileRes
          setResolvedRole(normalizeRole(profile?.role))
        } catch {
          setResolvedRole("")
        }
      }

      setLoading(true)
      await loadAdminData("Initializing admin snapshot")
      setLoading(false)
    }
    run()
  }, [token, status, session])

  const derived = useMemo(() => {
    const stats = snapshot.stats || {}

    const activeRestaurants = snapshot.restaurants.filter((r) => r?.is_published === true).length
    const pendingPayments = snapshot.payments.filter((p) => String(p?.status || p?.payment_status || "").toLowerCase() === "pending").length
    const failedPayments = snapshot.payments.filter((p) => String(p?.status || p?.payment_status || "").toLowerCase() === "failed").length

    return {
      totalUsers: Number(stats.total_users || snapshot.users.length || 0),
      totalRestaurants: Number(stats.total_restaurants || snapshot.restaurants.length || 0),
      activeRestaurants,
      pendingPayments,
      failedPayments,
      suspiciousSignals: failedPayments + Math.max(0, pendingPayments - 5),
    }
  }, [snapshot])

  const filteredRestaurants = useMemo(() => {
    const q = searchRestaurants.trim().toLowerCase()
    if (!q) return snapshot.restaurants
    return snapshot.restaurants.filter((row) => {
      const hay = `${row?.name || ""} ${row?.slug || ""} ${row?.city || ""} ${row?.country || ""}`.toLowerCase()
      return hay.includes(q)
    })
  }, [snapshot.restaurants, searchRestaurants])

  const filteredUsers = useMemo(() => {
    const q = searchUsers.trim().toLowerCase()
    if (!q) return snapshot.users
    return snapshot.users.filter((row) => {
      const hay = `${row?.full_name || row?.name || ""} ${row?.email || ""} ${row?.role || ""}`.toLowerCase()
      return hay.includes(q)
    })
  }, [snapshot.users, searchUsers])

  const filteredPartners = useMemo(() => {
    const q = searchPartners.trim().toLowerCase()
    if (!q) return snapshot.partners
    return snapshot.partners.filter((row) => {
      const hay = `${resolvePartnerId(row)} ${row?.email || ""} ${resolvePartnerName(row)} ${row?.referral_code || row?.marketer_referral_code || ""} ${row?.level || ""} ${row?.status || row?.owner_status || (row?.is_active ? "active" : "inactive") || ""}`.toLowerCase()
      return hay.includes(q)
    })
  }, [snapshot.partners, searchPartners])

  const filteredReferrals = useMemo(() => {
    const q = searchReferrals.trim().toLowerCase()
    if (!q) return adminReferrals
    return adminReferrals.filter((row) => {
      const hay = `${row.partnerId} ${row.partnerName} ${row.restaurantName} ${row.status} ${row.subscriptionStatus}`.toLowerCase()
      return hay.includes(q)
    })
  }, [adminReferrals, searchReferrals])

  const referralSummary = useMemo(() => {
    const total = adminReferrals.length
    const active = adminReferrals.filter((row) => row.status === "active").length
    const pending = adminReferrals.filter((row) => row.status === "pending").length
    const churned = adminReferrals.filter((row) => row.status === "churned").length
    const conversionRate = total ? Number(((active / total) * 100).toFixed(1)) : 0
    return { total, active, pending, churned, conversionRate }
  }, [adminReferrals])

  const setReferralStatus = async (row: AdminReferralRow, status: ReferralStatus) => {
    if (!token) return

    const operationLabel = `Updating referral status (${row.id})`
    const encodedPartnerId = encodeURIComponent(row.partnerId)
    const encodedReferralId = encodeURIComponent(row.id)
    const attempts: Array<{ method: "PATCH" | "POST"; endpoint: string }> = [
      { method: "PATCH", endpoint: `/admin/partners/${encodedPartnerId}/referrals/${encodedReferralId}/status` },
      { method: "PATCH", endpoint: `/admin/partners/${encodedPartnerId}/referrals/${encodedReferralId}` },
      { method: "POST", endpoint: `/admin/partners/${encodedPartnerId}/referrals/${encodedReferralId}/status` },
    ]

    try {
      startOperation(operationLabel)
      setUpdatingReferralId(row.id)

      let updated = false
      let lastError: any = null

      for (const attempt of attempts) {
        try {
          await apiFetch<any>(attempt.endpoint, {
            method: attempt.method,
            token,
            body: { status },
          })
          updated = true
          break
        } catch (err) {
          lastError = err
        }
      }

      if (!updated) {
        throw lastError || new Error("Referral status endpoint is not available on backend.")
      }

      setAdminReferrals((prev) => prev.map((item) => (item.id === row.id ? { ...item, status } : item)))
      toast({ title: "Referral updated", description: `Referral status changed to ${status}.` })
    } catch (err: any) {
      toast({
        title: "Referral update failed",
        description: err?.message || "Could not update referral status on backend.",
        variant: "destructive",
      })
    } finally {
      setUpdatingReferralId(null)
      endOperation(operationLabel, "Referral status sync finished")
    }
  }

  const filteredPlans = useMemo(() => {
    const q = searchPlans.trim().toLowerCase()
    if (!q) return snapshot.plans
    return snapshot.plans.filter((plan) => {
      const hay = `${plan?.name || ""} ${plan?.slug || ""} ${plan?.billing_cycle || ""}`.toLowerCase()
      return hay.includes(q)
    })
  }, [snapshot.plans, searchPlans])

  const filteredReceivers = useMemo(() => {
    const q = searchReceivers.trim().toLowerCase()
    if (!q) return snapshot.receivers
    return snapshot.receivers.filter((receiver) => {
      const hay = `${receiver?.provider || ""} ${receiver?.receiver_name || ""} ${receiver?.receiver_account || ""}`.toLowerCase()
      return hay.includes(q)
    })
  }, [snapshot.receivers, searchReceivers])

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background p-6 md:p-10">
        <div className="mx-auto max-w-7xl">
          <Card className="border-border/60 bg-card/60">
            <CardContent className="flex items-center gap-3 p-8">
              <RefreshCw className="h-5 w-5 animate-spin text-primary" />
              <p className="text-sm font-medium">Loading superadmin control plane...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-background p-6 md:p-10">
        <div className="mx-auto max-w-3xl">
          <Card className="border-destructive/30 bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" /> Authentication Required
              </CardTitle>
              <CardDescription>You need to sign in to access /admin.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/login">Go to Login</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background p-6 md:p-10">
        <div className="mx-auto max-w-3xl">
          <Dialog open>
            <DialogContent showCloseButton={false} className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                  <Shield className="h-5 w-5" /> Admin Login Required
                </DialogTitle>
                <DialogDescription>
                  This session is not recognized as admin. Please login again with an admin account to continue.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => signOut({ callbackUrl: "/login?next=/admin" })}
                >
                  Login Again as Admin
                </Button>
                <Button asChild>
                  <Link href="/dashboard">Back to Dashboard</Link>
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <Card className="border-border/60 bg-card/60">
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Shield className="h-6 w-6 text-primary" /> Superadmin Control Plane
                </CardTitle>
                <CardDescription>
                  Deep operational visibility and administration for users, restaurants, subscriptions, payments, and system activity.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={async () => {
                    setRefreshing(true)
                    await loadAdminData("Refreshing admin snapshot")
                    setRefreshing(false)
                  }}
                  disabled={refreshing}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                  Refresh Snapshot
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                >
                  Logout
                </Button>
              </div>
            </div>
            {error ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            ) : null}
            <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-xs">
              <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                <span className="font-medium">Operation Status:</span>
                {activeOperations.length === 0 ? (
                  <Badge variant="outline">Idle</Badge>
                ) : (
                  activeOperations.map((op) => (
                    <Badge key={op} variant="secondary" className="flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" /> {op}
                    </Badge>
                  ))
                )}
              </div>
              <p className="mt-1 text-muted-foreground">Last completed: {lastCompletedAction}</p>
            </div>
          </CardHeader>
        </Card>

        <Tabs value={activeAdminTab} onValueChange={setActiveAdminTab} className="grid gap-6 lg:grid-cols-[250px_1fr]">
          <Card className="h-fit border-border/60 bg-card/50 lg:sticky lg:top-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Admin Navigation</CardTitle>
              <CardDescription>System management sections</CardDescription>
            </CardHeader>
            <CardContent>
              <TabsList className="grid h-auto w-full grid-cols-1 gap-2 bg-transparent p-0">
                <TabsTrigger value="overview" className="justify-start">Overview</TabsTrigger>
                <TabsTrigger value="operations" className="justify-start">Operations</TabsTrigger>
                <TabsTrigger value="partners" className="justify-start">Partners</TabsTrigger>
                <TabsTrigger value="payments" className="justify-start">Payments</TabsTrigger>
                <TabsTrigger value="configuration" className="justify-start">Configuration</TabsTrigger>
              </TabsList>
            </CardContent>
          </Card>

          <div className="space-y-6">

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <Card className="xl:col-span-1 border-border/60 bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Users</p>
                <Users className="h-4 w-4 text-primary" />
              </div>
              <p className="mt-2 text-2xl font-bold">{metricValue(derived.totalUsers)}</p>
            </CardContent>
          </Card>
          <Card className="xl:col-span-1 border-border/60 bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Restaurants</p>
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <p className="mt-2 text-2xl font-bold">{metricValue(derived.totalRestaurants)}</p>
            </CardContent>
          </Card>
          <Card className="xl:col-span-1 border-border/60 bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Published</p>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              <p className="mt-2 text-2xl font-bold">{metricValue(derived.activeRestaurants)}</p>
            </CardContent>
          </Card>
          <Card className="xl:col-span-1 border-border/60 bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Payments Pending</p>
                <Wallet className="h-4 w-4 text-amber-600" />
              </div>
              <p className="mt-2 text-2xl font-bold">{metricValue(derived.pendingPayments)}</p>
            </CardContent>
          </Card>
          <Card className="xl:col-span-1 border-border/60 bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Payments Failed</p>
                <XCircle className="h-4 w-4 text-destructive" />
              </div>
              <p className="mt-2 text-2xl font-bold">{metricValue(derived.failedPayments)}</p>
            </CardContent>
          </Card>
          <Card className="xl:col-span-1 border-border/60 bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Risk Signals</p>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              <p className="mt-2 text-2xl font-bold">{metricValue(derived.suspiciousSignals)}</p>
            </CardContent>
          </Card>
        </div>

            <div className="grid gap-6 xl:grid-cols-2">
          <Card className="border-border/60 bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <LineChart className="h-5 w-5 text-primary" /> System Analysis
              </CardTitle>
              <CardDescription>Computed insights from live admin data snapshot.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-md border border-border/60 p-3">
                <span>User to Restaurant Ratio</span>
                <Badge variant="secondary">
                  {derived.totalRestaurants > 0
                    ? (derived.totalUsers / Math.max(derived.totalRestaurants, 1)).toFixed(2)
                    : "-"}
                </Badge>
              </div>
              <div className="flex items-center justify-between rounded-md border border-border/60 p-3">
                <span>Operational Pressure</span>
                <Badge variant={derived.suspiciousSignals > 5 ? "destructive" : "secondary"}>
                  {derived.suspiciousSignals > 5 ? "High" : "Normal"}
                </Badge>
              </div>
              <div className="flex items-center justify-between rounded-md border border-border/60 p-3">
                <span>Publish Coverage</span>
                <Badge variant="secondary">
                  {derived.totalRestaurants > 0
                    ? `${Math.round((derived.activeRestaurants / derived.totalRestaurants) * 100)}%`
                    : "0%"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5 text-primary" /> Recent System Logs
              </CardTitle>
              <CardDescription>Latest platform activity for audits and troubleshooting.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-72 space-y-2 overflow-auto">
                {snapshot.logs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No logs returned from admin endpoint.</p>
                ) : (
                  snapshot.logs.slice(0, 10).map((log: any, index) => (
                    <div key={log.id || index} className="rounded-md border border-border/60 p-3 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold">{String(log.action || log.event || "activity")}</span>
                        <span className="text-muted-foreground">{formatDate(log.created_at || log.timestamp)}</span>
                      </div>
                      <p className="mt-1 text-muted-foreground">
                        {String(log.message || log.description || log.details || "No details")}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
          </TabsContent>

          <TabsContent value="operations" className="space-y-6">
            <Card className="border-border/60 bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-primary" /> Restaurant Administration
            </CardTitle>
            <CardDescription>Search and inspect restaurants at platform level.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchRestaurants}
                onChange={(e) => setSearchRestaurants(e.target.value)}
                placeholder="Search restaurants..."
                className="pl-9"
              />
            </div>
            <div className="overflow-auto rounded-md border border-border/60">
              <table className="w-full min-w-190 text-sm">
                <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="p-3">Name</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">Published</th>
                    <th className="p-3">Updated</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRestaurants.slice(0, 15).map((row: any, index: number) => (
                    <tr key={row.id || index} className="border-t border-border/40">
                      <td className="p-3 font-medium">{row.name || "-"}</td>
                      <td className="p-3 text-muted-foreground">{[row.city, row.country].filter(Boolean).join(", ") || "-"}</td>
                      <td className="p-3">
                        <Badge variant={row.is_published ? "secondary" : "outline"}>
                          {row.is_published ? "Published" : "Draft"}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">{formatDate(row.updated_at)}</td>
                      <td className="p-3">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/${row.slug || ""}`} target="_blank">
                            Public <ExternalLink className="ml-1 h-3 w-3" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

            <Card className="border-border/60 bg-card/50">
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Layers className="h-5 w-5 text-primary" /> Subscription Plans (CRUD)
                </CardTitle>
                <CardDescription>Create, update, change status, and delete plans.</CardDescription>
              </div>
              <Button
                onClick={() =>
                  openCrudDialog({
                    title: "Create Plan",
                    description: "Create a new subscription plan.",
                    endpoint: "/admin/subscription/plans",
                    method: "POST",
                    payload: {
                      name: "Platinum",
                      slug: "platinum",
                      billing_cycle: "monthly",
                      price: 0,
                      is_active: true,
                    },
                  })
                }
              >
                <Plus className="mr-2 h-4 w-4" /> New Plan
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={searchPlans} onChange={(e) => setSearchPlans(e.target.value)} placeholder="Search plans..." className="pl-9" />
            </div>
            <div className="overflow-auto rounded-md border border-border/60">
              <table className="w-full min-w-205 text-sm">
                <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="p-3">Plan</th>
                    <th className="p-3">Slug</th>
                    <th className="p-3">Price</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlans.slice(0, 30).map((plan: any, index: number) => (
                    <tr key={plan.id || index} className="border-t border-border/40">
                      <td className="p-3 font-medium">{plan.name || "-"}</td>
                      <td className="p-3 text-muted-foreground">{plan.slug || "-"}</td>
                      <td className="p-3">{metricValue(plan.price)}</td>
                      <td className="p-3">
                        <Badge variant={plan.is_active ? "secondary" : "outline"}>{plan.is_active ? "Active" : "Inactive"}</Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => openDetailDialog(`Plan Detail: ${plan.name || plan.id}`, plan)}>
                            <Eye className="mr-1 h-3 w-3" /> View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              openCrudDialog({
                                title: `Update Plan: ${plan.name || plan.id}`,
                                description: "Edit plan payload and save.",
                                endpoint: `/admin/subscription/plans/${plan.id}`,
                                method: "PATCH",
                                payload: plan,
                              })
                            }
                          >
                            <Pencil className="mr-1 h-3 w-3" /> Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              openCrudDialog({
                                title: `Update Plan Status: ${plan.name || plan.id}`,
                                description: "Set plan activation status.",
                                endpoint: `/admin/subscription/plans/${plan.id}/status`,
                                method: "PATCH",
                                payload: { is_active: !Boolean(plan.is_active) },
                              })
                            }
                          >
                            <Settings className="mr-1 h-3 w-3" /> Status
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeleteDialog({ open: true, endpoint: `/admin/subscription/plans/${plan.id}`, label: plan.name || plan.id || "plan" })}
                          >
                            <Trash2 className="mr-1 h-3 w-3" /> Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

          <Card className="border-border/60 bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-primary" /> User Administration
              </CardTitle>
              <CardDescription>Role-aware user listing from admin scope.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchUsers}
                  onChange={(e) => setSearchUsers(e.target.value)}
                  placeholder="Search users..."
                  className="pl-9"
                />
              </div>
              <div className="max-h-80 space-y-2 overflow-auto">
                {filteredUsers.slice(0, 12).map((row: any, index: number) => (
                  <div key={row.id || index} className="rounded-md border border-border/60 p-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div>
                        <p className="text-sm font-semibold">{row.full_name || row.name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{row.email || "-"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{String(row.role || "user")}</Badge>
                        <Button size="sm" variant="outline" onClick={() => loadAndShowDetail(`User Detail: ${row.id}`, `/admin/users/${row.id}`)}>
                          <Eye className="mr-1 h-3 w-3" /> View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            openCrudDialog({
                              title: `Update User: ${row.id}`,
                              description: "Patch user fields (e.g., role, is_active).",
                              endpoint: `/admin/users/${row.id}`,
                              method: "PATCH",
                              payload: { role: row.role, is_active: row.is_active },
                            })
                          }
                        >
                          <Pencil className="mr-1 h-3 w-3" /> Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteDialog({ open: true, endpoint: `/admin/users/${row.id}`, label: row.email || row.id || "user" })}
                        >
                          <Trash2 className="mr-1 h-3 w-3" /> Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredUsers.length === 0 ? <p className="text-sm text-muted-foreground">No users found.</p> : null}
              </div>
            </CardContent>
          </Card>
          </TabsContent>

          <TabsContent value="partners" className="space-y-6">
            <Card className="border-border/60 bg-card/50">
              <CardHeader>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Handshake className="h-5 w-5 text-primary" /> Partner Management (Admin-only)
                    </CardTitle>
                    <CardDescription>Create and manage partner accounts. Self-registration is disabled.</CardDescription>
                  </div>
                  <Button
                    disabled={!partnerApiAvailable}
                    onClick={() =>
                      openCrudDialog({
                        title: "Create Partner",
                        description: "Create partner user/profile from admin side.",
                        endpoint: "/admin/partners",
                        method: "POST",
                        payload: {
                          email: "partner@company.com",
                          password: "PartnerPass123",
                          full_name: "Marketer Partner",
                          phone: "+251900009999",
                          referral_code: "PARTNER-CODE-001",
                          level: "starter",
                          payout_account: "CBE-1234567890",
                        },
                      })
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" /> New Partner
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {!partnerApiAvailable ? (
                  <div className="rounded-md border border-amber-400/40 bg-amber-500/10 p-3 text-sm text-amber-700">
                    Partner Program API is not available on the connected backend. The documented endpoint is POST /admin/partners,
                    but this deployment returns 404 for partner routes.
                  </div>
                ) : null}
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchPartners}
                    onChange={(e) => setSearchPartners(e.target.value)}
                    placeholder="Search partners..."
                    className="pl-9"
                  />
                </div>

                <div className="overflow-auto rounded-md border border-border/60">
                  <table className="w-full min-w-220 text-sm">
                    <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="p-3">Partner</th>
                        <th className="p-3">Referral Code</th>
                        <th className="p-3">Level</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Payout</th>
                        <th className="p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPartners.slice(0, 50).map((partner: any, index: number) => {
                        const partnerId = resolvePartnerId(partner)
                        const partnerName = resolvePartnerName(partner, "-")
                        const partnerReferral = partner.referral_code || partner.marketer_referral_code || "-"
                        const partnerStatus = String(partner.status || partner.owner_status || (partner.is_active ? "active" : "inactive") || "unknown")

                        return (
                        <tr key={partnerId || index} className="border-t border-border/40">
                          <td className="p-3">
                            <p className="font-medium">{partnerName}</p>
                            <p className="text-xs text-muted-foreground">{partner.email || partnerId || "-"}</p>
                          </td>
                          <td className="p-3">{partnerReferral}</td>
                          <td className="p-3">{partner.level || "-"}</td>
                          <td className="p-3">
                            <Badge variant={partnerStatus.toLowerCase() === "active" ? "secondary" : "outline"}>
                              {partnerStatus}
                            </Badge>
                          </td>
                          <td className="p-3 text-muted-foreground">{partner.payout_account || "-"}</td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-2">
                              <Button size="sm" variant="outline" disabled={detailLoading} onClick={() => loadAndShowPartnerDetail(partner)}>
                                <Eye className="mr-1 h-3 w-3" /> View
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  openCrudDialog({
                                    title: `Update Partner: ${partnerName || partnerId}`,
                                    description: "Edit partner profile fields.",
                                    endpoint: `/admin/partners/${partnerId}`,
                                    method: "PATCH",
                                    payload: {
                                      full_name: partnerName,
                                      phone: partner.phone,
                                      referral_code: partnerReferral === "-" ? "" : partnerReferral,
                                      level: partner.level,
                                      payout_account: partner.payout_account,
                                      status: partnerStatus,
                                    },
                                  })
                                }
                              >
                                <Pencil className="mr-1 h-3 w-3" /> Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  openCrudDialog({
                                    title: `Update Partner Status: ${partnerName || partnerId}`,
                                    description: "Set partner status.",
                                    endpoint: `/admin/partners/${partnerId}/status`,
                                    method: "PATCH",
                                    payload: { status: partnerStatus.toLowerCase() === "active" ? "inactive" : "active" },
                                  })
                                }
                              >
                                <Settings className="mr-1 h-3 w-3" /> Status
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  setDeleteDialog({
                                    open: true,
                                    endpoint: `/admin/partners/${partnerId}`,
                                    label: partnerName || partner.email || partnerId || "partner",
                                  })
                                }
                              >
                                <Trash2 className="mr-1 h-3 w-3" /> Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
                </div>

                {filteredPartners.length === 0 ? <p className="text-sm text-muted-foreground">No partners found.</p> : null}
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <Card className="border-border/60 bg-card/50">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Total Referrals</p>
                  <p className="mt-2 text-2xl font-bold">{referralSummary.total}</p>
                </CardContent>
              </Card>
              <Card className="border-border/60 bg-card/50">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Active</p>
                  <p className="mt-2 text-2xl font-bold">{referralSummary.active}</p>
                </CardContent>
              </Card>
              <Card className="border-border/60 bg-card/50">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className="mt-2 text-2xl font-bold">{referralSummary.pending}</p>
                </CardContent>
              </Card>
              <Card className="border-border/60 bg-card/50">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Churned</p>
                  <p className="mt-2 text-2xl font-bold">{referralSummary.churned}</p>
                </CardContent>
              </Card>
              <Card className="border-border/60 bg-card/50">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Conversion Rate</p>
                  <p className="mt-2 text-2xl font-bold">{referralSummary.conversionRate}%</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/60 bg-card/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Handshake className="h-5 w-5 text-primary" /> Partner Referrals
                </CardTitle>
                <CardDescription>Manage restaurant referrals within the same partner workspace.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchReferrals}
                    onChange={(e) => setSearchReferrals(e.target.value)}
                    placeholder="Search referrals..."
                    className="pl-9"
                  />
                </div>

                <div className="overflow-auto rounded-md border border-border/60">
                  <table className="w-full min-w-205 text-sm">
                    <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="p-3">Partner</th>
                        <th className="p-3">Restaurant</th>
                        <th className="p-3">Joined</th>
                        <th className="p-3">Subscription</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Manage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReferrals.map((row) => (
                        <tr key={row.id} className="border-t border-border/40">
                          <td className="p-3">
                            <p className="font-medium">{row.partnerName}</p>
                            <p className="text-xs text-muted-foreground">{row.partnerId}</p>
                          </td>
                          <td className="p-3 font-medium">{row.restaurantName}</td>
                          <td className="p-3 text-muted-foreground">{formatDate(row.joinedAt)}</td>
                          <td className="p-3">{row.subscriptionStatus}</td>
                          <td className="p-3">
                            <Badge
                              variant={
                                row.status === "active"
                                  ? "secondary"
                                  : row.status === "pending"
                                  ? "outline"
                                  : "destructive"
                              }
                            >
                              {row.status}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={updatingReferralId === row.id}
                                onClick={() => setReferralStatus(row, "pending")}
                              >
                                Pending
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={updatingReferralId === row.id}
                                onClick={() => setReferralStatus(row, "active")}
                              >
                                Active
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={updatingReferralId === row.id}
                                onClick={() => setReferralStatus(row, "churned")}
                              >
                                Churned
                              </Button>
                            </div>
                            {updatingReferralId === row.id ? (
                              <p className="mt-2 text-[11px] text-muted-foreground">Syncing status with backend...</p>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              {referralsLoading ? <p className="text-sm text-muted-foreground">Loading referrals from backend...</p> : null}
              {!referralsLoading && filteredReferrals.length === 0 ? <p className="text-sm text-muted-foreground">No referrals found from backend.</p> : null}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <Card className="border-border/60 bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Wallet className="h-5 w-5 text-primary" /> Payments & Verifications
              </CardTitle>
              <CardDescription>Monitor and control verification workflow (manual/auto).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={autoVerifyLoading}
                  onClick={async () => {
                    if (!token) return
                    const operationLabel = "Running auto verification"
                    try {
                      startOperation(operationLabel)
                      setAutoVerifyLoading(true)
                      await apiFetch<any>("/admin/payments/verify-auto", { method: "POST", token, body: {} })
                      toast({ title: "Auto-verify triggered", description: "Batch verification executed." })
                      await loadAdminData("Refreshing payments after auto verify")
                    } catch (err: any) {
                      toast({ title: "Auto-verify failed", description: err?.message || "Request failed", variant: "destructive" })
                    } finally {
                      setAutoVerifyLoading(false)
                      endOperation(operationLabel, "Auto verification completed")
                    }
                  }}
                >
                  <Activity className={`mr-2 h-4 w-4 ${autoVerifyLoading ? "animate-spin" : ""}`} />
                  {autoVerifyLoading ? "Running..." : "Run Auto Verify"}
                </Button>
              </div>
              <div className="max-h-80 space-y-2 overflow-auto">
                {snapshot.payments.slice(0, 12).map((payment: any, index: number) => {
                  const statusValue = String(payment.status || payment.payment_status || "unknown").toLowerCase()
                  const paymentId = String(payment.id || "")
                  const canVerify = !["succeeded", "completed", "failed", "refunded", "rejected", "approved"].includes(statusValue)
                  const isCurrentPaymentLoading = verifyingPaymentId !== null && paymentId === verifyingPaymentId
                  const isApproveLoading = isCurrentPaymentLoading && verifyingAction === "approve"
                  const isRejectLoading = isCurrentPaymentLoading && verifyingAction === "reject"
                  const statusVariant =
                    statusValue === "succeeded" || statusValue === "completed"
                      ? "secondary"
                      : statusValue === "pending"
                      ? "outline"
                      : "destructive"

                  return (
                    <div key={payment.id || index} className="rounded-md border border-border/60 p-3 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold">{payment.transaction_ref || payment.tref || "No Ref"}</span>
                        <Badge variant={statusVariant as any}>{statusValue}</Badge>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-muted-foreground">
                        <span>{payment.provider || "-"}</span>
                        <span>{formatDate(payment.created_at)}</span>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <Button size="sm" variant="outline" disabled={detailLoading} onClick={() => loadAndShowDetail(`Payment Detail: ${payment.id}`, `/admin/payments/${payment.id}`)}>
                          <Eye className="mr-1 h-3 w-3" /> View
                        </Button>
                        {canVerify ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isCurrentPaymentLoading}
                              onClick={() =>
                                setVerificationDialog({
                                  open: true,
                                  payment,
                                  approve: true,
                                  note: "Receipt amount mismatch resolved after manual review.",
                                })
                              }
                            >
                              <CheckCircle2 className={`mr-1 h-3 w-3 ${isApproveLoading ? "animate-spin" : ""}`} />
                              {isApproveLoading ? "Approving..." : "Approve"}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={isCurrentPaymentLoading}
                              onClick={() =>
                                setVerificationDialog({
                                  open: true,
                                  payment,
                                  approve: false,
                                  note: "Payment rejected after manual review.",
                                })
                              }
                            >
                              <XCircle className={`mr-1 h-3 w-3 ${isRejectLoading ? "animate-spin" : ""}`} />
                              {isRejectLoading ? "Rejecting..." : "Reject"}
                            </Button>
                          </>
                        ) : null}
                      </div>
                      {isCurrentPaymentLoading ? (
                        <p className="mt-2 text-[11px] text-muted-foreground">
                          {isApproveLoading ? "Submitting approval payload..." : "Submitting rejection payload..."}
                        </p>
                      ) : null}
                    </div>
                  )
                })}
                {snapshot.payments.length === 0 ? <p className="text-sm text-muted-foreground">No payments returned.</p> : null}
              </div>
            </CardContent>
          </Card>
          </TabsContent>

          <TabsContent value="configuration" className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-2">
              <Card className="border-border/60 bg-card/50">
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Wallet className="h-5 w-5 text-primary" /> Payment Receivers (CRUD)
                  </CardTitle>
                  <CardDescription>Manage active payment receiver profiles used by owner upgrade flows.</CardDescription>
                </div>
                <Button
                  onClick={() =>
                    openCrudDialog({
                      title: "Create Payment Receiver",
                      description: "Create a new admin payment receiver profile.",
                      endpoint: "/admin/payment-receivers",
                      method: "POST",
                      payload: { provider: "telebirr", receiver_account: "0911001122", receiver_name: "MenuVista Telebirr", is_active: true },
                    })
                  }
                >
                  <Plus className="mr-2 h-4 w-4" /> New Receiver
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={searchReceivers} onChange={(e) => setSearchReceivers(e.target.value)} placeholder="Search receivers..." className="pl-9" />
              </div>
              <div className="max-h-80 space-y-2 overflow-auto">
                {filteredReceivers.slice(0, 20).map((receiver: any, index: number) => (
                  <div key={receiver.id || index} className="rounded-md border border-border/60 p-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div>
                        <p className="text-sm font-semibold">{receiver.receiver_name || receiver.provider || "Receiver"}</p>
                        <p className="text-xs text-muted-foreground">{receiver.provider || "-"} • {receiver.receiver_account || "-"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={receiver.is_active ? "secondary" : "outline"}>{receiver.is_active ? "Active" : "Inactive"}</Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            openCrudDialog({
                              title: `Update Receiver: ${receiver.id}`,
                              description: "Edit payment receiver profile fields.",
                              endpoint: `/admin/payment-receivers/${receiver.id}`,
                              method: "PATCH",
                              payload: receiver,
                            })
                          }
                        >
                          <Pencil className="mr-1 h-3 w-3" /> Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteDialog({ open: true, endpoint: `/admin/payment-receivers/${receiver.id}`, label: receiver.receiver_name || receiver.id || "receiver" })}
                        >
                          <Trash2 className="mr-1 h-3 w-3" /> Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredReceivers.length === 0 ? <p className="text-sm text-muted-foreground">No payment receivers found.</p> : null}
              </div>
            </CardContent>
          </Card>

              <Card className="border-border/60 bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="h-5 w-5 text-primary" /> Verification Settings (Update)
              </CardTitle>
              <CardDescription>System-wide verification policy and provider settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={verificationSettingsDraft}
                onChange={(e) => setVerificationSettingsDraft(e.target.value)}
                rows={14}
                className="font-mono text-xs"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setVerificationSettingsDraft(toJson(snapshot.verificationSettings || {}))}
                >
                  Reset
                </Button>
                <Button
                  disabled={verificationSettingsSaving}
                  onClick={async () => {
                    if (!token) return
                    const operationLabel = "Saving verification settings"
                    try {
                      startOperation(operationLabel)
                      setVerificationSettingsSaving(true)
                      const payload = parseJsonSafe(verificationSettingsDraft)
                      await apiFetch<any>("/admin/verification/settings", {
                        method: "PATCH",
                        token,
                        body: payload,
                      })
                      toast({ title: "Saved", description: "Verification settings updated." })
                      await loadAdminData("Refreshing snapshot after verification settings save")
                    } catch (err: any) {
                      toast({ title: "Save failed", description: err?.message || "Invalid JSON or request failed.", variant: "destructive" })
                    } finally {
                      setVerificationSettingsSaving(false)
                      endOperation(operationLabel, "Verification settings saved")
                    }
                  }}
                >
                  {verificationSettingsSaving ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </CardContent>
          </Card>
            </div>
          </TabsContent>
          </div>
        </Tabs>

        <Separator />

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <Clock3 className="h-4 w-4" />
          <span>Admin snapshot is real-time from API at page load and refresh.</span>
          <span>Use endpoint-level admin policies for final action authorization.</span>
        </div>
      </div>

      <Dialog open={crudDialog.open} onOpenChange={(open) => setCrudDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{crudDialog.title}</DialogTitle>
            <DialogDescription>{crudDialog.description}</DialogDescription>
            <p className="text-xs text-muted-foreground">
              Endpoint: {crudDialog.method} {crudDialog.endpoint}
            </p>
          </DialogHeader>

          <div className="max-h-[60vh] space-y-3 overflow-auto rounded-md border border-border/50 bg-muted/20 p-3">
            {Object.keys(crudDialog.payload || {}).length === 0 ? (
              <p className="text-sm text-muted-foreground">No form fields for this action.</p>
            ) : (
              Object.entries(crudDialog.payload || {}).map(([key, value]) => {
                const fieldType = inferCrudFieldType(value)
                return (
                  <div key={key} className="space-y-2 rounded-md border border-border/40 bg-card p-3">
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {formatFieldLabel(key)}
                    </label>

                    {fieldType === "boolean" ? (
                      <select
                        className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                        value={String(Boolean(value))}
                        onChange={(e) =>
                          setCrudDialog((prev) => ({
                            ...prev,
                            payload: {
                              ...prev.payload,
                              [key]: e.target.value === "true",
                            },
                          }))
                        }
                      >
                        <option value="true">True</option>
                        <option value="false">False</option>
                      </select>
                    ) : fieldType === "multiline" ? (
                      <Textarea
                        value={String(value ?? "")}
                        rows={4}
                        onChange={(e) =>
                          setCrudDialog((prev) => ({
                            ...prev,
                            payload: {
                              ...prev.payload,
                              [key]: e.target.value,
                            },
                          }))
                        }
                      />
                    ) : (
                      <Input
                        type={fieldType === "number" ? "number" : "text"}
                        value={String(value ?? "")}
                        onChange={(e) =>
                          setCrudDialog((prev) => ({
                            ...prev,
                            payload: {
                              ...prev.payload,
                              [key]: fieldType === "number" ? Number(e.target.value || 0) : e.target.value,
                            },
                          }))
                        }
                      />
                    )}
                  </div>
                )
              })
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCrudDialog(EMPTY_CRUD_DIALOG)} disabled={savingDialog}>
              Cancel
            </Button>
            <Button onClick={executeCrudAction} disabled={savingDialog}>
              {savingDialog ? "Saving..." : "Execute"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              This will permanently delete: {deleteDialog.label}
            </DialogDescription>
            <p className="text-xs text-muted-foreground">DELETE {deleteDialog.endpoint}</p>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, endpoint: "", label: "" })} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={executeDeleteAction} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailDialog.open} onOpenChange={(open) => setDetailDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{detailDialog.title}</DialogTitle>
            <DialogDescription>Structured detail view.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-auto rounded-md border border-border/50 bg-muted/20 p-3">
            <DetailObjectView data={detailDialog.data} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialog({ open: false, title: "", data: null })}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={verificationDialog.open}
        onOpenChange={(open) => setVerificationDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {verificationDialog.approve ? "Approve Payment" : "Reject Payment"}
            </DialogTitle>
            <DialogDescription>
              Add admin note and submit verification for payment ID: {verificationDialog.payment?.id || "-"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-sm font-medium">Admin Note</label>
            <Textarea
              rows={4}
              value={verificationDialog.note}
              onChange={(e) => setVerificationDialog((prev) => ({ ...prev, note: e.target.value }))}
              placeholder="Add verification note"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setVerificationDialog({ open: false, payment: null, approve: true, note: "" })}
              disabled={Boolean(verifyingPaymentId)}
            >
              Cancel
            </Button>
            <Button
              variant={verificationDialog.approve ? "default" : "destructive"}
              onClick={() => verifyPayment(verificationDialog.payment, verificationDialog.approve, verificationDialog.note)}
              disabled={Boolean(verifyingPaymentId)}
            >
              {Boolean(verifyingPaymentId)
                ? verificationDialog.approve
                  ? "Approving..."
                  : "Rejecting..."
                : verificationDialog.approve
                ? "Confirm Approve"
                : "Confirm Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
