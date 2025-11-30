# 🔐 Implementación de Cookies HttpOnly - AlquiGest

## 📝 Descripción

Implementación de autenticación segura utilizando cookies HttpOnly para almacenar tokens JWT, mejorando significativamente la seguridad al eliminar la vulnerabilidad de almacenamiento en localStorage.

## 🎯 Cambios Principales

### Backend (✅ Completado)

- ✅ Autenticación mediante cookies HttpOnly
- ✅ Nuevo endpoint `/auth/me` para verificación de sesión
- ✅ Configuración CORS actualizada para soportar cookies
- ✅ Logout actualizado para limpiar cookies
- ✅ Refresh token con cookies
- ✅ Compatibilidad retroactiva con headers Authorization

### Frontend (⏳ Pendiente)

- ⏳ Crear AuthContext para gestión de estado
- ⏳ Actualizar función auth.ts
- ⏳ Crear helper fetchWithCredentials
- ⏳ Migrar componentes a nuevo sistema
- ⏳ Agregar `credentials: 'include'` a todas las peticiones

## 📚 Documentación

| Archivo | Descripción |
|---------|-------------|
| `RESUMEN_COOKIES_HTTPONLY.md` | Resumen ejecutivo de los cambios |
| `SEGURIDAD_COOKIES_HTTPONLY.md` | Documentación técnica completa del backend |
| `FRONTEND_MIGRATION_GUIDE.md` | Guía paso a paso para migrar el frontend |
| `test-cookies.sh` | Script de prueba automatizado |

## 🚀 Inicio Rápido

### 1. Configuración

Las propiedades ya están configuradas en `application.properties`:

```properties
# JWT Cookie Configuration
app.jwt.cookieName=accessToken
app.jwt.cookieMaxAge=3600

# CORS Configuration
app.cors.allowedOrigins=http://localhost:3000,http://localhost:3001
```

### 2. Testing del Backend

Ejecutar el script de prueba:

```bash
cd backend
./test-cookies.sh
```

O probar manualmente con cURL:

```bash
# Login
curl -X POST http://localhost:8081/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"username":"tu_usuario","password":"tu_password"}' \
  -c cookies.txt -v

# Verificar sesión
curl -X GET http://localhost:8081/api/auth/me \
  -b cookies.txt -v

# Logout
curl -X POST http://localhost:8081/api/auth/logout \
  -b cookies.txt -v
```

### 3. Verificar en el Navegador

1. Hacer login en la aplicación
2. Abrir DevTools (F12)
3. Ir a Application → Cookies → http://localhost:8081
4. Buscar la cookie `accessToken`
5. Verificar que tiene marcado `HttpOnly` ✅

## 📋 Endpoints Nuevos/Actualizados

### GET `/api/auth/me`
**Nuevo endpoint** para verificar sesión actual

```bash
curl -X GET http://localhost:8081/api/auth/me \
  -b cookies.txt
```

**Respuesta exitosa (200):**
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@example.com",
  "roles": ["ROLE_ADMIN"],
  "permisos": {
    "ver_inmuebles": true,
    "editar_inmuebles": true
  }
}
```

**Sin autenticación (401):**
```json
{
  "message": "No autenticado"
}
```

### POST `/api/auth/signin`
Actualizado para enviar JWT en cookie HttpOnly

**Request:**
```json
{
  "username": "admin",
  "password": "password"
}
```

**Respuesta (200):**
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@example.com",
  "roles": ["ROLE_ADMIN"],
  "permisos": {...}
}
```

**⚠️ Nota:** El token JWT ya NO se incluye en el body, se envía en una cookie HttpOnly.

### POST `/api/auth/logout`
Actualizado para eliminar la cookie

**Respuesta (200):**
```json
{
  "message": "Sesión cerrada exitosamente"
}
```

### POST `/api/auth/refresh`
Actualizado para renovar la cookie con un nuevo JWT

## 🔒 Configuración de Seguridad

### Desarrollo (Actual)

```java
jwtCookie.setHttpOnly(true);   // ✅ No accesible desde JS
jwtCookie.setSecure(false);    // ⚠️ Permitir HTTP (solo desarrollo)
jwtCookie.setPath("/");        // ✅ Disponible en toda la app
jwtCookie.setMaxAge(3600);     // ✅ 1 hora
```

### Producción (Recomendado)

```java
jwtCookie.setHttpOnly(true);   // ✅ No accesible desde JS
jwtCookie.setSecure(true);     // ✅ Solo HTTPS
jwtCookie.setPath("/");        // ✅ Disponible en toda la app
jwtCookie.setMaxAge(3600);     // ✅ 1 hora
jwtCookie.setAttribute("SameSite", "Strict"); // ✅ Protección CSRF
```

## 🛠️ Migración del Frontend

