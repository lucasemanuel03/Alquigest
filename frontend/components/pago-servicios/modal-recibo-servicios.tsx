"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Receipt, FileDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { TIPO_SERVICIO_LABEL } from "@/types/ServicioContrato"
import GenerarReciboServiciosPDF from "./generar-recibo-servicios-pdf"
import { fetchJSON } from "@/utils/functions/fetchWithCredentials"

interface Servicio {
  id: number
  nombreTipoServicio: string
  monto: number
}

interface DatosReciboServicios {
  periodo: string
  servicios: Servicio[]
  contrato: {
    fechaInicioContrato: string
    tipoInmueble: string
  }
  propietario: {
    nombre: string
    apellido: string
    direccion: string
    barrio: string
    dni: string
  }
  inquilino: {
    nombre: string
    apellido: string
    direccion: string
    barrio: string
    dni: string
  }
}

interface ModalReciboServiciosProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contratoId: number
  direccionInmueble: string
}

export default function ModalReciboServicios({
  open,
  onOpenChange,
  contratoId,
  direccionInmueble
}: ModalReciboServiciosProps) {
  const [datos, setDatos] = useState<DatosReciboServicios | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      fetchDatosRecibo()
    }
  }, [open, contratoId])

  const fetchDatosRecibo = async () => {
    setLoading(true)
    try {
      // Obtener periodo actual en formato mm/aaaa
      const fechaActual = new Date()
      const mes = String(fechaActual.getMonth() + 1).padStart(2, '0')
      const anio = fechaActual.getFullYear()
      const periodoActual = `${mes}/${anio}`
      
      // Construir la URL con query params
      const params = new URLSearchParams({
        contratoId: contratoId.toString(),
        periodo: periodoActual
      })
      
      const data = await fetchJSON<DatosReciboServicios>(`/pagos-servicios/recibo?${params.toString()}`)
      
      setDatos(data)
    } catch (err: any) {
      console.error("Error al obtener datos del recibo:", err)
    } finally {
      setLoading(false)
    }
  }

  const calcularTotal = () => {
    if (!datos) return 0
    return datos.servicios.reduce((sum, servicio) => sum + servicio.monto, 0)
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Receipt className="h-6 w-6 text-amber-500" />
            Recibo de Servicios
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            <span className="font-semibold">{direccionInmueble}</span>
            <br />
            Verifique los datos antes de generar el PDF
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">
            Cargando datos del recibo...
          </div>
        ) : datos ? (
          <div className="space-y-6">
            {/* Período */}
            <div className="flex items-center justify-center gap-2 bg-card rounded-lg p-4 border border-border">
              <span className="text-base text-muted-foreground">Período:</span>
              <p className="font-bold">{datos.periodo}</p>
            </div>

            <div className="border-t border-border"></div>

            {/* Información del Contrato */}
            <div className="space-y-3 bg-card rounded-lg p-4 border border-border">
              <h3 className="font-semibold text-base border-b border-border pb-2">Información del Contrato</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <span className="text-muted-foreground">Tipo de Inmueble:</span>
                  <p className="font-medium">{datos.contrato.tipoInmueble}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">Inicio del Contrato:</span>
                  <p className="font-medium">
                    {new Date(datos.contrato.fechaInicioContrato).toLocaleDateString('es-AR')}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-border"></div>

            {/* Locador */}
            <div className="space-y-3 bg-card rounded-lg p-4 border border-border">
              <h3 className="font-semibold text-base border-b border-border pb-2">Locador</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <span className="text-muted-foreground">Apellido, Nombre:</span>
                  <p className="font-medium">{datos.propietario.apellido}, {datos.propietario.nombre}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">DNI:</span>
                  <p className="font-medium">{datos.propietario.dni}</p>
                </div>
                <div className="col-span-2 space-y-1">
                  <span className="text-muted-foreground">Dirección:</span>
                  <p className="font-medium">{datos.propietario.direccion} - {datos.propietario.barrio}</p>
                </div>
              </div>
            </div>

            {/* Locatario */}
            <div className="space-y-3 bg-card rounded-lg p-4 border border-border">
              <h3 className="font-semibold text-base border-b border-border pb-2">Locatario</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <span className="text-muted-foreground">Apellido, Nombre:</span>
                  <p className="font-medium">{datos.inquilino.apellido}, {datos.inquilino.nombre}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">DNI:</span>
                  <p className="font-medium">{datos.inquilino.dni}</p>
                </div>
                <div className="col-span-2 space-y-1">
                  <span className="text-muted-foreground">Dirección:</span>
                  <p className="font-medium">{datos.inquilino.direccion} - {datos.inquilino.barrio}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-border"></div>

            {/* Servicios */}
            <div className="space-y-3">
              <h3 className="font-semibold text-base border-b border-border pb-2">Servicios</h3>
              <div className="space-y-2">
                {datos.servicios.map((servicio, index) => (
                  <div key={servicio.id}>
                    <div className="flex items-center justify-between p-3 bg-card rounded-lg hover:bg-muted transition-colors border border-border">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="font-medium">{servicio.nombreTipoServicio}</span>
                      </div>
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        ${servicio.monto.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    {index < datos.servicios.length - 1 && (
                      <div className="h-px bg-border/50 mx-4 my-1"></div>
                    )}
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="flex items-center justify-between p-4 bg-card rounded-lg border-2 border-green-500/50 shadow-sm mt-4">
                <span className="font-bold text-lg">Total:</span>
                <span className="font-bold text-xl text-green-600 dark:text-green-400">
                  ${calcularTotal().toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-red-500">
            Error al cargar los datos del recibo
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
          >
            Cancelar
          </Button>
          {datos && (
            <GenerarReciboServiciosPDF
              datos={datos}
              direccionInmueble={direccionInmueble}
            />
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
