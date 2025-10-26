# Implementación de Aumentos por ICL (Índice de Contratos de Locación)

## Descripción General

Se ha implementado un sistema completo para aplicar aumentos automáticos en los alquileres basados en el **ICL (Índice de Contratos de Locación)** publicado por el BCRA (Banco Central de la República Argentina).

---

## 🎯 Funcionalidades Implementadas

### 1. **Consulta de ICL desde la API del BCRA**
- Conexión automática con la API oficial del BCRA
- URL: `https://api.bcra.gob.ar/estadisticas/v4.0/monetarias/40`
- Cálculo automático de tasas de aumento entre dos fechas

### 2. **Aplicación Automática de Aumentos**
- Al crear un nuevo alquiler mensual, el sistema verifica si corresponde aplicar aumento
- Si `contrato.aumentaConICL == true`, consulta la API del BCRA
- Si `contrato.aumentaConICL == false`, aplica el porcentaje fijo configurado
- Registra cada aumento en el historial (`AumentoAlquiler`)

### 3. **Detección de Fechas de Aumento**
- Utiliza el atributo `fechaAumento` del contrato
- Si la fecha actual >= `fechaAumento`, aplica el aumento
- Soporta casos especiales: "No aumenta más", "Sin Aumento", etc.

---

## 📋 Archivos Creados/Modificados

### Nuevos Archivos

1. **`BCRAApiClient.java`** (`util/`)
   - Cliente HTTP para consumir la API del BCRA
   - Métodos:
     - `obtenerTasaAumentoICL(fechaInicio, fechaFin)` → Retorna la tasa (ej: 1.00177683)
     - `calcularNuevoMontoConICL(monto, fechaInicio, fechaFin)` → Retorna el monto ajustado

2. **`ICLController.java`** (`controller/`)
   - Endpoints para testing y consultas manuales del ICL
   - `GET /api/icl/tasa` - Obtener tasa de aumento
   - `GET /api/icl/calcular` - Calcular nuevo monto

### Archivos Modificados

1. **`AlquilerActualizacionService.java`**
   - Método `crearAlquilerParaContrato()` completamente reescrito
   - Nuevo método `debeAplicarAumento()` para determinar si aplica aumento
   - Integración con `BCRAApiClient` y `AumentoAlquilerService`

2. **`AlquilerRepository.java`**
   - Agregado método `findTopByContratoOrderByFechaVencimientoPagoDesc()`

3. **`ErrorCodes.java`**
   - Agregado código `ERROR_SERVICIO_EXTERNO`

---

## 🔄 Flujo de Creación de Alquileres con Aumento

```
1. Se ejecuta crearAlquilerParaContrato(contrato)
   ↓
2. Verificar si ya tiene alquileres pendientes
   ↓
3. Obtener el último alquiler para determinar el monto base
   ↓
4. ¿Debe aplicar aumento? (debeAplicarAumento())
   ├─ NO → Usar monto del último alquiler o del contrato
   └─ SÍ → Continuar
       ↓
5. ¿aumentaConICL == true?
   ├─ SÍ → Consultar API BCRA
   │   ↓
   │   a. Obtener fechaInicio (contrato.fechaAumento)
   │   b. fechaFin = fecha actual
   │   c. Consultar: bcraApiClient.obtenerTasaAumentoICL()
   │   d. Calcular: montoNuevo = montoBase * tasa
   │   e. Registrar aumento en historial
   │
   └─ NO → Aplicar porcentaje fijo (contrato.porcentajeAumento)
       ↓
       a. tasa = 1 + (porcentaje / 100)
       b. montoNuevo = montoBase * tasa
       c. Registrar aumento en historial
   ↓
6. Crear alquiler con montoNuevo
   ↓
7. Guardar en base de datos
```

---

## 🛠️ Ejemplo de Uso

### Escenario 1: Contrato con ICL

```java
Contrato contrato = new Contrato();
contrato.setAumentaConIcl(true);
contrato.setFechaAumento("2025-09-01");  // Última fecha de aumento
contrato.setMonto(new BigDecimal("1000.00"));

// Cuando se ejecute crearAlquilerParaContrato():
// 1. Consulta ICL desde 2025-09-01 hasta 2025-10-25
// 2. BCRA retorna: valorInicio = 28.140000, valorFin = 28.190000
// 3. Tasa = 28.190000 / 28.140000 = 1.00177683
// 4. Nuevo monto = 1000 * 1.00177683 = 1001.78
// 5. Se registra el aumento en AumentoAlquiler
```

### Escenario 2: Contrato con Porcentaje Fijo

