"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Loading from "@/components/loading"
import { fetchWithToken } from "@/utils/functions/auth-functions/fetchWithToken"
import BACKEND_URL from "@/utils/backendURL"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CalendarClockIcon, ArrowUpDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import TipoServicioIcon from "@/components/tipoServicioIcon"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PagoServicioItem {
  id: number
  estaPagado: boolean
  estaVencido: boolean
  fechaPago: string | null
  medioPago: string | null
  monto: number | null
  periodo: string
  servicioContrato: {
    id: number
    nroCuenta: string | null
    esDeInquilino: boolean
    tipoServicio: {
      id: number
      nombre: string
    }
  }
}

export default function HistorialPagosServiciosPage() {
  const params = useParams<{ id: string }>()
  const contratoId = params?.id
  const [data, setData] = useState<PagoServicioItem[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<"periodo" | "tipo" | "fechaPago">("periodo")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  useEffect(() => {
    const fetchData = async () => {
      if (!contratoId) return
      try {
        const resp = await fetchWithToken(`${BACKEND_URL}/pagos-servicios/contrato/${contratoId}`)
        setData(resp)
      } catch (e) {
        console.error("Error cargando historial de pagos de servicios:", e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [contratoId])

  if (loading) return <Loading text="Cargando historial de pagos de servicios"/>

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-8 pt-25 sm:pt-28">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"> 
          <Button variant="outline" onClick={() => window.history.back()}> 
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver
          </Button>
        </div>

        <Card className="mt-10">

          <CardHeader className="flex flex-col sm:flex-row gap-5 justify-between items-center">
            <div className="flex items-center space-x-2">
                <CalendarClockIcon className="h-7 w-7" />
                <CardTitle className="text-xl">Historial de pagos de servicios</CardTitle>
            </div>
                      <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Ordenar por</span>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="min-w-44">
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="periodo">Período</SelectItem>
                <SelectItem value="tipo">Tipo de servicio</SelectItem>
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
          </CardHeader>
          <CardContent>
            <Table >
              <TableHeader className="bg-primary">
                <TableRow>
                  <TableHead className="font-bold text-background">Período</TableHead>
                  <TableHead className="font-bold text-background">Servicio</TableHead>
                  <TableHead className="font-bold text-background">Nro. Cuenta</TableHead>
                  <TableHead className="font-bold text-background">A cargo de</TableHead>
                  <TableHead className="font-bold text-background">Monto</TableHead>
                  <TableHead className="font-bold text-background">Medio de Pago</TableHead>
                  <TableHead className="font-bold text-background">Fecha de pago</TableHead>
                  <TableHead className="font-bold text-background">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">No hay registros</TableCell>
                  </TableRow>
                ) : (
                  // ordenamiento
                  (() => {
                    const copia = [...data]
                    const sign = sortDir === "asc" ? 1 : -1
                    const parsePeriodo = (p: string) => {
                      // Intenta MM/YYYY o MM-YYYY
                      const m1 = p.match(/^(\d{2})[-\/](\d{4})$/)
                      if (m1) return new Date(Number(m1[2]), Number(m1[1]) - 1, 1).getTime()
                      // Intenta YYYY-MM o YYYY/MM
                      const m = p.match(/^(\d{4})[-\/]?(\d{2})$/)
                      if (m) return new Date(Number(m[1]), Number(m[2]) - 1, 1).getTime()
                      // Intenta Mes YYYY (Español)
                      const meses = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"]
                      const m2 = p.match(/^(\p{L}+)\s+(\d{4})$/u)
                      if (m2) {
                        const idx = meses.indexOf(m2[1].toLowerCase())
                        if (idx >= 0) return new Date(Number(m2[2]), idx, 1).getTime()
                      }
                      // Fallback: compara string
                      return p
                    }
                    copia.sort((a, b) => {
                      let va: number | string = 0
                      let vb: number | string = 0
                      if (sortBy === "periodo") {
                        const pa = parsePeriodo(a.periodo)
                        const pb = parsePeriodo(b.periodo)
                        if (typeof pa === "number" && typeof pb === "number") return (pa - pb) * sign
                        return String(pa).localeCompare(String(pb)) * sign
                      }
                      if (sortBy === "tipo") {
                        va = a.servicioContrato.tipoServicio.nombre
                        vb = b.servicioContrato.tipoServicio.nombre
                        return String(va).localeCompare(String(vb)) * sign
                      }
                      // fechaPago: nulls al final siempre
                      const ta = a.fechaPago ? new Date(a.fechaPago).getTime() : Number.POSITIVE_INFINITY
                      const tb = b.fechaPago ? new Date(b.fechaPago).getTime() : Number.POSITIVE_INFINITY
                      return (ta - tb) * sign
                    })
                    return copia
                  })().map((item) => {

                    const estadoPago = item.estaPagado 
                        ? item.estaVencido 
                          ? (<Badge className="bg-yellow-200 text-black w-26">Pagado Vencido</Badge>) 
                          : (<Badge className="bg-emerald-300 text-black w-26">Pagado</Badge>) 
                          : (<Badge className="bg-red-300 text-black w-26">Pendiente</Badge>)

                    const aCargoDe = item.servicioContrato.esDeInquilino 
                        ? (<Badge className="w-26" variant={"secondary"}>Locatario</Badge>) 
                        : (<Badge className="w-26">Estudio Jurídico</Badge>)

                    const tipoServicio = <div className="flex gap-2 items-center"> 
                                            <TipoServicioIcon className="h-6 w-6" tipoServicio={item.servicioContrato.tipoServicio.id}/>
                                            {item.servicioContrato.tipoServicio.nombre}
                                          </div>
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-semibold">{item.periodo}</TableCell>
                        <TableCell>{tipoServicio}</TableCell>
                        <TableCell>{item.servicioContrato.nroCuenta ?? "-"}</TableCell>
                        <TableCell>{aCargoDe }</TableCell>
                        <TableCell>{item.monto ? `$${item.monto.toLocaleString()}` : "-"}</TableCell>
                        <TableCell>{item.medioPago ?? "-"}</TableCell>
                        <TableCell>{item.fechaPago ?? "-"}</TableCell>
                        <TableCell>{estadoPago}</TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
              <TableCaption>Incluye servicios pagados y pendientes del contrato #{contratoId}</TableCaption>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
