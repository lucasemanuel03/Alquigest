"use client"
import BACKEND_URL from "@/utils/backendURL";


const auth = {
  login: async (username: string, password: string) => {
    const res = await fetch(`${BACKEND_URL}/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // Importante: enviar/recibir cookies HttpOnly
      body: JSON.stringify({ username, password }),
    });

    // Intentar parsear el cuerpo como JSON (tanto en error como en éxito)
    let payload: any = null;
    try {
      payload = await res.json();
    } catch (_) {
      // El backend puede responder 204 u otro sin cuerpo; ignorar
      payload = null;
    }

    if (!res.ok) {
      // Propagar mensaje del backend si existe, junto con el status
      const message = payload?.message || (res.status === 401 ? "Credenciales incorrectas." : "Error al iniciar sesión.");
      const error: any = new Error(message);
      error.status = res.status;
      throw error;
    }

    const data = payload; // { username, email, roles, permisos, accessToken? }

    // En producción usamos cookie HttpOnly; no dependemos de accessToken en body.
    // Guardamos sólo info de usuario para UI.
    if (data) {
      try {
        localStorage.setItem("user", JSON.stringify(data));
      } catch (_) {}
    }

    return { username: data?.username };
  },

  logout: async () => {
    try {
      await fetch(`${BACKEND_URL}/auth/signout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
    } catch (e) {
      console.warn("Error en signout backend:", e);
    }
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      } catch (e) {
        console.warn("No se pudo limpiar localStorage:", e);
      }
    }
  },

  UserEstaLogeado: () => {
    // Con cookie HttpOnly no podemos leer el token aquí.
    // Estrategia: intentamos ping a /auth/me con credenciales; si 200 → logeado.
    return false;
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

  getToken: () => {
    // No disponible en enfoque HttpOnly; las peticiones deben usar credentials: 'include'.
    return null;
  },
};



export default auth;
