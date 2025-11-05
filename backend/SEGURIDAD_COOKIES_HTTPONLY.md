# Implementación de Cookies HttpOnly para JWT

## 📋 Resumen de Cambios

Este documento describe la implementación de cookies HttpOnly para almacenar tokens JWT, mejorando significativamente la seguridad de la aplicación al eliminar el almacenamiento de tokens en localStorage.

## 🔒 Ventajas de Seguridad

### Antes (localStorage)
- ❌ Vulnerable a ataques XSS (Cross-Site Scripting)
- ❌ Accesible desde JavaScript malicioso
- ❌ Puede ser robado por scripts de terceros
- ❌ Expuesto en el código del frontend

### Después (Cookies HttpOnly)
- ✅ No accesible desde JavaScript
- ✅ Protección contra XSS
- ✅ Protección CSRF con SameSite
- ✅ Gestionado automáticamente por el navegador
- ✅ Más seguro para aplicaciones empresariales

## 🔧 Cambios Implementados

### 1. Backend - AuthController.java

#### Endpoint `/signin` (Login)
- **Cambio principal**: El JWT ahora se envía en una cookie HttpOnly en lugar del body de la respuesta
- **Configuración de cookie**:
  - `HttpOnly`: true → No accesible desde JavaScript
  - `Secure`: false (cambiar a true en producción con HTTPS)
  - `Path`: / → Disponible en toda la aplicación
  - `MaxAge`: 3600 segundos (1 hora)
  - `SameSite`: Strict (opcional, requiere Spring 6.1+)

```java
Cookie jwtCookie = new Cookie(jwtCookieName, jwt);
jwtCookie.setHttpOnly(true);
jwtCookie.setSecure(false); // Cambiar a true en producción
jwtCookie.setPath("/");
jwtCookie.setMaxAge(cookieMaxAge);
response.addCookie(jwtCookie);
```

#### Nuevo Endpoint `/me`
- **Propósito**: Verificar sesión actual del usuario
- **Funcionalidad**:
  - Lee el JWT desde la cookie
  - Valida el token
  - Retorna información del usuario autenticado
- **Uso**: Para que el frontend verifique si hay una sesión activa al cargar la aplicación

#### Endpoint `/logout`
- **Actualización**: Ahora elimina la cookie en lugar de solo invalidar el token
- **Implementación**:
  ```java
  Cookie jwtCookie = new Cookie(jwtCookieName, null);
  jwtCookie.setMaxAge(0); // Eliminar cookie
  response.addCookie(jwtCookie);
  ```

#### Endpoint `/refresh`
- **Actualización**: Lee el token desde la cookie y genera una nueva cookie con el token renovado

### 2. Backend - JwtAuthenticationFilter.java

#### Método `parseJwt()` actualizado
- **Prioridad**: Primero intenta leer desde la cookie
- **Fallback**: Si no encuentra cookie, intenta leer desde el header Authorization (compatibilidad)

```java
private String parseJwt(HttpServletRequest request) {
    // Primero buscar en cookies
    Cookie[] cookies = request.getCookies();
    if (cookies != null) {
        for (Cookie cookie : cookies) {
            if (jwtCookieName.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
    }
    
    // Fallback a header Authorization
    String headerAuth = request.getHeader("Authorization");
    if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
        return headerAuth.substring(7);
    }
    
    return null;
}
```

### 3. Backend - SecurityConfig.java

#### Configuración CORS actualizada
- **allowCredentials**: true → Permite el envío de cookies
- **allowedOrigins**: Configurado desde application.properties
- **exposedHeaders**: Incluye "Token-Refreshed" para notificar al frontend

```java
configuration.setAllowCredentials(true); // Permitir cookies
configuration.setExposedHeaders(Arrays.asList("Token-Refreshed"));
```

### 4. Backend - application.properties

