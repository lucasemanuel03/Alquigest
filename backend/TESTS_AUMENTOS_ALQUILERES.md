# Tests Unitarios - Funcionalidad de Aumento de Alquileres

## Resumen de Ejecución
- **Tests Totales:** 14
- **Exitosos:** 14 ✅
- **Fallidos:** 0
- **Omitidos:** 0
- **Tiempo de Ejecución:** 1.325 segundos

## Cobertura de Tests

### 1. Tests de Validación de Aumento (4 tests)

#### ✅ `debeAplicarAumento_mesYAnioCoinciden_debeRetornarTrue`
- **Propósito:** Verificar que se aplique aumento cuando el mes y año de `fechaAumento` coinciden con el mes y año actual
- **Escenario:** Contrato con `fechaAumento` = primer día del mes actual
- **Resultado Esperado:** Se crea un alquiler con aumento aplicado
- **Validaciones:**
  - Se crea al menos un alquiler
  - Se registra un aumento en el historial

#### ✅ `debeAplicarAumento_fechaAumentoYaPaso_debeRetornarTrue`
- **Propósito:** Verificar que se apliquen aumentos atrasados
- **Escenario:** Contrato con `fechaAumento` en el pasado (2 meses atrás)
- **Resultado Esperado:** Se aplica el aumento aunque la fecha haya pasado
- **Validaciones:**
  - Se crea alquiler con aumento atrasado
  - Se registra el aumento

#### ✅ `debeAplicarAumento_fechaAumentoFutura_noDebeAplicarAumento`
- **Propósito:** Verificar que NO se aplique aumento cuando la fecha es futura
- **Escenario:** Contrato con `fechaAumento` 2 meses en el futuro
- **Resultado Esperado:** Se crea alquiler sin aumento
- **Validaciones:**
  - Se crea el alquiler
  - NO se registra ningún aumento

#### ✅ `debeAplicarAumento_fechaAumentoNoAumentaMas_noDebeAplicarAumento`
- **Propósito:** Verificar que contratos con "No aumenta más" no apliquen aumento
- **Escenario:** Contrato con `fechaAumento` = "No aumenta más"
- **Resultado Esperado:** Se crea alquiler sin aumento
- **Validaciones:**
  - Se crea el alquiler
  - NO se registra ningún aumento

---

### 2. Tests de Aumento Fijo - Sin ICL (2 tests)

#### ✅ `aumentoFijo_debeCalcularMontoCorrectamente`
- **Propósito:** Verificar el cálculo correcto del aumento fijo
- **Escenario:** 
  - Monto base: $100,000
  - Porcentaje aumento: 10%
  - No hay alquiler previo
- **Fórmula:** `monto × (1 + (porcentajeAumento / 100))`
- **Cálculo:** `100,000 × 1.10 = 110,000`
- **Validaciones:**
  - El monto del nuevo alquiler es exactamente $110,000
  - Se registra el aumento con el porcentaje correcto

#### ✅ `aumentoFijo_conAlquilerPrevio_debeUsarMontoDelUltimoAlquiler`
- **Propósito:** Verificar que se use el monto del último alquiler, no el del contrato
- **Escenario:**
  - Monto original del contrato: $100,000
  - Monto del último alquiler: $120,000
  - Porcentaje aumento: 5%
- **Cálculo:** `120,000 × 1.05 = 126,000`
- **Validaciones:**
  - Se usa el monto del último alquiler ($120,000), NO el del contrato
  - El nuevo monto es $126,000

---

### 3. Tests de Aumento con ICL (2 tests)

#### ✅ `aumentoConICL_debeConsultarAPIBCRA`
- **Propósito:** Verificar que se consulte la API del BCRA cuando `aumentaConIcl = true`
- **Escenario:**
  - Monto base: $100,000
  - Tasa ICL de la API: 1.05 (5%)
  - `aumentaConIcl = true`
- **Cálculo:** `100,000 × 1.05 = 105,000`
- **Validaciones:**
  - Se llama a `bcraApiClient.obtenerTasaAumentoICL()`
  - El nuevo monto es $105,000
  - Se registra el aumento

#### ✅ `aumentoConICL_errorEnAPI_debeUsarMontoSinAumento`
- **Propósito:** Verificar el manejo de errores de la API del BCRA
- **Escenario:** La API del BCRA lanza una excepción
- **Resultado Esperado:** Se crea el alquiler con el monto base sin aumento (fallback)
- **Validaciones:**
  - Se intenta llamar a la API
  - Al fallar, se usa el monto base original
  - NO se registra ningún aumento

---

### 4. Tests de Actualización de Fecha de Aumento (2 tests)

#### ✅ `actualizarFechaAumento_debeActualizarCorrectamente`
- **Propósito:** Verificar que se actualice `fechaAumento` después de aplicar un aumento
- **Escenario:**
  - `fechaAumento` actual: 01/10/2025
  - `periodoAumento`: 3 meses
  - `fechaFin`: muy lejana (1 año)
- **Cálculo:** `01/10/2025 + 3 meses = 01/01/2026`
- **Validaciones:**
  - La `fechaAumento` se actualiza a `01/01/2026`
  - Siempre se establece el día 1 del mes

#### ✅ `actualizarFechaAumento_superaFechaFin_debeEstablecerNoAumentaMas`
- **Propósito:** Verificar que se marque "No aumenta más" cuando la nueva fecha supera `fechaFin`
- **Escenario:**
  - `fechaAumento` actual: 01/10/2025
  - `periodoAumento`: 3 meses
  - `fechaFin`: 30/11/2025 (cercana, solo 1 mes más)
