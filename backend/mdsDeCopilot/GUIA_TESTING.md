# Guía de Testing para Alquigest

## Objetivo

Este documento describe la estrategia de testing implementada para validar que el sistema Alquigest funciona correctamente. Los tests permiten verificar que los cambios en el código no rompan funcionalidades existentes.

## Estructura de Tests

### Backend (Java/Spring Boot)

La suite de tests del backend se encuentra en `/backend/src/test/java/com/alquileres/` y está organizada de la siguiente manera:

```
backend/src/test/java/com/alquileres/
├── controller/          # Tests de controladores REST
│   ├── InmuebleControllerTest.java
│   ├── InquilinoControllerTest.java
│   ├── PropietarioControllerTest.java
│   └── ContratoControllerTest.java
└── service/            # Tests de servicios de negocio
    ├── AlquilerActualizacionServiceTest.java
    ├── PermisosServiceTest.java
    └── PropietarioServiceIntegrationTest.java
```

### Tipos de Tests

#### 1. Tests Unitarios de Controladores
- **Propósito**: Verificar que los endpoints REST responden correctamente
- **Cobertura**: InmuebleController, InquilinoController, PropietarioController, ContratoController
- **Tests por controlador**: ~20 tests promedio
- **Tecnología**: JUnit 5 + Mockito

**Ejemplo de casos cubiertos:**
- Obtener todos los recursos
- Obtener recurso por ID
- Crear nuevo recurso
- Actualizar recurso existente
- Eliminar/desactivar recurso
- Búsquedas y filtros
- Manejo de errores (recurso no encontrado, datos inválidos)

#### 2. Tests Unitarios de Servicios
- **Propósito**: Verificar la lógica de negocio
- **Cobertura**: AlquilerActualizacionService, PermisosService
- **Tecnología**: JUnit 5 + Mockito

**Casos especiales cubiertos:**
- **AlquilerActualizacionService**: 
  - Cálculo de aumentos automáticos
  - Aumentos fijos vs aumentos con ICL
  - Integración con API del BCRA
  - Manejo de errores de API
  - Actualización de fechas de aumento

#### 3. Tests de Integración
- **Propósito**: Verificar la integración completa con base de datos
- **Cobertura**: PropietarioServiceIntegrationTest
- **Estado**: Actualmente con error de configuración de base de datos (requiere configuración de PostgreSQL para tests)

## Ejecutar los Tests

### Todos los tests
```bash
cd backend
mvn test
```

### Solo tests unitarios (sin integración)
```bash
cd backend
mvn test -Dtest=*Test,!*IntegrationTest
```

### Un test específico
```bash
cd backend
mvn test -Dtest=InmuebleControllerTest
```

### Ver reporte de cobertura
```bash
cd backend
mvn test jacoco:report
# El reporte se genera en: target/site/jacoco/index.html
```

## Estado Actual de los Tests

### ✅ Tests Pasando (78 tests)

#### Controladores (64 tests)
- **InmuebleControllerTest**: 21 tests
- **InquilinoControllerTest**: 23 tests  
- **PropietarioControllerTest**: 20 tests

#### Servicios (14 tests)
- **AlquilerActualizacionServiceTest**: 14 tests
- **PermisosServiceTest**: Incluido en los 78 tests

### ❌ Tests con Error (2 tests)
- **PropietarioServiceIntegrationTest**: 2 tests
  - Error: Falta configuración de base de datos PostgreSQL para tests
  - Solución pendiente: Configurar base de datos H2 o PostgreSQL para entorno de test

## Cobertura por Componente

### Controllers
| Controller | Test Creado | Tests | Endpoints Cubiertos |
|-----------|-------------|-------|-------------------|
| InmuebleController | ✅ | 21 | 10/10 |
| InquilinoController | ✅ | 23 | 12/12 |
| PropietarioController | ✅ | 20 | 11/11 |
| ContratoController | ✅ | 25 | 12/12 |
| AlquilerController | ⚠️ | 0 | 0/17 |
| AuthController | ❌ | 0 | 0/8 |
| PagoServicioController | ❌ | 0 | 0/10 |
| ServicioXContratoController | ❌ | 0 | 0/10 |
| AumentoAlquilerController | ❌ | 0 | 0/5 |

### Services  
| Service | Test Creado | Tests | Métodos Cubiertos |
|---------|-------------|-------|------------------|
| AlquilerActualizacionService | ✅ | 14 | Alto |
| PermisosService | ✅ | Varios | Alto |
| PropietarioService | ⚠️ | 2 | Parcial (integración) |
| InmuebleService | ❌ | 0 | 0% |
| InquilinoService | ❌ | 0 | 0% |
| ContratoService | ❌ | 0 | 0% |
| AlquilerService | ❌ | 0 | 0% |

## Buenas Prácticas Implementadas

### 1. Nomenclatura Clara
- Los tests usan nombres descriptivos que indican:
  - Método que se prueba
  - Escenario de prueba
  - Resultado esperado
- Formato: `nombreMetodo_escenario_resultadoEsperado`

