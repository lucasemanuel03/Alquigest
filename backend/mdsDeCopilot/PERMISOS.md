# Sistema de Permisos

### Acciones Disponibles
- `crear` - Crear nuevos registros
- `consultar` - Ver/listar registros
- `modificar` - Editar registros existentes
- `eliminar` - Eliminar registros
- `cambiar_estado` - Cambiar el estado de un registro
- `activar` - Activar un registro inactivo
- `desactivar` - Desactivar un registro (eliminación lógica)

### Sujetos (Entidades)
- `propietario`
- `inmueble`
- `inquilino`
- `contrato`
- `estado_contrato`
- `tipo_inmueble`

## Permisos por Rol

### ADMINISTRADOR
✅ **Todos los permisos** - Tiene acceso completo a todas las funcionalidades del sistema

### ABOGADA
#### Puede Consultar
- ✅ Todos los propietarios, inmuebles, inquilinos, contratos, estados y tipos

#### Propietarios
- ✅ `crear_propietario`
- ✅ `modificar_propietario`
- ✅ `activar_propietario`
- ✅ `desactivar_propietario`

#### Inquilinos
- ✅ `crear_inquilino`
- ✅ `modificar_inquilino`
- ✅ `activar_inquilino`
- ✅ `desactivar_inquilino`

#### Inmuebles
- ✅ `crear_inmueble`
- ✅ `modificar_inmueble`
- ✅ `cambiar_estado_inmueble`
- ✅ `activar_inmueble`
- ✅ `desactivar_inmueble`

#### Contratos
- ✅ `crear_contrato`
- ✅ `modificar_contrato`
- ✅ `cambiar_estado_contrato`

#### Estados y Tipos
- ✅ Solo consultar (no puede crear, modificar o eliminar)

### SECRETARIA
#### Puede Consultar
- ✅ Todos los propietarios, inmuebles, inquilinos, contratos, estados y tipos

#### Propietarios
- ✅ `crear_propietario`

#### Inquilinos
- ✅ `crear_inquilino`
- ✅ `modificar_inquilino`

#### Contratos, Inmuebles, Estados y Tipos
- ❌ Solo lectura (sin permisos de escritura)


## Lista Completa de Permisos

### Propietarios
- `crear_propietario`
- `consultar_propietario`
- `modificar_propietario`
- `eliminar_propietario`
- `activar_propietario`
- `desactivar_propietario`

### Inmuebles
- `crear_inmueble`
- `consultar_inmueble`
- `modificar_inmueble`
- `eliminar_inmueble`
- `cambiar_estado_inmueble`
- `activar_inmueble`
- `desactivar_inmueble`

### Inquilinos
- `crear_inquilino`
- `consultar_inquilino`
- `modificar_inquilino`
- `eliminar_inquilino`
- `activar_inquilino`
- `desactivar_inquilino`

### Contratos
- `crear_contrato`
- `consultar_contrato`
- `modificar_contrato`
- `eliminar_contrato`
- `cambiar_estado_contrato`
- `activar_contrato`
- `desactivar_contrato`

### Estados de Contrato
- `crear_estado_contrato`
- `consultar_estado_contrato`
- `modificar_estado_contrato`
- `eliminar_estado_contrato`
- `cambiar_estado_estado_contrato`
- `activar_estado_contrato`
- `desactivar_estado_contrato`

### Tipos de Inmueble
- `crear_tipo_inmueble`
- `consultar_tipo_inmueble`
- `modificar_tipo_inmueble`
- `eliminar_tipo_inmueble`
- `cambiar_estado_tipo_inmueble`
- `activar_tipo_inmueble`
- `desactivar_tipo_inmueble`
