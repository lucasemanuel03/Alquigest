# 🔒 Solución: Cookies HttpOnly no funcionan en Producción

## 📋 Diagnóstico del Problema

### Síntomas
- ✅ Login funciona correctamente en desarrollo (localhost)
- ❌ Login falla en producción (Render)
- ❌ El navegador no guarda la cookie `accessToken`
- ❌ Las solicitudes posteriores no tienen sesión activa

### Causa Raíz
**Problema de Cross-Origin Cookies** entre frontend y backend desplegados en diferentes servicios.

---

## 🔍 Análisis Técnico Profundo

### 1. **URL del Backend Hardcodeada**
**Archivo:** `frontend/utils/backendURL.ts`

**Problema:**
```typescript
const BACKEND_URL = "http://localhost:8081/api"; // ❌ Apunta a localhost en producción
```

**Impacto:**
- En producción, el frontend sigue intentando conectarse a `localhost`
- Las peticiones fallan o van al lugar equivocado
- El navegador no puede establecer cookies desde un origen incorrecto

**Solución aplicada:**
```typescript
const BACKEND_URL = process.env.NODE_ENV === 'production'
  ? process.env.NEXT_PUBLIC_BACKEND_URL || 'https://tu-backend-url.onrender.com/api'
  : "http://localhost:8081/api";
```

---

### 2. **Cookie con `secure: true` requiere HTTPS**
**Archivo:** `backend/src/main/java/com/alquileres/controller/AuthController.java`

**Configuración actual:**
```java
ResponseCookie cookie = ResponseCookie.from(jwtCookieName, jwt)
    .httpOnly(true)    // ✅ Cookie no accesible desde JavaScript
    .secure(true)      // ⚠️ Solo funciona con HTTPS
    .sameSite("None")  // ⚠️ Permite cross-origin, pero requiere Secure
    .path("/")
    .maxAge(cookieMaxAge)
    .build();
```

**Reglas del navegador:**
- `secure: true` → Cookie solo se envía por HTTPS
- `sameSite: "None"` → Permite cookies cross-site
- `sameSite: "None"` **REQUIERE** `secure: true`

**Implicaciones:**
- ✅ Producción (HTTPS): Funciona
- ❌ Localhost (HTTP): Navegadores modernos rechazan la cookie

---

### 3. **Cookie no se agregaba al Response**
**Problema encontrado:**
```java
// ❌ Cookie creada pero NO agregada a la respuesta
ResponseCookie cookie = ResponseCookie.from(...).build();
// Faltaba: response.addHeader("Set-Cookie", cookie.toString());
```

**Solución aplicada:**
```java
ResponseCookie cookie = ResponseCookie.from(jwtCookieName, jwt)
    .httpOnly(true)
    .secure(true)
    .sameSite("None")
    .path("/")
    .maxAge(cookieMaxAge)
    .build();

// ⭐ AGREGAR LA COOKIE A LA RESPUESTA
response.addHeader("Set-Cookie", cookie.toString());
```

---

### 4. **Configuración CORS**
**Archivo:** `backend/src/main/java/com/alquileres/config/SecurityConfig.java`

**Estado actual:**
```java
@Value("${ALLOWED_ORIGINS:http://localhost:3000}")
private String allowedOrigins;

configuration.setAllowedOrigins(Arrays.asList(origins));
configuration.setAllowCredentials(true); // ✅ CRUCIAL para cookies
```

**En `render.yaml`:**
```yaml
- key: ALLOWED_ORIGINS
  value: http://localhost:3000,https://*.onrender.com
```

**Problema potencial:** El wildcard `*.onrender.com` puede no funcionar correctamente.

---

## ✅ Soluciones Implementadas

### 1. ✅ Frontend: URL dinámica del backend
```typescript
// frontend/utils/backendURL.ts
const BACKEND_URL = process.env.NODE_ENV === 'production'
  ? process.env.NEXT_PUBLIC_BACKEND_URL || 'https://tu-backend-url.onrender.com/api'
  : "http://localhost:8081/api";
```

### 2. ✅ Backend: Agregar cookie al response
```java
// AuthController.java - signin
response.addHeader("Set-Cookie", cookie.toString());
```

---

## 🚀 Pasos para Completar la Solución

### **Paso 1: Configurar URL del Backend en Frontend**

1. Crear archivo `.env.production` en `frontend/`:
```bash
NEXT_PUBLIC_BACKEND_URL=https://alquigest-backend.onrender.com/api
```

2. O agregar variable de entorno en tu servicio de hosting del frontend.

### **Paso 2: Actualizar ALLOWED_ORIGINS en Backend**

**Opción A: Usar URL específica (Recomendado)**
```yaml
# render.yaml
- key: ALLOWED_ORIGINS
  value: http://localhost:3000,https://tu-frontend.vercel.app,https://tu-frontend.onrender.com
```

**Opción B: Configurar dinámicamente**
```java
// SecurityConfig.java - Modificar si es necesario
configuration.setAllowedOriginPatterns(Arrays.asList(origins));
// En lugar de:
// configuration.setAllowedOrigins(Arrays.asList(origins));
```

### **Paso 3: Verificar Configuración de Cookies**

Asegúrate de que TODOS los endpoints que manejan cookies tengan:
```java
response.addHeader("Set-Cookie", cookie.toString());
```

