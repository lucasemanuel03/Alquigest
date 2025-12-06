import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, ArrowLeft, Zap, Droplets, Flame, Wifi, Home, User, Building } from "lucide-react"
import Link from "next/link"

interface ServicioProps {
  id: string
  nombre: string
  tipo: "luz" | "agua" | "gas" | "internet" | "renta"
  gestionadoPor: "estudio" | "propietario" | "inquilino"
  estado: "activo" | "inactivo" | "pendiente"
  proveedor?: string
  numeroContrato?: string
  fechaVencimiento?: string
}

export default function ServiciosInmueblePage({ params }: { params: { id: string } }) {
  // Datos de ejemplo del inmueble
  const inmueble = {
    id: params.id,
    direccion: "Calle Mayor 123, Madrid",
    tipo: "Apartamento",
    propietario: "Juan García",
    inquilino: "María López",
  }

  // Datos de ejemplo de servicios
  const servicios: ServicioProps[] = [
    {
      id: "1",
      nombre: "Suministro Eléctrico",
      tipo: "luz",
      gestionadoPor: "estudio",
      estado: "activo",
      proveedor: "Iberdrola",
      numeroContrato: "IBE-2023-001234",
      fechaVencimiento: "2024-12-31",
    },
    {
      id: "2",
      nombre: "Suministro de Agua",
      tipo: "agua",
      gestionadoPor: "propietario",
      estado: "activo",
      proveedor: "Canal de Isabel II",
      numeroContrato: "CII-2023-567890",
    },
    {
      id: "3",
      nombre: "Suministro de Gas",
      tipo: "gas",
      gestionadoPor: "inquilino",
      estado: "activo",
      proveedor: "Naturgy",
      numeroContrato: "NAT-2023-789012",
    },
    {
      id: "4",
      nombre: "Internet y TV",
      tipo: "internet",
      gestionadoPor: "inquilino",
      estado: "activo",
      proveedor: "Movistar",
      numeroContrato: "MOV-2023-345678",
    },
    {
      id: "5",
      nombre: "Renta Mensual",
      tipo: "renta",
      gestionadoPor: "estudio",
      estado: "activo",
      proveedor: "Gestión Directa",
    },
  ]

  const getServiceIcon = (tipo: ServicioProps["tipo"]) => {
    switch (tipo) {
      case "luz":
        return <Zap className="h-5 w-5" />
      case "agua":
        return <Droplets className="h-5 w-5" />
      case "gas":
        return <Flame className="h-5 w-5" />
      case "internet":
        return <Wifi className="h-5 w-5" />
      case "renta":
        return <Home className="h-5 w-5" />
    }
  }

  const getGestionIcon = (gestionadoPor: ServicioProps["gestionadoPor"]) => {
    switch (gestionadoPor) {
      case "estudio":
        return <Building className="h-4 w-4" />
      case "propietario":
        return <User className="h-4 w-4" />
      case "inquilino":
        return <User className="h-4 w-4" />
    }
  }

  const getGestionColor = (gestionadoPor: ServicioProps["gestionadoPor"]) => {
    switch (gestionadoPor) {
      case "estudio":
        return "bg-accent text-accent-foreground"
      case "propietario":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "inquilino":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    }
  }

  const getEstadoColor = (estado: ServicioProps["estado"]) => {
    switch (estado) {
      case "activo":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "inactivo":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "pendiente":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/" className="flex items-center space-x-3">
                <Building2 className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold text-foreground ">LegalProp</h1>
                  <p className="text-sm text-muted-foreground font-serif">Gestión de Servicios</p>
                </div>
              </Link>
            </div>
            <Link href="/inmuebles">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a Inmuebles
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Property Info */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Servicios del Inmueble</h2>
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">{inmueble.direccion}</h3>
            <div className="flex flex-col sm:flex-row gap-4 text-sm text-muted-foreground">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-1" />
                <span>Propietario: {inmueble.propietario}</span>
              </div>
              <div className="flex items-center">
                <User className="h-4 w-4 mr-1" />
                <span>Inquilino: {inmueble.inquilino}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servicios.map((servicio) => (
            <Card key={servicio.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-accent/10 rounded-lg">{getServiceIcon(servicio.tipo)}</div>
                    <div>
                      <CardTitle className="text-lg font-sans">{servicio.nombre}</CardTitle>
                      <p className="text-sm text-muted-foreground">{servicio.proveedor}</p>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Estado */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Estado:</span>
                  <Badge className={getEstadoColor(servicio.estado)}>
                    {servicio.estado.charAt(0).toUpperCase() + servicio.estado.slice(1)}
                  </Badge>
                </div>

                {/* Gestionado por */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Gestionado por:</span>
                  <Badge className={getGestionColor(servicio.gestionadoPor)}>
                    <div className="flex items-center space-x-1">
                      {getGestionIcon(servicio.gestionadoPor)}
                      <span>
                        {servicio.gestionadoPor === "estudio"
                          ? "Estudio Jurídico"
                          : servicio.gestionadoPor === "propietario"
                            ? "Propietario"
                            : "Inquilino"}
                      </span>
                    </div>
                  </Badge>
                </div>

                {/* Número de contrato */}
                {servicio.numeroContrato && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Contrato:</span>
                    <span className="text-sm font-mono">{servicio.numeroContrato}</span>
                  </div>
                )}

                {/* Fecha de vencimiento */}
                {servicio.fechaVencimiento && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Vencimiento:</span>
                    <span className="text-sm font-medium">
                      {new Date(servicio.fechaVencimiento).toLocaleDateString("es-ES")}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                    Editar
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                    Historial
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Building className="h-8 w-8 text-accent" />
                <div>
                  <p className="text-2xl font-bold">{servicios.filter((s) => s.gestionadoPor === "estudio").length}</p>
                  <p className="text-sm text-muted-foreground">Gestionados por Estudio</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <User className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {servicios.filter((s) => s.gestionadoPor === "propietario").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Gestionados por Propietario</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <User className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {servicios.filter((s) => s.gestionadoPor === "inquilino").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Gestionados por Inquilino</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
