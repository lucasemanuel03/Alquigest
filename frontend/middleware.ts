import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Nombre de cookie alineado con backend (HttpOnly JWT)
  const token = request.cookies.get("accessToken")?.value;

  const protectedRoutes = [

    "/auth/signup",
  ];

  const isProtected = protectedRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  );

  // Si intenta entrar a una ruta protegida sin token → redirigir al Home
  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

// Qué rutas analiza el middleware
export const config = {
  matcher: [
    "/auth/signup/:path*",
  ],
};
