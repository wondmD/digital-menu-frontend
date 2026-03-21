import { NextResponse } from "next/server"

// Server-side proxy to avoid browser CORS issues when registering users.
export async function POST(request: Request) {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || ""

  try {
    const body = await request.json()

    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    })

    const raw = await res.text()
    const parsed = raw ? safeParse(raw) : null

    if (!res.ok) {
      const message = parsed?.error || parsed?.message || raw || "Registration failed"
      return NextResponse.json({ error: message, status: res.status, raw }, { status: res.status })
    }

    return NextResponse.json(parsed ?? {}, { status: res.status })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed"
    return NextResponse.json({ error: message, status: 500 }, { status: 500 })
  }
}

function safeParse(text: string) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}
