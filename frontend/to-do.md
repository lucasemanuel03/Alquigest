## Cosas para hacer:

### SPRINT 5 FIX
- [X] Clave fiscal mostrar en el detalla propietario solo si es abogada
- [ ] Mostrar estado contrato actual
- [ ] Agregar en back y front el porcentaje de mora (1%)
- [ ] Agregar la posibilidad de agregar un nuevo servicio al contrato
- [ ] Utilizar endpoint tiene contratos vigentes para mostrar contratos de un inmueble
- [x] Mercedes Locativas, se muestra para contratos no vigenetes.
- [ ] Periodo de aumento me deja ingresar un número mayor que el posible

### MEJORAS EN SPRINT 4 5
- [ ] Búsqueda en todas las pages importantes
  - [ ] Componente SearchBar que reciba por parámetro:
    - 1 el array de objetcs
    - 2 una función callback que le permita al componente padre (la page), setear el array de objetcs filtrados para que la page sea la encargada de mostrar los objetos.


### Contrato - detalle
- [x] Mostrar motivos de rescincion en detalle Contrato

### Contrato
- [x] Agregar nuevo paso para carga de servicios

### Inmueble
- [x] Crear nuevo inmueble con estado disponible o en reparacion

### Pago de servicios
- [x] Todo

### ALQUILERES
 - [x] Ver historial
 - [x] Registrar Pago

### RESUMEN DE SERVICIOS POR PAGAR
- [x] Ver de hacer/generar el pdf.

## BACKEND
- [ ] Estado de inmueble inactivo queda disponible [ P4B ]
- [ ] Revisar los permisos de secretaria (crear inquilino y propietario) [U2H, U2K]
- [ ] Permiso crear_usuario

  #### SPRINT 4
  - [ ] Endpoint contratos tenga un atributo montoAlquiler, que sea el valor del ultimo alquiler.
  - [ ] Problemas en la generación automática de pagos-alquiler, si el contrato se crea con fecha incio anterior al mesa actual

