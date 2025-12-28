### Para cada módulo ([modulo]):

- [ ] **Service Layer**
  - [ ] Crear `utils/services/[moduloService].ts`
  - [ ] Definir métodos CRUD básicos
  - [ ] Validar respuestas del servidor
  - [ ] Centralizar URLs
  - [ ] Documentar métodos

- [ ] **Hook Custom**
  - [ ] Crear `hooks/use[Modulo].ts`
  - [ ] Implementar state (data, loading, error)
  - [ ] Implementar métodos (create, update, delete, refetch)
  - [ ] Manejar errores consistentemente
  - [ ] Agregar JSDoc

- [ ] **Componentes Presentacionales**
  - [ ] Card: `components/[modulo]/[modulo]-card.tsx`
  - [ ] Form: `components/[modulo]/[modulo]-form.tsx`
  - [ ] Hacer componentes puros (sin lógica)
  - [ ] Agregar props para permisos
  - [ ] Usar shadcn/ui components

- [ ] **Page (Orquestador)**
  - [ ] Refactorizar `app/[modulo]/page.tsx`
  - [ ] Usar hook custom
  - [ ] Usar componentes presentacionales
  - [ ] Manejar estado de UI local (modal, edición)
  - [ ] Delegar lógica de negocio al hook

- [ ] **Tests**
  - [ ] Tests del service (`[moduloService].test.ts`)
  - [ ] Tests del hook (`use[Modulo].test.ts`)
  - [ ] Tests del componente card
  - [ ] Tests del componente form

- [ ] **Documentación**
  - [ ] JSDoc en todos los métodos
  - [ ] README en la carpeta del módulo
  - [ ] Ejemplos de uso del hook