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
  if (request.method !== "GET" && request.method !== "HEAD" && request.method !== "DELETE") {
    const isPost = request.method === "POST"
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
        newFormData.append(key, value)
      }

      // Inject snake_case IDs ONLY for creation endpoints, matching the Postman document
      // and backend requirements while avoiding collisions on update/delete endpoints.
      if (isPost) {
        if (rId && (isItemsAction || isCategoriesAction)) {
          newFormData.append("restaurant_id", rId)
          // Also append PascalCase as a fallback for strict validators
          newFormData.append("RestaurantID", rId)
        }
        if (cId && isItemsAction) {
          newFormData.append("category_id", cId)
          newFormData.append("CategoryID", cId)
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
          rawBody.RestaurantID = rId
        }
        if (cId && isItemsAction) {
          rawBody.category_id = cId
          rawBody.CategoryID = cId
        }
      }

      body = JSON.stringify(rawBody)
    }
  }

  try {
    const upstream = await fetch(targetUrl, {
      method: request.method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(contentType && !contentType.includes("multipart/form-data") ? { "Content-Type": contentType } : {}),
      },
      body,
    })

    const respText = await upstream.text()

    // Enhanced Inventory Logging: Print lists to terminal when fetched
    if (upstream.ok && request.method === "GET") {
      try {
        const json = JSON.parse(respText)
        const items = Array.isArray(json) ? json : (json?.data || [])
        
        if (path === "my-restaurants") {
          console.log("\n\x1b[42m\x1b[30m INVENTORY: YOUR RESTAURANTS \x1b[0m")
          items.forEach((r: any) => console.log(`\x1b[32mID:\x1b[0m ${r.id} | \x1b[32mNAME:\x1b[0m ${r.name}`))
          console.log("")
        } else if (path.endsWith("/categories")) {
          console.log(`\n\x1b[46m\x1b[30m INVENTORY: CATEGORIES \x1b[0m`)
          items.forEach((c: any) => console.log(`\x1b[36mID:\x1b[0m ${c.id} | \x1b[36mNAME:\x1b[0m ${c.name}`))
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
