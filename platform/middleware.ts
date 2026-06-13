import { NextRequest, NextResponse } from "next/server";

// Facilitator routes are basic-auth protected; client routes (/s/[token]/*)
// stay reachable through their unguessable sprint token only.
// With no BASIC_AUTH_PASS set (local dev), everything stays open.
export function middleware(req: NextRequest) {
  const expectedUser = process.env.BASIC_AUTH_USER ?? "unlockt";
  const expectedPass = process.env.BASIC_AUTH_PASS;
  if (!expectedPass) return NextResponse.next();

  const header = req.headers.get("authorization") ?? "";
  const [scheme, encoded] = header.split(" ");
  if (scheme === "Basic" && encoded) {
    try {
      const decoded = atob(encoded);
      const sep = decoded.indexOf(":");
      const user = decoded.slice(0, sep);
      const pass = decoded.slice(sep + 1);
      if (user === expectedUser && pass === expectedPass) {
        return NextResponse.next();
      }
    } catch {
      // fall through to 401
    }
  }
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Unlockt facilitator"' },
  });
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/research",
    "/research/:path*",
    "/api/library",
    "/api/ask",
  ],
};
