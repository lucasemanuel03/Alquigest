"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Receipt, FileDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { TIPO_SERVICIO_LABEL } from "@/types/ServicioContrato"
import GenerarReciboServiciosPDF from "./generar-recibo-servicios-pdf"

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
      // TODO: Reemplazar con el endpoint real cuando esté disponible
      // const data = await fetchJSON<DatosReciboServicios>(`/recibos-servicios/contrato/${contratoId}`)
      
      // DATOS MOCK - Eliminar cuando se implemente el endpoint
      await new Promise(resolve => setTimeout(resolve, 500)) // Simular delay de red
      
      const datosMock: DatosReciboServicios = {
        periodo: "11/2025",
        servicios: [
          {
            id: 1,
            nombreTipoServicio: "Luz",
            monto: 15000
          },
          {
            id: 2,
            nombreTipoServicio: "Agua",
            monto: 9000
          },
          {
            id: 3,
            nombreTipoServicio: "Gas",
            monto: 7500
          }
        ],
        contrato: {
          fechaInicioContrato: "2023-03-01",
          tipoInmueble: "CASA"
        },
        propietario: {
          nombre: "Juan",
          apellido: "Pérez",
          direccion: "Calle Falsa 123",
          barrio: "Centro",
          dni: "12345678"
        },
        inquilino: {
          nombre: "Lucas",
          apellido: "Gómez",
          direccion: "Av. Rivadavia 900",
          barrio: "Norte",
          dni: "98765432"
        }
      }
      
      setDatos(datosMock)
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
          <div className="space-y-6 py-4">
            {/* Período */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <span className="font-semibold text-lg">Período:</span>
              <Badge variant="outline" className="text-base px-4 py-2">
                {datos.periodo}
              </Badge>
            </div>

            {/* Información del Contrato */}
            <div className="space-y-3">
              <h3 className="font-semibold text-base border-b pb-2">Información del Contrato</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Tipo de Inmueble:</span>
                  <p className="font-medium">{datos.contrato.tipoInmueble}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Inicio del Contrato:</span>
                  <p className="font-medium">
                    {new Date(datos.contrato.fechaInicioContrato).toLocaleDateString('es-AR')}
                  </p>
                </div>
              </div>
            </div>

            {/* Propietario */}
            <div className="space-y-3">
              <h3 className="font-semibold text-base border-b pb-2">Locador (Propietario)</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Nombre:</span>
                  <p className="font-medium">{datos.propietario.apellido}, {datos.propietario.nombre}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">DNI:</span>
                  <p className="font-medium">{datos.propietario.dni}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Dirección:</span>
                  <p className="font-medium">{datos.propietario.direccion} - {datos.propietario.barrio}</p>
                </div>
              </div>
            </div>

            {/* Inquilino */}
            <div className="space-y-3">
              <h3 className="font-semibold text-base border-b pb-2">Locatario (Inquilino)</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Nombre:</span>
                  <p className="font-medium">{datos.inquilino.apellido}, {datos.inquilino.nombre}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">DNI:</span>
                  <p className="font-medium">{datos.inquilino.dni}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Dirección:</span>
                  <p className="font-medium">{datos.inquilino.direccion} - {datos.inquilino.barrio}</p>
                </div>
              </div>
            </div>

            {/* Servicios */}
            <div className="space-y-3">
              <h3 className="font-semibold text-base border-b pb-2">Servicios</h3>
              <div className="space-y-2">
                {datos.servicios.map((servicio) => (
                  <div
                    key={servicio.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <span className="font-medium">{servicio.nombreTipoServicio}</span>
                    <span className="font-semibold text-green-600">
                      ${servicio.monto.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg border-2 border-primary/20">
                <span className="font-bold text-lg">Total:</span>
                <span className="font-bold text-xl text-green-600">
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
