export type PagoAlquiler = {
  id: number
  contratoId: number
  fechaVencimientoPago: string
  monto: number
  estaPagado: boolean
  fechaPago: string | null
  necesitaAumentoManual: boolean
  cuentaBanco: string | null
  titularDePago: string | null
  metodo: string | null
  createdAt: string
  updatedAt: string | null
  inmuebleId: number
  direccionInmueble: string
  inquilinoId: number
  nombreInquilino: string
  apellidoInquilino: string
}
