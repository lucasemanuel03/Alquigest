# Guía de Migración Frontend: Fusión de ServicioXContrato y ConfiguracionPagoServicio

**Fecha:** 8 de Noviembre de 2025  
**Versión Backend:** 2.0  
**Breaking Changes:** Sí

---

## 📋 Resumen Ejecutivo

### Cambios Principales

1. **Fusión de entidades:** `ServicioXContrato` + `ConfiguracionPagoServicio` → `ServicioContrato`
2. **Nuevo nombre de columna en BD:** `servicio_x_contrato_id` → `servicio_contrato_id`
3. **Eliminación de campos:** `fechaInicio`, `fechaFin` (no se usaban)
4. **Cambio de tipos:** Fechas de `String` → `LocalDate` (formato ISO: `YYYY-MM-DD`)
5. **Campos ahora opcionales:** `nroCuenta`, `nroContrato` (antes NOT NULL, ahora nullable)

### Impacto Estimado

- **Endpoints afectados:** Todos los relacionados con servicios
- **Modelos a actualizar:** `ServicioXContrato`, `PagoServicio`, DTOs relacionados
- **Tiempo estimado:** 2-4 horas
- **Complejidad:** Media

---

## 🎯 Versión Resumida

### 1. Cambiar nombres de propiedades en modelos TypeScript

**Antes:**
```typescript
interface PagoServicio {
  servicioXContrato: ServicioXContrato;
}

interface ServicioXContrato {
  id: number;
  contratoId: number;
  tipoServicioId: number;
  nroCuenta: string;  // era obligatorio
  nroContrato: string; // era obligatorio
  esDeInquilino: boolean;
  esAnual: boolean;
  esActivo: boolean;
}

interface ConfiguracionPagoServicio {
  id: number;
  servicioXContratoId: number;
  fechaInicio: string;
  fechaFin: string | null;
  ultimoPagoGenerado: string | null;
  proximoPago: string;
  esActivo: boolean;
}
```

**Después:**
```typescript
interface PagoServicio {
  servicioContrato: ServicioContrato; // ⚠️ CAMBIO DE NOMBRE
}

interface ServicioContrato {
  id: number;
  contratoId: number;
  tipoServicioId: number;
  nroCuenta: string | null; // ⚠️ AHORA OPCIONAL
  nroContrato: string | null; // ⚠️ AHORA OPCIONAL
  nroContratoServicio: string | null;
  esDeInquilino: boolean;
  esAnual: boolean;
  esActivo: boolean;
  ultimoPagoGenerado: string | null; // ⚠️ FORMATO: YYYY-MM-DD
  proximoPago: string | null; // ⚠️ FORMATO: YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
}
```

### 2. Actualizar llamadas a API

**Endpoints que cambian:**

| Antes | Después |
|-------|---------|
| `/api/servicios-x-contrato` | `/api/servicios-contrato` |
| `/api/configuracion-pago-servicio` | ❌ **Eliminado** |

### 3. Buscar y reemplazar en todo el proyecto

```bash
# Reemplazos necesarios
servicioXContrato → servicioContrato
ServicioXContrato → ServicioContrato
servicio_x_contrato → servicio_contrato
configuracionPagoServicio → (ya no existe, fusionado en ServicioContrato)
```

### 4. Validaciones a actualizar

- `nroCuenta` y `nroContrato` ahora pueden ser `null` o vacíos
- Las fechas vienen en formato `YYYY-MM-DD` en lugar de `DD/MM/YYYY`

---

## 📖 Versión Detallada

### Paso 1: Actualizar Modelos TypeScript

#### Archivo: `src/types/ServicioContrato.ts` (NUEVO)

