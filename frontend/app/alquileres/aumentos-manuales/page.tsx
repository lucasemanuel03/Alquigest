"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, TrendingUp, AlertCircle } from "lucide-react"
import Link from "next/link"
import { fetchJSON } from "@/utils/functions/fetchWithCredentials"
import Loading from "@/components/loading"
import InmuebleIcon from "@/components/inmueble-icon"

interface AlquilerAumentoManual {
  id: number
  contratoId: number
  fechaVencimientoPago: string
  monto: number
  estaPagado: boolean
  fechaPago: string | null
  necesitaAumentoManual: boolean
  cuentaBanco: string | null
  titularDePago: string | null
  metodo: string | null
  createdAt: string
  updatedAt: string
  inmuebleId: number
  direccionInmueble: string
  inquilinoId: number
  nombreInquilino: string
  apellidoInquilino: string
}

export default function AumentosManualesAlquileresPage() {
  const [alquileres, setAlquileres] = useState<AlquilerAumentoManual[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAlquileres = async () => {
      setLoading(true)
      try {
        const data = await fetchJSON<AlquilerAumentoManual[]>("/alquileres/aumento-manual/pendientes")
        setAlquileres(data)
      } catch (err: any) {
        console.error("Error al obtener alquileres con aumentos manuales pendientes:", err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchAlquileres()
  }, [])

  if (loading) {
    return (
      <div className="p-6">
        <Loading text="Cargando alquileres con aumentos pendientes..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-8 pt-30">
        {/* Header */}
        <div className="mb-8 flex justify-between gap-3">
          <Link href="/alquileres">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
        </div>

        {/* Título y descripción */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
            <TrendingUp className="h-10 w-10 text-orange-500" />
            Aumentos Manuales Pendientes
          </h1>
          <p className="text-muted-foreground text-lg">
            Contratos que requieren un ajuste manual en el monto del alquiler
          </p>
        </div>

        {/* Contador */}
        {alquileres.length > 0 && (
          <div className="mb-6">
            <Badge variant="outline" className="text-base px-4 py-2 bg-orange-100 text-orange-700 border-orange-300">
              <AlertCircle className="h-4 w-4 mr-2" />
              {alquileres.length} {alquileres.length === 1 ? "contrato requiere" : "contratos requieren"} aumento manual
            </Badge>
          </div>
        )}

        {/* Lista de alquileres */}
        <div className="space-y-6">
          {alquileres.length === 0 ? (
            <Card className="border-1 border-foreground/20">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-lg text-muted-foreground">
                    No hay contratos con aumentos manuales pendientes
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Todos los contratos están al día con sus ajustes
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {alquileres.map((alquiler) => (
                <Card
                  key={alquiler.id}
                  className="hover:shadow-lg transition-shadow border-1 border-foreground/20 hover:border-orange-400"
                >
                  <CardHeader className="grid grid-cols-1 md:grid-cols-12 items-center gap-4">
                    {/* Dirección */}
                    <div className="flex items-center gap-2 md:col-span-5">
                      <InmuebleIcon tipoInmuebleString="CASA" className="h-7 w-7" />
                      <div>
                        <CardTitle className="text-lg font-semibold">
                          {alquiler.direccionInmueble}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">ID Contrato: #{alquiler.contratoId}</p>
                      </div>
                    </div>

                    {/* Locatario */}
                    <div className="flex flex-col md:col-span-4">
                      <p className="text-sm text-muted-foreground">Locatario</p>
                      <p className="font-semibold text-base">
                        {alquiler.apellidoInquilino}, {alquiler.nombreInquilino}
                      </p>
                    </div>

                    {/* Monto Actual */}
                    <div className="flex flex-col md:col-span-2">
                      <p className="text-sm text-muted-foreground">Monto Actual</p>
                      <p className="font-bold text-green-600 text-lg">
                        ${alquiler.monto.toLocaleString("es-AR")}
                      </p>
                    </div>

                    {/* Botón */}
                    <div className="flex justify-end md:col-span-1">
                      <Button
                        size="sm"
                        className="bg-orange-500 hover:bg-orange-600"
                        onClick={() => {
                          // Aquí irá la lógica para aplicar el aumento manual
                          console.log("Aplicar aumento manual para alquiler:", alquiler.id)
                        }}
                      >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Aplicar
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}