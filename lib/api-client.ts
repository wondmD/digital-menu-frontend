const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || ""

type CacheEntry<T> = {
  expiresAt: number
  value: T
}

const DEFAULT_CACHE_TTL_MS = 30_000
const clientResponseCache = new Map<string, CacheEntry<any>>()
const clientInFlightRequests = new Map<string, Promise<any>>()

export type ApiOptions = {
  method?: string
  headers?: Record<string, string>
  body?: any
  token?: string
  cacheTtlMs?: number
  /** request timeout in milliseconds */
  timeoutMs?: number
  revalidateSeconds?: number
  cacheTags?: string[]
  skipCacheInvalidation?: boolean
}

export class ApiError extends Error {
  status?: number
  body?: any
  constructor(message: string, status?: number, body?: any) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.body = body
  }
}

function buildCacheKey(path: string, method: string, token?: string, body?: any): string {
  const bodyKey = body instanceof FormData ? "form-data" : body ? JSON.stringify(body) : ""
  return [method, path, token || "", bodyKey].join("::")
}

function invalidateTokenCache(token?: string) {
  if (!token) return

  const tokenMarker = `::${token}::`
  for (const key of clientResponseCache.keys()) {
    if (key.includes(tokenMarker)) {
      clientResponseCache.delete(key)
    }
  }

  for (const key of clientInFlightRequests.keys()) {
    if (key.includes(tokenMarker)) {
      clientInFlightRequests.delete(key)
    }
  }
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  if (!API_BASE) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not set; update .env.local and restart the dev server.")
  }

  // Use the proxy on the client side to avoid CORS issues
  const isClient = typeof window !== "undefined"
  const baseUrl = isClient ? "/api/proxy" : API_BASE
  const url = `${baseUrl}${path}`
  
  const method = (options.method || "GET").toUpperCase()
  const isGetRequest = method === "GET"
  const isIdempotentRequest = isGetRequest || method === "HEAD" || method === "OPTIONS"
  // Cache and dedupe all GETs, including token-authenticated ones.
  // The cache key already includes the token, so responses stay user-scoped.
  const shouldCache = isGetRequest
  const cacheKey = shouldCache ? buildCacheKey(url, method, options.token, options.body) : null
  const cacheTtlMs = options.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS

  if (cacheKey) {
    const cached = clientResponseCache.get(cacheKey)
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value as T
    }

    const inFlight = clientInFlightRequests.get(cacheKey)
    if (inFlight) {
      return inFlight as Promise<T>
    }
  }

  const headers: Record<string, string> = {
    ...(options.headers || {}),
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json"
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`
  }

  const maxRetries = 3
  let lastError: any
  const timeoutMsDefault = 10_000

  const requestPromise = (async () => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutMs = options.timeoutMs ?? timeoutMsDefault
        const timeout = setTimeout(() => controller.abort(), timeoutMs)

        const res = await fetch(url, {
          method,
          headers,
          body:
            options.body instanceof FormData
              ? options.body
              : options.body
                ? JSON.stringify(options.body)
                : undefined,
          cache: shouldCache ? "force-cache" : "no-store",
          next:
            shouldCache
              ? {
                  revalidate: options.revalidateSeconds ?? Math.max(1, Math.ceil(cacheTtlMs / 1000)),
                  tags: options.cacheTags,
                }
              : undefined,
          signal: controller.signal,
        })

        clearTimeout(timeout)

        if (res.status === 401 && isClient && attempt === 0) {
          const { getSession } = await import("next-auth/react")
          const newSession = await getSession()
          const newToken = (newSession?.user as any)?.accessToken

          if (newToken && newToken !== options.token) {
            headers.Authorization = `Bearer ${newToken}`
            continue
          }
        }

        if (!res.ok) {
          const isRetryableStatus = [500, 502, 503, 504].includes(res.status)
          if (isRetryableStatus && attempt < maxRetries - 1) {
            const delay = Math.pow(2, attempt) * 1000
            await new Promise((resolve) => setTimeout(resolve, delay))
            continue
          }

          const text = await res.text()
          let message = `Request failed (HTTP ${res.status})`

          if (text) {
            try {
              const parsed = JSON.parse(text)
              message = parsed.error || parsed.message || message
            } catch {
              message = text
            }
          }

          throw new ApiError(message, res.status, text)
        }

        let data: T
        try {
          data = (await res.json()) as T
        } catch (e) {
          // non-JSON responses fall back to text
          const txt = await res.text().catch(() => "")
          // @ts-ignore
          data = (txt as unknown) as T
        }
        if (cacheKey) {
          clientResponseCache.set(cacheKey, {
            expiresAt: Date.now() + cacheTtlMs,
            value: data,
          })
        }

        if (isClient && !isGetRequest && options.token && !options.skipCacheInvalidation) {
          invalidateTokenCache(options.token)
          void fetch("/api/cache/revalidate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tags: ["public-restaurant-data", "public-landing-data"],
            }),
            cache: "no-store",
          }).catch(() => {})
        }

        return data
      } catch (err: any) {
        lastError = err
        const message = String(err?.message || "")
        const causeCode = err?.cause?.code || err?.code
        const isAbort = err?.name === "AbortError" || message.includes("aborted") || message.includes("timed out") || causeCode === "ETIMEDOUT"
        const isNetworkError =
          isAbort ||
          message.includes("socket hang up") ||
          message.includes("ECONNRESET") ||
          message.includes("Failed to fetch") ||
          message.includes("network")

        if (isNetworkError && isIdempotentRequest && attempt < maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000
          await new Promise((resolve) => setTimeout(resolve, delay))
          continue
        }

        // Normalize to ApiError so callers can inspect status/code reliably
        if (err instanceof ApiError) throw err
        throw new ApiError(message || "Network error", undefined, { original: err })
      }
    }

    throw lastError
  })()

  if (cacheKey) {
    clientInFlightRequests.set(cacheKey, requestPromise)
    requestPromise.finally(() => {
      clientInFlightRequests.delete(cacheKey)
    })
  }

  return requestPromise
}

export async function apiFetchWithProgress<T>(
  path: string, 
  options: ApiOptions & { onProgress?: (pct: number) => void } = {}
): Promise<T> {
  const isClient = typeof window !== "undefined"
  if (!isClient) return apiFetch(path, options)

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || ""
  const baseUrl = "/api/proxy"
  const url = `${baseUrl}${path}`
  const method = (options.method || "POST").toUpperCase()

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open(method, url)

    if (options.token) {
      xhr.setRequestHeader("Authorization", `Bearer ${options.token}`)
    }

    if (options.body && !(options.body instanceof FormData)) {
      xhr.setRequestHeader("Content-Type", "application/json")
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && options.onProgress) {
        const percentComplete = Math.round((event.loaded / event.total) * 100)
        options.onProgress(percentComplete)
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText))
        } catch (e) {
          resolve(xhr.responseText as any)
        }
      } else {
        let message = `Request failed (HTTP ${xhr.status})`
        try {
          const parsed = JSON.parse(xhr.responseText)
          message = parsed.error || parsed.message || message
        } catch {}
        reject(new Error(message))
      }
    }

    xhr.onerror = () => reject(new Error("Network connection error"))
    
    const body = options.body instanceof FormData 
      ? options.body 
      : options.body 
        ? JSON.stringify(options.body) 
        : undefined
        
    xhr.send(body)
  })
}

/**
 * Wrapper that returns `null` when the upstream returns 404 (not found).
 * Useful for callers that want a graceful not-found result instead of
 * handling an ApiError. Other errors are re-thrown.
 */
export async function apiFetchOrNull<T>(path: string, options: ApiOptions = {}): Promise<T | null> {
  try {
    return (await apiFetch<T>(path, options)) as T
  } catch (err: any) {
    if (err instanceof ApiError && err.status === 404) return null
    throw err
  }
}