```typescript
export interface ServicioContrato {
  id: number;
  contrato: {
    id: number;
    // ...otros campos del contrato
  };
  tipoServicio: {
    id: number;
    nombre: string;
    // ...otros campos
  };
  
  // Datos administrativos (OPCIONALES)
  nroCuenta?: string | null;
  nroContrato?: string | null;
  nroContratoServicio?: string | null;
  
  // Configuración
  esDeInquilino: boolean;
  esAnual: boolean;
  esActivo: boolean;
  
  // Control de generación (NUEVOS en esta entidad)
  ultimoPagoGenerado?: string | null; // YYYY-MM-DD
  proximoPago?: string | null; // YYYY-MM-DD
  
  // Auditoría
  createdAt: string;
  updatedAt: string;
}

export interface ServicioContratoCreateDTO {
  contratoId: number;
  tipoServicioId: number;
  esDeInquilino?: boolean;
  esAnual?: boolean;
  nroCuenta?: string;
  nroContrato?: string;
  nroContratoServicio?: string;
}

export interface ServicioContratoUpdateDTO {
  nroCuenta?: string;
  nroContrato?: string;
  nroContratoServicio?: string;
  esDeInquilino?: boolean;
  esAnual?: boolean;
}
```

#### Archivo: `src/types/PagoServicio.ts` (ACTUALIZAR)

```typescript
export interface PagoServicio {
  id: number;
  servicioContrato: ServicioContrato; // ⚠️ CAMBIO: era servicioXContrato
  periodo: string; // MM/YYYY
  fechaPago?: string | null;
  estaPagado: boolean;
  estaVencido: boolean;
  pdfPath?: string | null;
  medioPago?: string | null;
  monto?: number | null;
  createdAt: string;
  updatedAt: string;
}
```

---

### Paso 2: Actualizar Servicios API

#### Archivo: `src/services/servicioContratoService.ts` (NUEVO)

```typescript
import api from './api';
import { ServicioContrato, ServicioContratoCreateDTO, ServicioContratoUpdateDTO } from '../types/ServicioContrato';

export const servicioContratoService = {
  // Obtener todos los servicios de un contrato
  getByContrato: async (contratoId: number): Promise<ServicioContrato[]> => {
    const response = await api.get(`/servicios-contrato/contrato/${contratoId}`);
    return response.data;
  },

  // Obtener servicios activos de un contrato
  getActivosByContrato: async (contratoId: number): Promise<ServicioContrato[]> => {
    const response = await api.get(`/servicios-contrato/contrato/${contratoId}/activos`);
    return response.data;
  },

  // Crear un servicio
  create: async (dto: ServicioContratoCreateDTO): Promise<ServicioContrato> => {
    const response = await api.post('/servicios-contrato', dto);
    return response.data;
  },

  // Actualizar un servicio
  update: async (id: number, dto: ServicioContratoUpdateDTO): Promise<ServicioContrato> => {
    const response = await api.put(`/servicios-contrato/${id}`, dto);
    return response.data;
  },

  // Activar/Desactivar servicio
  toggleActivo: async (id: number, esActivo: boolean): Promise<ServicioContrato> => {
    const response = await api.patch(`/servicios-contrato/${id}/activo`, { esActivo });
    return response.data;
  },

  // Eliminar (desactivar) servicio
  delete: async (id: number): Promise<void> => {
    await api.delete(`/servicios-contrato/${id}`);
  },
};
```

#### Archivo: `src/services/pagoServicioService.ts` (ACTUALIZAR)

**Cambios necesarios:**

```typescript
// ANTES
const response = await api.get('/pagos-servicios/contrato/123');
const pagos: PagoServicio[] = response.data;
pagos.forEach(pago => {
  console.log(pago.servicioXContrato.tipoServicio.nombre);
});

// DESPUÉS
const response = await api.get('/pagos-servicios/contrato/123');
const pagos: PagoServicio[] = response.data;
pagos.forEach(pago => {
  console.log(pago.servicioContrato.tipoServicio.nombre); // ⚠️ CAMBIO
});
```

---

### Paso 3: Actualizar Componentes React

#### Ejemplo: Tabla de Servicios

