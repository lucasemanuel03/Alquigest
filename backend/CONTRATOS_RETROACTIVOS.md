# Contratos Retroactivos - Documentación

## Descripción General

El sistema ahora soporta la creación de contratos con fechas de inicio en el pasado (`fechaInicio < fechaActual`). Cuando se crea un contrato retroactivo, el sistema automáticamente:

1. Detecta que la fecha de inicio es anterior a la fecha actual
2. Genera los registros de alquiler (`Alquiler`) para todos los meses desde la fecha de inicio hasta el mes anterior al actual
3. Aplica aumentos según el `periodoAumento` configurado
4. Marca todos los alquileres retroactivos como pagados
5. Registra los aumentos en la tabla `AumentoAlquiler`

---

## Funcionalidades Implementadas

### ✅ Generación Automática de Alquileres Retroactivos

Cuando se crea un contrato con `fechaInicio` en el pasado, el sistema:

- **Primer alquiler**: Se crea con la fecha exacta de `fechaInicio`
- **Alquileres subsiguientes**: Se crean con día 1 de cada mes
- **Estado**: Todos marcados como `estaPagado = true`
- **Fecha de pago**: Igual a la fecha de vencimiento

### ✅ Aplicación de Aumentos Retroactivos

El sistema aplica aumentos automáticamente según la configuración:

#### Aumentos por ICL (Índice de Contratos de Locación)
- Consulta la API del BCRA para obtener valores históricos del ICL
- Calcula: `montoNuevo = montoAnterior × (ICL_fin / ICL_inicio)`
- Registra el aumento en `AumentoAlquiler`

#### Aumentos por Porcentaje Fijo
- Aplica el porcentaje configurado en `contrato.porcentajeAumento`
- Calcula: `montoNuevo = montoAnterior × (1 + porcentajeAumento/100)`
- Registra el aumento en `AumentoAlquiler`

### ✅ Actualización de `fechaAumento`

Después de procesar los alquileres retroactivos, el sistema actualiza `contrato.fechaAumento` para reflejar:
- La próxima fecha de aumento programada
- "No aumenta más" si la siguiente fecha de aumento superaría `fechaFin`

---

## Ejemplo Práctico

### Escenario
Crear un contrato con:
- `fechaInicio`: 15/02/2021 (hace 9 meses)
- `periodoAumento`: 3 meses
- `monto`: $100,000
- `aumentaConIcl`: true
- `fechaActual`: 05/11/2025

### Resultado

El sistema creará automáticamente:

| Fecha Vencimiento | Monto      | Estado  | Aumento |
|-------------------|------------|---------|---------|
| 15/02/2021        | $100,000   | Pagado ✓| -       |
| 01/03/2021        | $100,000   | Pagado ✓| -       |
| 01/04/2021        | $100,000   | Pagado ✓| -       |
| 01/05/2021        | $105,000   | Pagado ✓| ICL: +5%|
| 01/06/2021        | $105,000   | Pagado ✓| -       |
| 01/07/2021        | $105,000   | Pagado ✓| -       |
| 01/08/2021        | $110,250   | Pagado ✓| ICL: +5%|
| 01/09/2021        | $110,250   | Pagado ✓| -       |
| 01/10/2021        | $110,250   | Pagado ✓| -       |

Además:
- Se crean 2 registros en `AumentoAlquiler` (uno por cada aumento)
- El contrato se actualiza con `fechaAumento = 01/11/2021`

---

## API y Uso

### Endpoint
```
POST /api/contratos
```

### Request Body
```json
{
  "inmuebleId": 1,
  "inquilinoId": 1,
  "fechaInicio": "15/02/2021",
  "fechaFin": "15/02/2024",
  "monto": 100000,
  "periodoAumento": 3,
  "porcentajeAumento": 10,
  "aumentaConIcl": true,
  "estadoContratoId": 1
}
```

### Comportamiento

**Si `fechaInicio < fechaActual`:**
- ✅ Se crean alquileres retroactivos automáticamente
- ✅ Todos marcados como pagados
- ✅ Se aplican aumentos según configuración
- ✅ Se registran aumentos en historial

**Si `fechaInicio >= fechaActual`:**
- ✅ Se crea un solo alquiler (comportamiento normal)
- ✅ Sin alquileres retroactivos

---

## Consideraciones Importantes

### ⚠️ Rendimiento
- Los alquileres se guardan en **batch** para optimizar el rendimiento
- Los aumentos también se guardan en batch
- Se recomienda no crear contratos con fechas muy antiguas (> 5 años)

### ⚠️ API del BCRA
- Si la API del BCRA falla, el aumento por ICL no se aplica
- El error se registra en los logs
- El sistema continúa con el procesamiento normal

### ⚠️ Validaciones
- La `fechaFin` debe ser >= `fechaActual` (no se pueden crear contratos ya finalizados)
- La `fechaFin` debe ser >= `fechaInicio`
- El `periodoAumento` debe ser > 0

---

## Logs

El sistema registra información detallada:

```log
INFO: Contrato ID 123 tiene fecha de inicio en el pasado (2021-02-15). Generando alquileres retroactivos.
INFO: Iniciando creación de alquileres retroactivos para contrato ID: 123
INFO: Guardados 9 alquileres retroactivos para contrato ID: 123
INFO: Guardados 2 aumentos retroactivos para contrato ID: 123
INFO: FechaAumento del contrato ID 123 actualizada a: 2021-11-01
```

---

## Testing

Se han implementado tests completos en `ContratoRetroactivoTest.java`:

- ✅ Test de creación con 3 meses retroactivos
- ✅ Test de creación con 4 meses retroactivos y aumentos por ICL
- ✅ Test que verifica NO crear retroactivos cuando fecha es hoy/futuro

Ejecutar tests:
```bash
mvn test -Dtest=ContratoRetroactivoTest
```

---

## Historial de Aumentos

Todos los aumentos retroactivos quedan registrados en la tabla `AumentoAlquiler`:

```sql
SELECT * FROM aumento_alquiler WHERE contrato_id = 123;
```

| ID | Contrato | Fecha Aumento | Monto Anterior | Monto Nuevo | Porcentaje | Descripción |
|----|----------|---------------|----------------|-------------|------------|-------------|
| 1  | 123      | 2021-05-01    | 100000         | 105000      | 5.00       | Aumento retroactivo por ICL |
| 2  | 123      | 2021-08-01    | 105000         | 110250      | 5.00       | Aumento retroactivo por ICL |

---

## Soporte

Para más información sobre:
- **Aumentos por ICL**: Ver `AUMENTOS_ICL.md`
- **Aumentos manuales**: Ver `DOCUMENTACION_AUMENTOS_MANUALES.md`
- **API del BCRA**: Ver `DOCUMENTACION_REINTENTO_API_BCRA.md`

---

**Implementado**: Noviembre 2025  
**Versión**: 1.0  
**Estado**: ✅ Producción
