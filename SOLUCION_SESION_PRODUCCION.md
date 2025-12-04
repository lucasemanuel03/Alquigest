# 🔧 Solución al Problema de Sesión en Producción

## 🔴 Problema Original
En producción, después de iniciar sesión correctamente, al intentar hacer cualquier petición al backend o realizar acciones en el frontend, el sistema pedía volver a iniciar sesión. Las cookies no se mantenían entre requests.

## 🔍 Causas Identificadas

### 1. **`window.location.reload()` después del login y logout**
**Ubicaciones:**
- `frontend/app/client-root-latout.tsx` (línea 102)
- `frontend/components/user-pill.tsx` (línea 31)

**Problema:** 
- El `reload()` fuerza una recarga completa de la página
- En algunos navegadores/configuraciones, esto puede causar que las cookies recién seteadas se pierdan
- React ya maneja el re-render automáticamente cuando cambia el estado en `AuthProvider`

**Solución:** ✅ Eliminado - dejar que React maneje el estado naturalmente

### 2. **Backend URL hardcoded**
**Ubicación:** `frontend/utils/backendURL.ts`

**Problema:**
- URL hardcoded a producción: `"https://alquigest.onrender.com/api"`
- Dificulta cambiar entre local y producción
- No sigue las mejores prácticas de configuración

**Solución:** ✅ Usar variable de entorno `NEXT_PUBLIC_BACKEND_URL`

### 3. **Archivo duplicado `auth.ts`**
**Ubicación:** `frontend/utils/functions/auth-functions/auth.ts`

**Problema:**
- Hay dos sistemas de autenticación: `auth.ts` y `AuthProvider.tsx`
- Puede causar confusión y comportamientos inconsistentes
- El `auth.ts` ya no se usa pero sigue existiendo

**Nota:** No se eliminó para mantener compatibilidad, pero se actualizó para usar `credentials: 'include'`

---

## ✅ Cambios Aplicados

### 1. Frontend - Eliminar Reloads Innecesarios

**`frontend/app/client-root-latout.tsx`:**
```typescript
// ANTES ❌
onClose={() => {
  setShowNotificaciones(false);
  if (needsReload) {
    window.location.reload();  // ❌ Puede borrar cookies
  }
}}

// DESPUÉS ✅
onClose={() => {
  setShowNotificaciones(false);
  setNeedsReload(false);
  // React maneja el re-render automáticamente
}}
```

**`frontend/components/user-pill.tsx`:**
```typescript
// ANTES ❌
const handleLoginOrLogout = () => {
  if (username === "" && onLoginClick) {
    onLoginClick();
  } else {
    handleLogout();
    window.location.reload();  // ❌ Puede borrar cookies
  }
};

// DESPUÉS ✅
const handleLoginOrLogout = () => {
  if (username === "" && onLoginClick) {
    onLoginClick();
  } else {
    handleLogout(); // AuthProvider maneja la redirección
  }
};
```

### 2. Usar Variable de Entorno para Backend URL

**`frontend/utils/backendURL.ts`:**
```typescript
// ANTES ❌
const BACKEND_URL = "https://alquigest.onrender.com/api";

// DESPUÉS ✅
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://alquigest.onrender.com/api";
```

**Creado:** `frontend/.env.example`
```env
NEXT_PUBLIC_BACKEND_URL=https://alquigest.onrender.com/api
```

### 3. Verificación de Credenciales

**Ya Aplicado Correctamente ✅:**
- `fetchWithToken.ts`: `credentials: 'include'` (línea 27)
- `AuthProvider.tsx`: `credentials: 'include'` en login, logout, checkAuth
- `auth.ts`: `credentials: 'include'` en login, logout
- Todos los componentes de recuperación de contraseña

---

## 🧪 Testing

### Verificar en DevTools del Navegador:

1. **Application/Storage → Cookies**
   - ✅ Debe aparecer `accessToken` después del login
   - ✅ `HttpOnly`: ✓
   - ✅ `Secure`: ✓ (en HTTPS)
   - ✅ `SameSite`: None o Lax

2. **Network → Login Request**
   - ✅ Response debe incluir: `Set-Cookie: accessToken=...`

3. **Network → Siguientes Requests**
   - ✅ Request Headers debe incluir: `Cookie: accessToken=...`
   - ✅ NO debe aparecer error 401/403

