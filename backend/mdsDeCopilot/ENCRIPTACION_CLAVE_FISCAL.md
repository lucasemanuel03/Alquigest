# Implementación de Encriptación de Clave Fiscal

## Descripción General

Se ha implementado un sistema de encriptación AES-256 para proteger la clave fiscal de los propietarios. Este documento explica cómo funciona y cómo se integra en el sistema.

## Componentes Implementados

### 1. EncryptionService
**Ubicación:** `com/alquileres/security/EncryptionService.java`

Servicio responsable de encriptar y desencriptar datos sensibles usando AES-256.

**Métodos principales:**
- `encriptar(String valor)`: Encripta un valor y lo devuelve en Base64
- `desencriptar(String valorEncriptado)`: Desencripta un valor desde Base64

### 2. Modelo - Propietario
**Ubicación:** `com/alquileres/model/Propietario.java`

Se agregó el atributo `claveFiscal` (opcional):
```java
@Size(max = 500, message = "La clave fiscal no puede exceder 500 caracteres")
@Column(name = "clave_fiscal", length = 500)
private String claveFiscal;
```

### 3. DTO - PropietarioDTO
**Ubicación:** `com/alquileres/dto/PropietarioDTO.java`

Se agregó el atributo `claveFiscal` (opcional) que se sincroniza con la entidad.

### 4. DTO - ContratoDTO
**Ubicación:** `com/alquileres/dto/ContratoDTO.java`

Se agregó el atributo `claveFiscalPropietario` para mostrar la clave fiscal desencriptada del propietario cuando se consulta un contrato.

### 5. PropietarioService
**Ubicación:** `com/alquileres/service/PropietarioService.java`

Se actualizaron los métodos para:
- **Encriptar** la clave fiscal al crear o actualizar un propietario
- **Desencriptar** la clave fiscal cuando se devuelven DTOs al cliente
- Usar un método auxiliar privado `desencriptarClaveFiscal()` para evitar duplicación de código

**Métodos afectados:**
- `crearPropietario()`
- `actualizarPropietario()`
- `obtenerPropietarioPorId()`
- `obtenerTodosLosPropietarios()`
- `obtenerPropietariosActivos()`
- `obtenerPropietariosInactivos()`
- `buscarPorCuil()`
- `buscarPorNombreYApellido()`

### 6. ContratoService
**Ubicación:** `com/alquileres/service/ContratoService.java`

Se actualizó el método `enrichContratoDTO()` para desencriptar la clave fiscal del propietario cuando se enriquece un DTO de contrato.

## Configuración

### application.properties
Se agregó la clave de encriptación AES-256 en Base64:

```properties
encryption.key=YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY=
```

**IMPORTANTE:** Esta es una clave de ejemplo. En producción, debe ser reemplazada por una clave segura única.

### pom.xml
Se desactivó el filtering de Maven en los recursos para evitar problemas con caracteres especiales:

```xml
<resources>
    <resource>
        <directory>src/main/resources</directory>
        <filtering>false</filtering>
    </resource>
</resources>
```

## Flujo de Datos

### Crear/Actualizar Propietario
```
1. Cliente envía PropietarioDTO con claveFiscal
2. PropietarioService.crearPropietario() recibe el DTO
3. Se encripta la claveFiscal usando EncryptionService
4. Se guarda el propietario con claveFiscal encriptada en BD
5. Se desencripta la clave fiscal antes de devolver el DTO al cliente
```

### Consultar Propietario
```
1. Cliente solicita obtener un propietario
2. PropietarioService recupera la entidad de BD (claveFiscal encriptada)
3. Se desencripta la claveFiscal usando EncryptionService
4. Se devuelve el DTO con claveFiscal desencriptada al cliente
```

### Consultar Contrato (con información del propietario)
```
1. Cliente solicita obtener un contrato
2. ContratoService.enrichContratoDTO() obtiene info del propietario
3. Se desencripta la claveFiscal del propietario
4. Se asigna a claveFiscalPropietario en el ContratoDTO
5. Se devuelve el DTO con la clave fiscal desencriptada
```

## Seguridad

- **Encriptación:** AES-256 (estándar de facto para datos sensibles)
- **Almacenamiento:** La clave fiscal se guarda encriptada en la base de datos
- **Transmisión:** Se transmite desencriptada solo cuando es necesario (para copiar/pegar)
- **Manejo de errores:** Si ocurre un error al desencriptar, se registra pero no se lanza excepción (se devuelve null)

## Base de Datos

La columna `clave_fiscal` se crea automáticamente mediante Hibernate DDL cuando se ejecuta la aplicación:

```sql
CREATE TABLE propietarios (
    ...
    clave_fiscal varchar(500),
    ...
)
```

## Uso desde el Frontend

### Obtener propietario con clave fiscal
```bash
GET /api/propietarios/{id}
Response:
{
    "id": 1,
    "nombre": "Juan",
    "apellido": "Pérez",
    "claveFiscal": "30-12345678-9",
    ...
}
```

### Crear propietario con clave fiscal
```bash
POST /api/propietarios
{
    "nombre": "Juan",
    "apellido": "Pérez",
    "cuil": "20-12345678-9",
    "claveFiscal": "30-12345678-9",
    ...
}
```

## Generar Nueva Clave de Encriptación (Para Producción)

Para generar una clave segura de 256 bits en Base64:

```java
import javax.crypto.KeyGenerator;
import java.util.Base64;

KeyGenerator keyGen = KeyGenerator.getInstance("AES");
keyGen.init(256);
String encryptionKey = Base64.getEncoder().encodeToString(keyGen.generateKey().getEncoded());
System.out.println(encryptionKey);
```

Luego reemplazar el valor en `application.properties` y en variables de entorno para producción.

## Próximos Pasos

1. Cambiar la clave de encriptación en producción
2. Guardar la clave en variables de entorno en lugar de en properties
3. Implementar rotación de claves si es necesario
4. Auditar accesos a la clave fiscal