**ANTES:**
```tsx
import { ServicioXContrato } from '../types/ServicioXContrato';

interface Props {
  contratoId: number;
}

const TablaServicios: React.FC<Props> = ({ contratoId }) => {
  const [servicios, setServicios] = useState<ServicioXContrato[]>([]);
  const [configuraciones, setConfiguraciones] = useState<ConfiguracionPagoServicio[]>([]);

  useEffect(() => {
    // Dos llamadas separadas
    fetchServicios();
    fetchConfiguraciones();
  }, [contratoId]);

  return (
    <table>
      <thead>
        <tr>
          <th>Tipo</th>
          <th>Nro Cuenta</th>
          <th>Último Pago</th>
        </tr>
      </thead>
      <tbody>
        {servicios.map(servicio => {
          const config = configuraciones.find(c => c.servicioXContratoId === servicio.id);
          return (
            <tr key={servicio.id}>
              <td>{servicio.tipoServicio.nombre}</td>
              <td>{servicio.nroCuenta}</td>
              <td>{config?.ultimoPagoGenerado || 'N/A'}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};
```

**DESPUÉS:**
```tsx
import { ServicioContrato } from '../types/ServicioContrato';
import { servicioContratoService } from '../services/servicioContratoService';

interface Props {
  contratoId: number;
}

const TablaServicios: React.FC<Props> = ({ contratoId }) => {
  const [servicios, setServicios] = useState<ServicioContrato[]>([]);

  useEffect(() => {
    // ✅ Una sola llamada
    const fetchServicios = async () => {
      const data = await servicioContratoService.getByContrato(contratoId);
      setServicios(data);
    };
    fetchServicios();
  }, [contratoId]);

  return (
    <table>
      <thead>
        <tr>
          <th>Tipo</th>
          <th>Nro Cuenta</th>
          <th>Último Pago</th>
        </tr>
      </thead>
      <tbody>
        {servicios.map(servicio => (
          <tr key={servicio.id}>
            <td>{servicio.tipoServicio.nombre}</td>
            <td>{servicio.nroCuenta || 'N/A'}</td> {/* ⚠️ Ahora puede ser null */}
            <td>{servicio.ultimoPagoGenerado || 'N/A'}</td> {/* ⚠️ Ya no necesitas buscar en otra entidad */}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```

---

### Paso 4: Actualizar Formularios

#### Ejemplo: Formulario de Edición de Servicio

**ANTES:**
```tsx
const [formData, setFormData] = useState({
  nroCuenta: servicio.nroCuenta, // siempre tenía valor
  nroContrato: servicio.nroContrato, // siempre tenía valor
});

// Validación
if (!formData.nroCuenta || !formData.nroContrato) {
  alert('Todos los campos son obligatorios');
  return;
}
```

**DESPUÉS:**
```tsx
const [formData, setFormData] = useState({
  nroCuenta: servicio.nroCuenta || '', // ⚠️ puede ser null
  nroContrato: servicio.nroContrato || '', // ⚠️ puede ser null
  nroContratoServicio: servicio.nroContratoServicio || '',
});

// Validación (OPCIONAL)
// Ya no es obligatorio tener estos campos
if (formData.nroCuenta && formData.nroCuenta.length > 50) {
  alert('Número de cuenta demasiado largo');
  return;
}
```

---

### Paso 5: Actualizar Manejo de Fechas

**ANTES (String con formato DD/MM/YYYY):**
```typescript
const formatearFecha = (fecha: string) => {
  // fecha = "15/11/2025"
  const [dia, mes, anio] = fecha.split('/');
  return new Date(+anio, +mes - 1, +dia);
};
```

**DESPUÉS (String con formato YYYY-MM-DD):**
```typescript
const formatearFecha = (fecha: string) => {
  // fecha = "2025-11-15"
  return new Date(fecha);
};

// O usar directamente en el template
{servicio.ultimoPagoGenerado && (
  <span>{new Date(servicio.ultimoPagoGenerado).toLocaleDateString('es-AR')}</span>
)}
```

---

### Paso 6: Actualizar Tests

**Actualizar mocks:**

