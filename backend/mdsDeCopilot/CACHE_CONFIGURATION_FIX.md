# Solución al Error de Cache: "Cannot find cache named"

## Problema
Se generaba el error: `Cannot find cache named 'contratos-vigentes-count' for Builder[...]`

Esto ocurría porque:
1. Había anotaciones `@Cacheable` en `ContratoService` usando nombres de cache que no estaban registrados
2. Específicamente faltaban:
   - `contratos-vigentes-count`
   - `contratos-proximos-vencer-count`
3. El `CacheConfig.devCacheManager()` no incluía todos los nombres de cache necesarios

## Cambios Realizados

### 1. Actualización de CacheNames.java
Se agregaron dos nuevas constantes:
```java
public static final String CONTRATOS_VIGENTES_COUNT = "contratos-vigentes-count";
public static final String CONTRATOS_PROXIMOS_VENCER_COUNT = "contratos-proximos-vencer-count";
```

### 2. Actualización de CacheConfig.java
Se extendió la lista de cachés en el método `devCacheManager()` para incluir:
- contratos-vigentes-count
- contratos-proximos-vencer-count
- Todos los demás cachés utilizados en la aplicación (alquileres, inmuebles, inquilinos, propietarios, servicios)

### 3. Actualización de ContratoService.java
Se reemplazaron los strings literales con constantes de `CacheNames`:
- `@Cacheable("contratos-vigentes-count")` → `@Cacheable(CacheNames.CONTRATOS_VIGENTES_COUNT)`
- `@Cacheable(value = "contratos-proximos-vencer-count", key = "#diasAntes")` → `@Cacheable(value = CacheNames.CONTRATOS_PROXIMOS_VENCER_COUNT, key = "#diasAntes")`

## Beneficios

1. **Consistencia**: Todos los nombres de cache están centralizados en `CacheNames.java`
2. **Prevención de errores**: Evita typos al escribir nombres de cache
3. **Mantenibilidad**: Cambios de nombres de cache se hacen en un solo lugar
4. **Completitud**: Todos los cachés utilizados están ahora registrados en la configuración

## Cachés Registrados

### En Memoria (Desarrollo - ConcurrentMapCacheManager)
- contratos
- contratos-vigentes
- contratos-vigentes-count
- contratos-no-vigentes
- contratos-proximos-vencer
- contratos-proximos-vencer-count
- contratos-inmueble
- contratos-inquilino
- contrato-id
- contrato-existe
- inmueble-contrato-vigente
- alquileres
- alquileres-pendientes
- inmuebles
- inquilinos
- propietarios
- servicios
- servicios-contrato

### En Redis (Producción)
TTL: 1 hora para todos los cachés

## Testing

Para probar que todo funciona correctamente:

```bash
cd /home/conrado/Repositorios/Alquigest/backend
mvn clean install -DskipTests
mvn spring-boot:run
```

Luego acceder a endpoints que usen cache:
- `GET /api/contratos/count/vigentes` - Usa `CONTRATOS_VIGENTES_COUNT`
- `GET /api/contratos` - Usa `CONTRATOS`
- `GET /api/contratos/proximos-vencer/{dias}` - Usa `CONTRATOS_PROXIMOS_VENCER`

## Notas Importantes

- El sistema ahora automáticamente usa `ConcurrentMapCacheManager` en desarrollo (sin Redis)
- En producción (con Redis configurado), usará `RedisCacheManager` con TTL de 1 hora
- Los cachés se invalidan correctamente con `@CacheEvict` en operaciones de creación/actualización/eliminación

