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
import { Skeleton } from "@/components/ui/skeleton"


export default function PagoServiciosPage() {
  const [contratos, setContratos] = useState<ContratoDetallado[]>([])
  const [loading, setLoading] = useState(true)
  const [contratosServiciosNoPagos, setContratosServiciosNoPagos] = useState<Record<string, number>>({})
  const [loadingContadores, setLoadingContadores] = useState(true)
  const [loadingPendientes, setLoadingPendientes] = useState(true)
  const [contadores, setContadores] = useState({
    cantServiciosNoPagos: 0,
    cantServicios: 0,
  })

  useEffect(() => {
    // Fetch principal: contratos (bloquea el loading principal)
    const fetchContratos = async () => {
      console.log("Ejecutando fetch de Contratos...")
      setLoading(true)
      
      try {
        const data = await fetchWithToken(`${BACKEND_URL}/contratos/vigentes`)
        console.log("Contratos parseados del backend:", data)
        setContratos(data)
      } catch (err: any) {
        console.error("Error al traer contratos:", err.message)
      } finally {
        setLoading(false)
      }
    }

    // Fetch secundario: contadores (en background)
    const fetchContadores = async () => {
      setLoadingContadores(true)
      try {
        const cantServicios = await fetchWithToken(`${BACKEND_URL}/pagos-servicios/count/pendientes`)
        setContadores({
          cantServiciosNoPagos: cantServicios.serviciosPendientes,
          cantServicios: cantServicios.serviciosTotales,
        })
      } catch (err: any) {
        console.error("Error al traer contadores:", err.message)
      } finally {
        setLoadingContadores(false)
      }
    }

    // Fetch secundario: servicios no pagados por contrato (en background)
    const fetchServiciosNoPagados = async () => {
      setLoadingPendientes(true)
      try {
        const data = await fetchWithToken(`${BACKEND_URL}/pagos-servicios/no-pagados/mes-actual/por-contrato`)
        setContratosServiciosNoPagos(data)
      } catch (err: any) {
        console.error("Error al traer servicios no pagados:", err.message)
      } finally {
        setLoadingPendientes(false)
      }
    }

    fetchContratos()
    fetchContadores()
    fetchServiciosNoPagados()
  }, [])

  // Función para refrescar los datos cuando se registra un pago
  const handlePagoRegistrado = async (contratoId: number) => {
    console.log(`Pago registrado para contrato ${contratoId}, actualizando contadores...`)
    
    // Refrescar contadores
    try {
      const cantServicios = await fetchWithToken(`${BACKEND_URL}/pagos-servicios/count/pendientes`)
      setContadores({
        cantServiciosNoPagos: cantServicios.serviciosPendientes,
        cantServicios: cantServicios.serviciosTotales,
      })
    } catch (err: any) {
      console.error("Error al refrescar contadores:", err.message)
    }

    // Refrescar badges de pendientes por contrato
    try {
      const data = await fetchWithToken(`${BACKEND_URL}/pagos-servicios/no-pagados/mes-actual/por-contrato`)
      setContratosServiciosNoPagos(data)
    } catch (err: any) {
      console.error("Error al refrescar servicios no pagados:", err.message)
    }
  }

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
              {loadingContadores ? (
                <>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-40" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold font-sans">{contadores.cantServicios}</div>
                  <p className="text-xs text-muted-foreground">Bajo control del estudio jurídico</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-medium">Servicios Pendientes</CardTitle>
              <CreditCard className="h-6 w-6 text-red-400" />
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
              {loadingContadores ? (
                <>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-red-400 font-sans">
                    {contadores.cantServiciosNoPagos}
                  </div>
                  <p className="text-sm text-muted-foreground">Aún no pagados</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium">Servicios Pagados</CardTitle>
              <CreditCard className="h-6 w-6 text-green-500" />
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
              {loadingContadores ? (
                <>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold font-sans text-green-600">
                    {contadores.cantServicios - contadores.cantServiciosNoPagos}
                  </div>
                  <p className="text-xs text-muted-foreground">De este mes</p>
                </>
              )}
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

          {/* Cards de contratos */}
          <div className="space-y-6">
            {contratos.map((contrato: ContratoDetallado) => (
              <ContratoServiciosCard 
                key={contrato.id} 
                contrato={contrato} 
                cantidadPendientes={contratosServiciosNoPagos[contrato.id.toString()] || 0}
                loadingPendientes={loadingPendientes}
                onPagoRegistrado={() => handlePagoRegistrado(contrato.id)}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
