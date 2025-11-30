# Historial de Aumentos de Alquileres

## Descripción General

Se ha implementado un sistema completo para mantener un historial de todos los aumentos de alquileres en los contratos. Esta funcionalidad permite:

- Registrar automáticamente cuando se aplica un aumento a un alquiler
- Consultar el historial completo de aumentos de un contrato
- Obtener análisis de aumentos por rango de fechas
- Rastrear el porcentaje y monto de cada aumento

## Estructura Implementada

### 1. Modelo de Datos: `AumentoAlquiler`

**Atributos:**
- `id`: Identificador único
- `contrato`: Referencia al contrato asociado (ManyToOne)
- `fechaAumento`: Fecha en que se aplicó el aumento (formato ISO)
- `montoAnterior`: Monto del alquiler antes del aumento
- `montoNuevo`: Monto del alquiler después del aumento
- `porcentajeAumento`: Porcentaje de aumento aplicado
- `descripcion`: Descripción opcional del aumento
- `createdAt`: Fecha de creación del registro

### 2. DTO: `AumentoAlquilerDTO`

Facilita la comunicación entre controladores y servicios, incluyendo:
- Todos los atributos del modelo
- Constructor que convierte desde la entidad
- Getters y setters para cada atributo

### 3. Repositorio: `AumentoAlquilerRepository`

**Métodos disponibles:**
- `findByContrato(Contrato)`: Obtener todos los aumentos de un contrato
- `findByContratoOrderByFechaAumentoDesc(Contrato)`: Ordenado por fecha descendente
- `findByContratoIdOrderByFechaAumentoDesc(Long)`: Por ID de contrato
- `countByContrato(Contrato)`: Contar aumentos de un contrato
- `findByContratoIdAndFechaAumentoBetween(Long, String, String)`: Rango de fechas

### 4. Servicio: `AumentoAlquilerService`

**Métodos principales:**

#### Consultas
- `obtenerHistorialAumentos(Long contratoId)`: Obtener todos los aumentos de un contrato
- `obtenerAumentoPorId(Long id)`: Obtener un aumento específico
- `obtenerUltimoAumento(Long contratoId)`: Obtener el aumento más reciente
- `obtenerAumentosPorRangoFechas(Long, String, String)`: Aumentos en un rango de fechas
- `contarAumentos(Long contratoId)`: Contar aumentos totales

#### Registros
- `registrarAumento(Long contratoId, AumentoAlquilerDTO)`: Registrar manualmente un aumento
- `registrarAumentoAutomatico(Contrato, BigDecimal, BigDecimal, BigDecimal)`: Registrar automáticamente cuando se aplica

#### Eliminación
- `eliminarAumento(Long id)`: Eliminar un registro de aumento

### 5. Controlador: `AumentoAlquilerController`

**Endpoints disponibles:**

```
GET    /api/aumentos/contrato/{contratoId}           - Historial completo
GET    /api/aumentos/{id}                             - Aumento específico
GET    /api/aumentos/contrato/{contratoId}/ultimo     - Último aumento
GET    /api/aumentos/contrato/{contratoId}/rango      - Rango de fechas
GET    /api/aumentos/contrato/{contratoId}/contar     - Contar aumentos
POST   /api/aumentos/contrato/{contratoId}            - Registrar aumento
DELETE /api/aumentos/{id}                             - Eliminar aumento
```

## Cómo Integrar con el Sistema Actual

### 1. Al generar un alquiler con aumento

En `AlquilerActualizacionService`, cuando se crea un alquiler con monto aumentado:

```java
// Inyectar el servicio
@Autowired
private AumentoAlquilerService aumentoAlquilerService;

// Al aplicar el aumento
if (montoNuevoAlquiler != montoAnterior) {
    aumentoAlquilerService.registrarAumentoAutomatico(
        contrato,
        montoAnterior,
        montoNuevoAlquiler,
        porcentajeAumento
    );
}
```

### 2. Al consultar el historial de un contrato

```java
// En el DTO o respuesta del contrato, se puede incluir:
List<AumentoAlquilerDTO> aumentos = aumentoAlquilerService.obtenerHistorialAumentos(contratoId);
```

### 3. Análisis de aumentos

```java
// Obtener estadísticas
Long totalAumentos = aumentoAlquilerService.contarAumentos(contratoId);
AumentoAlquilerDTO ultimoAumento = aumentoAlquilerService.obtenerUltimoAumento(contratoId);
```

## Ejemplo de Uso con cURL

```bash
# Obtener historial de aumentos de un contrato
curl -X GET "http://localhost:8081/api/aumentos/contrato/1" \
  -H "Authorization: Bearer {token}"

# Obtener aumentos en un rango de fechas
curl -X GET "http://localhost:8081/api/aumentos/contrato/1/rango?fechaInicio=2025-01-01&fechaFin=2025-12-31" \
  -H "Authorization: Bearer {token}"

# Registrar manualmente un aumento
curl -X POST "http://localhost:8081/api/aumentos/contrato/1" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "fechaAumento": "2025-10-25",
    "montoAnterior": 10000.00,
    "montoNuevo": 11000.00,
    "porcentajeAumento": 10.00,
    "descripcion": "Aumento por IPC"
  }'

# Obtener el último aumento
curl -X GET "http://localhost:8081/api/aumentos/contrato/1/ultimo" \
  -H "Authorization: Bearer {token}"

# Contar aumentos
curl -X GET "http://localhost:8081/api/aumentos/contrato/1/contar" \
  -H "Authorization: Bearer {token}"

# Eliminar un aumento
curl -X DELETE "http://localhost:8081/api/aumentos/5" \
  -H "Authorization: Bearer {token}"
```

## Validaciones Implementadas

1. **Contrato debe existir**: Se valida que el contrato ID exista antes de registrar
2. **Datos incompletos**: Se valida que fechas y montos sean proporcionados
3. **Monto nuevo > Monto anterior**: El nuevo monto debe ser mayor
4. **Porcentaje automático**: Se calcula si no se proporciona

## Notas Importantes

- Los registros se guardan con `createdAt` automáticamente
- El porcentaje de aumento se calcula: `((montoNuevo - montoAnterior) / montoAnterior) * 100`
- Los aumentos se ordenan por fecha descendente por defecto
- Se puede eliminar cualquier aumento manualmente si es necesario
- El historial se mantiene indefinidamente para auditoría

## Próximos Pasos Recomendados

1. Integrar `registrarAumentoAutomatico()` en `AlquilerActualizacionService`
2. Agregar endpoint en `ContratoController` para retornar aumentos junto con datos del contrato
3. Crear reportes que incluyan análisis de aumentos
4. Considerar auditoría de quién registró cada aumento (agregar campo `usuarioId`)

