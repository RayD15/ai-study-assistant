import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "dev-secret-ganti-di-production-32char!!",
);

const PROTECTED = ["/dashboard", "/workspace", "/library", "/profile"];
const GUEST_ONLY = ["/login", "/register"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("asa_session")?.value;

  let valid = false;
  if (token) {
    try {
      await jwtVerify(token, SECRET);
      valid = true;
    } catch {
      valid = false;
    }
  }

  // Belum login -> redirect ke /login (simpan tujuan awal)
  if (!valid && PROTECTED.some((p) => pathname.startsWith(p))) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Sudah login -> jangan biarkan buka login/register lagi
  if (valid && GUEST_ONLY.includes(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/workspace/:path*",
    "/library/:path*",
    "/profile/:path*",
    "/login",
    "/register",
  ],
};
