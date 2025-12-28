# Módulo Inmuebles - Documentación

## 📋 Resumen

El módulo de **Inmuebles** gestiona el CRUD completo de propiedades inmobiliarias, incluyendo filtros dinámicos, búsqueda por dirección y verificación de duplicados.

---

## 🏗️ Estructura del Módulo

```
utils/services/
└── inmueblesService.ts      # API calls + lógica de negocio

hooks/
└── useInmuebles.ts           # State management + refetch logic

app/inmuebles/
├── page.tsx                  # Orquestador (usa InmueblesContainer)
├── [id]/
│   └── page.tsx             # Detalle de inmueble
└── nuevo/
    └── nuevoInmuebleModal.tsx # Modal para crear

components/inmuebles/
├── InmueblesContainer.tsx    # Contenedor principal
├── DetalleInmuebleContainer.tsx # Detalle de inmueble
├── InmueblesHeader.tsx       # Header con filtros
├── InmueblesGrid.tsx         # Grid de inmuebles
├── InmuebleCard.tsx          # Card de inmueble
├── InmuebleDatosCard.tsx     # Card de datos
├── InmuebleHeader.tsx        # Header de detalle
├── PropietarioCard.tsx       # Card de propietario
└── ContratoResumenCard.tsx   # Card de contratos
```

---

## 🔧 API Service (`inmueblesService.ts`)

### Métodos Disponibles

#### **GET: Por Filtro**
```typescript
InmueblesService.getByFiltro(filtro: FiltroInmuebles): Promise<Inmueble[]>
```
- **Filtros disponibles**: `"activos"` | `"inactivos"` | `"alquilados"` | `"disponibles"`
- **Retorna**: Array de inmuebles según el filtro
- **Endpoints**:
  - `activos` → `/inmuebles/activos`
  - `inactivos` → `/inmuebles/inactivos`
  - `alquilados` → `/inmuebles/alquilados`
  - `disponibles` → `/inmuebles/disponibles`

#### **GET: Todos**
```typescript
InmueblesService.getAll(): Promise<Inmueble[]>
```

#### **GET: Por ID**
```typescript
InmueblesService.getById(id: string | number): Promise<Inmueble>
```
- **Valida**: Que el servidor retorne un objeto con `id`

#### **GET: Buscar por Dirección**
```typescript
InmueblesService.buscarPorDireccion(direccion: string): Promise<Inmueble[]>
```
- **Uso**: Verificar duplicados antes de crear
- **Endpoint**: `/inmuebles/buscar-direccion?direccion=...`

#### **POST: Crear**
```typescript
InmueblesService.create(data: Omit<Inmueble, "id" | "tipo">): Promise<Inmueble>
```
- **Campos requeridos**:
  - `propietarioId`: number
  - `direccion`: string
  - `tipoInmuebleId`: number
  - `estado`: number
  - `superficie`: number
  - `esActivo`: boolean
  - `esAlquilado`: boolean

#### **PUT: Actualizar**
```typescript
InmueblesService.update(id: string | number, data: Partial<Inmueble>): Promise<Inmueble>
```
- **Lógica especial**: Si `estado === 3`, primero ejecuta `desactivar()`
- **Retorna**: Inmueble actualizado

#### **PATCH: Desactivar**
```typescript
InmueblesService.desactivar(id: string | number): Promise<void>
```
- **Endpoint**: `/inmuebles/{id}/desactivar`
- **Uso**: Baja lógica del inmueble

---

## 🎣 Hook Custom (`useInmuebles`)

### Firma
```typescript
const {
  inmuebles,      // Inmueble[]
  loading,        // boolean
  error,          // string | null
  refetch,        // (filtro?: FiltroInmuebles) => Promise<void>
  create,         // (data) => Promise<Inmueble>
  update,         // (id, data) => Promise<Inmueble>
  desactivar,     // (id) => Promise<void>
  clearError      // () => void
} = useInmuebles(filtroInicial?: FiltroInmuebles)
```

### Parámetros
- `filtroInicial` (opcional): `"activos"` por defecto

### Estado Interno
- **inmuebles**: Lista de inmuebles según el filtro actual
- **loading**: `true` mientras carga datos
- **error**: Mensaje de error si algo falla
- **filtroActual**: Filtro activo (se actualiza con `refetch`)

### Métodos

#### `refetch(filtro?: FiltroInmuebles)`
Recarga los datos con un nuevo filtro (o el actual).

```typescript
const { refetch } = useInmuebles("activos");

// Cambiar a inactivos
refetch("inactivos");
```

#### `create(data)`
Crea un nuevo inmueble y lo agrega al estado local.

```typescript
const nuevoInmueble = await create({
  propietarioId: 1,
  direccion: "Av. Siempre Viva 123",
  tipoInmuebleId: 1,
  estado: 1,
  superficie: 85,
  esActivo: true,
  esAlquilado: false,
});
```

#### `update(id, data)`
Actualiza un inmueble existente y reemplaza el objeto en el estado.

```typescript
await update(123, {
  direccion: "Nueva Dirección 456",
  estado: 3, // Esto activa la desactivación automática
});
```

#### `desactivar(id)`
Desactiva un inmueble (baja lógica) y lo elimina del estado local.

