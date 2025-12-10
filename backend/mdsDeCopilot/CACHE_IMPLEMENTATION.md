# Implementación de Cache en Alquigest

## Descripción General
Se ha implementado un sistema completo de caché en la aplicación Alquigest para mejorar el rendimiento, especialmente en las consultas de contratos que son frecuentemente accedidas.

## Configuración de Cache

### 1. **CacheConfig.java**
Archivo de configuración que establece:
- **Redis Cache** (Producción): TTL de 1 hora para datos en producción
- **ConcurrentMapCacheManager** (Desarrollo): Cache en memoria para desarrollo local

```java
@Configuration
@EnableCaching
public class CacheConfig {
    // Redis para producción con TTL de 1 hora
    // ConcurrentMapCacheManager para desarrollo
}
```

### 2. **CacheNames.java**
Constantes centralizadas para los nombres de los cachés, evitando errores de tipeo y facilitando mantenimiento.

**Cachés Implementados:**
- `CONTRATOS` - Todos los contratos
- `CONTRATOS_VIGENTES` - Contratos con estado vigente
- `CONTRATOS_NO_VIGENTES` - Contratos no vigentes
- `CONTRATOS_PROXIMOS_VENCER` - Contratos próximos a vencer
- `CONTRATOS_POR_INMUEBLE` - Contratos agrupados por inmueble
- `CONTRATOS_POR_INQUILINO` - Contratos agrupados por inquilino
- `CONTRATO_POR_ID` - Contrato individual por ID
- `CONTRATO_EXISTE` - Verificación de existencia de contrato
- `INMUEBLE_TIENE_CONTRATO_VIGENTE` - Verificación de contrato vigente en inmueble
- `SERVICIOS_POR_CONTRATO` - Servicios asociados a un contrato

## Servicios Actualizados

### ContratoService

**Métodos con @Cacheable (Lectura):**
- `obtenerTodosLosContratos()` - Cache: `CONTRATOS`
- `obtenerContratoPorId(Long id)` - Cache: `CONTRATO_POR_ID` (key: id)
- `obtenerContratosPorInmueble(Long inmuebleId)` - Cache: `CONTRATOS_POR_INMUEBLE` (key: inmuebleId)
- `obtenerContratosPorInquilino(Long inquilinoId)` - Cache: `CONTRATOS_POR_INQUILINO` (key: inquilinoId)
- `obtenerContratosVigentes()` - Cache: `CONTRATOS_VIGENTES`
- `obtenerContratosNoVigentes()` - Cache: `CONTRATOS_NO_VIGENTES`
- `contarContratosVigentes()` - Cache: `contratos-vigentes-count`
- `obtenerContratosProximosAVencer(int diasAntes)` - Cache: `CONTRATOS_PROXIMOS_VENCER` (key: diasAntes)
- `contarContratosProximosAVencer(int diasAntes)` - Cache: `contratos-proximos-vencer-count` (key: diasAntes)
- `existeContrato(Long id)` - Cache: `CONTRATO_EXISTE` (key: id)
- `inmuebleTieneContratoVigente(Long inmuebleId)` - Cache: `INMUEBLE_TIENE_CONTRATO_VIGENTE` (key: inmuebleId)

**Métodos con @CacheEvict (Escritura):**
- `crearContrato(ContratoCreateDTO)` - Invalida: CONTRATOS, CONTRATOS_VIGENTES, CONTRATOS_NO_VIGENTES, CONTRATOS_PROXIMOS_VENCER, CONTRATOS_POR_INMUEBLE, CONTRATOS_POR_INQUILINO, INMUEBLE_TIENE_CONTRATO_VIGENTE
- `terminarContrato(Long id, EstadoContratoUpdateDTO)` - Invalida todos los cachés de contratos
- `guardarPdf(Long id, byte[], String)` - Invalida: CONTRATO_POR_ID

### InquilinoService

**Métodos con @CacheEvict:**
- `crearInquilino()` - Invalida cachés de contratos relacionados
- `actualizarInquilino()` - Invalida cachés de contratos relacionados
- `desactivarInquilino()` - Invalida cachés de contratos relacionados
- `activarInquilino()` - Invalida cachés de contratos relacionados

### PropietarioService

**Métodos con @CacheEvict:**
- `crearPropietario()` - Invalida cachés de contratos relacionados
- `actualizarPropietario()` - Invalida cachés de contratos relacionados

### InmuebleService

**Métodos con @CacheEvict:**
- `crearInmueble()` - Invalida cachés de contratos relacionados
- `actualizarInmueble()` - Invalida cachés de contratos relacionados
- `eliminarInmueble()` - Invalida cachés de contratos relacionados

