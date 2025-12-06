"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCard, Blocks, ArrowLeft, Receipt } from "lucide-react"
import { ContratoDetallado } from "@/types/ContratoDetallado"
import { fetchWithToken } from "@/utils/functions/auth-functions/fetchWithToken"
import BACKEND_URL from "@/utils/backendURL"
import Loading from "@/components/loading"
import ContratoServiciosCard from "@/components/pago-servicios/contrato-servicios-card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import EstadisticaCard from "@/components/estadisticas/estadistica-card"


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

  // Ordenar contratos por cantidad de servicios pendientes (descendente)
  const contratosOrdenados = useMemo(() => {
    return [...contratos].sort((a, b) => {
      const pa = contratosServiciosNoPagos[a.id.toString()] || 0
      const pb = contratosServiciosNoPagos[b.id.toString()] || 0
      if (pb !== pa) return pb - pa
      return a.id - b.id
    })
  }, [contratos, contratosServiciosNoPagos])

  useEffect(() => {
    // Fetch principal: contratos (bloquea el loading principal)
    const fetchContratos = async () => {
      setLoading(true)
      
      try {
        const data = await fetchWithToken(`${BACKEND_URL}/contratos/vigentes`)
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
      <main className="container mx-auto px-6 py-8 pt-25  sm:pt-30">
        <div className="mb-8 flex flex-col gap-3">
          <Button variant="outline" onClick={() => window.history.back()} className="w-fit">
          <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">

          <EstadisticaCard 
            titulo="Total de servicios"
            valor={contadores.cantServicios}
            icono={<Blocks className=" text-slate-700" />}
            coloresIcono="bg-slate-300"
            subtitulo="Bajo control del estudio jurídico"
            tituloAyuda="Cantidad de servicios bajo control del estudio jurídico"
            cargando={loadingContadores}
            />
          <EstadisticaCard
            titulo="Servicios Pendientes"
            valor={contadores.cantServiciosNoPagos}
            icono={<Receipt className=" text-orange-700" />}
            coloresIcono="bg-orange-300"
            subtitulo="Servicios aún no pagados"
            tituloAyuda="Cantidad de facturas de servicios que figuran como no pagadas en el sistema"
            cargando={loadingContadores}
          />

          <EstadisticaCard 
            titulo="Servicios Pagados"
            valor={contadores.cantServicios - contadores.cantServiciosNoPagos}
            icono={<CreditCard className=" text-green-700" />}
            coloresIcono="bg-green-300"
            subtitulo="Servicios pagados este mes"
            tituloAyuda="Cantidad de facturas de servicios que han sido pagadas en el mes actual"
            cargando={loadingContadores}
          />

        </div>

        {/* Contratos List */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-foreground">Alquileres con servicios bajo control</h2>

          {/* Mensaje cuando no hay contratos */}
          {!loading && contratos.length === 0 && (
            <p className="text-lg text-secondary">No hay contratos con servicios bajo control actualmente</p>
          )}

          {/* Cards de contratos */}
          {/** Lista ordenada: primero contratos con más servicios pendientes */}
          <div className="grid grid-cols-1 gap-4 ">
            {contratosOrdenados.map((contrato: ContratoDetallado) => (
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