### Paso 1: Actualizar configuración de fetch

**Antes:**
```typescript
const response = await fetch(url, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

**Después:**
```typescript
const response = await fetch(url, {
  credentials: 'include', // ⭐ IMPORTANTE
  headers: {
    'Content-Type': 'application/json'
  }
});
```

### Paso 2: Crear AuthContext

Ver `FRONTEND_MIGRATION_GUIDE.md` para el código completo del `AuthProvider`.

### Paso 3: Verificar sesión al inicio

```typescript
useEffect(() => {
  const checkSession = async () => {
    const res = await fetch(`${BACKEND_URL}/auth/me`, {
      credentials: 'include'
    });
    
    if (res.ok) {
      const user = await res.json();
      setUser(user);
    }
  };
  
  checkSession();
}, []);
```

## ⚠️ Consideraciones Importantes

### CORS
El frontend debe estar en la lista de orígenes permitidos:

```properties
# application.properties
app.cors.allowedOrigins=http://localhost:3000,https://tu-dominio.com
```

### Credenciales
Todas las peticiones fetch deben incluir:

```typescript
credentials: 'include'
```

### HTTPS en Producción
Para que las cookies seguras funcionen, necesitas HTTPS:

1. Obtener certificado SSL/TLS
2. Configurar el servidor
3. Cambiar `setSecure(false)` a `setSecure(true)`

## 🧪 Testing Automatizado

### Ejecutar tests

```bash
cd backend
./test-cookies.sh
```

### Salida esperada

```
================================================
   Test de Autenticación con Cookies HttpOnly
================================================

Test 1: Login
-------------------
✓ Login exitoso (HTTP 200)
✓ Cookie 'accessToken' guardada correctamente

Test 2: Verificar sesión actual
--------------------------------
✓ Sesión verificada exitosamente (HTTP 200)

Test 3: Acceder a endpoint protegido
-------------------------------------
✓ Acceso al endpoint protegido exitoso (HTTP 200)

Test 4: Refresh token
---------------------
✓ Token refrescado exitosamente (HTTP 200)

Test 5: Logout
--------------
✓ Logout exitoso (HTTP 200)

Test 6: Verificar cierre de sesión
-----------------------------------
✓ Sesión cerrada correctamente (HTTP 401 esperado)

================================================
✓ Tests completados!
================================================
```

## 🐛 Troubleshooting

### Cookie no se guarda
**Problema:** La cookie no aparece en el navegador
**Soluciones:**
- Verificar que el backend está corriendo
- Verificar CORS: `allowCredentials: true`
- Verificar que el frontend usa `credentials: 'include'`
- Verificar que el dominio coincide (no mezclar localhost con 127.0.0.1)

### Error 401 en todas las peticiones
**Problema:** Todas las peticiones retornan 401
**Soluciones:**
- Verificar que la cookie se está enviando (Network tab en DevTools)
- Verificar que el token no ha expirado
- Verificar que `credentials: 'include'` está en todas las peticiones

### CORS error
**Problema:** Error de CORS en el navegador
**Soluciones:**
- Verificar que el origen del frontend está en `allowedOrigins`
- Verificar que `allowCredentials: true` está configurado
- No usar `*` en `allowedOrigins` con `allowCredentials: true`

## 📊 Checklist de Implementación

### Backend
- [x] Modificar AuthController para usar cookies
- [x] Agregar endpoint `/auth/me`
- [x] Actualizar JwtAuthenticationFilter
- [x] Configurar CORS
- [x] Actualizar application.properties
- [x] Crear documentación
- [x] Crear script de prueba
- [ ] Testing en desarrollo
- [ ] Configurar para producción

### Frontend
- [ ] Crear AuthProvider
- [ ] Actualizar auth.ts
- [ ] Crear fetchWithCredentials
- [ ] Migrar componentes
- [ ] Testing completo
- [ ] Desplegar a producción

## 🎓 Referencias

- [OWASP - HttpOnly Cookie](https://owasp.org/www-community/HttpOnly)
- [Spring Security CORS](https://docs.spring.io/spring-security/reference/servlet/integrations/cors.html)
- [MDN - HTTP Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [MDN - Fetch Credentials](https://developer.mozilla.org/en-US/docs/Web/API/Request/credentials)

## 📞 Soporte

Para preguntas o problemas:
1. Revisar la documentación en `SEGURIDAD_COOKIES_HTTPONLY.md`
2. Consultar `FRONTEND_MIGRATION_GUIDE.md`
3. Ejecutar `./test-cookies.sh` para verificar el backend
4. Revisar la sección de Troubleshooting

---

**Versión:** 1.0.0  
**Fecha:** Noviembre 2025  
**Estado:** Backend completado ✅ | Frontend pendiente ⏳
