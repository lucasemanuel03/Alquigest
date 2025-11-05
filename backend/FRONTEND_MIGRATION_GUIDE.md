# Guía de Migración del Frontend - Cookies HttpOnly

## 📋 Resumen

Esta guía describe los pasos necesarios para actualizar el frontend de Next.js/React para trabajar con cookies HttpOnly en lugar de localStorage.

## 🎯 Objetivos

1. Eliminar el uso de `localStorage` para almacenar tokens JWT
2. Implementar un `AuthContext` robusto para manejar el estado de autenticación
3. Configurar todas las peticiones fetch para incluir cookies automáticamente
4. Implementar verificación de sesión al iniciar la aplicación

## 🔧 Cambios Necesarios

### 1. Actualizar `utils/functions/auth-functions/auth.ts`

```typescript
"use client"
import BACKEND_URL from "@/utils/backendURL";

const auth = {
  login: async (username: string, password: string) => {
    const res = await fetch(`${BACKEND_URL}/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include', // ⭐ IMPORTANTE: Incluir cookies
      body: JSON.stringify({ username, password }),
    });

    let payload: any = null;
    try {
      payload = await res.json();
    } catch (_) {
      payload = null;
    }

    if (!res.ok) {
      const message = payload?.message || (res.status === 401 ? "Credenciales incorrectas." : "Error al iniciar sesión.");
      const error: any = new Error(message);
      error.status = res.status;
      throw error;
    }

    const data = payload; // { username, email, roles, permisos } - NO incluye token

    // Guardar solo información del usuario (NO el token)
    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(data));
    }

    return { username: data.username };
  },

  logout: async () => {
    try {
      await fetch(`${BACKEND_URL}/auth/signout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include', // ⭐ Incluir cookies para eliminarlas
      });
    } catch (e) {
      console.warn("Error en signout backend:", e);
    }
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("user"); // Solo eliminar info de usuario
        // NO es necesario eliminar token, lo hace el backend con la cookie
      } catch (e) {
        console.warn("No se pudo limpiar localStorage:", e);
      }
    }
  },

  // Verificar sesión actual
  checkAuth: async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/auth/me`, {
        method: "GET",
        credentials: 'include', // ⭐ Incluir cookies
      });

      if (res.ok) {
        const userData = await res.json();
        
        // Actualizar localStorage con datos frescos
        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(userData));
        }
        
        return userData;
      }
      
      return null;
    } catch (error) {
      console.error("Error verificando autenticación:", error);
      return null;
    }
  },

  // ELIMINADO: getToken() - Ya no es necesario

  UserEstaLogeado: () => {
    // Ya no podemos verificar el token directamente
    // En su lugar, verificamos si hay datos de usuario
    if (typeof window === "undefined") return false;
    const user = localStorage.getItem("user");
    return user !== null;
  },

  getUser: () => {
    if (typeof window === "undefined") return null;
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  getUserRoles: (): string[] => {
    const user = auth.getUser();
    return user?.roles || [];
  },

  getUserPermisos: (): Record<string, boolean> => {
    const user = auth.getUser();
    return user?.permisos || {};
  },

  hasRol: (rol: string) => {
    return auth.getUserRoles().includes(rol);
  },

  tienePermiso: (permiso: string) => {
    const permisos = auth.getUserPermisos();
    return permisos[permiso] === true;
  },
};

export default auth;
```

### 2. Crear `contexts/AuthProvider.tsx` (Nuevo archivo)

```typescript
"use client"
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
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

  // Verificar sesión al cargar
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/auth/me`, {
        credentials: 'include'
      });

      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        
        // Sincronizar con localStorage (opcional, para compatibilidad)
        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(userData));
        }
      } else {
        setUser(null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("user");
        }
      }
    } catch (error) {
      console.error("Error verificando autenticación:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    const res = await fetch(`${BACKEND_URL}/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Error al iniciar sesión");
    }

    const userData = await res.json();
    setUser(userData);
    
    // Sincronizar con localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(userData));
    }
  };

  const logout = async () => {
    try {
      await fetch(`${BACKEND_URL}/auth/signout`, {
        method: "POST",
        credentials: 'include'
      });
    } catch (error) {
      console.error("Error en logout:", error);
    }
    
    setUser(null);
    
    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
    }
    
    router.push('/');
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
```

### 3. Actualizar `app/layout.tsx`

```typescript
import type React from "react";
import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import ClientRootLayout from "./client-root-latout";
import { AuthProvider } from "@/contexts/AuthProvider"; // ⭐ Importar AuthProvider

