import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || ""

async function handle(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  if (!API_BASE) {
    return NextResponse.json({ error: "API base URL not configured" }, { status: 500 })
  }

  const { path: pathSegments } = await params
  
  const session = await getServerSession(authOptions)
  const token = (session?.user as any)?.accessToken as string | undefined
  
  // Requirement check: Only block if it's strictly an "owner/private" endpoint.
  // Public endpoints (like public menu views) should be allowed without a token.
  const isPrivate = pathSegments[0]?.toLowerCase() === "my-restaurants" || 
                    pathSegments[0]?.toLowerCase() === "subscription" ||
                    pathSegments[0]?.toLowerCase() === "admin"
  
  if (isPrivate && !token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Robustly identify IDs from the path
  let rId = "", cId = ""
  for (let i = 0; i < pathSegments.length; i++) {
    const seg = pathSegments[i].toLowerCase()
    if ((seg === "my-restaurants" || seg === "restaurants") && i + 1 < pathSegments.length) {
      rId = pathSegments[i + 1]
    }
    if (seg === "categories" && i + 1 < pathSegments.length) {
      cId = pathSegments[i + 1]
    }
  }

  const path = pathSegments.join("/")
  const url = new URL(request.url)
  
  // Clean query string to avoid duplicate ID parameters which cause "slice/array" errors in Go backends
  const queryParams = new URLSearchParams(url.search)
  queryParams.delete("restaurant_id")
  queryParams.delete("category_id")
  queryParams.delete("restaurantId")
  queryParams.delete("categoryId")
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : ""
  
  const targetUrl = `${API_BASE}/${path}${queryString}`

  // Log the final request details to the terminal for debugging
  console.log(`\x1b[35m[API Proxy]\x1b[0m ${request.method} -> ${targetUrl}`)
  if (rId || cId) {
    console.log(`\x1b[36m[Context]\x1b[0m RestaurantID: ${rId || 'N/A'} | CategoryID: ${cId || 'N/A'}`)
  }

  const contentType = request.headers.get("content-type") || ""
  
  let body: any = null
  const method = request.method.toUpperCase()
  if (method !== "GET" && method !== "HEAD" && method !== "DELETE") {
    const isPost = method === "POST"
    const lastSeg = pathSegments[pathSegments.length - 1].toLowerCase()
    const isItemsAction = lastSeg === "items"
    const isCategoriesAction = lastSeg === "categories"

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData()
      const newFormData = new FormData()
      
      // Copy fields, stripping existing IDs to prevent the "slice" collision
      for (const [key, value] of formData.entries()) {
        const k = key.toLowerCase().replace(/[^a-z0-9]/g, "")
        if (k === "restaurantid" || k === "categoryid") continue
        
        // Preserve filenames for File objects as Go backends require them in the multipart header
        if (value instanceof File) {
          newFormData.append(key, value, value.name)
        } else {
          newFormData.append(key, value)
        }
      }

      // Inject snake_case IDs ONLY for creation endpoints, matching the Postman document
      // and backend requirements while avoiding collisions on update/delete endpoints.
      if (isPost) {
        if (rId && (isItemsAction || isCategoriesAction)) {
          newFormData.append("restaurant_id", rId)
        }
        if (cId && isItemsAction) {
          newFormData.append("category_id", cId)
        }
      }

      body = newFormData
    } else {
      const rawBody = await request.json()
      
      // Scrub conflicting keys
      delete rawBody.restaurant_id
      delete rawBody.category_id
      delete rawBody.restaurantId
      delete rawBody.categoryId
      delete rawBody.RestaurantID
      delete rawBody.CategoryID

      // Inject IDs for POST requests
      if (isPost) {
        if (rId && (isItemsAction || isCategoriesAction)) {
          rawBody.restaurant_id = rId
        }
        if (cId && isItemsAction) {
          rawBody.category_id = cId
        }
      }

      body = JSON.stringify(rawBody)
    }
  }

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

    if (!upstream.ok) {
      console.log(`\x1b[31m[API Proxy Error]\x1b[0m ${upstream.status} from ${targetUrl}: ${respText.slice(0, 200)}`)
    }

    // Enhanced Inventory Logging: Print lists to terminal when fetched
    if (upstream.ok && method === "GET") {
      try {
        const json = JSON.parse(respText)
        const items = Array.isArray(json) ? json : (json?.data || [])
        
        if (path === "my-restaurants" || path === "restaurants") {
          console.log(`\n\x1b[42m\x1b[30m INVENTORY: RESTAURANTS (${path}) \x1b[0m`)
          const list = Array.isArray(items) ? items : (items.items || [])
          list.forEach((r: any) => console.log(`\x1b[32mSlug:\x1b[0m ${r.slug} | \x1b[32mName:\x1b[0m ${r.name} | \x1b[32mID:\x1b[0m ${r.id}`))
          console.log("")
        } else if (path.endsWith("/categories")) {
          console.log(`\n\x1b[46m\x1b[30m INVENTORY: CATEGORIES (${path}) \x1b[0m`)
          const list = Array.isArray(items) ? items : (items.items || [])
          list.forEach((c: any) => console.log(`\x1b[36mID:\x1b[0m ${c.id} | \x1b[36mName:\x1b[0m ${c.name}`))
          console.log("")
        } else if (path.endsWith("/items")) {
          console.log(`\n\x1b[45m\x1b[30m INVENTORY: ITEMS (${path}) \x1b[0m`)
          const list = Array.isArray(items) ? items : (items.items || [])
          list.forEach((i: any) => console.log(`\x1b[35mID:\x1b[0m ${i.id} | \x1b[35mName:\x1b[0m ${i.name} | \x1b[35mCategory:\x1b[0m ${i.category_id}`))
          console.log("")
        }
      } catch (e) { /* ignore parse errors */ }
    }

    return new NextResponse(respText, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") || "application/json",
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export const GET = handle
export const POST = handle
export const PATCH = handle
export const PUT = handle
export const DELETE = handle
