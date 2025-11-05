import BACKEND_URL from "@/utils/backendURL";

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

/**
 * Función helper para hacer peticiones fetch con cookies incluidas automáticamente.
 * Reemplaza a fetchWithToken ya que los tokens ahora se manejan con cookies HttpOnly.
 */
export async function fetchWithCredentials(
  endpoint: string,
  options: FetchOptions = {}
) {
  const { skipAuth = false, ...fetchOptions } = options;

  const url = endpoint.startsWith("http") ? endpoint : `${BACKEND_URL}${endpoint}`;

  const response = await fetch(url, {
    ...fetchOptions,
    credentials: 'include', // ⭐ CLAVE: Incluir cookies siempre
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
  });

  // Si recibimos 401 y no es un endpoint público, disparar evento
  if (response.status === 401 && !skipAuth) {
    console.warn("⚠️ Sesión expirada o sin autenticación");
    // Disparar evento personalizado para que otros componentes puedan reaccionar
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
  }

  return response;
}

/**
 * Helper para parsear respuestas JSON con manejo de errores
 */
export async function fetchJSON<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const response = await fetchWithCredentials(`${BACKEND_URL}${endpoint}`, options);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Helper para peticiones POST/PUT/DELETE
 */
export async function fetchMutation<T = any>(
  endpoint: string,
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  body?: any
): Promise<T> {
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

/**
 * Alias para compatibilidad con código existente.
 * Permite migración gradual desde fetchWithToken.
 */
export const fetchWithToken = fetchWithCredentials;