const nunito = Nunito({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "AlquiGest",
  description: "Sistema de gestión de alquileres para estudio jurídico",
  icons: {
    icon: "/alquigest-circulo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <AuthProvider> {/* ⭐ Envolver con AuthProvider */}
          <ClientRootLayout>{children}</ClientRootLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 4. Actualizar `app/client-root-latout.tsx`

```typescript
"use client"
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthProvider"; // ⭐ Usar el nuevo hook
import ModalLogin from "@/components/modal-login";
import HeaderAlquigest from "@/components/header";
import { usePathname } from "next/navigation";
// ...otros imports...

export default function ClientRootLayout({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth(); // ⭐ Usar hook
  const [showModal, setShowModal] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const pathname = usePathname();
  const isPublicRoute = pathname?.startsWith("/auth/") === true;

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isPublicRoute) {
      setShowModal(true);
    }
  }, [isLoading, isAuthenticated, isPublicRoute]);

  // ...resto del código sin cambios...

  return (
    <div>
      <HeaderAlquigest
        tituloPagina={getTituloPagina(pathname)}
        username={user?.username || ""} // ⭐ Usar user del contexto
        // ...resto props...
      />
      {/* ...resto componentes... */}
    </div>
  );
}
```

### 5. Crear función helper para fetch con credenciales

Crear archivo: `utils/functions/fetchWithCredentials.ts`

```typescript
import BACKEND_URL from "@/utils/backendURL";

export async function fetchWithCredentials(
  endpoint: string,
  options: RequestInit = {}
) {
  const url = endpoint.startsWith('http') ? endpoint : `${BACKEND_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    credentials: 'include', // ⭐ Siempre incluir cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  // Si recibimos 401, redirigir al login
  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      window.location.href = '/';
    }
  }

  return response;
}

// Función helper para GET con manejo de JSON
export async function fetchJSON<T>(endpoint: string): Promise<T> {
  const response = await fetchWithCredentials(endpoint);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}

// Función helper para POST/PUT/DELETE
export async function fetchMutation(
  endpoint: string,
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  body?: any
) {
  const response = await fetchWithCredentials(endpoint, {
    method,
    body: body ? JSON.stringify(body) : undefined,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}
```

### 6. Actualizar componentes que usan `fetchWithToken`

**Antes:**
```typescript
const response = await fetchWithToken(`${BACKEND_URL}/inmuebles`);
```

**Después:**
```typescript
import { fetchJSON } from "@/utils/functions/fetchWithCredentials";

const data = await fetchJSON<Inmueble[]>('/inmuebles');
```

O si necesitas más control:
```typescript
import { fetchWithCredentials } from "@/utils/functions/fetchWithCredentials";

const response = await fetchWithCredentials('/inmuebles');
const data = await response.json();
```

### 7. Ejemplo de migración de componente

**Antes (page.tsx):**
```typescript
const cantInmuebles = await fetchWithToken(`${BACKEND_URL}/inmuebles/count/activos`);
```

**Después:**
```typescript
import { fetchJSON } from "@/utils/functions/fetchWithCredentials";

const cantInmuebles = await fetchJSON<number>('/inmuebles/count/activos');
```

## 🔍 Checklist de Migración

- [ ] Actualizar `auth.ts` para eliminar uso de tokens en localStorage
- [ ] Crear `AuthProvider.tsx` con el contexto de autenticación
- [ ] Envolver aplicación con `<AuthProvider>` en `layout.tsx`
- [ ] Actualizar `client-root-layout.tsx` para usar `useAuth()`
- [ ] Crear función `fetchWithCredentials()` helper
- [ ] Reemplazar todas las llamadas a `fetchWithToken()` por `fetchWithCredentials()`
- [ ] Agregar `credentials: 'include'` a todas las peticiones fetch
- [ ] Probar login/logout
- [ ] Probar protección de rutas
- [ ] Probar refresh de página (debe mantener sesión)

## 🧪 Testing

### Test Manual

1. **Login**
   - Hacer login
   - Verificar en DevTools → Application → Cookies que existe `accessToken`
   - Verificar que `HttpOnly` está marcado

2. **Navegación**
   - Navegar entre páginas
   - Verificar que las peticiones incluyen la cookie automáticamente
   - Refrescar la página (F5) → debe mantener la sesión

3. **Logout**
   - Hacer logout
   - Verificar que la cookie `accessToken` fue eliminada
   - Verificar redirección al login

4. **Sesión expirada**
   - Esperar a que expire el token (1 hora por defecto)
   - Hacer una petición
   - Debe redirigir al login automáticamente

## ⚠️ Problemas Comunes

### Cookie no se envía
**Problema**: Las peticiones no incluyen la cookie
**Solución**: Verificar que todas las peticiones fetch incluyen `credentials: 'include'`

### CORS error
**Problema**: Error de CORS al hacer peticiones
**Solución**: 
- Verificar que el backend tiene configurado `allowCredentials: true`
- Verificar que el frontend está en `allowedOrigins` del backend

### Sesión no persiste al refrescar
**Problema**: Al refrescar la página (F5), se pierde la sesión
**Solución**: 
- Verificar que `checkAuth()` se ejecuta en el `useEffect` de `AuthProvider`
- Verificar que `/auth/me` funciona correctamente

### Redirige al login constantemente
**Problema**: La aplicación redirige al login aunque haya sesión
**Solución**:
- Verificar que `isLoading` se está manejando correctamente
- No mostrar el modal de login mientras `isLoading === true`

## 📚 Recursos

- [MDN - Credentials](https://developer.mozilla.org/en-US/docs/Web/API/Request/credentials)
- [Next.js Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching)
- [React Context](https://react.dev/reference/react/useContext)

## 🎉 Beneficios Finales

✅ Mayor seguridad (protección XSS)
✅ Código más limpio y mantenible
✅ Mejor arquitectura con AuthContext
✅ Compatibilidad con SSR de Next.js
✅ Gestión automática de cookies por el navegador
