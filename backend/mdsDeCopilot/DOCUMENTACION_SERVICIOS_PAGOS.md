# Documentación del Sistema de Servicios y Pagos de Servicio

## 📋 Índice
1. [Introducción](#introducción)
2. [Modelos (Entidades)](#modelos-entidades)
3. [Repositorios](#repositorios)
4. [Servicios (Lógica de Negocio)](#servicios-lógica-de-negocio)
5. [DTOs](#dtos)
6. [Controladores (API REST)](#controladores-api-rest)
7. [Scheduler (Tareas Automáticas)](#scheduler-tareas-automáticas)
8. [Creación Automática de Servicios](#creación-automática-de-servicios)
9. [Flujo de Trabajo](#flujo-de-trabajo)

---

## Introducción

Este módulo gestiona los **servicios públicos** (luz, agua, gas, internet, etc.) asociados a los contratos de alquiler y sus respectivos pagos. El sistema permite:

- Definir tipos de servicios (Luz, Agua, Gas, etc.)
- **Crear automáticamente servicios para todos los contratos vigentes al iniciar sesión** ⭐ NUEVO
- Asociar servicios a contratos específicos
- Configurar pagos mensuales o anuales automáticos
- Generar facturas automáticamente el primer día de cada mes
- Vencimiento hardcodeado mediante cron (día 10 de cada mes)
- Actualizar montos de pagos pendientes
- Rastrear pagos realizados y vencidos
- Prevenir duplicados mediante control mensual en BD

---

## Modelos (Entidades)

### 1. `TipoServicio`
**Ubicación:** `model/TipoServicio.java`

**Propósito:** Define los tipos de servicios públicos disponibles en el sistema (Luz, Agua, Gas, Internet, etc.)

**Atributos principales:**
- `id` (Integer): Identificador único
- `nombre` (String): Nombre del servicio (único, requerido)
- `createdAt`, `updatedAt`: Fechas de auditoría

**Características:**
- Nombre único y obligatorio
- Timestamps automáticos

---

### 2. `ServicioXContrato`
**Ubicación:** `model/ServicioXContrato.java`

**Propósito:** Relaciona un tipo de servicio con un contrato específico. Es el vínculo entre un contrato y los servicios que consume.

**Atributos principales:**
- `id` (Integer): Identificador único
- `contrato` (Contrato): Relación con el contrato
- `tipoServicio` (TipoServicio): Tipo de servicio (Luz, Agua, etc.)
- `nroCuenta` (String): Número de cuenta del servicio
- `nroContrato` (String): Número de contrato con el proveedor
- `esDeInquilino` (Boolean): Indica si el servicio está a nombre del inquilino
- `esAnual` (Boolean): Si es `true`, el pago es anual; si es `false`, es mensual
- `esActivo` (Boolean): Si el servicio está activo

**Relaciones:**
- Muchos a Uno con `Contrato`
- Muchos a Uno con `TipoServicio`

---

### 3. `ConfiguracionPagoServicio`
**Ubicación:** `model/ConfiguracionPagoServicio.java`

**Propósito:** Configura la generación automática de pagos para un servicio. Controla cuándo se deben generar las facturas mensuales o anuales.

**Atributos principales:**
- `id` (Integer): Identificador único
- `servicioXContrato` (ServicioXContrato): Relación uno a uno con el servicio
- `fechaInicio` (String): Fecha de inicio del servicio
- `fechaFin` (String): Fecha de finalización (opcional)
- `ultimoPagoGenerado` (String): Última fecha para la que se generó un pago
- `proximoPago` (String): Fecha del próximo pago a generar
- `esActivo` (Boolean): Si la configuración está activa

**Relaciones:**
- Uno a Uno con `ServicioXContrato`

**Funcionamiento:**
- Calcula automáticamente cuándo generar la próxima factura
- Si el servicio es anual, suma 1 año
- Si el servicio es mensual, suma 1 mes

---

### 4. `PagoServicio`
**Ubicación:** `model/PagoServicio.java`

**Propósito:** Representa una factura individual de un servicio para un período específico.

**Atributos principales:**
- `id` (Integer): Identificador único
- `servicioXContrato` (ServicioXContrato): Servicio asociado
- `periodo` (String): Período de la factura (formato: "MM/yyyy", ej: "01/2025")
- `fechaPago` (String): Fecha en que se realizó el pago
- `estaPagado` (Boolean): Si la factura fue pagada
- `estaVencido` (Boolean): Si la factura está vencida
- `pdfPath` (String): Ruta del PDF del comprobante
- `medioPago` (String): Medio de pago utilizado
- `monto` (BigDecimal): Monto de la factura

**Relaciones:**
- Muchos a Uno con `ServicioXContrato`

**Características:**
- El período sigue el formato "mm/aaaa" (validado)
- **NO tiene campo `fechaVencimiento`** - El vencimiento se gestiona mediante cron (día 10 de cada mes)
- Permite adjuntar PDF del comprobante
- El campo `estaVencido` se gestiona externamente

---

### 5. `ConfiguracionSistema`
**Ubicación:** `model/ConfiguracionSistema.java`

**Propósito:** Almacena configuraciones del sistema, incluyendo el control del último mes procesado.

**Atributos principales:**
- `id` (Integer): Identificador único
- `clave` (String): Clave única de configuración
- `valor` (String): Valor de la configuración
- `descripcion` (String): Descripción de la configuración

**Uso específico:**
- Almacena `ULTIMO_MES_PROCESADO_PAGOS_SERVICIOS` con valor en formato "MM/yyyy"
- Previene el procesamiento duplicado de facturas en el mismo mes

---

## Repositorios

### 1. `TipoServicioRepository`
**Ubicación:** `repository/TipoServicioRepository.java`

**Métodos principales:**
- `findByNombre(String nombre)`: Busca un tipo de servicio por nombre
- `existsByNombre(String nombre)`: Verifica si existe un tipo de servicio

---

### 2. `ServicioXContratoRepository`
**Ubicación:** `repository/ServicioXContratoRepository.java`

**Métodos principales:**
- `findByContratoId(Long contratoId)`: Obtiene todos los servicios de un contrato
- `findServiciosActivosByContratoId(Long contratoId)`: Solo servicios activos
- `findByTipoServicioId(Integer tipoServicioId)`: Filtra por tipo de servicio
- `findByEsActivo(Boolean esActivo)`: Filtra por estado activo/inactivo
- `findByEsDeInquilino(Boolean esDeInquilino)`: Filtra según si es del inquilino

---

### 3. `ConfiguracionPagoServicioRepository`
**Ubicación:** `repository/ConfiguracionPagoServicioRepository.java`

**Métodos principales:**
- `findByServicioXContratoId(Integer servicioXContratoId)`: Busca configuración por servicio
- `findByEsActivo(Boolean esActivo)`: Configuraciones activas
- `findConfiguracionesConPagosPendientes(String fechaActual)`: Configuraciones que necesitan generar pagos
- `findByContratoId(Long contratoId)`: Configuraciones de un contrato
- `existsByServicioXContratoId(Integer servicioXContratoId)`: Verifica si existe configuración

---

### 4. `PagoServicioRepository`
**Ubicación:** `repository/PagoServicioRepository.java`

**Métodos principales:**
- `findByServicioXContratoId(Integer servicioXContratoId)`: Pagos de un servicio
- `findByContratoId(Long contratoId)`: Todos los pagos de un contrato
- `findPagosPendientes()`: Pagos no pagados
- `findPagosVencidos()`: Pagos vencidos y no pagados
- `findByServicioXContratoIdAndPeriodo(...)`: Busca pago específico por período
- `existsByServicioXContratoIdAndPeriodo(...)`: Verifica si existe pago para un período
- `findPagosNoPagadosByContratoAndTipoServicio(...)`: Filtra por contrato y tipo de servicio
- `countPagosPendientes()`: Cuenta pagos pendientes
- `countPagosVencidos()`: Cuenta pagos vencidos

---

### 5. `ConfiguracionSistemaRepository`
**Ubicación:** `repository/ConfiguracionSistemaRepository.java`

**Métodos principales:**
- `findByClave(String clave)`: Busca configuración por clave
- `existsByClave(String clave)`: Verifica si existe una configuración

---

## Servicios (Lógica de Negocio)

### 1. `ServicioXContratoService`
**Ubicación:** `service/ServicioXContratoService.java`

**Responsabilidad:** Gestiona la creación y administración de servicios asociados a contratos.

**Métodos principales:**

#### `crearServicio(contratoId, tipoServicioId, nroCuenta, nroContrato, esDeInquilino, esAnual, fechaInicio)`
- Crea un nuevo `ServicioXContrato`
- Valida que el contrato y tipo de servicio existan
- **Automáticamente crea la `ConfiguracionPagoServicio` asociada**
- Calcula el `proximoPago` según sea mensual o anual
- Retorna el servicio creado

#### `obtenerServiciosPorContrato(contratoId)`
- Retorna todos los servicios de un contrato

#### `obtenerServiciosActivosPorContrato(contratoId)`
- Retorna solo servicios activos

#### `desactivarServicio(servicioId)`
- Desactiva un servicio y su configuración de pago
- Ya no se generarán facturas para este servicio

#### `reactivarServicio(servicioId, nuevaFechaInicio)`
- Reactiva un servicio previamente desactivado

#### `actualizarServicio(servicioId, nroCuenta, nroContrato)`
- Actualiza datos de un servicio existente

---

### 2. `ConfiguracionPagoServicioService`
**Ubicación:** `service/ConfiguracionPagoServicioService.java`

**Responsabilidad:** Gestiona la configuración de generación automática de pagos.

**Métodos principales:**

#### `crearConfiguracion(ServicioXContrato, String fechaInicio)`
- Crea una configuración para un servicio
- Calcula automáticamente el próximo pago (mensual o anual)
- Verifica que no exista configuración duplicada

#### `actualizarDespuesDeGenerarPago(ConfiguracionPagoServicio, String fechaPagoGenerado)`
- Actualiza la configuración después de generar un pago
- Recalcula el próximo pago automáticamente
- Registra el último pago generado

#### `calcularProximoPago(String fechaBase, Boolean esAnual)` (privado)
- Si `esAnual = true`: suma 1 año a la fecha base
- Si `esAnual = false`: suma 1 mes a la fecha base
- Retorna la fecha en formato ISO

#### `desactivarConfiguracion(Integer configuracionId)`
- Desactiva una configuración (no genera más pagos)

#### `obtenerPorServicioXContrato(Integer servicioXContratoId)`
- Obtiene la configuración de un servicio específico

---

### 3. `PagoServicioService`
**Ubicación:** `service/PagoServicioService.java`

**Responsabilidad:** Gestiona los pagos de servicios.

**Métodos principales:**

#### `actualizarMontosPagosNoPagados(ActualizacionMontosServiciosRequest)`
- Actualiza los montos de pagos no pagados de un contrato
- Recibe una lista de tipos de servicio con sus nuevos montos
- Valida que los montos sean positivos
- Retorna un resumen de las actualizaciones realizadas

**Ejemplo de uso:**
```json
{
  "contratoId": 1,
  "actualizaciones": [
    {
      "tipoServicioId": 1,
      "nuevoMonto": 5000.00
    },
    {
      "tipoServicioId": 2,
      "nuevoMonto": 3500.00
    }
  ]
}
```

#### `obtenerPagosNoPagadosPorContrato(Long contratoId)`
- Retorna todos los pagos pendientes de un contrato

#### `obtenerPagosPorContrato(Long contratoId)`
- Retorna todos los pagos (pagados y no pagados) de un contrato

---

### 4. `ServicioActualizacionService`
**Ubicación:** `service/ServicioActualizacionService.java`

**Responsabilidad:** Genera automáticamente las facturas mensuales/anuales de servicios.

**Métodos principales:**

#### `procesarPagosPendientes()`
- **Se ejecuta automáticamente:**
  - Al iniciar sesión (en `AuthController`)
  - El primer día de cada mes a las 00:01 (en `ContratoScheduler`)
- Verifica si ya se procesó el mes actual consultando `ConfiguracionSistema`
- Si el mes guardado es diferente al actual, procesa:
  1. Busca configuraciones con `proximoPago <= fechaActual`
  2. Genera facturas (`PagoServicio`) con:
     - Período en formato "MM/yyyy"
     - Estado `estaPagado = false`
     - Estado `estaVencido = false` (se gestiona por cron externo)
  3. Actualiza cada configuración con el nuevo `proximoPago`
  4. Guarda el mes actual en `ConfiguracionSistema`

**Prevención de duplicados:**
- Usa `ConfiguracionSistema` con clave `ULTIMO_MES_PROCESADO_PAGOS_SERVICIOS`
- Solo procesa si el mes es diferente al guardado
- Verifica que no exista factura para el mismo período antes de crear

#### `forzarProcesamientoPagos()`
- Fuerza el procesamiento independientemente del mes
- Útil para testing o procesamiento manual

#### `getUltimoMesProcesado()`
- Retorna el último mes procesado desde la BD

---

### 5. `ServicioActualizacionService`
**Ubicación:** `service/ServicioActualizacionService.java`

**Responsabilidad:** Crea automáticamente servicios para contratos vigentes.

**Métodos principales:**

#### `crearServiciosParaContratosVigentes()`
- **Se ejecuta automáticamente:**
  - Al iniciar sesión (en `AuthController`)
  - Antes de `procesarPagosPendientes()`
- Obtiene todos los contratos vigentes sin servicios configurados
- Para cada contrato, crea servicios para todos los tipos de servicio disponibles
- Configura los pagos para que sean mensuales por defecto
- Previene la creación de servicios duplicados para un mismo contrato

**Ejemplo de uso:**
```
Situación inicial:
- Contrato vigente sin servicios

Al iniciar sesión:
1. Se detecta el contrato sin servicios
2. Se crean servicios para Luz, Agua, Gas
3. Se configura el primer pago para el próximo mes

Próximo login:
- El contrato ya tiene servicios
- No se crean servicios duplicados
```

---

## DTOs

### 1. `CrearServicioRequest`
**Ubicación:** `dto/CrearServicioRequest.java`

**Propósito:** Request para crear un nuevo servicio asociado a un contrato.

**Atributos:**
- `contratoId` (Long): ID del contrato (obligatorio)
- `tipoServicioId` (Integer): ID del tipo de servicio (obligatorio)
- `nroCuenta` (String): Número de cuenta (opcional)
- `nroContrato` (String): Número de contrato con proveedor (opcional)
- `esDeInquilino` (Boolean): Si es del inquilino (default: false)
- `esAnual` (Boolean): Si es anual (default: false = mensual)
- `fechaInicio` (String): Fecha de inicio en formato ISO (opcional, usa fecha actual si no se provee)

---

### 2. `ActualizacionMontoServicioDTO`
**Ubicación:** `dto/ActualizacionMontoServicioDTO.java`

**Propósito:** Representa la actualización de monto para un tipo de servicio.

**Atributos:**
- `tipoServicioId` (Integer): ID del tipo de servicio
- `nuevoMonto` (BigDecimal): Nuevo monto a aplicar (debe ser positivo)

---

### 3. `ActualizacionMontosServiciosRequest`
**Ubicación:** `dto/ActualizacionMontosServiciosRequest.java`

**Propósito:** Request para actualizar montos de múltiples servicios de un contrato.

**Atributos:**
- `contratoId` (Long): ID del contrato
- `actualizaciones` (List<ActualizacionMontoServicioDTO>): Lista de actualizaciones

**Validaciones:**
- El `contratoId` es obligatorio
- La lista de actualizaciones no puede estar vacía
- Cada actualización debe tener un monto positivo

---

## Controladores (API REST)

### 1. `ServicioXContratoController`
**Ubicación:** `controller/ServicioXContratoController.java`
**Ruta base:** `/api/servicios-contrato`

**Endpoints:**

#### `POST /`
Crea un nuevo servicio para un contrato.

**Request Body:**
```json
{
  "contratoId": 1,
  "tipoServicioId": 2,
  "nroCuenta": "123456789",
  "nroContrato": "CTR-2025-001",
  "esDeInquilino": false,
  "esAnual": false,
  "fechaInicio": "2025-01-01"
}
```

**Response:** Objeto `ServicioXContrato` creado

#### `GET /contrato/{contratoId}`
Obtiene todos los servicios de un contrato.

**Response:** Array de `ServicioXContrato`

#### `GET /contrato/{contratoId}/activos`
Obtiene solo servicios activos de un contrato.

**Response:** Array de `ServicioXContrato`

---

### 2. `PagoServicioController`
**Ubicación:** `controller/PagoServicioController.java`
**Ruta base:** `/api/pagos-servicios`

**Endpoints:**

#### `PUT /actualizar-montos`
Actualiza los montos de pagos no pagados de un contrato.

**Request Body:**
```json
{
  "contratoId": 1,
  "actualizaciones": [
    {
      "tipoServicioId": 1,
      "nuevoMonto": 5000.00
    }
  ]
}
```

**Response:**
```json
{
  "contratoId": 1,
  "totalPagosActualizados": 5,
  "detallesPorTipoServicio": {
    "1": 3,
    "2": 2
  },
  "mensaje": "Actualización completada exitosamente"
}
```

#### `GET /contrato/{contratoId}/no-pagados`
Obtiene todos los pagos no pagados de un contrato.

**Response:** Array de `PagoServicio`

#### `GET /contrato/{contratoId}`
Obtiene todos los pagos (pagados y no pagados) de un contrato.

**Response:** Array de `PagoServicio`

---

### 3. `ContratoController`
**Ubicación:** `controller/ContratoController.java`
**Ruta base:** `/api/contratos`

**Endpoints disponibles:**

#### `GET /`
Obtiene todos los contratos.

#### `GET /{id}`
Obtiene un contrato por ID.

#### `GET /inmueble/{inmuebleId}`
Obtiene contratos por inmueble.

#### `GET /inquilino/{inquilinoId}`
Obtiene contratos por inquilino.

#### `GET /vigentes`
Obtiene contratos vigentes.

#### `GET /no-vigentes`
Obtiene contratos no vigentes.

#### `GET /count/vigentes`
Cuenta contratos vigentes.

#### `GET /proximos-vencer?diasAntes={dias}`
Obtiene contratos próximos a vencer.

#### `GET /count/proximos-vencer?diasAntes={dias}`
Cuenta contratos próximos a vencer.

#### `POST /`
Crea un nuevo contrato.

**Request Body:** `ContratoCreateDTO`

#### `PATCH /{id}/estado`
Cambia el estado de un contrato (Vigente, No Vigente, Cancelado).

**Request Body:**
```json
{
  "estadoContratoId": 2,
  "motivoCancelacionId": 1,
  "observaciones": "Texto opcional"
}
```

#### `GET /{id}/existe`
Verifica si existe un contrato.

#### `GET /inmueble/{inmuebleId}/tiene-contrato-vigente`
Verifica si un inmueble tiene un contrato vigente.

**⚠️ NOTA IMPORTANTE:** 
- **NO existe endpoint PUT para actualizar contratos**
- Los contratos solo pueden:
  - **Crearse** (POST)
  - **Cambiar de estado** (PATCH)
  - **Consultarse** (GET)

---

## Scheduler (Tareas Automáticas)

### `ContratoScheduler`
**Ubicación:** `scheduler/ContratoScheduler.java`

#### `procesarPagosServiciosProgramado()`
- **Cron:** `0 1 0 1 * *` - Se ejecuta **solo el primer día del mes a las 00:01**
- **Función:** Ejecuta `ServicioActualizacionService.procesarPagosPendientes()`
- **Comportamiento:**
  - Se ejecuta el primer día de cada mes a las 00:01
  - La lógica interna verifica si ya se procesó el mes actual
  - Solo genera facturas si el mes es nuevo
  - Previene duplicados mediante control en BD

---

## Creación Automática de Servicios

### `crearServiciosParaContratosVigentes()` ⭐ NUEVO

**Ubicación:** `service/ServicioActualizacionService.java`

**Propósito:** Crear automáticamente servicios para todos los contratos vigentes que no tengan servicios configurados.

**¿Cuándo se ejecuta?**
- **Al iniciar sesión** (en `AuthController`)
- Se ejecuta ANTES de `procesarPagosPendientes()`

**¿Qué hace?**

1. **Obtiene todos los contratos vigentes** del sistema
2. **Obtiene todos los tipos de servicio** disponibles en la BD (Luz, Agua, Gas, etc.)
3. **Para cada contrato vigente:**
   - Verifica si el contrato ya tiene servicios configurados
   - Si NO tiene servicios, crea automáticamente:
     - Un `ServicioXContrato` para cada tipo de servicio
     - Una `ConfiguracionPagoServicio` para cada servicio creado
4. **Retorna** la cantidad de servicios creados

**Configuración por defecto:**
- `esAnual = false` (todos los servicios son mensuales por defecto)
- `esDeInquilino = false`
- `esActivo = true`
- `fechaInicio = fecha actual`
- `proximoPago = fecha actual + 1 mes`

**Prevención de duplicados:**
- Solo crea servicios si el contrato NO tiene ningún servicio configurado
- Si el contrato ya tiene al menos un servicio, lo omite

**Manejo de errores:**
- Si falla la creación de un servicio, continúa con los demás
- No bloquea el proceso de login
- Registra errores en el log para debugging

**Ejemplo:**

```
Situación inicial:
- 2 contratos vigentes sin servicios
- 3 tipos de servicio en BD: Luz, Agua, Gas

Al iniciar sesión:
1. Detecta 2 contratos sin servicios
2. Crea 6 ServicioXContrato (3 por cada contrato)
3. Crea 6 ConfiguracionPagoServicio
4. Calcula proximoPago para cada uno
5. Retorna: "6 servicios creados"

Próximo login:
- Los contratos ya tienen servicios
- No crea duplicados
- Retorna: "0 servicios creados"
```

**Logs generados:**

```
INFO: Iniciando creación automática de servicios para contratos vigentes
INFO: Se encontraron 2 contratos vigentes
INFO: Creando servicios para contrato ID: 1
DEBUG: Servicio creado - Contrato ID: 1, Tipo: Luz
DEBUG: Configuración creada para servicio ID: 15
DEBUG: Servicio creado - Contrato ID: 1, Tipo: Agua
DEBUG: Configuración creada para servicio ID: 16
DEBUG: Servicio creado - Contrato ID: 1, Tipo: Gas
DEBUG: Configuración creada para servicio ID: 17
INFO: Creación automática completada. Total de servicios creados: 6
```

**Requisitos:**
- ⚠️ **Debe haber tipos de servicio en la BD** para que funcione
- Si no hay tipos de servicio, registra un warning y retorna 0

---

## Flujo de Trabajo

### 5. Flujo Completo al Iniciar Sesión ⭐ NUEVO

```
Usuario hace POST /api/auth/signin
   ↓
AuthController.authenticateUser()
   ↓
1. actualizarContratosVencidos()
   - Actualiza estado de contratos cuya fechaFin ya pasó
   ↓
2. actualizarFechasAumento()
   - Recalcula fechas de aumento automáticas
   ↓
3. crearServiciosParaContratosVigentes() ⭐ NUEVO
   ├─ Busca contratos vigentes
   ├─ Verifica cuáles no tienen servicios
   ├─ Para cada contrato sin servicios:
   │  ├─ Obtiene todos los tipos de servicio
   │  ├─ Crea ServicioXContrato para cada tipo
   │  ├─ Crea ConfiguracionPagoServicio para cada servicio
   │  └─ Calcula proximoPago (fecha actual + 1 mes)
   └─ Log: "X servicios creados"
   ↓
4. procesarPagosPendientes()
   ├─ Verifica si el mes actual fue procesado
   ├─ Si es mes nuevo:
   │  ├─ Busca configuraciones con proximoPago <= hoy
   │  ├─ Genera PagoServicio (facturas) para cada configuración
   │  └─ Actualiza ultimoMesProcesado en BD
   └─ Log: "X facturas generadas"
   ↓
5. Autenticación y generación de JWT
   ↓
✅ Login completado con servicios y pagos actualizados
```

### 6. Caso de Uso: Primer Login con Contratos Vigentes

```
Escenario:
- BD tiene 3 tipos de servicio: Luz, Agua, Gas
- Hay 2 contratos vigentes recién creados (sin servicios)
- Es el día 1 de octubre de 2025
- Es la primera vez que se ejecuta el sistema este mes

Usuario inicia sesión:
   ↓
Paso 1: Actualizar contratos vencidos
   - Resultado: 0 contratos actualizados
   ↓
Paso 2: Actualizar fechas de aumento
   - Resultado: 0 fechas actualizadas
   ↓
Paso 3: Crear servicios para contratos vigentes
   - Detecta 2 contratos sin servicios
   - Crea 6 ServicioXContrato (3 por contrato)
   - Crea 6 ConfiguracionPagoServicio
   - Configura proximoPago = 2025-11-01 para todos
   - Resultado: 6 servicios creados
   ↓
Paso 4: Procesar pagos pendientes
   - Mes actual: "10/2025"
   - Último mes procesado: null
   - Busca configuraciones con proximoPago <= 2025-10-01
   - No encuentra ninguna (proximoPago es 2025-11-01)
   - Actualiza ultimoMesProcesado = "10/2025"
   - Resultado: 0 facturas generadas
   ↓
✅ Login exitoso

Estado final de la BD:
- 6 ServicioXContrato creados
- 6 ConfiguracionPagoServicio creadas
- 0 PagoServicio (se generarán en noviembre)
- ConfiguracionSistema.valor = "10/2025"

Próximo login el 1 de noviembre:
   ↓
Paso 3: Crear servicios
   - Contratos ya tienen servicios
   - Resultado: 0 servicios creados
   ↓
Paso 4: Procesar pagos
   - Mes actual: "11/2025" ≠ "10/2025"
   - Busca configuraciones con proximoPago <= 2025-11-01
   - Encuentra 6 configuraciones
   - Genera 6 PagoServicio (facturas)
   - Resultado: 6 facturas generadas
```

---

## Casos de Uso Completos

### Caso 1: Agregar servicio de luz mensual a un contrato
```
POST /api/servicios-contrato
{
  "contratoId": 1,
  "tipoServicioId": 1, // Luz
  "esAnual": false, // Mensual
  "fechaInicio": "2025-10-01"
}
```

**Resultado:**
1. Se crea `ServicioXContrato` con luz
2. Se crea `ConfiguracionPagoServicio` con `proximoPago: "2025-11-01"`
3. El 1 de noviembre a las 00:01, se generará automáticamente el primer `PagoServicio` con período "11/2025"

### Caso 2: La compañía de luz aumenta la tarifa
```
PUT /api/pagos-servicios/actualizar-montos
{
  "contratoId": 1,
  "actualizaciones": [
    {
      "tipoServicioId": 1,
      "nuevoMonto": 6500.00
    }
  ]
}
```

**Resultado:**
- Todos los `PagoServicio` con `estaPagado = false` del tipo "Luz" se actualizan con monto 6500.00

### Caso 3: Proceso automático del primer día del mes
```
Fecha: 2025-11-01 00:01
Scheduler ejecuta procesarPagosPendientes()

BD actual:
- ConfiguracionSistema.valor = "10/2025"

Resultado:
1. Detecta mes nuevo: "11/2025" ≠ "10/2025"
2. Busca configuraciones con proximoPago <= "2025-11-01"
3. Genera PagoServicio para cada una:
   - periodo: "11/2025"
   - estaPagado: false
   - estaVencido: false (se gestionará por cron externo día 10)
4. Actualiza ConfiguracionSistema.valor = "11/2025"
```

### Caso 4: Crear un contrato y servicios automáticamente ⭐ NUEVO

```
Paso 1: Crear contrato
POST /api/contratos
{
  "inmuebleId": 5,
  "inquilinoId": 3,
  "fechaInicio": "15/10/2025",
  "fechaFin": "15/10/2026",
  "monto": 50000,
  "porcentajeAumento": 10,
  "periodoAumento": 12
}

Resultado:
- Contrato creado con ID: 10
- Estado: Vigente
- Sin servicios aún

Paso 2: Usuario inicia sesión
POST /api/auth/signin

Automáticamente:
1. Se detecta el contrato 10 sin servicios
2. Se crean servicios para Luz, Agua, Gas
3. Se crean 3 ConfiguracionPagoServicio
4. proximoPago = 2025-11-15 (fecha actual + 1 mes)

Paso 3: El 1 de noviembre
- Sistema genera 3 PagoServicio (facturas)
- Período: "11/2025"
- estaPagado: false

✅ Contrato completamente configurado y con facturas generadas automáticamente
```

---

## Notas Importantes

- **Fechas:** Se usan Strings en formato ISO (yyyy-MM-dd)
- **Períodos:** Formato "MM/yyyy" (ej: "01/2025")
- **Vencimiento:** NO se almacena en BD, se gestiona mediante cron externo (día 10 de cada mes)
- **Montos:** Se usa `BigDecimal` para precisión decimal
- **Automatización:** Las facturas se generan automáticamente, no manualmente
- **Creación automática de servicios:** ⭐ NUEVO
  - Se ejecuta al iniciar sesión
  - Solo afecta contratos vigentes sin servicios
  - Crea todos los tipos de servicio disponibles
  - No duplica servicios existentes
- **Prevención de duplicados:** 
  - El sistema verifica el mes procesado en `ConfiguracionSistema`
  - Verifica que no exista factura para el mismo período antes de crear
  - Verifica que el contrato no tenga servicios antes de crearlos
- **Servicios activos:** Solo se procesan servicios con `esActivo = true`
- **Ejecución:**
  - Primer día del mes a las 00:01 (scheduler)
  - Al iniciar sesión cualquier usuario
  - Solo se ejecuta realmente si es un mes nuevo
- **Contratos:** 
  - NO se pueden actualizar después de creados
  - Solo se puede cambiar su estado (Vigente, No Vigente, Cancelado)
- **Requisitos para creación automática:**
  - Debe haber al menos un `TipoServicio` en la BD
  - El contrato debe estar en estado "Vigente"

---

## Validación de Vencimientos

**⚠️ IMPORTANTE:** La validación de vencimientos se gestiona **externamente mediante un cron**.

- El modelo `PagoServicio` NO tiene campo `fechaVencimiento`
- El vencimiento se hardcodea como el día 10 de cada mes
- Un cron externo debe actualizar el campo `estaVencido` según la lógica de negocio
- El sistema solo genera las facturas con `estaVencido = false`

---

**Fecha de documentación:** 15 de Octubre 2025  
**Sistema:** Alquigest - Gestión de Alquileres  
**Tecnología:** Java Spring Boot + SQLite  
**Versión:** 3.0 - Incluye creación automática de servicios al iniciar sesión
