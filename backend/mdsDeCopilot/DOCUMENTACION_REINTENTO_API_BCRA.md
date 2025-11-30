# Documentación: Reintento Automático de Consulta API BCRA

## Resumen

Se ha implementado un mecanismo de reintento automático para alquileres que necesitan aumento manual. Cuando se consultan los alquileres pendientes de actualización manual, el sistema automáticamente reintenta obtener los índices ICL de la API del BCRA y, si tiene éxito, aplica el aumento sin intervención del usuario.

## Comportamiento

### Endpoint: GET /api/alquileres/aumento-manual/pendientes

**Antes de la modificación:**
- Simplemente devolvía la lista de alquileres con `necesitaAumentoManual = true`

**Después de la modificación:**
1. Obtiene todos los alquileres con `necesitaAumentoManual = true`
2. Para cada alquiler:
   - Verifica si el contrato aumenta con ICL (`aumentaConIcl = true`)
   - Reintenta la consulta a la API del BCRA
   - Si la consulta tiene éxito:
     - Calcula el nuevo monto con la tasa obtenida
     - Actualiza el alquiler automáticamente
     - Registra el aumento en el historial
     - Marca `necesitaAumentoManual = false`
   - Si la consulta falla:
     - Mantiene el alquiler en la lista de pendientes
     - Registra un log de advertencia
3. Devuelve solo los alquileres que **AÚN** necesitan intervención manual

## Flujo de Trabajo Actualizado

### Escenario 1: API del BCRA funciona en el reintento

```
1. Usuario consulta: GET /api/alquileres/aumento-manual/pendientes
2. Sistema encuentra alquiler con necesitaAumentoManual = true
3. Sistema reintenta consulta a API del BCRA
4. ✅ API responde exitosamente
5. Sistema calcula nuevo monto automáticamente
6. Sistema actualiza alquiler (necesitaAumentoManual = false)
7. Sistema registra aumento en historial
8. Sistema NO devuelve este alquiler en la respuesta (ya está resuelto)
```

### Escenario 2: API del BCRA sigue fallando

```
1. Usuario consulta: GET /api/alquileres/aumento-manual/pendientes
2. Sistema encuentra alquiler con necesitaAumentoManual = true
3. Sistema reintenta consulta a API del BCRA
4. ❌ API falla nuevamente
5. Sistema mantiene alquiler pendiente
6. Sistema devuelve este alquiler en la respuesta
7. Usuario debe aplicar aumento manual usando POST /api/alquileres/{id}/aumento-manual
```

## Código Implementado

### AlquilerService.java

```java
public List<AlquilerDTO> obtenerAlquileresConAumentoManualPendiente() {
    List<Alquiler> alquileres = alquilerRepository.findByNecesitaAumentoManualTrueAndEsActivoTrue();
    
    logger.info("Encontrados {} alquileres pendientes. Reintentando API del BCRA...", 
               alquileres.size());

    List<Alquiler> alquileresPendientes = new ArrayList<>();
    int actualizadosExitosamente = 0;

    for (Alquiler alquiler : alquileres) {
        try {
            Contrato contrato = alquiler.getContrato();
            
            // Solo reintentar si aumenta con ICL
            if (!Boolean.TRUE.equals(contrato.getAumentaConIcl())) {
                alquileresPendientes.add(alquiler);
                continue;
            }

            // Obtener fechas y reintentar consulta API
            String fechaInicio = contrato.getFechaAumento();
            String fechaFin = LocalDate.now().withDayOfMonth(1).format(ISO_LOCAL_DATE);
            
            BigDecimal tasaAumento = bcraApiClient.obtenerTasaAumentoICL(fechaInicio, fechaFin);
            
            // ✅ Consulta exitosa - aplicar aumento
            BigDecimal montoAnterior = alquiler.getMonto();
            BigDecimal nuevoMonto = montoAnterior.multiply(tasaAumento)
                    .setScale(2, RoundingMode.HALF_UP);
            
            BigDecimal porcentajeAumento = tasaAumento.subtract(BigDecimal.ONE)
                    .multiply(new BigDecimal("100"))
                    .setScale(2, RoundingMode.HALF_UP);

            // Actualizar alquiler
            alquiler.setMonto(nuevoMonto);
            alquiler.setNecesitaAumentoManual(false);
            alquilerRepository.save(alquiler);

            // Registrar en historial
            aumentoAlquilerService.crearYGuardarAumento(
                    contrato, montoAnterior, nuevoMonto, porcentajeAumento);
            
            actualizadosExitosamente++;
            
        } catch (Exception e) {
            // ❌ Fallo - mantener pendiente
            logger.warn("Fallo reintento para alquiler ID {}: {}", 
                       alquiler.getId(), e.getMessage());
            alquileresPendientes.add(alquiler);
        }
    }

    logger.info("Reintento completado: {} actualizados, {} aún pendientes", 
               actualizadosExitosamente, alquileresPendientes.size());

    return alquileresPendientes.stream()
            .map(AlquilerDTO::new)
            .collect(Collectors.toList());
}
```

## Ejemplos de Uso

### Ejemplo 1: Todos los alquileres se resuelven automáticamente

**Request:**
```http
GET /api/alquileres/aumento-manual/pendientes
```

**Response:**
```json
[]
```

