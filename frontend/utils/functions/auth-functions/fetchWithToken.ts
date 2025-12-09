// ⚠️ MIGRADO A COOKIES HTTPONLY
// Esta función ahora usa cookies en lugar de localStorage
// El comportamiento de retorno se mantiene igual para compatibilidad

import BACKEND_URL from "@/utils/backendURL";

export const fetchWithToken = async (url: string, options: RequestInit = {}) => {
  
  // Construir la URL completa si es relativa
  ;
  const fullUrl = url.startsWith("http") ? url : `${BACKEND_URL}${url.startsWith("/") ? url : `/${url}`}`;

  // Construir headers dinámicamente: no forzar Content-Type si el body es FormData
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  const hasContentTypeHeader = Object.keys(headers).some(
    (k) => k.toLowerCase() === "content-type"
  );
  if (!isFormData && !hasContentTypeHeader) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(fullUrl, {
    ...options,
    headers,
    credentials: 'include',
  });

  const contentType = res.headers.get("content-type") || "";

  if (!res.ok) {
    let message = "Error al procesar la solicitud";
    if (res.status === 401 || res.status === 403) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }
      message = "No autorizado, inicia sesión de nuevo";
    } else if (contentType.includes("application/json")) {
      try {
        const errJson = await res.json();
        message = errJson.message || errJson.error || message;
      } catch {
      }
    } else {
      try {
        const errText = await res.text();
        if (errText) message = errText;
      } catch {
        // ignore
      }
    }
    throw new Error(message);
  }

  // Respuesta OK: devolver según tipo
  if (contentType.includes("application/json")) {
    return await res.json();
  }
  if (
    contentType.includes("application/pdf") ||
    contentType.includes("application/octet-stream")
  ) {
    return await res.blob();
  }
  // 204 o sin cuerpo
  if (res.status === 204) {
    return null;
  }
  // Fallback: texto
  return await res.text();
};

