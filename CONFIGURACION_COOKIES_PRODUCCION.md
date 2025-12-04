# Configuración de Cookies HttpOnly para Producción

## Problema Detectado

El sistema funciona en local pero en producción las cookies no se guardan correctamente, causando que el usuario tenga que volver a iniciar sesión constantemente.

## Causa Principal

Las cookies HttpOnly requieren configuración específica para funcionar en producción con HTTPS y dominios cruzados.

---

## ✅ Configuración del Backend (Java/Spring Boot)

### 1. AuthController.java - Línea 134

**CAMBIAR ESTO:**
```java
jwtCookie.setSecure(false);   // ❌ NO funciona en producción HTTPS
```

**POR ESTO:**
```java
jwtCookie.setSecure(true);    // ✅ Requerido para HTTPS en producción
jwtCookie.setAttribute("SameSite", "None"); // ✅ Permitir cookies cross-site
```

### 2. Configuración Completa de Cookies

En `AuthController.java`, todas las cookies deben configurarse así:

```java
Cookie jwtCookie = new Cookie(jwtCookieName, jwt);
jwtCookie.setHttpOnly(true);      // ✅ No accesible desde JavaScript (seguridad)
jwtCookie.setSecure(true);        // ✅ Solo HTTPS (producción)
jwtCookie.setPath("/");           // ✅ Disponible en toda la aplicación
jwtCookie.setMaxAge(cookieMaxAge); // ✅ Duración en segundos
jwtCookie.setAttribute("SameSite", "None"); // ✅ Permitir cross-origin con credentials
response.addCookie(jwtCookie);
```

### 3. Variables de Entorno Requeridas

Crear/verificar en el backend:

```properties
# application.properties o variables de entorno
jwt.cookie.name=accessToken
jwt.cookie.max-age=86400

# CORS - Orígenes permitidos (tu dominio de producción)
app.allowed.origins=https://tu-dominio-frontend.com,https://www.tu-dominio-frontend.com

# Si backend y frontend están en subdominios diferentes:
# Ejemplo: api.tudominio.com y app.tudominio.com
# Entonces el Domain de la cookie debe ser: .tudominio.com
```

### 4. SecurityConfig.java - Verificar CORS

Ya está configurado correctamente con:
```java
configuration.setAllowCredentials(true); // ✅ Permitir cookies
```

**IMPORTANTE:** Cuando `allowCredentials(true)`, NO se puede usar `allowedOrigins("*")`. Debes especificar los orígenes exactos:

```java
configuration.setAllowedOrigins(Arrays.asList(
    "https://tu-dominio-frontend.com",
    "https://www.tu-dominio-frontend.com"
));
```

---

## ✅ Configuración del Frontend (Next.js)

### 1. Todas las peticiones deben incluir `credentials: 'include'`

Ya aplicado en:
- ✅ `fetchWithToken.ts` (línea 27)
- ✅ `auth.ts` (líneas 7, 46)
- ✅ `AuthProvider.tsx` (líneas 40, 61, 80)
- ✅ `recuperar-contrasena-card.tsx`
- ✅ `nueva-contrasena-card.tsx`

### 2. Variables de Entorno

En `.env.local` o `.env.production`:

```env
NEXT_PUBLIC_BACKEND_URL=https://api.tu-dominio.com/api
```

---

## 🔍 Checklist de Depuración

### En el navegador (DevTools):

1. **Application/Storage → Cookies**
   - ✅ Debe aparecer una cookie llamada `accessToken`
   - ✅ `HttpOnly`: ✓
   - ✅ `Secure`: ✓ (en HTTPS)
   - ✅ `SameSite`: None
   - ✅ `Domain`: debe ser compatible entre frontend y backend

2. **Network → Headers de las peticiones**
   - ✅ `Cookie: accessToken=...` debe enviarse automáticamente
   - ✅ Request Headers debe incluir la cookie

