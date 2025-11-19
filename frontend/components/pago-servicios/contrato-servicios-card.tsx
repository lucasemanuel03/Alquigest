"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, ChevronDown, ChevronUp, FileClock, Receipt } from "lucide-react"
import Link from "next/link"
import { ContratoDetallado } from "@/types/ContratoDetallado"
import { fetchWithToken } from "@/utils/functions/auth-functions/fetchWithToken"
import BACKEND_URL from "@/utils/backendURL"
import ServicioPagoCard from "@/components/pago-servicios/servicio-pago-card"
import BotonPagoModal, { PagoResumenItem } from "@/components/pago-servicios/BotonPagoModal"
import LoadingSmall from "../loading-sm"
import { Skeleton } from "../ui/skeleton"
import InmuebleIcon from "../inmueble-icon"
import { useAuth } from "@/contexts/AuthProvider"
import ModalReciboServicios from "@/components/pago-servicios/modal-recibo-servicios"

interface ContratoServiciosCardProps {
  contrato: ContratoDetallado
  cantidadPendientes?: number
  loadingPendientes?: boolean
  onPagoRegistrado?: () => void | Promise<void>
}

export default function ContratoServiciosCard({ 
  contrato, 
  cantidadPendientes = 0, 
  loadingPendientes = false,
  onPagoRegistrado
}: ContratoServiciosCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [servicios, setServicios] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [serviciosCargados, setServiciosCargados] = useState(false)
  const [registrandoBatch, setRegistrandoBatch] = useState(false)
  const [modalReciboOpen, setModalReciboOpen] = useState(false)

  // Estado local para acumular pagos masivos (por pagoId)
  type DatosPagoBatch = {
    periodo: string
    fechaPago: string // DD/MM/YYYY
    estaPagado: boolean
    estaVencido: boolean
    pdfPath: string
    medioPago: string
    monto: number
  }
  const [pagosBatch, setPagosBatch] = useState<Record<number, DatosPagoBatch>>({})

  const cantidadSeleccionados = useMemo(() => Object.keys(pagosBatch).length, [pagosBatch])

  const fetchServiciosNoPagados = async () => {
    setLoading(true)
    try {
      const data = await fetchWithToken(`${BACKEND_URL}/pagos-servicios/contrato/${contrato.id}/no-pagados`)
      setServicios(data)
      setServiciosCargados(true)
      
      // Notificar al componente padre que se actualizaron los servicios
      // (esto se llama después de registrar un pago)
      if (onPagoRegistrado) {
        await onPagoRegistrado()
      }
    } catch (err: any) {
      console.error(`Error al cargar servicios del contrato ${contrato.id}:`, err.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleCard = async () => {
    const expanding = !isExpanded
    setIsExpanded(expanding)

    // Si se está expandiendo y no se han cargado los servicios, cargarlos
    if (expanding && !serviciosCargados) {
      await fetchServiciosNoPagados()
    }
  }

  // Callback para que cada ServicioPagoCard nos informe sus datos para batch
  const handleDatosPagoChange = (
    pagoId: number,
    datos: {
      periodo: string
      fechaPagoISO: string // YYYY-MM-DD
      vencido: string // "SI" | "NO"
      medioPago: string
      monto: string | number
      pdfPath?: string
    } | null
  ) => {
    setPagosBatch(prev => {
      const next = { ...prev }
      if (!datos) {
        delete next[pagoId]
        return next
      }
      // Validaciones mínimas
      const montoNum = typeof datos.monto === 'number' ? datos.monto : parseFloat(String(datos.monto).replace(',', '.'))
      const fechaOk = !!datos.fechaPagoISO
      if (!fechaOk || isNaN(montoNum) || montoNum <= 0) {
        delete next[pagoId]
        return next
      }
      const fechaDDMMYYYY = datos.fechaPagoISO.split('-').reverse().join('/')
      next[pagoId] = {
        periodo: datos.periodo,
        fechaPago: fechaDDMMYYYY,
        estaPagado: true,
        estaVencido: datos.vencido === 'SI',
        pdfPath: datos.pdfPath || '',
        medioPago: datos.medioPago || 'No especificado',
        monto: montoNum
      }
      return next
    })
  }

  // Registrar pagos masivos
  const resumenBatch: PagoResumenItem[] = Object.entries(pagosBatch).map(([pagoId, datos]) => ({
    id: pagoId,
    titulo: `Servicio #${pagoId}`,
    subtitulo: `${datos.periodo} | ${datos.medioPago}${datos.estaVencido ? ' | Vencido' : ''}`,
    monto: datos.monto,
  }))

  const confirmarBatch = async () => {
    if (cantidadSeleccionados === 0) return
    setRegistrandoBatch(true)
    try {
      const body = {
        pagos: Object.entries(pagosBatch).map(([pagoId, datosPago]) => ({
          pagoId: Number(pagoId),
          datosPago,
        }))
      }
      await fetchWithToken(`${BACKEND_URL}/pagos-servicios/batch`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      setPagosBatch({})
      await fetchServiciosNoPagados()
      if (onPagoRegistrado) await onPagoRegistrado()
    } catch (e) {
      console.error('Error registrando pagos masivos', e)
      throw e
    } finally {
      setRegistrandoBatch(false)
    }
  }

  return (
    <Card className="transition-all duration-200 hover:shadow-lg cursor-pointer border-1 border-foreground/20">
      <CardHeader onClick={toggleCard} className="cursor-pointer">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <InmuebleIcon tipoInmuebleString={contrato.tipoInmueble} className="h-7 w-7 text-primary" />
            <div>
              <CardTitle className="text-lg">{contrato.direccionInmueble}</CardTitle>
              <CardDescription className="font-sans text-base flex gap-5">
                <div>
                  Locador: {contrato.apellidoPropietario}, {contrato.nombrePropietario}
                </div>
                <div>
                  Locatario: {contrato.apellidoInquilino}, {contrato.nombreInquilino}
                </div>
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {loadingPendientes ? (
              <Skeleton className="h-6 w-24" />
            ) : cantidadPendientes > 0 ? (
              <Badge variant="destructive" className="text-sm w-30">
                {cantidadPendientes} pendiente{cantidadPendientes !== 1 ? 's' : ''}
              </Badge>
            ) : null}
            <Button variant="ghost" size="lg" onClick={toggleCard}>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Servicios controlados:</h4>
            {loading ? (
              <div className="text-center py-4">
                <LoadingSmall text="Cargando servicios..." />
              </div>
            ) : servicios.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No hay servicios pendientes de pago para este contrato.
              </p>
            ) : (
              <div className="grid gap-3">
                {servicios.map((pagoServicio: any) => (
                  <ServicioPagoCard
                    key={pagoServicio.id}
                    pagoServicio={pagoServicio}
                    onPagoRegistrado={fetchServiciosNoPagados}
                    onDatosPagoChange={(datos) =>
                      handleDatosPagoChange(
                        pagoServicio.id,
                        datos
                          ? {
                              periodo: pagoServicio.periodo,
                              fechaPagoISO: datos.fechaPagoISO,
                              vencido: datos.vencido,
                              medioPago: datos.medioPago,
                              monto: datos.monto,
                              pdfPath: datos.pdfPath,
                            }
                          : null
                      )
                    }
                  />
                ))}
              </div>
            )}
            <div className="pt-4 border-t flex justify-end gap-5 items-center ">
                 {/* Aquí va el botón HISTORIAL */}
              <Link href={`/contratos/${contrato.id}/historial-pagos-servicios`}>
                <Button className="w-42" variant={"outline"}>
                  <FileClock className="h-4 w-4 mr-2" />
                  Ver Historial
                </Button>
              </Link>
              <Button 
                className="w-42 border-amber-400" 
                variant={"outline"}
                onClick={() => setModalReciboOpen(true)}
              >
                <Receipt className="h-4 w-4 mr-2" />
                Recibo de Servicios
              </Button>
                {/* Aquí va el botón para generar MERCEDES LOCATIVAS */}
              <Link href={`/alquileres/${contrato.id}/generar-recibo`}>
                <Button className="w-42" variant={"outline"}>
                  <Receipt className="h-4 w-4 mr-2" />
                  Mercedes Locativas
                </Button>
              </Link>
              <BotonPagoModal
                triggerLabel={registrandoBatch ? 'Procesando...' : `Registrar Pagos${cantidadSeleccionados > 0 ? ` (${cantidadSeleccionados})` : ''}`}
                items={resumenBatch}
                onConfirm={confirmarBatch}
                isDisabled={registrandoBatch || cantidadSeleccionados === 0 || !useAuth().hasPermission("pagar_servicios")}
                confirmLabel="Confirmar pagos"
                cancelLabel="Cancelar"
                title="Confirmación de múltiples pagos"
                description="Revisa los servicios y montos a registrar. Esta acción marcará como pagados todos los servicios listados."
                triggerVariant="default"
                className="bg-emerald-600 hover:bg-emerald-700"
              />
            </div>
          </div>
        </CardContent>
      )}
      
      {/* Modal de Recibo de Servicios */}
      <ModalReciboServicios
        open={modalReciboOpen}
        onOpenChange={setModalReciboOpen}
        contratoId={contrato.id}
        direccionInmueble={contrato.direccionInmueble}
      />
    </Card>
  )
}
