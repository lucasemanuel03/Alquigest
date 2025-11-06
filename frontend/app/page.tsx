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
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { fetchJSON } from "@/utils/functions/fetchWithCredentials"
import Loading from "@/components/loading"
import EstadisticaCard from "@/components/estadisticas/estadistica-card"

export default function HomePage() {

  const [loading, setLoading] = useState(false)
  const [contadores, setContadores] = useState({
    cantInmueblesActivos: 0,
    cantContratosVigentes: 0,
    cantServiciosNoPagos: -99,
    honorariosDelMes: 0,
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
        <div className="mb-12 flex justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2 ">¡Bienvenido!</h2>
            <p className="text-muted-foreground font-sans text-xs md:text-lg">
              Gestione alquileres de forma simple.
            </p>
          </div>
          
        </div>

        {/* Cards DATOS ACTUALES */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-10">
          <EstadisticaCard
            titulo="Facturas Pendientes"
            valor={contadores.cantServiciosNoPagos}
            icono={<AlertCircle className="h-6 w-6 text-orange-500" />}
            subtitulo="Servicios aún no pagados"
            tituloAyuda="Cantidad de facturas de servicios que figuran como no pagadas en el sistema"
          />

          <EstadisticaCard
            titulo="Alquileres Activos"
            valor={contadores.cantContratosVigentes}
            icono={<CheckCircle2 className="h-6 w-6 text-green-500" />}
            subtitulo="Con contrato/s vigente/s"
            tituloAyuda="Cantidad de alquileres que se encuentran activos en el sistema"
          />

          <EstadisticaCard
            titulo="Inmuebles Gestionados"
            valor={contadores.cantInmueblesActivos}
            icono={<Building2 className="h-6 w-6 text-muted-foreground" />}
            subtitulo="Bajo administración"
            tituloAyuda="Cantidad de inmuebles activos bajo administración del estudio jurídico"
          />

          <EstadisticaCard
            titulo="Honorarios del mes"
            valor={`$ ${contadores.honorariosDelMes.toLocaleString('es-AR')}`}
            icono={<BarChart3 className="h-6 w-6 text-muted-foreground" />}
            subtitulo="Cálculo real acumulativo"
            tituloAyuda="Suma de los honorarios correspondientes a los alquileres ya pagos del mes actual"
          />
        </div>

        {/* Main Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10">
          {/* Propietarios Card - Most Important (2 columns) */}
          <Link href="/propietarios" className="group lg:col-span-2">
            <Card className=" h-full transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 border-[var(--amarillo-alqui)]/20 hover:border-[var(--amarillo-alqui)]">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-4 bg-accent/10 rounded-full w-fit group-hover:bg-accent/20 transition-colors">
                  <Users className="h-12 w-12 text-accent" />
                </div>
                <CardTitle className="text-2xl md:text-3xl font-bold">Locadores</CardTitle>
                <CardDescription className="text-base">
                  Visualice y gestione la información de los propietarios/locadores
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button className="w-full bg-[var(--amarillo-alqui)]/80 hover:bg-[var(--amarillo-alqui)] text-black">
                  Ir a Locadores
                </Button>
              </CardContent>
            </Card>
          </Link>

          {/* Pago de Servicios Card - Important (2 columns) */}
          <Link href="/pago-servicios" className="group lg:col-span-2">
            <Card className="h-full transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 border-green-500/20 hover:border-green-500">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-4 bg-green-500/10 rounded-full w-fit group-hover:bg-green-500/20 transition-colors">
                  <CreditCard className="h-12 w-12 text-green-600" />
                </div>
                <CardTitle className="text-2xl md:text-3xl font-bold">Pago de Servicios</CardTitle>
                <CardDescription className="text-base">Gestiona los pagos de servicios de cada contrato controlados por el estudio jurídico</CardDescription>
                
              </CardHeader>
              <CardContent className="text-center">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">Ir a Pagos</Button>
              </CardContent>
            </Card>
          </Link>

          {/* Alquileres Card - Important (2 columns) */}
          <Link href="/alquileres" className="group lg:col-span-2">
            <Card className="h-full transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 border-[var(--amarillo-alqui)]/20 hover:border-[var(--amarillo-alqui)]">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-4 bg-[var(--amarillo-alqui)]/10 rounded-full w-fit group-hover:bg-[var(--amarillo-alqui)]/20 transition-colors">
                  <Notebook className="h-12 w-12 text-[var(--amarillo-alqui)]" />
                </div>
                <CardTitle className="text-2xl md:text-3xl font-bold">Alquileres Vigentes</CardTitle>
                <CardDescription className="text-base">Visualice y administre la información de los contratos de alquiler vigentes</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button className="w-full bg-[var(--amarillo-alqui)]/80 hover:bg-[var(--amarillo-alqui)] text-black">Ir a Alquileres</Button>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-12">

          {/* Inquilinos Card */}
          <Link href="/inquilinos" className="group">
            <Card className="h-full transition-all duration-200 hover:shadow-lg hover:scale-105">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-4 p-4 bg-secondary/10 rounded-full w-fit group-hover:bg-secondary/20 transition-colors">
                  <Users className="h-10 w-10 text-secondary" />
                </div>
                <CardTitle className="text-xl font-bold">Locatarios</CardTitle>
                <CardDescription className="text-base">Administra la información de los inquilinos/locatarios</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button variant="outline" className="w-full bg-transparent">
                  Ver Locatarios
                </Button>
              </CardContent>
            </Card>
          </Link>
          
          {/* Inmuebles Card */}
          <Link href="/inmuebles" className="group">
            <Card className="h-full transition-all duration-200 hover:shadow-lg hover:scale-105">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-fit group-hover:bg-primary/20 transition-colors">
                  <Building2 className="h-10 w-10 text-secondary" />
                </div>
                <CardTitle className="text-xl font-bold">Inmuebles</CardTitle>
                <CardDescription className="text-base">Administra la información de inmuebles a cargo</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button variant="outline" className="w-full bg-transparent">
                  Ver Inmuebles
                </Button>
              </CardContent>
            </Card>
          </Link>

          {/* Contratos Card */}
          <Link href="/contratos/historial" className="group">
            <Card className="h-full transition-all duration-200 hover:shadow-lg hover:scale-105">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-4 p-4 bg-secondary/10 rounded-full w-fit group-hover:bg-secondary/20 transition-colors">
                  <FileClock className="h-10 w-10 text-secondary" />
                </div>
                <CardTitle className="text-xl font-bold">Historial de Contratos</CardTitle>
                <CardDescription className="text-base">Visualice el historial de contratos registrados</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button variant="outline" className="w-full bg-transparent">
                  Ver Historial
                </Button>
              </CardContent>
            </Card>
          </Link>

        </div>
      </main>
    </div>
  )
}
