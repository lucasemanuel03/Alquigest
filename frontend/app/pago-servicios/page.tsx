"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCard, Blocks, ArrowLeft } from "lucide-react"
import { ContratoDetallado } from "@/types/ContratoDetallado"
import { fetchWithToken } from "@/utils/functions/auth-functions/fetchWithToken"
import BACKEND_URL from "@/utils/backendURL"
import Loading from "@/components/loading"
import ContratoServiciosCard from "@/components/pago-servicios/contrato-servicios-card"
import { Button } from "@/components/ui/button"


export default function PagoServiciosPage() {
  const [contratos, setContratos] = useState<ContratoDetallado[]>([])
  const [loading, setLoading] = useState(true)
  const [isRendering, setIsRendering] = useState(false) // nuevo estado para transición
  const [contadores, setContadores] = useState({
    cantServiciosNoPagos: -1,
    cantServicios: -1,
  })

  useEffect(() => {
    const fetchTodosLosDatos = async () => {
      console.log("Ejecutando fetch de Contratos y Contadores...")
      setLoading(true)
      setIsRendering(false)
      
      try {
        // Fetch de contratos y contadores en paralelo
        const [data, cantServicios] = await Promise.all([
          fetchWithToken(`${BACKEND_URL}/contratos/vigentes`),
          fetchWithToken(`${BACKEND_URL}/pagos-servicios/count/pendientes`)
          
        ])

        console.log("Datos parseados del backend:", data)
        setContratos(data)
        setContadores({
          cantServiciosNoPagos: cantServicios.serviciosPendientes,
          cantServicios: cantServicios.serviciosTotales,
        })
        
        // Dar tiempo para que React procese los datos antes de ocultar loading
        setTimeout(() => {
          setLoading(false)
          // Activar animación de fade-in
          requestAnimationFrame(() => {
            setIsRendering(true)
          })
        }, 100)
      } catch (err: any) {
        console.error("Error al traer datos:", err.message)
        setLoading(false)
      }
    }

    fetchTodosLosDatos()
  }, [])

  if(loading){
      return(
        <div>
          <Loading text="Cargando contratos de alquiler"/>
        </div>
      )
    }

  return (
    <div className="min-h-screen bg-background">

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 pt-30">
        <div className="mb-8 flex flex-col gap-3">
          <Button variant="outline" onClick={() => window.history.back()} className="w-fit">
          <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-medium">Total de servicios</CardTitle>
              <Blocks className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
              <div className="text-2xl font-bold font-sans">{contadores.cantServicios}</div>
              <p className="text-xs text-muted-foreground">Bajo control del estudio jurídico</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-medium">Servicios Pendientes</CardTitle>
              <CreditCard className="h-6 w-6 text-red-400" />
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
              <div className="text-2xl font-bold  text-red-400 font-sans">
                {contadores.cantServiciosNoPagos}
              </div>
              <p className="text-sm text-muted-foreground">Aún no pagados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium">Servicios Pagados</CardTitle>
              <CreditCard className="h-6 w-6 text-green-500" />
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
              <div className="text-2xl font-bold font-sans text-green-600">
                {contadores.cantServicios - contadores.cantServiciosNoPagos}
              </div>
              <p className="text-xs text-muted-foreground">De este mes</p>
            </CardContent>
          </Card>
        </div>

        {/* Contratos List */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-foreground">Alquileres con servicios bajo control</h2>

          {/* Mensaje cuando no hay contratos */}
          {!loading && contratos.length === 0 && (
            <p className="text-lg text-secondary">No hay contratos con servicios bajo control actualmente</p>
          )}

          {/* Spinner mientras se procesan las cards */}
          {!loading && !isRendering && contratos.length > 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p className="text-muted-foreground">Preparando contratos...</p>
            </div>
          )}

          {/* Cards con fade-in */}
          <div className={`space-y-6 transition-opacity duration-500 ${isRendering ? 'opacity-100' : 'opacity-0'}`}>
            {contratos.map((contrato: ContratoDetallado) => (
              <ContratoServiciosCard key={contrato.id} contrato={contrato} />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
