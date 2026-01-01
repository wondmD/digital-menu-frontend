const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || ""

export type ApiOptions = {
  method?: string
  headers?: Record<string, string>
  body?: any
  token?: string
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const url = `${API_BASE}${path}`
  const headers: Record<string, string> = {
    ...(options.headers || {}),
  }

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json"
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`
  }

  const res = await fetch(url, {
    method: options.method || "GET",
    headers,
    body:
      options.body instanceof FormData
        ? options.body
        : options.body
          ? JSON.stringify(options.body)
          : undefined,
    cache: "no-store",
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Request failed: ${res.status}`)
  }

  return res.json() as Promise<T>
}
