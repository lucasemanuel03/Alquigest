"use client"

import { useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useAlquileresPendientes } from "@/hooks/useAlquileresPendientes"
import Loading from "@/components/loading"
import InmuebleIcon from "@/components/inmueble-icon"
import { Coins, X, ExternalLink, User, Calendar, Import, History } from "lucide-react"
import Link from "next/link"
import Modal2RegistrarPagoAlquiler from "./modal2-registrar-pago-alquiler"
import { PagoAlquiler } from "@/types/PagoAlquiler"

type PagoAlquileresModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Modal que muestra los alquileres pendientes de pago
 * Ordena por fecha de vencimiento y muestra información resumida del alquiler.
 */
export default function PagoAlquileresModal({ open, onOpenChange }: PagoAlquileresModalProps) {
  const {
    alquileres,
    loading,
    refetch,
  } = useAlquileresPendientes()

  const [modalPagoOpen, setModalPagoOpen] = useState(false);
  const [alquilerSeleccionado, setAlquilerSeleccionado] = useState<PagoAlquiler | null>(null);

  // Ordenar por fecha de vencimiento (más antiguo primero)
  const alquileresOrdenados = useMemo(() => {
    return [...alquileres].sort((a, b) => {
      const fechaA = new Date(a.fechaVencimientoPago).getTime()
      const fechaB = new Date(b.fechaVencimientoPago).getTime()
      return fechaA - fechaB
    })
  }, [alquileres])

  const formatearFecha = (fecha: string) => {
    const date = new Date(fecha)
    return date.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" })
  }

  const esVencido = (fecha: string) => {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const vencimiento = new Date(fecha)
    vencimiento.setHours(0, 0, 0, 0)
    return vencimiento < hoy
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl" className="w-full h-[80vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-xl flex items-center gap-2">
            <Coins className="text-amber-600" /> Alquileres Impagos
          </DialogTitle>
        </DialogHeader>
        
        <DialogDescription className="transition-all transform overflow-y-scroll overflow-x-auto">
          {loading ? (
            <div className="px-6 pb-6">
              <Loading text="Cargando alquileres pendientes" />
            </div>
          ) : (
            <div className="px-6 pb-4 space-y-4">

              <div className="space-y-4">
                <div className="flex gap-1">
                    <h2 className="text-base font-medium text-secondary">Hay {alquileres.length}</h2>
                    <h2 className="text-base font-medium text-secondary">{(alquileres.length === 1)? "alquiler que aún no fue pagado": "alquileres que aún no fueron pagados"}</h2>
                </div>

                <ScrollArea className="h-[60vh] pr-3">
                  <div className="space-y-2 pb-1">
                    {alquileres.length === 0 ? (
                      <p className="text-base text-secondary text-center py-8">
                        ¡Excelente! No hay alquileres pendientes de pago
                      </p>
                    ) : (
                      alquileresOrdenados.map((alquiler) => (
                        <Card 
                          key={alquiler.id} 
                          className={`hover:shadow-md transition-shadow ${
                            esVencido(alquiler.fechaVencimientoPago) 
                              ? "border-l-4 border-l-red-500" 
                              : "border-l-4 border-l-amber-500"
                          }`}
                        >
                          <CardHeader className="pb-1">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <InmuebleIcon tipoInmuebleString="" className="h-6 w-6 text-primary" />
                                    <div>
                                        <div className="flex items-center">
                                            <p className="font-semibold text-sm sm:text-lg">{alquiler.direccionInmueble}</p>
                                        </div>
                                        <div className="flex items-center gap-1 text-sm sm:text-base text-muted-foreground">
                                            <User className="h-4 w-4" />
                                            <span>{alquiler.apellidoInquilino}, {alquiler.nombreInquilino}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1">
                                   
                                    <div className="flex flex-col items-center">
                                        <p className="text-xs sm:text-sm text-muted-foreground">Monto del Alquiler</p>
                                        <p className="font-bold sm:text-lg text-green-600">
                                            ${alquiler.monto.toLocaleString("es-AR")}
                                        </p>
                                    </div>
                                </div>
                              
                            </div>
                          </CardHeader>

                          <CardContent className="pt-0">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-xs sm:text-sm text-muted-foreground">Vencimiento</p>
                                  <p className="font-medium">{formatearFecha(alquiler.fechaVencimientoPago)}</p>
                                </div>
                              </div>

                              <div className="flex justify-end items-center gap-2">
                                <Link href={`/alquileres/${alquiler.contratoId}/historial-pago-alquiler`} >
                                  <Button variant="outline" size="sm" className="w-38" onClick={() => onOpenChange(false)}>
                                    <History/>
                                    Ver Historial
                                  </Button>
                                </Link>

                                <Button
                                    size="sm" 
                                    className="bg-green-600 hover:bg-green-700 w-38 border"
                                    onClick={() => {setModalPagoOpen(true); setAlquilerSeleccionado(alquiler);}} >
                                    <Import />
                                    Registrar Pago
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}
        </DialogDescription>

        <DialogFooter className="px-6 mb-6">
          <Link href="/alquileres">
            <Button variant="outline" onClick={() => {onOpenChange(false)}}>
                <ExternalLink /> Ver Todos
            </Button>
          </Link>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X /> Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

            {/* Modal de Registro de Pago */}
            {alquilerSeleccionado && (
              <Modal2RegistrarPagoAlquiler
                open={modalPagoOpen}
                onOpenChange={setModalPagoOpen}
                alquiler={alquilerSeleccionado!}
                onPagoRegistrado={async () => {
                  // Refrescar la lista para remover el alquiler ya pagado
                  await refetch()
                  // Limpiar selección y cerrar el modal de pago
                  setAlquilerSeleccionado(null)
                  setModalPagoOpen(false)
                }}
              />
            )}

    </>
            
  )
}
