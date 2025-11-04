export interface Contrato {
    id: number
    inmuebleId: number
    inquilinoId: number
    fechaInicio: string
    fechaFin: string
    monto: number
    porcentajeAumento: number
    porcentajeHonorario: number
    estadoContratoId: number
    aumentaConIcl: boolean
    tipoAumento: string
    periodoAumento: number
    fechaAumento: string
}