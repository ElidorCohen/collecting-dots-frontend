import { NextResponse, type NextRequest } from "next/server"

export function proxy(request: NextRequest) {
  const host = request.headers.get("host") || ""
  const loopback = host.match(/^127\.0\.0\.1(?::(\d+))?$/)
  const path = request.nextUrl.pathname
  const page = path === "/" || path === "/opener" || path.startsWith("/opener/")
  if (!loopback || !page || !["GET", "HEAD"].includes(request.method)) return NextResponse.next()

  // These recordings reject a numeric-IP embedding origin, but play on localhost.
  // Canonicalize only local page visits; public hosts, API calls and media stay intact.
  const destination = request.nextUrl.clone()
  destination.hostname = "localhost"
  destination.port = loopback[1] || ""
  const response = NextResponse.redirect(destination, 307)
  response.headers.set("Cache-Control", "no-store")
  return response
}

export const config = { matcher: ["/", "/opener/:path*"] }