### Test Manual:

```bash
# 1. Login
curl -X POST https://alquigest.onrender.com/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"tupass"}' \
  -c cookies.txt -v

# 2. Verificar que la cookie se guardó
cat cookies.txt

# 3. Hacer una petición autenticada
curl https://alquigest.onrender.com/api/auth/me \
  -b cookies.txt -v

# 4. Debería retornar los datos del usuario, NO un 401
```

---

## 🚀 Desplegar Cambios

### Frontend (Vercel/Netlify/etc):

1. **Configurar variable de entorno:**
   ```
   NEXT_PUBLIC_BACKEND_URL=https://alquigest.onrender.com/api
   ```

2. **Rebuild y deploy**

### Si el problema persiste:

1. **Verificar CORS en el backend:**
   - Debe permitir tu dominio específico, NO `"*"`
   - Debe tener `allowCredentials: true`

2. **Verificar configuración de cookies en el backend:**
   - `setSecure(true)` en producción
   - `setAttribute("SameSite", "None")` para cross-origin
   - Si frontend y backend están en diferentes subdominios:
     ```java
     jwtCookie.setDomain(".tudominio.com");
     ```

3. **Limpiar caché del navegador:**
   - Ctrl+Shift+Delete → Borrar cookies y caché
   - Probar en modo incógnito

---

## 📋 Checklist de Verificación

- [x] Eliminar `window.location.reload()` después de login
- [x] Eliminar `window.location.reload()` después de logout
- [x] Usar `NEXT_PUBLIC_BACKEND_URL` en lugar de hardcoded
- [x] Verificar que `fetchWithToken` use `credentials: 'include'`
- [x] Verificar que `AuthProvider` use `credentials: 'include'`
- [x] Crear `.env.example` con variables necesarias
- [ ] Configurar variable de entorno en plataforma de deploy
- [ ] Verificar CORS del backend (permitir origen específico)
- [ ] Verificar cookies del backend (Secure, SameSite, Domain)
- [ ] Probar login → hacer request → debe mantener sesión

---

## 🆘 Si Aún No Funciona

### Diagnóstico en DevTools:

1. **Si la cookie NO aparece:**
   - Problema de CORS o configuración del backend
   - Ver `CONFIGURACION_COOKIES_PRODUCCION.md`

2. **Si la cookie aparece pero NO se envía:**
   - Problema con `SameSite` o `Domain`
   - Verificar que `credentials: 'include'` esté en TODAS las peticiones

3. **Si la cookie se envía pero retorna 401:**
   - El backend no está leyendo la cookie correctamente
   - Verificar que el nombre de la cookie coincida (`accessToken`)

### Logs útiles:

En `AuthProvider.tsx` ya hay logs:
- ✅ Sesión activa: username
- ❌ Sin sesión activa
- ✅ Login exitoso: username

Revisar estos logs en la consola del navegador para diagnosticar.

---

## 📚 Archivos Modificados

1. ✅ `frontend/app/client-root-latout.tsx`
2. ✅ `frontend/components/user-pill.tsx`
3. ✅ `frontend/utils/backendURL.ts`
4. ✅ `frontend/components/modal-login.tsx`
5. ✅ `frontend/.env.example` (creado)

## 📚 Archivos Previamente Actualizados

1. ✅ `frontend/utils/functions/auth-functions/fetchWithToken.ts`
2. ✅ `frontend/utils/functions/auth-functions/auth.ts`
3. ✅ `frontend/contexts/AuthProvider.tsx`
4. ✅ `frontend/components/contrasenas/recuperar-contrasena-card.tsx`
5. ✅ `frontend/components/contrasenas/nueva-contrasena-card.tsx`

---

## 💡 Próximos Pasos Recomendados

1. **Hacer commit de estos cambios:**
   ```bash
   git add .
   git commit -m "fix: eliminar window.reload que borraba cookies de sesión"
   git push
   ```

2. **Configurar variable de entorno en producción**

3. **Probar el flujo completo:**
   - Login → Ver que se guarda la cookie
   - Navegar a otra página → Ver que mantiene la sesión
   - Hacer una acción (crear, editar) → Ver que mantiene la sesión
   - Logout → Ver que se borra la cookie

4. **Si todo funciona, considerar eliminar `auth.ts`** (ya no se usa, todo está en `AuthProvider.tsx`)
