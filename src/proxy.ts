import { NextResponse, type NextRequest } from "next/server";

// Optimistic check only: bounce signed-out visitors to the login page early.
// The real session check happens in every admin page and server action (through the backend).
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname === "/login" || pathname === "/setup") return NextResponse.next();
  if (!request.cookies.has("emrix_admin")) {
    const url = new URL("/login", request.url);
    if (pathname !== "/") url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Every page; not Next's own files, API routes (they check the session themselves) or images.
  matcher: ["/((?!_next/|api/|media/|images/|icon\\.svg|favicon\\.ico|robots\\.txt).*)"],
};