- **Cálculo:** `01/10/2025 + 3 meses = 01/01/2026` → supera `fechaFin`
- **Validaciones:**
  - La `fechaAumento` se establece como "No aumenta más"
  - NO se establece una fecha específica

---

### 5. Tests de Procesamiento Mensual (2 tests)

#### ✅ `procesarAlquileresPendientes_mesYaProcesado_noDebeCrearAlquileres`
- **Propósito:** Verificar que no se procesen alquileres duplicados en el mismo mes
- **Escenario:** La configuración indica que el mes actual ya fue procesado
- **Resultado Esperado:** NO se crean alquileres
- **Validaciones:**
  - Retorna 0 alquileres creados
  - NO se consulta la lista de contratos vigentes

#### ✅ `procesarAlquileresPendientes_mesNoProcesado_debeCrearAlquileres`
- **Propósito:** Verificar que se procesen alquileres cuando cambia el mes
- **Escenario:** El último mes procesado fue el mes anterior
- **Resultado Esperado:** Se crean alquileres para el nuevo mes
- **Validaciones:**
  - Se crean alquileres
  - Se actualiza la configuración del último mes procesado

---

### 6. Tests de No Creación de Alquileres (2 tests)

#### ✅ `crearAlquileres_contratoConAlquilerPendiente_noDebeCrearNuevo`
- **Propósito:** Verificar que no se creen alquileres duplicados
- **Escenario:** El contrato ya tiene un alquiler pendiente (no pagado)
- **Resultado Esperado:** NO se crea un nuevo alquiler
- **Validaciones:**
  - Retorna 0 alquileres creados
  - NO se llama a `saveAll()`

#### ✅ `crearAlquileres_sinContratosVigentes_noDebeCrearAlquileres`
- **Propósito:** Verificar el comportamiento cuando no hay contratos vigentes
- **Escenario:** No existen contratos con estado "Vigente"
- **Resultado Esperado:** NO se crean alquileres
- **Validaciones:**
  - Retorna 0 alquileres creados
  - NO se intenta guardar ningún alquiler

---

## Casos de Uso Probados

### ✅ Lógica de Negocio Principal
1. **Creación de alquileres solo al inicio de mes** - Verificado mediante control de mes procesado
2. **Monto del primer alquiler = monto del contrato** - Verificado en tests sin alquiler previo
3. **Monto de alquileres subsiguientes = monto del último alquiler** - Verificado en tests con alquiler previo
4. **Aumento se aplica solo cuando mes y año coinciden** - Verificado con fechas pasadas, presentes y futuras
5. **Actualización automática de fechaAumento** - Verificado que se suma periodoAumento
6. **Detección de fin de aumentos** - Verificado con "No aumenta más"

### ✅ Cálculos de Aumentos
1. **Aumento fijo:** `monto × (1 + porcentajeAumento/100)` ✅
2. **Aumento con ICL:** `monto × tasaICL` (obtenida de API BCRA) ✅
3. **Fallback en error:** Uso del monto base si falla la API ✅

### ✅ Integridad de Datos
1. **No duplicar alquileres** - Verificado con alquileres pendientes
2. **No procesar dos veces el mismo mes** - Verificado con configuración de sistema
3. **Historial de aumentos** - Verificado que se registren en `AumentoAlquiler`

---

## Configuración de Tests

### Framework Utilizado
- **JUnit 5** (Jupiter)
- **Mockito** para mocking de dependencias

### Dependencias Mockeadas
- `AlquilerRepository`
- `ContratoRepository`
- `ConfiguracionSistemaRepository`
- `BCRAApiClient`
- `AumentoAlquilerService`

### Ventajas de este Enfoque
- ✅ Tests rápidos (no requieren base de datos)
- ✅ Aislamiento total de dependencias externas
- ✅ Fácil reproducción de escenarios específicos
- ✅ No afecta datos de producción

---

## Cómo Ejecutar los Tests

### Ejecutar todos los tests del servicio:
```bash
mvn test -Dtest=AlquilerActualizacionServiceTest
```

### Ejecutar un test específico:
```bash
mvn test -Dtest=AlquilerActualizacionServiceTest#aumentoFijo_debeCalcularMontoCorrectamente
```

### Ejecutar todos los tests del proyecto:
```bash
mvn test
```

---

## Próximos Pasos Recomendados

### Tests de Integración
Crear tests de integración que:
1. Usen base de datos H2 en memoria
2. Verifiquen el flujo completo desde login hasta creación de alquiler
3. Prueben la interacción real con la API del BCRA

### Tests de Performance
Evaluar el rendimiento con:
1. 100+ contratos vigentes
2. Procesamiento batch
3. Tiempo de respuesta

### Tests End-to-End
Probar desde el frontend:
1. Flujo completo de usuario
2. Validación de datos en UI
3. Sincronización con backend

---

## Métricas de Calidad

- **Cobertura de Código:** Alta (todos los métodos críticos cubiertos)
- **Tiempo de Ejecución:** 1.3 segundos (excelente para 14 tests)
- **Complejidad Ciclomática:** Controlada mediante separación de responsabilidades
- **Mantenibilidad:** Alta (métodos auxiliares reutilizables)

---

**Fecha de Creación:** 30 de Octubre de 2025  
**Versión:** 1.0  
**Autor:** Sistema de Tests Automatizados

