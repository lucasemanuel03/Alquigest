"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Building2,
  Users,
  Home,
  BarChart3,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Notebook,
  FileClock,
  FileChartColumnIncreasing,
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { fetchJSON } from "@/utils/functions/fetchWithCredentials"
import Loading from "@/components/loading"
import EstadisticaCard from "@/components/estadisticas/estadistica-card"

export default function HomePage() {

  const [loading, setLoading] = useState(false)
  const [cargandoContadores, setCargandoContadores] = useState(true)
  const [contadores, setContadores] = useState({
    cantInmueblesActivos: -99,
    cantContratosVigentes: -99,
    cantServiciosNoPagos: -99,
    honorariosDelMes: -99,
  })

  useEffect(() => {
  const fetchContadores = async () => {

    try {
      const cantInmuebles = await fetchJSON<number>('/inmuebles/count/activos');
      const cantContratos = await fetchJSON<number>('/contratos/count/vigentes');
      const cantServicios = await fetchJSON('/pagos-servicios/count/pendientes')
      const honorarios = await fetchJSON<number>('/alquileres/honorarios')

      setContadores({
        cantInmueblesActivos: cantInmuebles,
        cantContratosVigentes: cantContratos,
        cantServiciosNoPagos: cantServicios.serviciosPendientes,
        honorariosDelMes: honorarios
      });

      setCargandoContadores(false);
    } catch (err: any) {
      console.error("Error al traer contadores:", err.message);
    } finally {
      setLoading(false);
    }
  };

  fetchContadores();
}, []);

  if (loading) return(
    <div>
      <Loading text="Cargando..." />
    </div>
  )

  return (
    <div className="bg-background">
      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 pt-30">
        {/* Welcome Section */}
        <div className="mb-8 flex justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2 ">¡Bienvenido!</h2>
            <p className="text-muted-foreground font-sans text-xs md:text-sm">
              Gestione alquileres de forma simple.
            </p>
          </div>
          
        </div>

        {/* Cards DATOS ACTUALES */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <EstadisticaCard
            titulo="Facturas Pendientes"
            valor={contadores.cantServiciosNoPagos}
            icono={<AlertCircle className="h-6 w-6 text-orange-500" />}
            subtitulo="Servicios aún no pagados"
            tituloAyuda="Cantidad de facturas de servicios que figuran como no pagadas en el sistema"
            cargando={cargandoContadores}
          />

          <EstadisticaCard
            titulo="Alquileres Activos"
            valor={contadores.cantContratosVigentes}
            icono={<CheckCircle2 className="h-6 w-6 text-green-500" />}
            subtitulo="Con contrato/s vigente/s"
            tituloAyuda="Cantidad de alquileres que se encuentran activos en el sistema"
            cargando={cargandoContadores}
          />

          <EstadisticaCard
            titulo="Inmuebles Gestionados"
            valor={contadores.cantInmueblesActivos}
            icono={<Building2 className="h-6 w-6 text-muted-foreground" />}
            subtitulo="Bajo administración"
            tituloAyuda="Cantidad de inmuebles activos bajo administración del estudio jurídico"
            cargando={cargandoContadores}
          />

          <EstadisticaCard
            titulo="Honorarios del mes"
            valor={`$ ${contadores.honorariosDelMes.toLocaleString('es-AR')}`}
            icono={<BarChart3 className="h-6 w-6 text-muted-foreground" />}
            subtitulo="Cálculo real acumulativo"
            tituloAyuda="Suma de los honorarios correspondientes a los alquileres ya pagos del mes actual"
            cargando={cargandoContadores}
          />
        </div>

        {/* Main Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-7">
          {/* Propietarios Card - Most Important (2 columns) */}
          <Link href="/propietarios" className="group lg:col-span-2">
            <Card className=" h-full transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 border-[var(--amarillo-alqui)]/20 hover:border-[var(--amarillo-alqui)]">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-4 bg-accent/10 rounded-full w-fit group-hover:bg-accent/20 transition-colors">
                  <Users className="h-12 w-12 text-accent" />
                </div>
                <CardTitle className="text-2xl md:text-2xl font-bold">Locadores</CardTitle>
                <CardDescription className="text-base">
                  Visualice y gestione la información de los propietarios/locadores
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          {/* Pago de Servicios Card - Important (2 columns) */}
          <Link href="/pago-servicios" className="group lg:col-span-2">
            <Card className="h-full transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 border-green-500/20 hover:border-green-500">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-4 bg-green-500/10 rounded-full w-fit group-hover:bg-green-500/20 transition-colors">
                  <CreditCard className="h-12 w-12 text-green-600" />
                </div>
                <CardTitle className="text-2xl md:text-2xl font-bold">Pago de Servicios</CardTitle>
                <CardDescription className="text-base">Gestiona los pagos de servicios de cada contrato controlados por el estudio jurídico</CardDescription>
                
              </CardHeader>
            </Card>
          </Link>

          {/* Alquileres Card - Important (2 columns) */}
          <Link href="/alquileres" className="group lg:col-span-2">
            <Card className="h-full transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 border-[var(--amarillo-alqui)]/20 hover:border-[var(--amarillo-alqui)]">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-4 bg-[var(--amarillo-alqui)]/10 rounded-full w-fit group-hover:bg-[var(--amarillo-alqui)]/20 transition-colors">
                  <Notebook className="h-12 w-12 text-[var(--amarillo-alqui)]" />
                </div>
                <CardTitle className="text-2xl md:text-2xl font-bold">Contratos de Alquiler</CardTitle>
                <CardDescription className="text-base">Visualice y administre la información de todos los contratos de alquiler.</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-7 mt-8">

          {/* Inquilinos Card */}
          <Link href="/inquilinos" className="group">
            <Card className="h-full transition-all duration-200 hover:shadow-lg hover:scale-105">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-4 p-4 bg-secondary/10 rounded-full w-fit group-hover:bg-secondary/20 transition-colors">
                  <Users className="h-7 w-7 text-secondary" />
                </div>
                <CardTitle className="text-xl font-bold">Locatarios</CardTitle>
                <CardDescription className="text-base">Administra la información de los inquilinos/locatarios</CardDescription>
              </CardHeader>
            </Card>
          </Link>
          
          {/* Inmuebles Card */}
          <Link href="/inmuebles" className="group">
            <Card className="h-full transition-all duration-200 hover:shadow-lg hover:scale-105">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-fit group-hover:bg-primary/20 transition-colors">
                  <Building2 className="h-7 w-7 text-secondary" />
                </div>
                <CardTitle className="text-xl font-bold">Inmuebles</CardTitle>
                <CardDescription className="text-base">Administra la información de inmuebles a cargo</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          {/* Contratos Card */}
          <Link href="/informes" className="group">
            <Card className="h-full transition-all duration-200 hover:shadow-lg hover:scale-105">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-4 p-4 bg-secondary/10 rounded-full w-fit group-hover:bg-secondary/20 transition-colors">
                  <FileChartColumnIncreasing className="h-7 w-7 text-secondary" />
                </div>
                <CardTitle className="text-xl font-bold">Reportes e Informes</CardTitle>
                <CardDescription className="text-base">Visualice y exporte informes mensuales</CardDescription>
              </CardHeader>
            </Card>
          </Link>

        </div>
      </main>
    </div>
  )
}
