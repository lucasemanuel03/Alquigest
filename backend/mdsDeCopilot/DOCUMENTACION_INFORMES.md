# Documentación de Endpoints de Informes

## Resumen
Este documento describe los 4 endpoints de informes implementados en el sistema de gestión de alquileres.

---

## 1. Informe de Honorarios por Inmueble

### Endpoint
```
GET /api/informes/honorarios
```

### Descripción
Genera un informe con los honorarios del mes actual agrupados por inmueble. Solo incluye alquileres **pagados** de contratos **vigentes**.

### Servicios que utilizarán este endpoint
- Generación de reportes de honorarios mensuales
- Dashboard administrativo
- Análisis financiero mensual

### Respuesta
```json
{
  "periodo": "11/2025",
  "honorariosPorInmueble": [
    {
      "inmuebleId": 1,
      "direccionInmueble": "Calle Falsa 123",
      "contratoId": 10,
      "nombrePropietario": "Juan",
      "apellidoPropietario": "Pérez",
      "nombreInquilino": "María",
      "apellidoInquilino": "González",
      "montoAlquiler": 100000.00,
      "honorario": 10000.00
    }
  ],
  "totalHonorarios": 10000.00
}
```

---

## 2. Informe de Pagos de Alquileres

### Endpoint
```
GET /api/informes/alquileres
```

### Descripción
Genera un informe con todos los alquileres del mes actual (pagados y pendientes). Solo incluye contratos **vigentes**. Ahora incluye el **monto por cobrar** (suma de alquileres no pagados).

### Servicios que utilizarán este endpoint
- Reporte de ingresos mensuales
- Control de pagos de alquileres
- Seguimiento de morosidad
- Conciliación bancaria

### Respuesta
```json
{
  "periodo": "11/2025",
  "pagos": [
    {
      "alquilerId": 1,
      "contratoId": 10,
      "direccionInmueble": "Calle Falsa 123",
      "nombreInquilino": "María",
      "apellidoInquilino": "González",
      "nombrePropietario": "Juan",
      "apellidoPropietario": "Pérez",
      "monto": 100000.00,
      "fechaPago": "05/11/2025",
      "fechaVencimiento": "10/11/2025",
      "estaPagado": true
    }
  ],
  "totalPagado": 100000.00,
  "montoPorCobrar": 50000.00
}
```

---

## 3. Informe de Aumentos de Alquiler

### Endpoint
```
GET /api/informes/aumentos?meses=6
```

### Descripción
Genera un informe con todos los aumentos de alquiler aplicados en los últimos N meses, agrupados por contrato. El parámetro `meses` es **opcional** (por defecto 6).

### Parámetros
- `meses` (query param, opcional): Cantidad de meses hacia atrás para el informe. Por defecto: 6
  - Ejemplo: `meses=3` para ver aumentos de los últimos 3 meses
  - Ejemplo: `meses=12` para ver aumentos del último año

### Servicios que utilizarán este endpoint
- Reporte histórico de aumentos
- Análisis de ajustes de precios
- Auditoría de modificaciones de contratos
- Seguimiento de índices de actualización

### Respuesta
```json
{
  "periodoDesde": "05/2025",
  "periodoHasta": "11/2025",
  "aumentosPorContrato": [
    {
      "contratoId": 10,
      "direccionInmueble": "Calle Falsa 123",
      "nombreInquilino": "María",
      "apellidoInquilino": "González",
      "nombrePropietario": "Juan",
      "apellidoPropietario": "Pérez",
      "aumentos": [
        {
          "aumentoId": 1,
          "fechaAumento": "2025-08-01",
          "montoAnterior": 100000.00,
          "montoNuevo": 110000.00,
          "porcentajeAumento": 10.00
        }
      ]
    }
  ]
}
```

---

## 4. Informe de Pagos de Servicios

### Endpoint
```
GET /api/informes/pagos-servicios
```

### Descripción
Genera un informe con todos los pagos de servicios del mes actual **agrupados por contrato**. Incluye fecha, monto, período, tipo de servicio, datos del contrato (partes y inmueble) y datos del alquiler relacionado del mismo período.

### Servicios que utilizarán este endpoint
- Reporte de gastos de servicios
- Control de expensas
- Conciliación de pagos de servicios
- Dashboard de servicios por contrato
- Análisis de costos operativos

### Respuesta
```json
{
  "periodo": "11/2025",
  "contratosPagosServicios": [
    {
      "contratoId": 10,
      "direccionInmueble": "Calle Falsa 123",
      "nombrePropietario": "Juan",
      "apellidoPropietario": "Pérez",
      "nombreInquilino": "María",
      "apellidoInquilino": "González",
      "alquilerRelacionado": {
        "alquilerId": 1,
        "montoAlquiler": 100000.00,
        "fechaVencimientoAlquiler": "10/11/2025",
        "alquilerPagado": true
      },
      "pagosServicios": [
        {
          "pagoServicioId": 1,
          "fechaPago": "15/11/2025",
          "monto": 5000.00,
          "periodoServicio": "11/2025",
          "tipoServicio": "Luz",
          "estaPagado": true
        },
        {
          "pagoServicioId": 2,
          "fechaPago": "16/11/2025",
          "monto": 3000.00,
          "periodoServicio": "11/2025",
          "tipoServicio": "Gas",
          "estaPagado": true
        }
      ],
      "subtotalPagado": 8000.00
    }
  ],
  "totalPagado": 8000.00
}
```

---

## Notas Técnicas

### Queries Implementadas

#### AlquilerRepository
- `findAlquileresPagadosPorMesYAnio`: Obtiene alquileres pagados del mes actual de contratos vigentes
- `findAlquileresPorMesYAnioYEstadoContrato`: Obtiene todos los alquileres del mes por estado de contrato

#### AumentoAlquilerRepository
- `findAumentosPorRangoFecha`: Obtiene aumentos en un rango de fechas para todos los contratos

#### PagoServicioRepository
- `findPagosServiciosDelMesActualConDetalle`: Query compleja que obtiene pagos de servicios con datos completos del contrato, partes y alquiler relacionado

### Consideraciones
- Todos los informes trabajan con el **mes actual** por defecto
- Los informes 1 y 2 solo consideran contratos **vigentes**
- El informe 2 ahora incluye el **monto por cobrar** (alquileres no pagados)
- El informe 3 permite especificar la **cantidad de meses** (por defecto 6)
- El informe 4 **agrupa los pagos de servicios por contrato** para mejor organización
- Los montos son calculados con precisión de 2 decimales
- Los totales solo suman valores de elementos **pagados**
- Cada agrupación por contrato en el informe 4 incluye un **subtotal** de servicios pagados

