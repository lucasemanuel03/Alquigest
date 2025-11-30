Lista de Endpoints:
**/api**
    **/auth**
        POS /signin
        POS /signup 
        POS /signout
        POS /refresh
    **/contratos**
        GET - Obtener todos los contratos
        GET /{id} - Obtener contrato por ID
        GET /inmueble/{inmuebleId} - Obtener contratos por inmueble
        GET /inquilino/{inquilinoId} - Obtener contratos por inquilino
        GET /vigentes - Obtener contratos vigentes
        GET /no-vigentes - Obtener contratos no vigentes
        GET /count/vigentes - Contar contratos vigentes
        GET /proximos-vencer - Obtener contratos próximos a vencer
        POS - Crear nuevo contrato   **ABOGADA**
        PUT /{id} - Actualizar contrato   **ABOGADA**
        PAT /{id}/estado - Cambiar estado del contrato   **ABOGADA**
        GET /{id}/existe - Verificar si existe un contrato
    **/estados-contrato**
        GET - Obtener todos los estados de contrato
        GET /{id} - Obtener estado de contrato por ID
        GET /nombre/{nombre} - Obtener estado de contrato por nombre
        POS - Crear nuevo estado de contrato  **ADMIN**
        PUT /{id} - Actualizar estado de contrato  **ADMIN**
        DEL /{id} - Eliminar estado de contrato  **ADMIN**
        GET /{id}/existe - Verificar si existe un estado de contrato
    **/inmuebles**
        GET - Obtener todos los inmuebles
        GET /activos - Obtener solo inmuebles activos
        GET /inactivos - Obtener solo inmuebles inactivos
        GET /count/activos - Contar inmuebles activos
        GET /disponibles - Obtener inmuebles disponibles
        GET /{id} - Obtener inmueble por ID
        GET /propietario/{propietarioId} - Buscar por propietario
        GET /buscar-direccion - Buscar por dirección
        POS - Crear nuevo inmueble  **ABOGADA**
        PUT /{id} - Actualizar inmueble  **ABOGADA**
        PAT /{id}/alquiler - Cambiar estado de alquiler  **ABOGADA**
        PAT /{id}/desactivar - Desactivar inmueble (eliminación lógica)  **ABOGADA**
        PAT /{id}/activar - Activar inmueble inactivo  **ABOGADA**
        PAT /{id}/tipo - Cambiar tipo de inmueble  **ABOGADA**
    **/inquilinos**
        GET - Obtener todos los inquilinos
        GET /activos - Obtener solo inquilinos activos
        GET /inactivos - Obtener solo inquilinos inactivos
        GET /count/activos - Contar inquilinos activos
        GET /{id} - Obtener inquilino por ID
        GET /buscar/cuil/{cuil} - Buscar inquilino por CUIL
        GET /buscar/nombre - Buscar inquilinos por nombre
        POS - Crear nuevo inquilino  **ABOGADA**
        PUT /{id} - Actualizar inquilino completo  **ABOGADA**
        PAT /{id}/desactivar - Desactivar inquilino (eliminación lógica)  **ABOGADA**
        PAT /{id}/activar - Activar inquilino inactivo  **ABOGADA**
    **/propietarios**
        GET /
        GET /activos
        GET /inactivos
        GET /count/activos
        GET /{id}
        GET /dni/{dni}
        GET /buscar
        POS /  **ABOGADA**
        PUT /{id}   **ABOGADA**
        PAT /{id}/desactivar   **ABOGADA**
        PAT /{id}/activar  **ABOGADA**
    **/tipos-inmueble**
        GET - Obtener todos los tipos de inmueble
        GET /{id} - Obtener tipo de inmueble por ID
        POS - Crear nuevo tipo de inmueble  **ADMIN**
        PUT /{id} - Actualizar tipo de inmueble  **ADMIN**
        DEL /{id} - Eliminar tipo de inmueble  **ADMIN**