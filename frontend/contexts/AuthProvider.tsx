"use client"
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import BACKEND_URL from "@/utils/backendURL";

interface User {
  id: number;
  username: string;
  email: string;
  roles: string[];
  permisos: Record<string, boolean>;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Verificar sesión al cargar
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const startTime = performance.now();
    console.log("🔍 [AUTH] Iniciando verificación de sesión...");
    
    try {
      const fetchStart = performance.now();
      console.log(`🌐 [AUTH] Enviando petición a: ${BACKEND_URL}/auth/me`);
      
      const res = await fetch(`${BACKEND_URL}/auth/me`, {
        credentials: 'include' // ⭐ CLAVE: Incluir cookies
      });

      const fetchEnd = performance.now();
      console.log(`⏱️ [AUTH] Petición completada en: ${(fetchEnd - fetchStart).toFixed(2)}ms`);

      if (res.ok) {
        const parseStart = performance.now();
        const userData = await res.json();
        const parseEnd = performance.now();
        
        setUser(userData);
        console.log(`✅ [AUTH] Sesión activa: ${userData.username}`);
        console.log(`📊 [AUTH] Parsing JSON: ${(parseEnd - parseStart).toFixed(2)}ms`);
      } else {
        setUser(null);
        console.log(`❌ [AUTH] Sin sesión activa (${res.status})`);
      }
    } catch (error) {
      console.error("❌ [AUTH] Error verificando autenticación:", error);
      setUser(null);
    } finally {
      const totalTime = performance.now() - startTime;
      setIsLoading(false);
      console.log(`🏁 [AUTH] Verificación total completada en: ${totalTime.toFixed(2)}ms`);
    }
  };

  const login = async (username: string, password: string) => {
    const res = await fetch(`${BACKEND_URL}/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include', // ⭐ CLAVE: Incluir cookies
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Error al iniciar sesión");
    }

    const userData = await res.json();
    setUser(userData);
    console.log("✅ Login exitoso:", userData.username);
  };

  const logout = async () => {
    try {
      await fetch(`${BACKEND_URL}/auth/logout`, {
        method: "POST",
        credentials: 'include' // ⭐ CLAVE: Incluir cookies
      });
      console.log("✅ Logout exitoso");
    } catch (error) {
      console.error("Error en logout:", error);
    }
    setUser(null);
    
    // Redirigir solo si no estamos en una ruta pública
    if (pathname && !pathname.startsWith("/auth/")) {
      router.push('/');
    }
  };

  const hasRole = (role: string) => {
    return user?.roles?.includes(role) || false;
  };

  const hasPermission = (permission: string) => {
    return user?.permisos?.[permission] === true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        checkAuth,
        hasRole,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
}