```java
Contrato contrato = new Contrato();
contrato.setAumentaConIcl(false);
contrato.setPorcentajeAumento(new BigDecimal("10.00")); // 10%
contrato.setFechaAumento("2025-10-01");
contrato.setMonto(new BigDecimal("1000.00"));

// Cuando se ejecute crearAlquilerParaContrato():
// 1. No consulta BCRA
// 2. Tasa = 1 + (10 / 100) = 1.10
// 3. Nuevo monto = 1000 * 1.10 = 1100.00
// 4. Se registra el aumento en AumentoAlquiler
```

### Escenario 3: No Aplica Aumento

```java
Contrato contrato = new Contrato();
contrato.setFechaAumento("2025-12-01");  // Fecha futura
// Fecha actual: 2025-10-25

// No aplica aumento porque fechaActual < fechaAumento
// Usa el monto del último alquiler o del contrato
```

---

## 🌐 Endpoints de ICL (Testing)

### 1. Obtener Tasa de Aumento

```bash
GET /api/icl/tasa?fechaInicio=2025-10-01&fechaFin=2025-10-25
```

**Respuesta:**
```json
{
  "fechaInicio": "2025-10-01",
  "fechaFin": "2025-10-25",
  "tasaAumento": 1.00177683,
  "porcentajeAumento": 0.18
}
```

### 2. Calcular Nuevo Monto

```bash
GET /api/icl/calcular?montoOriginal=1000&fechaInicio=2025-10-01&fechaFin=2025-10-25
```

**Respuesta:**
```json
{
  "montoOriginal": 1000.00,
  "nuevoMonto": 1001.78,
  "diferencia": 1.78,
  "tasaAumento": 1.00177683,
  "porcentajeAumento": 0.18,
  "fechaInicio": "2025-10-01",
  "fechaFin": "2025-10-25"
}
```

---

## 📊 Registro de Aumentos

Cada vez que se aplica un aumento, se crea automáticamente un registro en la tabla `aumento_alquiler`:

```java
AumentoAlquiler {
  id: 1,
  contrato: Contrato(id=1),
  fechaAumento: "2025-10-25",
  montoAnterior: 1000.00,
  montoNuevo: 1001.78,
  porcentajeAumento: 0.18,
  descripcion: "Aumento automático registrado",
  createdAt: "2025-10-25T10:30:00"
}
```

**Consultar historial de aumentos:**
```bash
GET /api/aumentos/contrato/1
```

---

## ⚙️ Configuración del Contrato

Para que un contrato aplique aumentos correctamente, debe tener:

### Aumentos por ICL:
```java
contrato.setAumentaConIcl(true);
contrato.setFechaAumento("2025-09-01");  // Última fecha de aumento o fecha próxima
contrato.setPeriodoAumento(6);  // Opcional: cada cuántos meses aumenta
```

### Aumentos por Porcentaje Fijo:
```java
contrato.setAumentaConIcl(false);
contrato.setPorcentajeAumento(new BigDecimal("10.00"));  // 10%
contrato.setFechaAumento("2025-10-01");
contrato.setPeriodoAumento(12);  // Cada 12 meses
```

---

## 🔍 Validaciones y Manejo de Errores

### API del BCRA No Disponible
- Se captura la excepción
- Se usa el monto sin aumento
- Se registra el error en el log
- El alquiler se crea igual para no interrumpir el flujo

### Fechas Inválidas
- Si `fechaAumento` no se puede parsear, no se aplica aumento
- Si faltan datos en la respuesta del BCRA, lanza BusinessException

### División por Cero
- Se valida que `valorInicio` no sea cero antes de dividir

---

## 🚀 Ventajas de la Implementación

✅ **Automático**: Los aumentos se aplican al generar alquileres mensuales
✅ **Trazable**: Historial completo en `AumentoAlquiler`
✅ **Flexible**: Soporta ICL y porcentajes fijos
✅ **Resiliente**: Si falla la API, continúa sin aumento
✅ **Auditable**: Logs detallados de cada operación
✅ **Testeable**: Endpoints dedicados para pruebas

---

## 📝 Notas Importantes

1. **Formato de Fechas**: Todas las fechas deben estar en formato ISO `yyyy-MM-dd`
2. **Precisión**: Los cálculos usan `BigDecimal` con 10 decimales, redondeo HALF_UP
3. **Timeout**: La consulta a la API del BCRA tiene timeout de 30 segundos
4. **Transacciones**: Cada alquiler se crea en una transacción independiente
5. **Actualizaciones de `fechaAumento`**: Debes actualizar manualmente después de aplicar aumento

---

## 🔜 Mejoras Futuras Sugeridas

1. ✨ Actualizar automáticamente `contrato.fechaAumento` después de aplicar aumento
2. ✨ Cachear valores del ICL para reducir consultas al BCRA
3. ✨ Notificar al propietario/inquilino cuando se aplica un aumento
4. ✨ Panel de administración para ver históricos de ICL
5. ✨ Soporte para otras fuentes de índices (IPC, etc.)

---

**Implementación completada el 25 de octubre de 2025** ✅

