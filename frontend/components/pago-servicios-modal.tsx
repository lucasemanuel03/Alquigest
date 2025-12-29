"use client"

import { useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { usePagoServicios } from "@/hooks/usePagoServicios"
import Loading from "@/components/loading"
import ContratoServiciosCard from "@/components/pago-servicios/contrato-servicios-card"
import { Blocks, X, ExternalLink } from "lucide-react"
import { DialogDescription } from "@radix-ui/react-dialog"
import Link from "next/link"

type PagoServiciosModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Modal que muestra los contratos con servicios pendientes de pago
 * Ordena por cantidad de servicios pendientes y permite expandir cards sin romper el layout del modal.
 */
export default function PagoServiciosModal({ open, onOpenChange }: PagoServiciosModalProps) {
  const {
    contratos,
    contratosServiciosNoPagos,
    loading,
    loadingPendientes,
    refrescarDatos,
  } = usePagoServicios()

  const contratosOrdenados = useMemo(() => {
    return [...contratos].sort((a, b) => {
      const pa = contratosServiciosNoPagos[a.id.toString()] || 0
      const pb = contratosServiciosNoPagos[b.id.toString()] || 0
      if (pb !== pa) return pb - pa
      return a.id - b.id
    })
  }, [contratos, contratosServiciosNoPagos])

  const handlePagoRegistrado = async (contratoId: number) => {
    await refrescarDatos(contratoId)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl" className="w-full h-[80vh] p-0">
        <DialogHeader className="px-6 pt-6">
            <DialogTitle className="text-xl flex items-center gap-2">
                <Blocks className="text-green-600"/> Pago de Servicios
            </DialogTitle>
        </DialogHeader>
        <DialogDescription className=" transition-all transform overflow-y-scroll overflow-x-auto">
        {loading ? (
          <div className="px-6 pb-6">
            <Loading text="Cargando contratos de alquiler" />
          </div>
        ) : (
          <div className="px-6 pb-4 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Alquileres con servicios bajo control</h2>
              </div>

              <ScrollArea className="max-h-[60vh] pr-3">
                <div className="space-y-4 pb-2">
                  {contratos.length === 0 ? (
                    <p className="text-base text-secondary">No hay contratos con servicios bajo control actualmente</p>
                  ) : (
                    contratosOrdenados.map((contrato) => (
                      <ContratoServiciosCard
                        estoyEnModal={true}
                        key={contrato.id}
                        contrato={contrato}
                        cantidadPendientes={contratosServiciosNoPagos[contrato.id.toString()] || 0}
                        loadingPendientes={loadingPendientes}
                        onPagoRegistrado={() => handlePagoRegistrado(contrato.id)}
                      />
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
        </DialogDescription>

        <DialogFooter className="px-6 pb-2">
                      <Link href="/pago-servicios">
            <Button variant="outline" onClick={() => {onOpenChange(false)}}>
                <ExternalLink /> Ver Todos
            </Button>
          </Link>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
               <X/> Cerrar
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
