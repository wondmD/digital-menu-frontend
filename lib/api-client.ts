const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || ""

export type ApiOptions = {
  method?: string
  headers?: Record<string, string>
  body?: any
  token?: string
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

  if (isClient) {
    if (options.body instanceof FormData) {
      const keys = Array.from(options.body.keys())
      console.log(`[apiFetch] Calling endpoint: ${url} (Original path: ${path})`, { method, bodyKeys: keys })
    } else {
      console.log(`[apiFetch] Calling endpoint: ${url} (Original path: ${path})`, { method, options })
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

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        method,
        headers,
        body:
          options.body instanceof FormData
            ? options.body
            : options.body
              ? JSON.stringify(options.body)
              : undefined,
        cache: "no-store",
      })

      if (res.status === 401 && isClient && attempt === 0) {
        // Token might have expired during the request or clock drift
        // Try to trigger a session refresh by calling getSession
        const { getSession } = await import("next-auth/react")
        const newSession = await getSession()
        const newToken = (newSession?.user as any)?.accessToken
        
        if (newToken && newToken !== options.token) {
          headers.Authorization = `Bearer ${newToken}`
          // Retry the request with the new token
          continue
        }
      }

      if (!res.ok) {
        // Retry on server errors (500, 502, 503, 504) as they might be 
        // caused by proxy timeouts or backend cold starts
        const isRetryableStatus = [500, 502, 503, 504].includes(res.status)
        if (isRetryableStatus && attempt < maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000
          await new Promise(resolve => setTimeout(resolve, delay))
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

        throw new Error(message)
      }

      return res.json() as Promise<T>
    } catch (err: any) {
      lastError = err
      
      // Retry on network errors or "socket hang up" (ECONNRESET)
      // These are common during Render cold starts
      const isNetworkError = err.message.includes("socket hang up") || 
                            err.message.includes("ECONNRESET") ||
                            err.message.includes("Failed to fetch")
                            
      if (isNetworkError && attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000 // Exponential backoff: 1s, 2s
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      
      throw err
    }
  }

  throw lastError
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
