import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // El middleware aquí es principalmente para headers/logging
  // La protección de rutas es manejada por AuthProvider + client-root-layout
  // Las cookies HttpOnly no son accesibles en el middleware durante navegación del cliente
  
  return NextResponse.next();
}

// El middleware se ejecuta en todas las rutas excepto archivos estáticos
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
