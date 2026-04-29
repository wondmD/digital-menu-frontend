import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || ""

async function handle(request: Request, context: { params: any }) {
  const { params } = context
  // Handle both Next.js 14 (Sync) and Next.js 15 (Async) params
  const resolvedParams = params instanceof Promise ? await params : params
  const { path: pathSegments } = resolvedParams || { path: [] }
  
  const path = (pathSegments || []).filter(Boolean).join("/")
  
  if (!API_BASE) {
    return NextResponse.json({ error: "API base URL not configured" }, { status: 500 })
  }

  const isPublicPlan = path === "subscription/plans" || path === "plans"
  
  // Requirement check: Only block if it's strictly an "owner/private" endpoint.
  const isPrivate = !isPublicPlan && (
                    pathSegments?.[0]?.toLowerCase() === "my-restaurants" || 
                    pathSegments?.[0]?.toLowerCase() === "subscription" ||
                    pathSegments?.[0]?.toLowerCase() === "admin")
  
  let token: string | undefined
  if (isPrivate) {
    try {
      const session = await getServerSession(authOptions)
      token = (session?.user as any)?.accessToken as string | undefined
      if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    } catch (err: any) {
      console.error("[api/proxy] getServerSession error:", err?.stack || err)
      return NextResponse.json({ error: "Auth session error", detail: String(err?.message || err) }, { status: 500 })
    }
  }

  // Robustly identify IDs from the path
  let rId = "", cId = ""
  if (pathSegments) {
    for (let i = 0; i < pathSegments.length; i++) {
      const seg = pathSegments[i].toLowerCase()
      if ((seg === "my-restaurants" || seg === "restaurants") && i + 1 < pathSegments.length) {
        rId = pathSegments[i + 1]
      }
      if (seg === "categories" && i + 1 < pathSegments.length) {
        cId = pathSegments[i + 1]
      }
    }
  }

  const url = new URL(request.url)
  
  // Clean query string to avoid duplicate or conflicting parameters
  const queryParams = new URLSearchParams(url.search)
  const paramsToDelete = [
    "restaurant_id", "category_id", "restaurantId", "categoryId",
    "RestaurantSlug"
  ]
  paramsToDelete.forEach(p => queryParams.delete(p))
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : ""
  
  const method = request.method.toUpperCase()
  const contentType = request.headers.get("content-type") || ""
  let body: any = null

  if (method !== "GET" && method !== "HEAD") {
    const isPost = method === "POST"
    const lastSeg = pathSegments[pathSegments.length - 1].toLowerCase()
    const isItemsAction = lastSeg === "items"
    const isCategoriesAction = lastSeg === "categories"

    // DELETE requests may include JSON body for endpoints like gallery remove.
    // Some clients omit content-length/content-type on DELETE, so we still attempt to read the body.
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData()
      const newFormData = new FormData()
      
      // Copy fields, stripping existing IDs to prevent collisions
      for (const [key, value] of formData.entries()) {
        const k = key.toLowerCase().replace(/[^a-z0-9]/g, "")
        // Extremely aggressive scrubbing of any field that sounds like slug or id
        if (k === "restaurantid" || k === "categoryid" || 
            k === "id" || k === "restaurant_id") {
          continue
        }
        
        // Preserve filenames for File/Blob objects as Go backends require them in the multipart header.
        // We use duck-typing to check for Blobs/Files from the request.
        if (value && typeof value === 'object' && 'arrayBuffer' in (value as any)) {
          newFormData.append(key, value as any, (value as any).name || 'file')
        } else {
          newFormData.append(key, value)
        }
      }

      // Do not inject IDs from path into body for create endpoints.
      // Item/category routes already include identifiers in the URL and some backend
      // versions derive SQL values from path params; duplicating IDs in body can
      // produce column/value count mismatches.

      body = newFormData
    } else {
      const rawText = await request.text()
      let rawBody: Record<string, any> = {}
      if (rawText) {
        try {
          rawBody = JSON.parse(rawText)
        } catch {
          // Preserve non-JSON payloads as-is.
          body = rawText
          rawBody = {}
        }
      }

      if (body !== null) {
        // Non-JSON payload already handled above.
      } else {
        // Extremely aggressive scrubbing for JSON payloads
        const keysToDelete = [
          "restaurant_id", "category_id", "restaurantId", "categoryId", 
          "RestaurantID", "CategoryID", "RestaurantSlug"
        ]
        
        keysToDelete.forEach(key => {
          if (key in rawBody) {
            delete rawBody[key]
          }
        })
      
        // Do not inject IDs from path into JSON body for create endpoints.
        body = rawText ? JSON.stringify(rawBody) : null
      }
    }
  }

  // Clean up API_BASE to ensure no trailing slash interaction issues
  const base = API_BASE.endsWith("/") ? API_BASE.slice(0, -1) : API_BASE
  const targetUrl = `${base}/${path}${queryString}`

  try {
    const upstreamHeaders: Record<string, string> = {}
    
    // Only send Authorization if it's a private endpoint or if the client explicitly sent it
    const clientAuth = request.headers.get("Authorization")
    if (clientAuth) {
      upstreamHeaders["Authorization"] = clientAuth
    } else if (isPrivate && token) {
      upstreamHeaders["Authorization"] = `Bearer ${token}`
    }

    // Only send Content-Type if we have a body and it's not multipart
    if (body && !contentType.includes("multipart/form-data")) {
      upstreamHeaders["Content-Type"] = contentType || "application/json"
    }

    const upstream = await fetch(targetUrl, {
      method,
      headers: upstreamHeaders,
      body,
    })

    const respText = await upstream.text()

    return new NextResponse(respText, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") || "application/json",
      },
    })
  } catch (error: any) {
    console.error("[api/proxy] upstream fetch failed", {
      targetUrl,
      method,
      error: error?.stack || String(error),
    })
    return NextResponse.json({ error: "Upstream request failed", detail: String(error?.message || error) }, { status: 500 })
  }
}

export const GET = handle
export const POST = handle
export const PATCH = handle
export const PUT = handle
export const DELETE = handle