**Ejemplo:**
```java
void obtenerInmueblePorId_returnsInmueble_whenValidIdProvided()
void obtenerInmueblePorId_throwsException_whenInmuebleNotFound()
```

### 2. Aislamiento con Mocks
- Se usa Mockito para simular dependencias
- Cada test es independiente y no depende del estado de otros tests
- Los mocks aseguran que se prueba solo la lógica del componente

### 3. Cobertura de Casos
Cada controlador/servicio cubre:
- ✅ Casos exitosos (happy path)
- ✅ Casos de error (excepciones, validaciones)
- ✅ Casos límite (listas vacías, valores nulos)
- ✅ Casos de validación (datos inválidos)

### 4. Assertions Significativas
- Se verifican tanto el status code como el contenido de la respuesta
- Se usa `verify()` para asegurar que se llamaron los métodos correctos
- Se validan las excepciones esperadas

## Cómo Agregar Nuevos Tests

### Para un nuevo Controller

1. Crear archivo en `/backend/src/test/java/com/alquileres/controller/`
```java
@ExtendWith(MockitoExtension.class)
class NuevoControllerTest {
    @Mock
    private NuevoService service;
    
    @InjectMocks
    private NuevoController controller;
    
    @Test
    void metodo_escenario_resultado() {
        // Arrange
        // Act
        // Assert
    }
}
```

2. Cubrir todos los endpoints del controller
3. Incluir casos exitosos y de error
4. Ejecutar: `mvn test -Dtest=NuevoControllerTest`

### Para un nuevo Service

1. Crear archivo en `/backend/src/test/java/com/alquileres/service/`
2. Mockear los repositorios y dependencias
3. Probar la lógica de negocio
4. Validar manejo de errores

## Frontend

### Estado Actual
- ❌ No hay tests automatizados para el frontend
- Tecnología disponible: React Testing Library, Jest
- Prioridad: Media (el backend es crítico primero)

### Recomendaciones para Testing Frontend
1. Tests de componentes con React Testing Library
2. Tests de integración de formularios
3. Tests de llamadas a API (mocks)
4. Tests E2E con Playwright/Cypress (opcional)

## Integración Continua (CI/CD)

### Configuración Actual
- Los tests se ejecutan manualmente con `mvn test`
- Recomendación: Configurar GitHub Actions para ejecutar tests en cada PR

### Configuración Sugerida (.github/workflows/tests.yml)
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-java@v2
        with:
          java-version: '17'
      - run: cd backend && mvn test
```

## Métricas de Calidad

### Objetivo de Cobertura
- **Controllers**: 80%+ de cobertura de líneas
- **Services**: 70%+ de cobertura de líneas  
- **Crítico**: 90%+ (cálculos de alquileres, aumentos, pagos)

### Estado Actual
- **Tests totales**: 102 tests (100 pasando + 2 con error de configuración)
- **Cobertura estimada**: ~35% del código backend
- **Componentes críticos cubiertos**: 
  - ✅ Aumentos automáticos de alquileres
  - ✅ CRUD básico de Inmuebles, Inquilinos, Propietarios
  - ⚠️ Contratos (parcial)
  - ❌ Autenticación
  - ❌ Pagos de servicios

## Próximos Pasos

### Prioridad Alta
1. ✅ Crear tests para ContratoController (COMPLETADO)
2. ⏳ Resolver error de PropietarioServiceIntegrationTest
3. ⏳ Crear tests para AlquilerController
4. ⏳ Crear tests para AlquilerService

### Prioridad Media
5. Crear tests para AuthController
6. Crear tests para PagoServicioController
7. Agregar tests para servicios faltantes

### Prioridad Baja
8. Tests de integración E2E
9. Tests de rendimiento
10. Tests de frontend

## Solución de Problemas

### Error: "Failed to load ApplicationContext"
**Causa**: Falta configuración de base de datos para tests  
**Solución**: 
1. Agregar perfil `test` en `application.properties`
2. Configurar H2 en memoria para tests
3. O configurar PostgreSQL de test

### Error: "Cannot find symbol"
**Causa**: DTO o modelo no tiene el método/campo esperado  
**Solución**: Verificar la estructura real del DTO/modelo antes de crear el test

### Tests lentos
**Causa**: Tests de integración con base de datos real  
**Solución**: Usar base de datos en memoria (H2) para tests

## Recursos

- [JUnit 5 Documentation](https://junit.org/junit5/docs/current/user-guide/)
- [Mockito Documentation](https://javadoc.io/doc/org.mockito/mockito-core/latest/org/mockito/Mockito.html)
- [Spring Boot Testing](https://spring.io/guides/gs/testing-web/)
- [Testing Best Practices](https://phauer.com/2019/modern-best-practices-testing-java/)

## Mantenimiento

- **Frecuencia de revisión**: Cada sprint o cada 2 semanas
- **Responsable**: Equipo de desarrollo
- **Actualizar**: Cuando se agreguen nuevas funcionalidades
- **Refactorizar**: Cuando los tests se vuelvan difíciles de mantener
