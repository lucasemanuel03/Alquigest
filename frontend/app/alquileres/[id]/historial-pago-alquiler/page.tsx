"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Loading from "./loading";
import { fetchWithToken } from "@/utils/functions/auth-functions/fetchWithToken"
import BACKEND_URL from "@/utils/backendURL"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CalendarClockIcon, ArrowUpDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"


export default function HistorialPagoAlquilerPage() {
  const params = useParams<{ id: string }>()
  const contratoId = params?.id
  const [data, setData] = useState<AlquilerItem[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<"periodo" | "monto" | "fechaPago" | "vencimiento">("periodo")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  useEffect(() => {
    const fetchData = async () => {
      if (!contratoId) return
      try {
        const resp = await fetchWithToken(`${BACKEND_URL}/alquileres/contrato/${contratoId}`)
        setData(resp)
      } catch (e) {
        console.error("Error cargando historial de pagos de alquiler:", e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [contratoId])

  // Función para convertir fecha a nombre de mes/año
  const formatPeriodo = (fechaISO: string) => {
    const fecha = new Date(fechaISO)
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
                   "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
    return `${meses[fecha.getMonth()]} ${fecha.getFullYear()}`
  }

  // Función para normalizar y formatear fechas a DD/MM/AAAA
  const formatearFecha = (fecha: string | null | undefined): string => {
    if (!fecha) return "-"
    
    // Si ya viene en formato DD/MM/AAAA
    if (fecha.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      return fecha
    }
    
    // Si viene en formato YYYY-MM-DD
    if (fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = fecha.split('-')
      return `${day}/${month}/${year}`
    }
    
    // Intentar parsear como fecha ISO completa
    try {
      const date = new Date(fecha)
      if (!isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, '0')
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const year = date.getFullYear()
        return `${day}/${month}/${year}`
      }
    } catch (e) {
      console.error("Error parseando fecha:", fecha, e)
    }
    
    return fecha // Devolver original si no se puede parsear
  }

  if (loading) return <Loading text="Cargando historial de pagos de alquiler" />

  // Extraer información del primer elemento si existe
  const primerPago = data.length > 0 ? data[0] : null
  const direccion = primerPago?.direccionInmueble || ""
  const nombreCompleto = primerPago 
    ? `${primerPago.nombreInquilino} ${primerPago.apellidoInquilino}`
    : ""

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-8 pt-25 sm:pt-28">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"> 
          <Button variant="outline" onClick={() => window.history.back()}> 
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver 
          </Button>

        </div> 
        <Card className="mt-10">
          <CardHeader>
            <div className="flex flex-col sm:flex-1">
              <div className="flex items-center space-x-2">
                <CalendarClockIcon className="h-7 w-7" />
                <CardTitle className="text-xl">Historial de pagos de alquiler</CardTitle>
              </div>
              <Separator className="mt-5"/>
              <div className="flex flex-col sm:flex-row gap-2 justify-between items-center">
                {primerPago && (
                  <div>
                    <p className="text-base text-foreground">
                      Inmueble: <span className="text-primary">{direccion}</span>
                    </p>
                    <p className="text-base text-foreground">
                      Locatario: <span className="text-primary">{nombreCompleto}</span>
                    </p>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Ordenar por</span>
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                    <SelectTrigger className="min-w-44">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="periodo">Período</SelectItem>
                      <SelectItem value="monto">Monto</SelectItem>
                      <SelectItem value="vencimiento">Vencimiento</SelectItem>
                      <SelectItem value="fechaPago">Fecha de pago</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    title={sortDir === "asc" ? "Ascendente" : "Descendente"}
                    onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                  >
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    {sortDir === "asc" ? "Asc" : "Desc"}
                  </Button>
                </div>
              </div>
            </div>
            
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader className="bg-primary">
                <TableRow>
                  <TableHead className="font-bold text-background">Período</TableHead>
                  <TableHead className="font-bold text-background">Monto</TableHead>
                  <TableHead className="font-bold text-background">Vencimiento</TableHead>
                  <TableHead className="font-bold text-background">Método de Pago</TableHead>
                  <TableHead className="font-bold text-background">Titular</TableHead>
                  <TableHead className="font-bold text-background">Cuenta Banco</TableHead>
                  <TableHead className="font-bold text-background">Fecha de Pago</TableHead>
                  <TableHead className="font-bold text-background">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                      No hay registros de pagos de alquiler
                    </TableCell>
                  </TableRow>
                ) : (
                  // ordenamiento
                  (() => {
                    const copia = [...data]
                    const sign = sortDir === "asc" ? 1 : -1
                    copia.sort((a, b) => {
                      if (sortBy === "periodo") {
                        const ta = new Date(a.fechaVencimientoPago).getTime()
                        const tb = new Date(b.fechaVencimientoPago).getTime()
                        return (ta - tb) * sign
                      }
                      if (sortBy === "monto") {
                        return (a.monto - b.monto) * sign
                      }
                      if (sortBy === "vencimiento") {
                        const ta = new Date(a.fechaVencimientoPago).getTime()
                        const tb = new Date(b.fechaVencimientoPago).getTime()
                        return (ta - tb) * sign
                      }
                      // fechaPago: nulls al final siempre
                      const ta = a.fechaPago ? new Date(a.fechaPago).getTime() : Number.POSITIVE_INFINITY
                      const tb = b.fechaPago ? new Date(b.fechaPago).getTime() : Number.POSITIVE_INFINITY
                      return (ta - tb) * sign
                    })
                    return copia
                  })().map((item) => {
                    const estadoPago = item.estaPagado 
                      ? <Badge className="bg-emerald-300 text-black w-26">Pagado</Badge>
                      : <Badge className="bg-red-300 text-black w-26">Pendiente</Badge>

                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-semibold">{formatPeriodo(item.fechaVencimientoPago)}</TableCell>
                        <TableCell className="font-semibold">${item.monto.toLocaleString()}</TableCell>
                        <TableCell>{formatearFecha(item.fechaVencimientoPago)}</TableCell>
                        <TableCell>{item.metodo ?? "-"}</TableCell>
                        <TableCell>{item.titularDePago ?? "-"}</TableCell>
                        <TableCell>{item.cuentaBanco ?? "-"}</TableCell>
                        <TableCell>{formatearFecha(item.fechaPago)}</TableCell>
                        <TableCell>{estadoPago}</TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
              <TableCaption>Historial completo de pagos de alquiler para el contrato #{contratoId}</TableCaption>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