```typescript
await desactivar(123);
```

---

## 📄 Componentes

### **InmueblesContainer** (Principal)
- **Ubicación**: `components/inmuebles/InmueblesContainer.tsx`
- **Responsabilidad**: Orquesta la lista de inmuebles
- **Usa**: `useInmuebles` para gestionar datos

**Features**:
- Filtros dinámicos (activos, inactivos, alquilados, disponibles)
- Búsqueda por dirección
- Edición de inmuebles
- Gestión de propietarios

### **DetalleInmuebleContainer** (Detalle)
- **Ubicación**: `components/inmuebles/DetalleInmuebleContainer.tsx`
- **Responsabilidad**: Muestra los detalles de un inmueble
- **Usa**: `InmueblesService.getById(id)`

**Features**:
- Carga datos del inmueble
- Carga datos del propietario
- Carga contratos asociados
- Validación de contrato vigente

### **NuevoInmuebleModal** (Crear)
- **Ubicación**: `app/inmuebles/nuevo/nuevoInmuebleModal.tsx`
- **Responsabilidad**: Modal para crear inmuebles
- **Usa**: `useInmuebles().create`

**Features**:
- Validación de dirección duplicada
- Lazy-load de propietarios
- Modal de confirmación para duplicados
- Creación de propietario inline
- Permisos (`crear_propietario`)

---

## 🔄 Flujo de Trabajo

### **Crear Inmueble**
1. Usuario abre `NuevoInmuebleModal`
2. Completa el formulario
3. Al enviar, se verifica la dirección (`buscarPorDireccion`)
4. Si existe duplicado → Modal de confirmación
5. Si confirma → `create()` del hook
6. Hook actualiza el estado local
7. Callback `onInmuebleCreado` notifica al padre

### **Editar Inmueble**
1. Usuario hace clic en "Editar"
2. Se abre `ModalEditarInmueble`
3. Al enviar → `update()` del hook
4. Si `estado === 3` → Se ejecuta `desactivar()` primero
5. Luego se ejecuta PUT
6. Estado local se actualiza

### **Filtrar Inmuebles**
1. Usuario selecciona filtro en `InmueblesHeader`
2. Se llama `handleChangeFiltro(nuevoFiltro)`
3. Se actualiza la URL (`?filtro=inactivos`)
4. Se ejecuta `refetch(nuevoFiltro)`
5. Hook recarga datos y actualiza estado

---

## ✅ Checklist de Implementación

- [x] **Service Layer**
  - [x] Crear `inmueblesService.ts`
  - [x] Métodos CRUD (getAll, getById, create, update)
  - [x] Filtros (activos, inactivos, alquilados, disponibles)
  - [x] Búsqueda por dirección
  - [x] Desactivación (PATCH)
  - [x] Validaciones de respuesta

- [x] **Hook Custom**
  - [x] Crear `useInmuebles.ts`
  - [x] State (inmuebles, loading, error)
  - [x] Métodos (create, update, desactivar, refetch)
  - [x] Manejo de errores
  - [x] JSDoc

- [x] **Componentes**
  - [x] Refactorizar `InmueblesContainer`
  - [x] Refactorizar `DetalleInmuebleContainer`
  - [x] Refactorizar `NuevoInmuebleModal`
  - [x] Usar hook en todos los componentes

- [x] **Exports**
  - [x] Index en `utils/services/index.ts`
  - [x] Index en `hooks/index.ts`

- [x] **Documentación**
  - [x] README del módulo
  - [x] JSDoc en métodos
  - [x] Ejemplos de uso

---

## 🧪 Ejemplos de Uso

### **Usar el Hook en un Componente**
```typescript
import { useInmuebles } from "@/hooks/useInmuebles";

export default function MiComponente() {
  const { inmuebles, loading, create, refetch } = useInmuebles("activos");

  if (loading) return <Loading />;

  return (
    <div>
      {inmuebles.map(inm => (
        <div key={inm.id}>{inm.direccion}</div>
      ))}
      <Button onClick={() => refetch("inactivos")}>
        Ver Inactivos
      </Button>
    </div>
  );
}
```

### **Llamar al Service Directamente**
```typescript
import { InmueblesService } from "@/utils/services/inmueblesService";

async function buscarInmueble(id: number) {
  try {
    const inmueble = await InmueblesService.getById(id);
    console.log(inmueble);
  } catch (error) {
    console.error("Error:", error.message);
  }
}
```

---

## 🚀 Próximos Pasos

- [ ] Tests unitarios para `inmueblesService`
- [ ] Tests unitarios para `useInmuebles`
- [ ] Tests de integración para `InmueblesContainer`
- [ ] Implementar componente `inmueble-card.tsx` puro
- [ ] Implementar componente `inmueble-form.tsx` reutilizable
- [ ] Optimizar lazy-loading de propietarios

---

## 📚 Referencias

- [Patrón de Refactorización](./PATRON_REFACTORIZACION.md)
- [Checklist](./CHECKLIST_REFACTORIZAR.md)
- [Documentación de Propietarios](./propietarios/README.md)
- [Documentación de Inquilinos](./inquilinos/README.md)
