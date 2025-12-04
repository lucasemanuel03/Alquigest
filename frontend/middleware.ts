import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("accessToken")?.value;
  const pathname = request.nextUrl.pathname;

  // Rutas públicas que NO requieren autenticación
  const publicRoutes = [
    "/auth/recuperar-contrasena",
    "/auth/resetear-contrasena",
  ];

  // Verificar si es una ruta pública
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // Si es una ruta pública, permitir acceso
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Todas las demás rutas requieren autenticación (excepto home "/" que maneja AuthProvider)
  // Si no hay token y no es la home, redirigir a home (donde se mostrará el modal de login)
  if (!token && pathname !== "/") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

// El middleware se ejecuta en todas las rutas excepto:
// - Archivos estáticos (_next/static, favicon, imágenes, etc.)
// - API routes internas de Next.js
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.webp).*)",
  ],
};
