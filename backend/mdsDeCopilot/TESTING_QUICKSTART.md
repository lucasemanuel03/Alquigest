# Guía Rápida de Testing - Alquigest

## 🚀 Inicio Rápido

### Ejecutar todos los tests
```bash
cd backend
mvn test
```

### Usando el script helper
```bash
cd backend
./run-tests.sh all          # Todos los tests
./run-tests.sh controller   # Solo controladores
./run-tests.sh service      # Solo servicios
./run-tests.sh <NombreTest> # Test específico
./run-tests.sh coverage     # Generar reporte de cobertura
```

## 📊 Estado Actual

| Componente | Tests | Estado |
|-----------|-------|--------|
| InmuebleController | 21 | ✅ |
| InquilinoController | 23 | ✅ |
| PropietarioController | 20 | ✅ |
| ContratoController | 22 | ✅ |
| AlquilerActualizacionService | 14 | ✅ |
| PermisosService | Varios | ✅ |
| PropietarioServiceIntegration | 2 | ❌ |
| **TOTAL** | **102** | **100 ✅ / 2 ❌** |

## ✅ Validar cambios

Antes de hacer commit de tus cambios, ejecuta:

```bash
cd backend
mvn test
```

Si todos los tests pasan, tu código está listo para commit.

## 🔍 Ver resultados detallados

Los reportes de tests se guardan en:
```
backend/target/surefire-reports/
```

Para ver el reporte HTML de cobertura:
```bash
cd backend
mvn test jacoco:report
# Abrir: target/site/jacoco/index.html
```

## 🆘 Solución de Problemas

### Error: "Failed to load ApplicationContext"
- Los 2 tests de integración tienen este error
- Es un problema de configuración de BD para tests
- No afecta los 100 tests unitarios que pasan correctamente

### Tests lentos
- Los tests de integración son más lentos (requieren BD)
- Los tests unitarios son rápidos (<5 segundos)
- Usa `./run-tests.sh controller` para ejecutar solo tests rápidos

### Actualizar tests
Si cambias la API o servicios:
1. Actualiza los tests correspondientes
2. Ejecuta `mvn test` para validar
3. Actualiza la documentación si es necesario

## 📚 Más Información

Ver [GUIA_TESTING.md](./GUIA_TESTING.md) para:
- Cómo crear nuevos tests
- Estructura de tests
- Mejores prácticas
- Estrategia de testing completa
