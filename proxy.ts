import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { isRevelUser, isClientUser } from "@/lib/permissions";

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session?.user;
  const pathname = nextUrl.pathname;

  // Public paths — always accessible
  const publicPaths = ["/login", "/forgot-password"];
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    // Redirect already-logged-in users away from login
    if (isLoggedIn) {
      const role = session.user.role;
      const destination = isRevelUser(role) ? "/admin/dashboard" : "/dashboard";
      return NextResponse.redirect(new URL(destination, nextUrl));
    }
    return NextResponse.next();
  }

  // All other paths require auth
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  const role = session.user.role;

  // Admin routes — Revel staff only
  if (pathname.startsWith("/admin")) {
    if (!isRevelUser(role)) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
    return NextResponse.next();
  }

  // Client portal routes — client users only (Revel staff can also preview)
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/proofs") ||
    pathname.startsWith("/documents") ||
    pathname.startsWith("/tasks") ||
    pathname.startsWith("/analytics") ||
    pathname.startsWith("/budget")
  ) {
    if (isRevelUser(role)) {
      // Revel staff accessing client routes get redirected to admin
      return NextResponse.redirect(new URL("/admin/dashboard", nextUrl));
    }
    if (!isClientUser(role)) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|uploads).*)"],
};
