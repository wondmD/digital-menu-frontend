import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidateTag } from "next/cache"

const DEFAULT_TAGS = ["public-restaurant-data", "public-landing-data"]

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const payload = await request.json().catch(() => ({}))
  const tags = Array.isArray(payload?.tags) && payload.tags.length > 0 ? payload.tags : DEFAULT_TAGS

  for (const tag of tags) {
    revalidateTag(String(tag))
  }

  return NextResponse.json({ ok: true, tags })
}