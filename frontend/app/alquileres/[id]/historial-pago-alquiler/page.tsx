"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Loading from "./loading";
import { fetchWithToken } from "@/utils/functions/auth-functions/fetchWithToken"
import BACKEND_URL from "@/utils/backendURL"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CalendarClockIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"


export default function HistorialPagoAlquilerPage() {
  const params = useParams<{ id: string }>()
  const contratoId = params?.id
  const [data, setData] = useState<AlquilerItem[]>([])
  const [loading, setLoading] = useState(true)

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

  if (loading) return <Loading text="Cargando historial de pagos de alquiler" />

  // Extraer información del primer elemento si existe
  const primerPago = data.length > 0 ? data[0] : null
  const direccion = primerPago?.direccionInmueble || ""
  const nombreCompleto = primerPago 
    ? `${primerPago.nombreInquilino} ${primerPago.apellidoInquilino}`
    : ""

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-8 pt-30">
        <div> 
          <Button variant="outline" onClick={() => window.history.back()}> 
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver 
          </Button> 
        </div> 
        <Card className="mt-10">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <CalendarClockIcon className="h-7 w-7" />
              <CardTitle className="text-xl">Historial de pagos de alquiler</CardTitle>
            </div>
            {primerPago && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-base text-foreground">
                  Inmueble: <span className="text-primary">{direccion}</span>
                </p>
                <p className="text-base text-foreground">
                  Locatario: <span className="text-primary">{nombreCompleto}</span>
                </p>
              </div>
            )}
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
                  data.map((item) => {
                    const estadoPago = item.estaPagado 
                      ? <Badge className="bg-emerald-300 text-black w-26">Pagado</Badge>
                      : <Badge className="bg-red-300 text-black w-26">Pendiente</Badge>

                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-semibold">{formatPeriodo(item.fechaVencimientoPago)}</TableCell>
                        <TableCell className="font-semibold">${item.monto.toLocaleString()}</TableCell>
                        <TableCell>{new Date(item.fechaVencimientoPago + 'T12:00:00').toLocaleDateString('es-AR')}</TableCell>
                        <TableCell>{item.metodo ?? "-"}</TableCell>
                        <TableCell>{item.titularDePago ?? "-"}</TableCell>
                        <TableCell>{item.cuentaBanco ?? "-"}</TableCell>
                        <TableCell>{"-"}</TableCell>
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
