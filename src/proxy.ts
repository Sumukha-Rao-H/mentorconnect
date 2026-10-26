import { NextResponse, type NextRequest } from "next/server";
import { decrypt, SESSION_COOKIE } from "@/lib/jwt";
import { ROUTE_ROLES } from "@/lib/rbac";

const PUBLIC_ROUTES = ["/login", "/register"];

// Optimistic checks only: the cookie is verified but the database is not hit.
// Pages and server actions re-check the user's current role via the DAL.
export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const session = await decrypt(req.cookies.get(SESSION_COOKIE)?.value);
  const isPublic = PUBLIC_ROUTES.some((r) => path.startsWith(r));

  if (!session && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }
  if (session && (isPublic || path === "/")) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }
  if (session) {
    const rule = ROUTE_ROLES.find((r) => path.startsWith(r.prefix));
    if (rule && !rule.roles.includes(session.role)) {
      return NextResponse.redirect(new URL("/dashboard?denied=1", req.nextUrl));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)"],
};