#### Nuevas propiedades añadidas:
```properties
# JWT Cookie Configuration
app.jwt.cookieName=accessToken
app.jwt.cookieMaxAge=3600

# CORS Configuration
app.cors.allowedOrigins=${ALLOWED_ORIGINS:http://localhost:3000,http://localhost:3001}
```

## 🚀 Configuración para Producción

### application.properties (Producción)
```properties
# JWT Cookie Configuration
app.jwt.cookieName=accessToken
app.jwt.cookieMaxAge=3600

# CORS Configuration - Actualizar con tu dominio de producción
app.cors.allowedOrigins=https://tu-dominio.com
```

### Cambios necesarios en el código para producción:

1. **Activar Secure flag** en todas las cookies:
```java
jwtCookie.setSecure(true); // Solo funciona con HTTPS
```

2. **Descomentar SameSite** (si usas Spring 6.1+):
```java
jwtCookie.setAttribute("SameSite", "Strict");
```

3. **Configurar certificado SSL/TLS** en el servidor

## 📝 Endpoints Actualizados

| Endpoint | Método | Cambios | Cookie |
|----------|--------|---------|--------|
| `/api/auth/signin` | POST | Envía JWT en cookie HttpOnly | ✅ Crea |
| `/api/auth/logout` | POST | Elimina la cookie | ❌ Elimina |
| `/api/auth/me` | GET | **NUEVO** - Verifica sesión actual | ➖ Lee |
| `/api/auth/refresh` | POST | Renueva cookie con nuevo JWT | 🔄 Actualiza |

## 🔍 Testing

### Probar con cURL

#### Login
```bash
curl -X POST http://localhost:8081/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}' \
  -c cookies.txt \
  -v
```

#### Verificar sesión
```bash
curl -X GET http://localhost:8081/api/auth/me \
  -b cookies.txt \
  -v
```

#### Logout
```bash
curl -X POST http://localhost:8081/api/auth/logout \
  -b cookies.txt \
  -c cookies.txt \
  -v
```

### Probar en navegador

1. Hacer login
2. Abrir DevTools → Application/Storage → Cookies
3. Verificar que existe la cookie `accessToken` con:
   - HttpOnly: ✅
   - Secure: ❌ (en desarrollo) / ✅ (en producción)
   - Path: /
   - Expires: 1 hora desde el login

## ⚠️ Compatibilidad

El sistema mantiene **compatibilidad hacia atrás** con el método anterior:
- Si el frontend envía el token en el header `Authorization: Bearer <token>`, seguirá funcionando
- Esto permite una migración gradual del frontend

## 🔄 Próximos Pasos

### Frontend (Recomendado)
1. Crear `AuthContext` para manejar el estado de autenticación
2. Eliminar acceso directo a `localStorage` para tokens
3. Usar `credentials: 'include'` en todas las peticiones fetch
4. Implementar verificación de sesión al iniciar la aplicación
5. Manejar renovación automática de tokens

Ver documentación del frontend para los cambios necesarios allí.

## 📚 Recursos Adicionales

- [OWASP - HttpOnly Cookie](https://owasp.org/www-community/HttpOnly)
- [MDN - SameSite Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)
- [Spring Security CORS](https://docs.spring.io/spring-security/reference/servlet/integrations/cors.html)

## 🐛 Troubleshooting

### Cookie no se está enviando
- Verificar que `credentials: 'include'` está en las peticiones fetch
- Verificar configuración CORS: `allowCredentials: true`
- Verificar que el origen está en `allowedOrigins`

### Error de CORS
- Verificar `app.cors.allowedOrigins` en application.properties
- No usar `allowedOriginPatterns("*")` con `allowCredentials(true)`

### Cookie no visible en DevTools
- Las cookies HttpOnly no son accesibles desde JavaScript, pero sí visibles en DevTools
- Verificar en: DevTools → Application → Cookies

### Token expira muy rápido
- Ajustar `app.jwt.cookieMaxAge` en application.properties
- Valor en segundos (3600 = 1 hora)
