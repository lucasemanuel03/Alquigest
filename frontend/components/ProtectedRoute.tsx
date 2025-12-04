"use client"

import { useAuth } from "@/contexts/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";
import Loading from "./loading-default";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: string;
  requiredRole?: string;
  fallbackPath?: string;
}

/**
 * Componente para proteger rutas basado en permisos y roles
 * 
 * Uso:
 * ```tsx
 * <ProtectedRoute requiredPermission="consultar_propietario">
 *   <ProprietariosPage />
 * </ProtectedRoute>
 * ```
 */
export default function ProtectedRoute({
  children,
  requiredPermission,
  requiredRole,
  fallbackPath = "/",
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated, hasPermission, hasRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Mientras está cargando, esperar
    if (isLoading) return;

    // Si no está autenticado, redirigir a home (AuthProvider mostrará modal de login)
    if (!isAuthenticated) {
      router.push(fallbackPath);
      return;
    }

    // Validar permisos
    if (requiredPermission && !hasPermission(requiredPermission)) {
      console.warn(`Acceso denegado: Se requiere permiso "${requiredPermission}"`);
      router.push(fallbackPath);
      return;
    }

    // Validar roles
    if (requiredRole && !hasRole(requiredRole)) {
      console.warn(`Acceso denegado: Se requiere rol "${requiredRole}"`);
      router.push(fallbackPath);
      return;
    }
  }, [isLoading, isAuthenticated, user, requiredPermission, requiredRole, router, fallbackPath, hasPermission, hasRole]);

  // Mientras carga, mostrar loading
  if (isLoading) {
    return <Loading texto="Verificando autenticación..." />;
  }

  // Si no está autenticado, no renderizar (redirige arriba)
  if (!isAuthenticated) {
    return null;
  }

  // Validar permisos finales antes de renderizar
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return null;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return null;
  }

  // Si pasó todas las validaciones, renderizar
  return <>{children}</>;
}
