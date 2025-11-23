"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckSquare, ChevronDown, ChevronUp } from "lucide-react"
import TipoServicioIcon from "@/components/tipoServicioIcon"
import { Badge } from "../ui/badge"
import BACKEND_URL from "@/utils/backendURL"
import { fetchWithToken } from "@/utils/functions/auth-functions/fetchWithToken"
import BotonPagoModal, { PagoResumenItem } from "@/components/pago-servicios/BotonPagoModal"
import { useAuth } from "@/contexts/AuthProvider"

interface ServicioPagoCardProps {
  pagoServicio: any
  onPagoRegistrado?: () => void | Promise<void>
  onDatosPagoChange?: (datos: {
    fechaPagoISO: string
    vencido: "SI" | "NO"
    medioPago: string
    monto: string | number
    pdfPath?: string
  } | null) => void
}

export default function ServicioPagoCard({ pagoServicio, onPagoRegistrado, onDatosPagoChange }: ServicioPagoCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [sePago, setSePago] = useState(false)
  const [monto, setMonto] = useState(pagoServicio.monto || 0)
  // Obtener la fecha actual en formato YYYY-MM-DD
  const fechaActual = new Date().toISOString().split('T')[0]
  const [fechaPago, setFechaPago] = useState(fechaActual)
  const [vencido, setVencido] = useState("NO")
  const [medioPago, setMedioPago] = useState("No especificado")
  const [loading, setLoading] = useState(false)

  // Notificar cambios al padre para batch
  useEffect(() => {
    if (!onDatosPagoChange) return
    if (sePago) {
      // Si ya se pagó individualmente, quitar de batch
      onDatosPagoChange(null)
      return
    }
    onDatosPagoChange({
      fechaPagoISO: fechaPago,
      vencido: vencido as "SI" | "NO",
      medioPago,
      monto,
      pdfPath: pagoServicio.pdfPath || ""
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monto, fechaPago, vencido, medioPago, sePago])

  const confirmarPagoIndividual = async () => {
    setLoading(true)
    try {
      const body = {
        periodo: pagoServicio.periodo,
        fechaPago: fechaPago.split('-').reverse().join('/'),
        estaPagado: true,
        estaVencido: vencido === "SI",
        pdfPath: pagoServicio.pdfPath || "",
        medioPago: medioPago,
        monto: parseFloat(String(monto).replace(',', '.'))
      }
      await fetchWithToken(`${BACKEND_URL}/pagos-servicios/${pagoServicio.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })
      // Actualizar estado local
      pagoServicio.estaPagado = true
      pagoServicio.monto = body.monto
      pagoServicio.fechaPago = fechaPago
      pagoServicio.estaVencido = body.estaVencido
      setIsExpanded(false)
      setSePago(true)
      if (onDatosPagoChange) onDatosPagoChange(null)
      if (onPagoRegistrado) await onPagoRegistrado()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-muted/50 border-1 border-foreground/30">
      <CardContent className="flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer gap-5 sm:gap-0" onClick={() => setIsExpanded(e => !e)}>
          
            <div className="flex items-center gap-3">
              <div className="flex gap-2 items-center">
                <TipoServicioIcon tipoServicio={pagoServicio.servicioContrato.tipoServicio.id} className="h-9 w-9"/>
                <div>
                <p className="font-bold text-base">{pagoServicio.servicioContrato.tipoServicio.nombre}</p>
                <p className="text-sm text-muted-foreground">Período: {pagoServicio.periodo}</p>
                <p className="text-sm text-muted-foreground">Nro Cuenta: {pagoServicio.servicioContrato.nroCuenta || "No Especificado"}</p>
                {(pagoServicio.servicioContrato.nroContratoServicio !== null && pagoServicio.servicioContrato.nroContratoServicio !== "") && (
                  <p className="text-sm text-muted-foreground">Nro Contrato Servicio: {pagoServicio.servicioContrato.nroContratoServicio || "No Especificado"}</p>
                )}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-10">
              <div className="flex flex-col gap-1 items-end">
                <div>
                    {pagoServicio.estaPagado ? (
                      <Badge className="bg-emerald-400 w-32">Pagado</Badge>
                    ) : (
                      <Badge className="bg-red-300 text-red-950 w-32">Pendiente de Pago</Badge>
                    )}
                </div>

                <div>
                    {pagoServicio.servicioContrato.esDeInquilino ? (
                      <Badge className="w-32" variant={"secondary"}>Paga Locatario</Badge>
                    ) : (
                      <Badge className="w-32">Paga Estudio Jurídico</Badge>
                    )}
                </div>
              </div>
            
            <div>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
            </div>
        </div>
        {isExpanded && (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="space-y-2">
              <Label
                title="Ingrese el monto del pago, para cargar decimales utilice coma [,]" 
              >Monto</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  title="Ingrese el monto del pago, para cargar decimales utilice coma [,]" 
                  type="text"
                  inputMode="decimal"
                  value={monto} 
                  onChange={e => {
                    const value = e.target.value;
                    // Permitir solo números y un punto decimal
                    if (value === '' || /^\d*\,?\d*$/.test(value)) {
                      const numValue = parseFloat(value.replace(',', '.'));
                      // Verificar que no sea negativo y no exceda el máximo
                      if (value === '' || (!isNaN(numValue) && numValue >= 0 && numValue <= 90000000)) {
                        setMonto(value);
                      }
                    }
                  }}
                  placeholder="$10,000"
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Fecha de pago</Label>
              <Input type="date" value={fechaPago} onChange={e => setFechaPago(e.target.value)} />
            </div>
            <div className="space-y-2"> 
              <Label>Medio de pago</Label>
              <Select value={medioPago} onValueChange={setMedioPago}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="No especificado">No especificado</SelectItem>
                  <SelectItem value="Efectivo">Efectivo</SelectItem>
                  <SelectItem value="Transferencia">Transferencia</SelectItem>
                  <SelectItem value="Débito/Crédito">Débito/Crédito</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 flex flex-col items-center">
              <Label>¿Se pagó vencido?</Label>
              <Select value={vencido} onValueChange={setVencido}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NO">NO</SelectItem>
                  <SelectItem value="SI">SI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end">
              <BotonPagoModal
                triggerLabel={loading ? "Procesando..." : "Registrar pago"}
                items={[{
                  id: pagoServicio.servicioContrato.tipoServicio.nombre,
                  titulo: pagoServicio.servicioContrato.tipoServicio.nombre,
                  subtitulo: `${pagoServicio.periodo} | ${medioPago}${vencido === 'SI' ? ' | Vencido' : ''}`,
                  monto: typeof monto === 'number' ? monto : parseFloat(String(monto).replace(',', '.'))
                }]}
                onConfirm={confirmarPagoIndividual}
                isDisabled={loading || pagoServicio.estaPagado || !monto || parseFloat(String(monto).replace(',', '.')) <= 0 || !useAuth().hasPermission("pagar_servicios")}
                confirmLabel="Confirmar pago"
                iconLabel={<CheckSquare/>}
                cancelLabel="Cancelar"
                title="Confirmar pago del servicio"
                description="Verificá los datos del servicio antes de registrar el pago."
                className="bg-emerald-600 hover:bg-emerald-700 mr-[3px]"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