3. **Network → Response Headers del login**
   - ✅ `Set-Cookie: accessToken=...; HttpOnly; Secure; SameSite=None`

### Si la cookie NO aparece:

❌ **Problema 1: Domain mismatch**
- Frontend: `app.midominio.com`
- Backend: `api.midominio.com`
- Cookie Domain debe ser: `.midominio.com` (con punto inicial)

❌ **Problema 2: HTTPS no configurado**
- `Secure=true` requiere HTTPS
- En desarrollo local usa `Secure=false`

❌ **Problema 3: SameSite=Strict**
- Si frontend y backend están en dominios diferentes, debe ser `SameSite=None`

❌ **Problema 4: CORS**
- El backend debe retornar:
  ```
  Access-Control-Allow-Origin: https://tu-frontend.com
  Access-Control-Allow-Credentials: true
  ```

---

## 🚀 Testing en Producción

### 1. Probar el flujo completo:

```bash
# 1. Login
curl -X POST https://api.tudominio.com/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"tupass"}' \
  -c cookies.txt -v

# 2. Verificar sesión
curl https://api.tudominio.com/api/auth/me \
  -b cookies.txt -v

# 3. Hacer una petición autenticada
curl https://api.tudominio.com/api/propietarios \
  -b cookies.txt -v
```

### 2. En el frontend:

```javascript
// Test rápido en la consola del navegador
fetch('https://api.tudominio.com/api/auth/me', {
  credentials: 'include'
})
  .then(r => r.json())
  .then(console.log)
```

---

## 📝 Cambios Aplicados

### Frontend:
- ✅ `fetchWithToken.ts`: Incluye `credentials: 'include'`
- ✅ `auth.ts`: Login/logout usan `credentials: 'include'`, no guardan token en localStorage
- ✅ `AuthProvider.tsx`: Todas las peticiones usan `credentials: 'include'`
- ✅ Componentes de recuperación de contraseña actualizados

### Backend (PENDIENTE - Debes aplicar):
- ⚠️ Cambiar `setSecure(false)` → `setSecure(true)` en AuthController
- ⚠️ Agregar `setAttribute("SameSite", "None")` en todas las cookies
- ⚠️ Verificar que `app.allowed.origins` contenga tu dominio de producción
- ⚠️ Si backend y frontend están en subdominios, configurar `setDomain(".tudominio.com")`

---

## 🔧 Ejemplo Completo de Cookie en Producción

```java
@PostMapping("/signin")
public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest, HttpServletResponse response) {
    // ... autenticación ...
    
    String jwt = jwtUtils.generateJwtToken(authentication);
    
    Cookie jwtCookie = new Cookie("accessToken", jwt);
    jwtCookie.setHttpOnly(true);
    jwtCookie.setSecure(true);  // ✅ HTTPS obligatorio
    jwtCookie.setPath("/");
    jwtCookie.setMaxAge(86400); // 24 horas
    jwtCookie.setAttribute("SameSite", "None"); // ✅ Cross-origin
    
    // Si frontend y backend están en subdominios diferentes:
    // jwtCookie.setDomain(".tudominio.com"); // ✅ Compartir entre subdominios
    
    response.addCookie(jwtCookie);
    
    return ResponseEntity.ok(userData);
}
```

---

## 🆘 Problemas Comunes

### "La cookie se guarda pero no se envía en las siguientes peticiones"
→ Falta `credentials: 'include'` en algún fetch

### "La cookie no se guarda"
→ Verifica SameSite, Secure y Domain

### "401 Unauthorized después de login exitoso"
→ El middleware del backend no está leyendo la cookie correctamente

### "CORS error"
→ Falta `Access-Control-Allow-Credentials: true` o el origen no está en la whitelist

---

## 📚 Referencias

- [MDN: HTTP Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [SameSite Cookie Explained](https://web.dev/samesite-cookies-explained/)
- [Spring Security CORS](https://docs.spring.io/spring-security/reference/servlet/integrations/cors.html)