```typescript
// ANTES
const mockServicioXContrato = {
  id: 1,
  contratoId: 100,
  tipoServicioId: 1,
  nroCuenta: '123456',
  nroContrato: '789',
  esDeInquilino: false,
  esAnual: false,
  esActivo: true,
};

const mockConfiguracion = {
  id: 1,
  servicioXContratoId: 1,
  fechaInicio: '2025-01-01',
  fechaFin: null,
  ultimoPagoGenerado: '2025-10-01',
  proximoPago: '2025-11-01',
  esActivo: true,
};

// DESPUÉS
const mockServicioContrato = {
  id: 1,
  contratoId: 100,
  tipoServicioId: 1,
  nroCuenta: '123456', // ahora puede ser null
  nroContrato: '789', // ahora puede ser null
  nroContratoServicio: null,
  esDeInquilino: false,
  esAnual: false,
  esActivo: true,
  ultimoPagoGenerado: '2025-10-01', // ⚠️ fusionado aquí
  proximoPago: '2025-11-01', // ⚠️ fusionado aquí
  createdAt: '2025-01-01T10:00:00',
  updatedAt: '2025-11-08T15:30:00',
};
```

---

## 🔍 Checklist de Migración

### Pre-Migración
- [ ] Hacer backup de la rama actual
- [ ] Crear rama de migración: `git checkout -b feature/servicio-contrato-fusion`
- [ ] Revisar todos los archivos que usan `ServicioXContrato` o `ConfiguracionPagoServicio`

### Durante la Migración
- [ ] Actualizar tipos TypeScript
- [ ] Actualizar servicios API
- [ ] Actualizar componentes React
- [ ] Actualizar formularios
- [ ] Actualizar validaciones
- [ ] Actualizar manejo de fechas
- [ ] Actualizar tests
- [ ] Probar endpoints en desarrollo

### Post-Migración
- [ ] Ejecutar tests: `npm test`
- [ ] Ejecutar lint: `npm run lint`
- [ ] Verificar build: `npm run build`
- [ ] Pruebas manuales en desarrollo
- [ ] Code review
- [ ] Merge a develop

---

## 🚨 Errores Comunes y Soluciones

### Error 1: `servicioXContrato is undefined`

**Causa:** Olvidaste actualizar la propiedad  
**Solución:** Buscar y reemplazar `servicioXContrato` → `servicioContrato`

### Error 2: `nroCuenta.length is not a function`

**Causa:** `nroCuenta` puede ser `null` ahora  
**Solución:** 
```typescript
// ANTES
if (servicio.nroCuenta.length > 0)

// DESPUÉS
if (servicio.nroCuenta && servicio.nroCuenta.length > 0)
```

### Error 3: `404 Not Found - /api/configuracion-pago-servicio/123`

**Causa:** El endpoint fue eliminado  
**Solución:** Usar `/api/servicios-contrato/123` directamente

### Error 4: Fecha inválida al parsear

**Causa:** El formato cambió de DD/MM/YYYY a YYYY-MM-DD  
**Solución:**
```typescript
// Formato correcto
const fecha = new Date(servicio.ultimoPagoGenerado); // "2025-11-15"
```

---

## 📞 Soporte

Si tienes dudas durante la migración:
1. Revisa este documento
2. Consulta la documentación del backend actualizada
3. Pregunta al equipo de backend

---

## 📝 Changelog

### v2.0 - 2025-11-08

**Breaking Changes:**
- Fusión de `ServicioXContrato` + `ConfiguracionPagoServicio` → `ServicioContrato`
- Cambio de nombre de columna: `servicio_x_contrato_id` → `servicio_contrato_id`
- Eliminación de campos: `fechaInicio`, `fechaFin`
- Cambio de tipos de fechas: `String` → `LocalDate` (YYYY-MM-DD)
- Campos opcionales: `nroCuenta`, `nroContrato`, `nroContratoServicio`

**Mejoras:**
- ✅ Menos llamadas a API (1 en lugar de 2)
- ✅ Código más simple y mantenible
- ✅ Mejor performance en consultas
- ✅ Eliminación de redundancia de datos

