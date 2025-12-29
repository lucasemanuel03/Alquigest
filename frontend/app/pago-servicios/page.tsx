"use client"

import { useMemo } from "react"
import { CreditCard, Blocks, ArrowLeft, Receipt } from "lucide-react"
import { usePagoServicios } from "@/hooks/usePagoServicios"
import Loading from "@/components/loading"
import ContratoServiciosCard from "@/components/pago-servicios/contrato-servicios-card"
import { Button } from "@/components/ui/button"
import EstadisticaCard from "@/components/estadisticas/estadistica-card"

/**
 * Página de Pago de Servicios
 * 
 * Responsabilidades:
 * - Orquestar el hook usePagoServicios
 * - Ordenar y filtrar datos
 * - Coordinar la actualización cuando se registra un pago
 * - Delegar renderizado a componentes presentacionales
 */
export default function PagoServiciosPage() {
  const {
    contratos,
    contadores,
    contratosServiciosNoPagos,
    loading,
    loadingContadores,
    loadingPendientes,
    refrescarDatos,
  } = usePagoServicios()

  // Ordenar contratos por cantidad de servicios pendientes (descendente)
  const contratosOrdenados = useMemo(() => {
    return [...contratos].sort((a, b) => {
      const pa = contratosServiciosNoPagos[a.id.toString()] || 0
      const pb = contratosServiciosNoPagos[b.id.toString()] || 0
      if (pb !== pa) return pb - pa
      return a.id - b.id
    })
  }, [contratos, contratosServiciosNoPagos])

  /**
   * Callback cuando se registra un pago en un contrato
   * Refrescar datos secundarios (contadores y pendientes)
   */
  const handlePagoRegistrado = async (contratoId: number) => {
    await refrescarDatos(contratoId)
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
            valor={contadores.serviciosTotales}
            icono={<Blocks className=" text-slate-700" />}
            coloresIcono="bg-slate-300"
            subtitulo="Bajo control del estudio jurídico"
            tituloAyuda="Cantidad de servicios bajo control del estudio jurídico"
            cargando={loadingContadores}
            />
          <EstadisticaCard
            titulo="Servicios Pendientes"
            valor={contadores.serviciosPendientes}
            icono={<Receipt className=" text-orange-700" />}
            coloresIcono="bg-orange-300"
            subtitulo="Servicios aún no pagados"
            tituloAyuda="Cantidad de facturas de servicios que figuran como no pagadas en el sistema"
            cargando={loadingContadores}
          />

          <EstadisticaCard 
            titulo="Servicios Pagados"
            valor={contadores.serviciosTotales - contadores.serviciosPendientes}
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
            {contratosOrdenados.map((contrato) => (
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