**Archivos a revisar:**
- ✅ `/auth/signin` - **YA CORREGIDO**
- ⚠️ `/auth/logout` - Verificar
- ⚠️ `/auth/refresh` - Verificar

### **Paso 4: Testing**

#### **A) En Desarrollo (localhost):**
```bash
# Frontend
cd frontend
npm run dev

# Backend
cd backend
./mvnw spring-boot:run
```

**Verificar:**
- ✅ Login funciona
- ✅ Cookie se guarda en DevTools → Application → Cookies
- ✅ Peticiones subsiguientes incluyen la cookie

#### **B) En Producción:**
```bash
# Desplegar cambios
git add .
git commit -m "fix: cookies cross-origin en producción"
git push origin main
```

**Verificar en el navegador:**
1. Abrir DevTools → Network
2. Login → Ver headers de la respuesta
3. Buscar: `Set-Cookie: accessToken=...`
4. Verificar en Application → Cookies

---

## 🔍 Debug: Cómo Verificar Cookies

### **Chrome DevTools:**
1. F12 → **Application** tab
2. **Cookies** → Selecciona tu dominio
3. Busca `accessToken`
4. Verifica:
   - ✅ `HttpOnly`: Sí
   - ✅ `Secure`: Sí
   - ✅ `SameSite`: None
   - ✅ `Domain`: Tu dominio del backend
   - ✅ `Path`: /

### **Network Tab:**
```
Request Headers:
Cookie: accessToken=eyJhbGciOiJIUzUxMiJ9...

Response Headers:
Set-Cookie: accessToken=eyJhbGc...; Path=/; Secure; HttpOnly; SameSite=None
```

---

## 🛡️ Consideraciones de Seguridad

### **SameSite="None" en Producción**
```java
.sameSite("None")  // Permite cross-origin
.secure(true)      // HTTPS obligatorio
```

**Riesgos:**
- Permite cookies en contextos cross-site
- Potencialmente vulnerable a CSRF si no se implementan otras protecciones

**Mitigaciones:**
1. ✅ `HttpOnly`: Protege contra XSS
2. ✅ `Secure`: Solo HTTPS
3. ⚠️ Implementar CSRF tokens (opcional, ya que JWT en sí ofrece protección)

### **Alternativa: Mismo Dominio**
Si frontend y backend están en subdiminios del mismo dominio:
```
frontend: https://app.tudominio.com
backend:  https://api.tudominio.com
```

Podrías usar:
```java
.sameSite("Lax")  // Más seguro
.domain(".tudominio.com")  // Compartido entre subdominios
```

---

## 📊 Comparación: Local vs Producción

| Aspecto | Local | Producción |
|---------|-------|------------|
| **Protocolo** | HTTP | HTTPS |
| **Dominios** | Mismo (localhost) | Diferentes |
| **SameSite** | Lax funciona | Requiere None |
| **Secure** | False funciona | True requerido |
| **CORS** | Simple | Crítico |

---

## ⚠️ Problemas Comunes y Soluciones

### **1. Cookie no aparece en DevTools**
**Causas:**
- ❌ Backend no envía `Set-Cookie` header
- ❌ URL del backend incorrecta
- ❌ CORS no permite credentials

**Solución:**
```javascript
// Verificar en Network → Response Headers
// Debe aparecer: Set-Cookie: accessToken=...
```

### **2. Cookie se guarda pero no se envía**
**Causas:**
- ❌ `credentials: 'include'` falta en fetch
- ❌ `SameSite` incompatible

**Solución:**
```typescript
fetch(url, {
  credentials: 'include'  // ⭐ CRUCIAL
})
```

### **3. Error CORS en producción**
**Causas:**
- ❌ `ALLOWED_ORIGINS` no incluye la URL del frontend
- ❌ `allowCredentials: true` falta

**Solución:**
```yaml
ALLOWED_ORIGINS: https://tu-frontend-exacto.vercel.app
```

---

## 🎯 Checklist Final

Antes de desplegar, verifica:

### **Backend:**
- [ ] `response.addHeader("Set-Cookie", cookie.toString())` en `/signin`
- [ ] `ALLOWED_ORIGINS` incluye la URL exacta del frontend
- [ ] `allowCredentials(true)` en CORS config
- [ ] `secure: true` en cookie
- [ ] `sameSite: "None"` en cookie

### **Frontend:**
- [ ] `NEXT_PUBLIC_BACKEND_URL` configurada
- [ ] `credentials: 'include'` en TODOS los fetch
- [ ] Middleware verifica cookie `accessToken`

### **Testing:**
- [ ] Login funciona en local
- [ ] Login funciona en producción
- [ ] Cookie aparece en DevTools
- [ ] Peticiones subsiguientes tienen sesión activa

---

## 📚 Referencias

- [MDN: SameSite cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)
- [OWASP: Secure Cookie Attribute](https://owasp.org/www-community/controls/SecureCookieAttribute)
- [Chrome: SameSite Cookie Changes](https://www.chromium.org/updates/same-site)

---

## 🆘 Soporte Adicional

Si el problema persiste:

1. **Verificar logs del backend:**
```bash
# En Render, ver logs del servicio
```

2. **Capturar request/response completo:**
```bash
# DevTools → Network → Seleccionar request → Headers
```

3. **Testear con curl:**
```bash
curl -v -X POST https://tu-backend.onrender.com/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}' \
  -c cookies.txt
```

---

**Última actualización:** 4 de diciembre de 2025
