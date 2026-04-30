import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/dashboard", "/expenses", "/trips"];

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const publicKey = request.cookies.get("stellar_star_public_key")?.value;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (pathname === "/auth" && publicKey) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isProtected && !publicKey) {
    const authUrl = new URL("/auth", request.url);
    const redirectTo = pathname + search;
    authUrl.searchParams.set("redirect", redirectTo);
    return NextResponse.redirect(authUrl);
  }

  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*", "/expenses/:path*", "/trips/:path*", "/auth"] };