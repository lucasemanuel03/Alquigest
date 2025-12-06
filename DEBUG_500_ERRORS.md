# 🔴 Debug: Errores 500 en Endpoints del Backend

## 📋 Síntomas

Después de resolver el problema de autenticación, ahora aparecen errores 500 en varios endpoints:

```
❌ GET /api/alquileres/honorarios → 500 Internal Server Error
❌ GET /api/alquileres/aumento-manual/pendientes → 500 Internal Server Error
```

**Mensajes en consola:**
```
Error al traer contadores: Ha ocurrido un error interno en el servidor
Error al cargar notificaciones: Error: Ha ocurrido un error interno en el servidor
```

---

## 🔍 Análisis

### ✅ Lo que SÍ funciona:
- ✅ Autenticación (`/auth/signin`)
- ✅ Cookies HttpOnly se envían correctamente
- ✅ CORS configurado correctamente
- ✅ Las peticiones llegan al backend

### ❌ Lo que NO funciona:
- ❌ Endpoints específicos devuelven 500
- ❌ El backend falla al procesar las peticiones

---

## 🎯 Causa Probable

Los errores 500 indican que hay **excepciones no controladas** en el backend. Las causas más comunes son:

### 1. **Problemas de Base de Datos**
```
- Conexión perdida
- Queries que fallan
- Tablas/columnas faltantes
- Relaciones rotas (FK constraints)
```

### 2. **Datos Nulos o Inconsistentes**
```java
// Ejemplo: Si algún alquiler tiene contrato null
alquiler.getContrato().getId() // ❌ NullPointerException
```

### 3. **Dependencias Faltantes**
```
- Servicios que fallan (ej: BCRA API)
- Beans no inicializados
```

### 4. **Errores en Queries Personalizadas**
```java
// Si hay un @Query con SQL incorrecto
@Query("SELECT a FROM Alquiler a WHERE ...") // ❌ Sintaxis incorrecta
```

---

## 🚀 Pasos para Resolver

### **Paso 1: Ver Logs del Backend**

#### **En Render:**
1. Ve a tu servicio backend en Render
2. Click en **"Logs"** en el menú lateral
3. Busca el timestamp cuando ocurrieron los errores
4. Copia el stack trace completo

#### **Ejemplo de lo que buscamos:**
```
2025-12-04 12:34:56 ERROR [http-nio-8080-exec-1] o.a.c.c.C.[.[.[/].[dispatcherServlet] : 
Servlet.service() for servlet [dispatcherServlet] in context with path [] threw exception
java.lang.NullPointerException: Cannot invoke "Long.getId()" because "contrato" is null
    at com.alquileres.service.AlquilerService.calcularHonorarios(AlquilerService.java:123)
    at com.alquileres.controller.AlquilerController.calcularHonorarios(AlquilerController.java:133)
    ...
```

---

### **Paso 2: Verificar Estado de la Base de Datos**

Conectarse a la base de datos y verificar:

```sql
-- 1. Verificar que hay alquileres
SELECT COUNT(*) FROM alquileres;

-- 2. Verificar que los alquileres tienen contratos válidos
SELECT 
    a.id,
    a.contrato_id,
    c.id as contrato_existe
FROM alquileres a
LEFT JOIN contratos c ON a.contrato_id = c.id
WHERE c.id IS NULL;

-- 3. Verificar estructura de tablas
\d alquileres
\d contratos
```

---

### **Paso 3: Agregar Try-Catch y Logs**

Si el error no está claro, podemos agregar manejo de errores más detallado:

```java
@GetMapping("/honorarios")
public ResponseEntity<BigDecimal> calcularHonorarios() {
    try {
        System.out.println("🔍 Intentando calcular honorarios...");
        BigDecimal honorarios = alquilerService.calcularHonorarios();
        System.out.println("✅ Honorarios calculados: " + honorarios);
        return ResponseEntity.ok(honorarios);
    } catch (Exception e) {
        System.err.println("❌ Error calculando honorarios: " + e.getMessage());
        e.printStackTrace();
        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(BigDecimal.ZERO);
    }
}
```

---

### **Paso 4: Verificar Servicio Específico**

Revisar `AlquilerService.java`:

```bash
# Buscar el método que falla
grep -n "calcularHonorarios" backend/src/main/java/com/alquileres/service/AlquilerService.java
grep -n "obtenerAlquileresConAumentoManualPendiente" backend/src/main/java/com/alquileres/service/AlquilerService.java
```

