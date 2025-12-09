"use client"
import { useState, useEffect, ReactNode } from "react";
import ModalLogin from "@/components/modal-login";
import { useAuth } from "@/contexts/AuthProvider";
import HeaderAlquigest from "@/components/header";
import { usePathname } from "next/navigation";
import Footer from "@/components/footer";
import QuickActions from "@/components/quick-actions";
import ModalNotificacionesInicio from "@/components/notifications/modal-notificaciones-inicio";

export default function ClientRootLayout({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showNotificaciones, setShowNotificaciones] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationDot, setNotificationDot] = useState(true);
  const [needsReload, setNeedsReload] = useState(false);
  const pathname = usePathname();
  const isPublicRoute = pathname?.startsWith("/auth/") === true;

  // 📊 Log de estado de carga
  useEffect(() => {
    console.log("🎨 [RENDER] Estado actual:", { 
      isLoading, 
      isAuthenticated, 
      hasUser: !!user,
      pathname 
    });
  }, [isLoading, isAuthenticated, user, pathname]);

  // Mapear las rutas a títulos específicos
  const getTituloPagina = (path: string) => {
    if (path.startsWith("/propietarios")) return "Locadores";
    if (path.startsWith("/inmuebles")) return "Inmuebles";
    if (path.startsWith("/inquilinos")) return "Locatarios";
    if (path.startsWith("/alquileres")) return "Contratos de alquiler";
    if (path.startsWith("/contratos")) return "Contratos";
    return "Gestiones";
  };

  // Mostrar modal de login si no está autenticado
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isPublicRoute) {
      setShowModal(true);
    } else if (isAuthenticated) {
      setShowModal(false);
    }
  }, [isLoading, isAuthenticated, isPublicRoute]);

  // Sincronizar tema
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    setIsDarkMode(savedTheme === "dark");
  }, []);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const newTheme = !prev;
      if (newTheme) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
      return newTheme;
    });
  };

  // Mostrar loading mientras verifica sesión
  if (isLoading) {
    console.log("⏳ [RENDER] Mostrando pantalla de carga...");
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col gap-4 items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p>Verificando sesión...</p>
          <p className="text-xs text-gray-500">
            Si esto tarda mucho, puede ser que el servidor esté iniciando (cold start)
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <HeaderAlquigest
        tituloPagina={getTituloPagina(pathname)}
        username={user?.username || ""}
        toggleTheme={toggleTheme}
        isDarkMode={isDarkMode}
        onBellClick={() => setShowNotificaciones(true)}
        showNotificationDot={notificationDot}
        onLoginClick={() => {setShowModal(true)}}
      />
      <QuickActions />
      {children}
      <Footer />

      <ModalLogin
        open={showModal}
        isDarkMode={isDarkMode}
        onClose={(username, justLoggedIn) => {
          setShowModal(false);
          if (justLoggedIn) {
            setShowNotificaciones(true);
            setNeedsReload(true);
          }
        }}
      />

      {showNotificaciones && (
        <ModalNotificacionesInicio
          isOpen={showNotificaciones}
          onClose={() => {
            setShowNotificaciones(false);
            if (needsReload) {
              window.location.reload();
            }
          }}
          setNotificationDot={setNotificationDot}
        />
      )}
    </div>
  );
}
