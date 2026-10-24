import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  if (!["localhost", "127.0.0.1", "[::1]"].includes(request.nextUrl.hostname)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  try {
    const response = await fetch("https://www.collectingdots.com/api/get-artists-data", {
      next: { revalidate: 300 }, signal: AbortSignal.timeout(20000),
    })
    if (!response.ok) throw new Error("Roster unavailable")
    const roster = await response.json()
    if (!roster.success || !Array.isArray(roster.data)) throw new Error("Invalid roster")
    return NextResponse.json(roster)
  } catch {
    return NextResponse.json({ success: false, message: "The artist roster is temporarily unavailable." }, { status: 502 })
  }
}