**Logs:**
```
INFO: Encontrados 3 alquileres con aumento manual pendiente. Reintentando consulta a API del BCRA...
DEBUG: Reintentando consulta API del BCRA para alquiler ID 123: fechaInicio=2025-10-01, fechaFin=2025-11-01
INFO: ✅ Consulta API exitosa para alquiler ID 123. Tasa obtenida: 1.00177683
INFO: Alquiler ID 123 actualizado automáticamente. Monto: 150000.00 -> 150266.52. Porcentaje: 0.18%
DEBUG: Reintentando consulta API del BCRA para alquiler ID 124: fechaInicio=2025-10-01, fechaFin=2025-11-01
INFO: ✅ Consulta API exitosa para alquiler ID 124. Tasa obtenida: 1.00177683
INFO: Alquiler ID 124 actualizado automáticamente. Monto: 200000.00 -> 200355.37. Porcentaje: 0.18%
DEBUG: Reintentando consulta API del BCRA para alquiler ID 125: fechaInicio=2025-10-01, fechaFin=2025-11-01
INFO: ✅ Consulta API exitosa para alquiler ID 125. Tasa obtenida: 1.00177683
INFO: Alquiler ID 125 actualizado automáticamente. Monto: 180000.00 -> 180319.83. Porcentaje: 0.18%
INFO: Reintento completado: 3 alquileres actualizados exitosamente, 0 aún pendientes
```

### Ejemplo 2: Algunos se resuelven, otros siguen pendientes

**Request:**
```http
GET /api/alquileres/aumento-manual/pendientes
```

**Response:**
```json
[
  {
    "id": 124,
    "contratoId": 46,
    "fechaVencimientoPago": "2025-11-10",
    "monto": 200000.00,
    "estaPagado": false,
    "necesitaAumentoManual": true,
    "inmuebleId": 11,
    "direccionInmueble": "Av. Libertador 5678",
    "inquilinoId": 6,
    "nombreInquilino": "María",
    "apellidoInquilino": "González"
  }
]
```

**Logs:**
```
INFO: Encontrados 3 alquileres con aumento manual pendiente. Reintentando consulta a API del BCRA...
DEBUG: Reintentando consulta API del BCRA para alquiler ID 123: fechaInicio=2025-10-01, fechaFin=2025-11-01
INFO: ✅ Consulta API exitosa para alquiler ID 123. Tasa obtenida: 1.00177683
INFO: Alquiler ID 123 actualizado automáticamente. Monto: 150000.00 -> 150266.52. Porcentaje: 0.18%
DEBUG: Reintentando consulta API del BCRA para alquiler ID 124: fechaInicio=2025-10-01, fechaFin=2025-11-01
WARN: Fallo al reintentar consulta API para alquiler ID 124: Connection timeout. Se mantiene pendiente.
DEBUG: Reintentando consulta API del BCRA para alquiler ID 125: fechaInicio=2025-10-01, fechaFin=2025-11-01
INFO: ✅ Consulta API exitosa para alquiler ID 125. Tasa obtenida: 1.00177683
INFO: Alquiler ID 125 actualizado automáticamente. Monto: 180000.00 -> 180319.83. Porcentaje: 0.18%
INFO: Reintento completado: 2 alquileres actualizados exitosamente, 1 aún pendientes
```

## Ventajas de esta Implementación

### 1. **Recuperación Automática**
- Los alquileres se actualizan automáticamente cuando la API vuelve a estar disponible
- No requiere intervención manual si el problema es temporal

### 2. **Transparencia**
- El endpoint devuelve solo los alquileres que realmente necesitan intervención manual
- Logs detallados para auditoría y debugging

### 3. **Resiliencia**
- Si falla el reintento, no afecta a otros alquileres
- El alquiler permanece en estado pendiente hasta resolverse

### 4. **Optimización**
- Reduce la carga de trabajo manual del usuario
- Los alquileres se resuelven tan pronto como la API esté disponible

### 5. **Consistencia**
- Usa el mismo proceso de cálculo que los aumentos automáticos
- Registra los aumentos en el historial como cualquier otro aumento

## Consideraciones para el Frontend

### 1. Indicador de Progreso
- Mostrar mensaje "Verificando disponibilidad de API del BCRA..." al consultar pendientes
- Puede tomar unos segundos debido a los reintentos

### 2. Actualización de Lista
- Si la lista devuelta es vacía, mostrar mensaje: "¡Todos los alquileres se actualizaron automáticamente!"
- Si quedan pendientes, mostrar cuántos se resolvieron automáticamente

### 3. Polling Opcional
- Considerar un botón "Reintentar actualización automática" que llame al endpoint
- Puede ser útil si el usuario sabe que la API ahora está disponible

### 4. Notificaciones
```javascript
// Ejemplo de lógica en frontend
const pendientes = await fetch('/api/alquileres/aumento-manual/pendientes');
const data = await pendientes.json();

if (data.length === 0) {
    showSuccessMessage('Todos los alquileres fueron actualizados automáticamente');
} else if (initialCount > data.length) {
    showInfoMessage(`${initialCount - data.length} alquileres actualizados. ${data.length} requieren atención manual`);
} else {
    showWarningMessage(`${data.length} alquileres requieren actualización manual`);
}
```

## Limitaciones

1. **Solo para contratos con aumentaConIcl = true**
   - Los contratos con aumento fijo no se reintentan (no aplica)

2. **Rendimiento**
   - Cada reintento hace una llamada a la API externa
   - Si hay muchos pendientes, puede tomar tiempo

3. **Sin cache**
   - Cada consulta al endpoint reintenta todos los pendientes
   - Considerar implementar cache si esto se vuelve problemático

## Recomendaciones

1. **Monitoreo**
   - Revisar logs periódicamente para detectar patrones de falla
   - Alertar si hay muchos alquileres pendientes durante mucho tiempo

2. **Frontend**
   - Implementar refresh automático cada X minutos si hay pendientes
   - Mostrar timestamp del último intento

3. **Futuras Mejoras**
   - Implementar exponential backoff para reintentos
   - Cache de tasas de ICL por período
   - Notificaciones push cuando se resuelven automáticamente