---

## 🔧 Soluciones Comunes

### **Solución 1: NullPointerException**

Si el error es por datos nulos:

```java
// ❌ ANTES
public BigDecimal calcularHonorarios() {
    List<Alquiler> alquileres = alquilerRepository.findAll();
    return alquileres.stream()
        .filter(a -> a.isPagado())
        .map(a -> a.getMonto()) // ❌ Puede ser null
        .reduce(BigDecimal.ZERO, BigDecimal::add);
}

// ✅ DESPUÉS
public BigDecimal calcularHonorarios() {
    try {
        List<Alquiler> alquileres = alquilerRepository.findAll();
        return alquileres.stream()
            .filter(a -> a != null && a.isPagado())
            .map(a -> a.getMonto() != null ? a.getMonto() : BigDecimal.ZERO)
            .reduce(BigDecimal.ZERO, BigDecimal::add)
            .multiply(new BigDecimal("0.10"));
    } catch (Exception e) {
        System.err.println("Error calculando honorarios: " + e.getMessage());
        return BigDecimal.ZERO;
    }
}
```

---

### **Solución 2: Problema de Conexión BD**

Si es un problema de base de datos:

```properties
# application-production.properties
# Aumentar timeouts
spring.datasource.hikari.connection-timeout=60000
spring.datasource.hikari.validation-timeout=5000

# Agregar reintentos automáticos
spring.datasource.hikari.connection-test-query=SELECT 1
```

---

### **Solución 3: Query Personalizada Incorrecta**

Si hay un `@Query` que falla:

```java
// ❌ ANTES
@Query("SELECT a FROM Alquiler a WHERE a.necesitaAumentoManual = true")
List<Alquiler> findConAumentoManualPendiente();

// ✅ DESPUÉS - Verificar nombre de columna
@Query("SELECT a FROM Alquiler a WHERE a.necesitaAumentoManual = :valor")
List<Alquiler> findConAumentoManualPendiente(@Param("valor") boolean valor);

// O usar método derivado
List<Alquiler> findByNecesitaAumentoManualTrue();
```

---

## 📊 Checklist de Verificación

- [ ] **Ver logs del backend en Render**
- [ ] **Identificar el stack trace exacto del error**
- [ ] **Verificar conexión a base de datos**
- [ ] **Revisar datos en tablas afectadas**
- [ ] **Verificar que las columnas existen**
- [ ] **Agregar try-catch temporal para debugging**
- [ ] **Revisar implementación del servicio**
- [ ] **Verificar queries personalizadas**
- [ ] **Comprobar que no hay datos corruptos**

---

## 🆘 Qué Compartir para Ayuda Adicional

Si el problema persiste, comparte:

1. **Stack trace completo de los logs de Render**
   ```
   Render Dashboard → Tu servicio → Logs → Copiar el error completo
   ```

2. **Código del servicio que falla**
   ```bash
   cat backend/src/main/java/com/alquileres/service/AlquilerService.java
   ```

3. **Estructura de la tabla**
   ```sql
   \d alquileres
   ```

4. **Datos de ejemplo**
   ```sql
   SELECT * FROM alquileres LIMIT 5;
   ```

---

## 💡 Tips de Debugging

### **Logs en Tiempo Real:**
```bash
# En Render, los logs se actualizan automáticamente
# Mantén la página abierta y recarga el frontend para ver nuevos errores
```

### **Filtrar Logs:**
```bash
# Buscar solo errores
grep -i "error\|exception" logs.txt

# Buscar stack traces específicos
grep -A 20 "NullPointerException" logs.txt
```

### **Test Directo con cURL:**
```bash
# Testear endpoint directamente
curl -v -X GET https://alquigest.onrender.com/api/alquileres/honorarios \
  -H "Cookie: accessToken=TU_TOKEN_AQUI"
```

---

## 🎯 Próximos Pasos

1. **Acceder a los logs de Render**
2. **Copiar el error exacto**
3. **Compartir el stack trace** para análisis detallado
4. **Verificar estado de la base de datos**

---

**Nota Importante:** Los errores 500 son del lado del servidor, no del frontend. El frontend está funcionando correctamente y enviando las peticiones como debe. El problema está en el procesamiento de esas peticiones en el backend.

---

**Última actualización:** 4 de diciembre de 2025
