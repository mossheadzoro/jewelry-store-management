import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Public path prefixes that do not require an active session
const PUBLIC_PATHS = [
  "/login",
  "/unauthorized",
  "/public",
  "/api/auth",
  "/api/public",
  "/api/security/challenge",
  "/api/security/2fa/verify",
  "/api/cron",
  "/favicon.ico",
];

// Helper to test if a pathname matches public routes or static assets
function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return true;
  }
  // Ignore static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico|css|js|woff|woff2|ttf)$/)
  ) {
    return true;
  }
  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // 1. Bypass public static assets and whitelisted paths
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // 2. Extract and verify session token
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || "jewelry_store_management_secret_key_2026_default",
  });

  const isApiRoute = pathname.startsWith("/api/");

  // 3. Unauthenticated access handling
  if (!token || !token.id) {
    if (isApiRoute) {
      return NextResponse.json(
        { error: "Unauthorized: Active session required." },
        { status: 401 }
      );
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  // 4. Role Extraction & Normalization
  const userRole = (token.role as string)?.toUpperCase() || "SALESMAN";
  const isAdmin =
    userRole === "ADMIN" ||
    userRole === "SUPER_ADMIN" ||
    userRole === "OWNER";
  const isManagerOrAdmin = isAdmin || userRole === "MANAGER";

  // If already logged in, redirect away from /login
  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // 5. RBAC: Settings (Manager + Admin only)
  if (pathname.startsWith("/settings") || pathname.startsWith("/api/settings")) {
    if (!isManagerOrAdmin) {
      if (isApiRoute) {
        return NextResponse.json(
          { error: "Forbidden: Access to Settings requires Manager or Administrator privileges." },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL("/unauthorized?reason=settings", req.url));
    }
  }

  // 6. RBAC: Staff Management (Manager + Admin only)
  if (
    pathname.startsWith("/staff") ||
    pathname.startsWith("/api/users") ||
    pathname.startsWith("/api/staff")
  ) {
    if (!isManagerOrAdmin) {
      if (isApiRoute) {
        return NextResponse.json(
          { error: "Forbidden: Staff Management requires Manager or Administrator privileges." },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL("/unauthorized?reason=staff", req.url));
    }
  }

  // 7. RBAC: Branch Provisioning & Management (Admin only)
  if (
    pathname === "/api/branch/create" ||
    pathname === "/api/branch/delete" ||
    pathname === "/api/branch/update"
  ) {
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Branch network provisioning is restricted to Administrators." },
        { status: 403 }
      );
    }
  }

  // Allow authorized request to proceed
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
