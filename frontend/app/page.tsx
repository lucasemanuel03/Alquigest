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
import { fetchWithToken } from "@/utils/functions/auth-functions/fetchWithToken"
import BACKEND_URL from "@/utils/backendURL"
import Loading from "@/components/loading"

export default function HomePage() {

  const [loading, setLoading] = useState(false)
  const [contadores, setContadores] = useState({
    cantInmueblesActivos: 0,
    cantContratosVigentes: 0,
    cantServiciosNoPagos: 0,
    honorariosDelMes: 0,
  })

  useEffect(() => {
  const fetchContadores = async () => {

    try {
      const cantInmuebles = await fetchWithToken(`${BACKEND_URL}/inmuebles/count/activos`);
      const cantContratos = await fetchWithToken(`${BACKEND_URL}/contratos/count/vigentes`);
      const cantServicios = await fetchWithToken(`${BACKEND_URL}/pagos-servicios/count/pendientes`)
      const honorarios = await fetchWithToken(`${BACKEND_URL}/alquileres/honorarios`)

      setContadores({
        cantInmueblesActivos: cantInmuebles,
        cantContratosVigentes: cantContratos,
        cantServiciosNoPagos: cantServicios,
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
        <div className="mb-16 flex justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2 ">¡Bienvenido!</h2>
            <p className="text-muted-foreground font-sans text-xs md:text-lg">
              Gestione alquireles de forma simple.
            </p>
          </div>
          
        </div>

        {/* Cards DATOS ACTUALES */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-10">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-md md:text-lg font-medium ">Facturas Pendientes</CardTitle>
                <AlertCircle className="h-6 w-6 text-orange-500" />
            </CardHeader>
            <CardContent className="flex flex-col items-center">
                <div className="text-3xl font-bold font-sans text-orange-600">{contadores.cantServiciosNoPagos}</div>
                <p className="text-sm text-muted-foreground">Servicios aún no pagados</p>
            </CardContent>
          </Card>

          <Card>
            
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-md md:text-lg font-medium ">Alquileres Activos</CardTitle>
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="text-3xl font-bold font-sans text-green-600">{contadores.cantContratosVigentes}</div>
              <p className="text-sm text-muted-foreground"> Con contrato/s vigente/s</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-md md:text-lg font-medium">Inmuebles Gestionados</CardTitle>
              <Building2 className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="text-3xl font-bold font-sans">{contadores.cantInmueblesActivos}</div>
              <p className="text-sm text-muted-foreground">Bajo administración</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-md md:text-lg font-medium ">Honorarios del mes</CardTitle>
              <BarChart3 className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="text-2xl font-bold font-sans">${contadores.honorariosDelMes.toLocaleString('es-AR')}</div>
              <p className="text-sm text-muted-foreground">Cálculo estimativo</p>
              
            </CardContent>
          </Card>
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