### ServicioContratoService

**Métodos con @CacheEvict:**
- `crearServicio()` - Invalida cachés de contratos y servicios
- `crearServicioCompleto()` - Invalida cachés de contratos y servicios
- `actualizarServicio()` - Invalida cachés de contratos y servicios
- `desactivarServicio()` - Invalida cachés de contratos y servicios
- `reactivarServicio()` - Invalida cachés de contratos y servicios
- `reactivarServicioConFecha()` - Invalida cachés de contratos y servicios
- `desactivarServiciosDeContrato()` - Invalida cachés de contratos y servicios

## Estrategia de Invalidación de Cache

### Principio Core
Cuando se modifica cualquier entidad relacionada con contratos (Inquilino, Propietario, Inmueble, ServicioContrato), se invalidan TODOS los cachés de contratos para garantizar consistencia de datos.

**Justificación:**
- Los datos de contratos dependen de múltiples entidades relacionadas
- Un cambio en un inquilino, propietario o inmueble puede afectar la visualización de los contratos
- Es mejor invalidar todos los cachés que mantener cachés inconsistentes

### Cascada de Invalidación
```
Crear/Actualizar Inquilino → Invalida Cachés de Contratos
Crear/Actualizar Propietario → Invalida Cachés de Contratos
Crear/Actualizar Inmueble → Invalida Cachés de Contratos
Crear/Actualizar Servicio → Invalida Cachés de Contratos
Crear/Actualizar Contrato → Invalida Todos los Cachés Relacionados
```

## Configuración en Producción (Render)

Para producción, asegúrese de que las variables de entorno de Redis estén configuradas:

```properties
spring.data.redis.host=<your-redis-host>
spring.data.redis.port=6379
spring.data.redis.password=<your-redis-password>
```

Si Redis no está disponible, el sistema automáticamente utilizará ConcurrentMapCacheManager.

## TTL (Time To Live)

- **Redis**: 1 hora (3600 segundos)
- **ConcurrentMapCacheManager**: Sin expiración automática (se invalida manualmente)

## Impacto en el Rendimiento

### Mejoras Esperadas
1. **Reducción de consultas a BD**: Las consultas frecuentes al endpoint `/api/contratos` serán servidas desde cache
2. **Mejor tiempo de respuesta**: Especialmente notable en endpoints de lectura
3. **Menor carga de BD**: Reducción en queries repetidas

### Métricas de Caché
- Cache invalidation happen on write operations (INSERT, UPDATE, DELETE)
- Cache hits on repeated read operations within TTL
- Automatic cleanup after TTL expiration (Redis)

## Próximas Mejoras Recomendadas

1. **Cachear endpoints de Alquileres**: Implementar cache en `AlquilerService`
2. **Cache de Notificaciones**: Cache de notificaciones pendientes
3. **Monitoreo de Cache**: Implementar métricas de hit/miss ratio
4. **Cache Warming**: Pre-cargar datos críticos al startup
5. **Cache Segmentado**: Separar cachés por usuario si es necesario

## Testing del Cache

Para validar que el cache está funcionando:

```bash
# Primer request (cache miss)
curl http://localhost:8080/api/contratos

# Segundo request (cache hit - más rápido)
curl http://localhost:8080/api/contratos

# Crear un contrato (invalida cache)
curl -X POST http://localhost:8080/api/contratos -d '...'

# Request después de modificación (cache miss, datos actualizados)
curl http://localhost:8080/api/contratos
```

## Archivos Modificados

1. `/backend/src/main/java/com/alquileres/config/CacheConfig.java` - **CREADO**
2. `/backend/src/main/java/com/alquileres/config/CacheNames.java` - **CREADO**
3. `/backend/src/main/java/com/alquileres/service/ContratoService.java` - MODIFICADO
4. `/backend/src/main/java/com/alquileres/service/InquilinoService.java` - MODIFICADO
5. `/backend/src/main/java/com/alquileres/service/PropietarioService.java` - MODIFICADO
6. `/backend/src/main/java/com/alquileres/service/InmuebleService.java` - MODIFICADO
7. `/backend/src/main/java/com/alquileres/service/ServicioContratoService.java` - MODIFICADO

## Notas Importantes

- ✅ El cache es transparente para los controladores (no requieren cambios)
- ✅ La invalidación es automática según las anotaciones @CacheEvict
- ✅ Compatible con Redis en producción y memoria local en desarrollo
- ✅ Soporta parámetros de método como claves de cache (ver `key = "#id"`)
- ⚠️ Cambios en una entidad relacionada invalida todos los cachés de contratos (trade-off: consistencia vs rendimiento)

