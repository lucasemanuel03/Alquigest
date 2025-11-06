"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronDown, ChevronUp, Import } from "lucide-react"
import TipoServicioIcon from "@/components/tipoServicioIcon"
import { Badge } from "../ui/badge"
import BACKEND_URL from "@/utils/backendURL"
import { fetchWithToken } from "@/utils/functions/auth-functions/fetchWithToken"

interface ServicioPagoCardProps {
  pagoServicio: any
  onPagoRegistrado?: () => void | Promise<void>
}

export default function ServicioPagoCard({ pagoServicio, onPagoRegistrado }: ServicioPagoCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [monto, setMonto] = useState(pagoServicio.monto || 0)
  // Obtener la fecha actual en formato YYYY-MM-DD
  const fechaActual = new Date().toISOString().split('T')[0]
  const [fechaPago, setFechaPago] = useState(fechaActual)
  const [vencido, setVencido] = useState("NO")
  const [medioPago, setMedioPago] = useState("No especificado")
  const [loading, setLoading] = useState(false)

  const handleRegistrarPago = async () => {
    setLoading(true)
    try {
      // Construir el body para el PUT
      const body = {
        periodo: pagoServicio.periodo,
        fechaPago: fechaPago.split('-').reverse().join('/'), // Convertir de YYYY-MM-DD a DD/MM/YYYY
        estaPagado: true,
        estaVencido: vencido === "SI",
        pdfPath: pagoServicio.pdfPath || "",
        medioPago: medioPago,
        monto: parseFloat(monto)
      }

      const response = await fetchWithToken(`${BACKEND_URL}/pagos-servicios/${pagoServicio.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      })

      if (response) {
        alert(`Pago registrado exitosamente: $${monto}`)
        // Actualizar el estado local
        pagoServicio.estaPagado = true
        pagoServicio.monto = parseFloat(monto)
        pagoServicio.fechaPago = fechaPago
        pagoServicio.estaVencido = vencido === "SI"
        setIsExpanded(false)
        // Notificar al padre para refrescar la lista de no pagados
        
      }
    } catch (error) {
      console.error("Error al registrar el pago:", error)
      // alert("Error al registrar el pago. Intente nuevamente.") REVISAR BACKEND DEVUELVE UN 500
    } finally {
      setLoading(false)
      if (onPagoRegistrado) {
          await onPagoRegistrado()
      }
    }
  }

  return (
    <Card className="bg-muted/50">
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(e => !e)}>
          
            <div className="flex items-center gap-3">
                <TipoServicioIcon tipoServicio={pagoServicio.servicioXContrato.tipoServicio.id} className="h-9 w-9"/>
                <div>
                <p className="font-bold text-base">{pagoServicio.servicioXContrato.tipoServicio.nombre}</p>
                <p className="text-sm text-muted-foreground">Período: {pagoServicio.periodo}</p>
                <p className="text-sm text-muted-foreground">Nro Cuenta: {pagoServicio.servicioXContrato.nroCuenta || "No Especificado"}</p>
                {pagoServicio.servicioXContrato.nroContratoServicio !== "" && (
                  <p className="text-sm text-muted-foreground">Nro Contrato Servicio: {pagoServicio.servicioXContrato.nroContratoServicio || "No Especificado"}</p>
                )}
                </div>
            </div>
            <div className="flex items-center gap-10">
              <div className="flex flex-col gap-1 items-end">
                <div>
                    {pagoServicio.estaPagado ? (
                      <Badge className="bg-emerald-400">Pagado</Badge>
                    ) : (
                      <Badge className="bg-red-300 text-red-950">Pendiente de Pago</Badge>
                    )}
                </div>

                <div>
                    {pagoServicio.servicioXContrato.esDeInquilino ? (
                      <Badge variant={"secondary"}>Paga Locatario</Badge>
                    ) : (
                      <Badge>Paga Estudio</Badge>
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
              <Button onClick={handleRegistrarPago} 
                      disabled={loading || pagoServicio.estaPagado || !monto} 
                      className="w-fit bg-emerald-600 hover:bg-emerald-700">
                <Import/>
                {loading ? "Registrando..." : "Registrar pago"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
