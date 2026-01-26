import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || ""
  const base = API_BASE.endsWith("/") ? API_BASE.slice(0, -1) : API_BASE
  const targetUrl = `${base}/auth/reset-password`

  try {
    const body = await request.json()
    console.log(`[Auth Proxy] ResetPassword -> ${targetUrl}`)

    const res = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    })

    const raw = await res.text()
    
    if (!res.ok) {
        console.error(`[Auth Proxy Error] ${res.status} from ${targetUrl}:`, raw)
        return new NextResponse(raw, { status: res.status })
    }

    return new NextResponse(raw, { 
        status: res.status,
        headers: { "Content-Type": "application/json" }
    })
  } catch (error: any) {
    console.error("[Auth Proxy Exception]:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
