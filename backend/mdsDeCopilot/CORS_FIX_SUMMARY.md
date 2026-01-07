# Solución al Error de CORS con allowCredentials

## Problema
El error `IllegalArgumentException: When allowCredentials is true, allowedOrigins cannot contain the special value "*"` ocurría porque:

1. Teníamos `@CrossOrigin(origins = "*")` en los controladores `AlquilerController` y `AmbitoPDFController`
2. La configuración global tenía `allowCredentials = true` 
3. Spring Security no permite usar `*` como origen cuando las credenciales están habilitadas

## Cambios Realizados

### 1. Eliminación de anotaciones @CrossOrigin conflictivas
- **AlquilerController.java**: Eliminada la anotación `@CrossOrigin(origins = "*")`
- **AmbitoPDFController.java**: Eliminada la anotación `@CrossOrigin(origins = "*", maxAge = 3600)`

### 2. Actualización de allowed.origins
- **application.properties**: Removido el patrón `https://*.vercel.app` ya que causaba conflictos
- Orígenes actuales: `http://localhost:3000,http://localhost:3001,https://alquigest.vercel.app`

### 3. Actualización de GlobalCorsConfig.java
- Cambiado el valor por defecto de `${allowed.origins:*}` a `${allowed.origins:http://localhost:3000,https://alquigest.vercel.app}`

## Actualización en Render

### Variables de Entorno a Actualizar

En el dashboard de Render, actualiza la variable:

```
ALLOWED_ORIGINS=http://localhost:3000,https://alquigest.vercel.app,https://alquigest.onrender.com
```

**IMPORTANTE**: Eliminar la barra final (`/`) de `https://alquigest.vercel.app/`

### Pasos para Aplicar en Render

1. Ve a tu servicio en Render Dashboard
2. Navega a "Environment"
3. Busca la variable `ALLOWED_ORIGINS`
4. Actualízala a: `http://localhost:3000,https://alquigest.vercel.app,https://alquigest.onrender.com`
5. Guarda los cambios
6. Render re-desplegará automáticamente

## Por qué funciona ahora

- **No hay `*` en ninguna configuración CORS**: Todos los orígenes están explícitamente listados
- **Sin conflictos entre configuraciones**: Solo usamos `GlobalCorsConfig` y `SecurityConfig`, sin anotaciones a nivel de controlador
- **allowedOriginPatterns**: Usamos patrones que son compatibles con `allowCredentials = true`

## Configuración Final de CORS

### GlobalCorsConfig.java
```java
.allowedOriginPatterns(allowedOrigins.split(","))
.allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
.allowedHeaders("*")
.allowCredentials(true)
```

### SecurityConfig.java
```java
configuration.setAllowedOriginPatterns(Arrays.asList(origins));
configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
configuration.setAllowedHeaders(Arrays.asList("*"));
configuration.setAllowCredentials(true);
```

## Verificación Local

Para probar localmente:
```bash
cd /home/conrado/Repositorios/Alquigest/backend
mvn clean install -DskipTests
mvn spring-boot:run
```

Luego accede a: `http://localhost:8081/api/health`

## Notas Importantes

- La configuración CORS ahora es consistente en toda la aplicación
- Las cookies HttpOnly funcionarán correctamente con `allowCredentials = true`
- Si necesitas agregar más orígenes en el futuro, añádelos a la variable `ALLOWED_ORIGINS` separados por comas
- **NUNCA uses `*` cuando `allowCredentials = true`**

