"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Phone, Mail, User, Edit, MapPin, ArrowLeft, Menu, Grid, SquareCheck, SquareX, Eye } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Propietario } from "@/types/Propietario"
import BACKEND_URL from "@/utils/backendURL"
import NuevoPropietarioModal from "./nuevoPropietarioModal"
import EditarPropietarioModal from "./editarPropietarioModal"
import Loading from "@/components/loading"
import { fetchWithToken } from "@/utils/functions/auth-functions/fetchWithToken"
import auth from "@/utils/functions/auth-functions/auth"
import { Switch } from "@/components/ui/switch"
import BarraBusqueda from "@/components/busqueda/barra-busqueda"
import { useAuth } from "@/contexts/AuthProvider"

export default function PropietariosPage() {

  const { hasPermission, hasRole, user } = useAuth();

  //DATOS REALES
  const [propietariosBD, setPropietariosBD] = useState<Propietario[]>([]);
  const [propietariosMostrar, setPropietariosMostrar] = useState<Propietario[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroInactivos, setFiltroInactivos] = useState(false);
  const [isEditOwnerOpen, setIsEditOwnerOpen] = useState(false)
  const [editingOwner, setEditingOwner] = useState<Propietario | null>(null)
  const [showList, setShowList] = useState(false)

  const displayStyle = showList? "grid grid-cols-1 gap-6" : "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"

useEffect(() => {
  const fetchPropietarios = async () => {
    const url = filtroInactivos
        ? `${BACKEND_URL}/propietarios/inactivos`
        : `${BACKEND_URL}/propietarios/activos`;

    console.log("Ejecutando fetch de propietarios...");
    try {
      console.log(filtroInactivos ? "Filtro inactivos Activado" : "Cargando inmuebles activos...");
      const data = await fetchWithToken(url);
      console.log("Datos parseados del backend:", data);

      // Ordenar por apellido ascendente
      const dataOrdenada = data.sort((a: Propietario, b: Propietario) =>
        a.apellido.localeCompare(b.apellido));

      setPropietariosBD(dataOrdenada);
      setPropietariosMostrar(dataOrdenada);
    } catch (err: any) {
      console.error("Error al traer propietarios:", err.message);
    } finally {
      setLoading(false);
    }
  };

  fetchPropietarios();
}, [filtroInactivos]);

  const handleEditOwner = (owner: Propietario) => {
    setEditingOwner(owner)
    setIsEditOwnerOpen(true)
  }

  if (loading) return(
    <div>
      <Loading text="Cargando locadores..."/>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">

      <main className="container mx-auto px-6 py-8 pt-30">
        {/* Page Title */}
        <div className="mb-8 flex flex-col gap-5">
          <div className="mt-8 flex justify-between">
            <Link href="/">
              <Button variant="outline"> 
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver</Button>
            </Link>            
            <NuevoPropietarioModal
                text="Nuevo Locador"
                onPropietarioCreado={(nuevo) => setPropietariosBD(prev => [...prev, nuevo])}
              />

          </div>

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">{filtroInactivos? "Locadores Inactivos":"Locadores Activos"}</h2>
              <p className="text-muted-foreground text-sm md:text-xl font-sans">Cantidad Actual: {propietariosBD.length}</p>
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <Button
                onClick={() => setShowList(!showList)} 
                className="transition-all"
                variant="outline">
                {!showList? <div className="flex gap-2 items-center">Ver Lista<Menu/></div> : <div className="flex gap-2 items-center">Ver Grilla<Grid/></div> }
              </Button>
              <Button
                onClick={() => setFiltroInactivos(!filtroInactivos)} 
                className="transition-all"
                title={filtroInactivos ? "Mostrar los locadores con los que se trabaja actualmente" : "Mostrar locadores con los que no se trabaja actualmente"}
                variant="outline">
                {!filtroInactivos? <div className="flex gap-2 items-center"><SquareX/>Ver Inactivos</div> : <div className="flex gap-2 items-center"><SquareCheck/>Ver Activos</div> }
              </Button>
            </div>
          </div>
        </div>

        <BarraBusqueda 
          arrayDatos={propietariosBD}
          placeholder="Buscar por apellido, nombre  o CUIL ..."
          setDatosFiltrados={setPropietariosMostrar}
          propiedadesBusqueda={["apellido", "nombre", "cuil"]}
        />


        {/* Owners Grid */}
        <div className={displayStyle}>
          {propietariosMostrar.map((propietario) => (
            <Card key={propietario.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <User className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {propietario.apellido}, {propietario.nombre}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">CUIL: {propietario.cuil}</p>
                    </div>
                  </div>
                  <Badge
                    variant={propietario.esActivo === true? "default" : "secondary"}
                    className={propietario.esActivo === true ? "bg-accent w-18" : "w-18"}
                  >
                    {propietario.esActivo=== true ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {!showList && (
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-muted-foreground truncate">{propietario.email}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-muted-foreground">{propietario.telefono || "No Especificado"}</span>
                    </div>
                    <div className="flex items-start text-sm">
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground mt-0.5" />
                      <span className="text-muted-foreground text-xs leading-relaxed">{propietario.direccion || "No Especificado"}{`, ${propietario.barrio}`}</span>
                    </div>
                  </div>
                )}
                

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Link href={`/propietarios/${propietario.id}`}>
                    <Button variant="outline" size="sm" className="w-full bg-transparent">
                      <Eye />
                      Ver Detalles
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full bg-transparent"
                    onClick={() => handleEditOwner(propietario)}
                    disabled={!hasPermission("modificar_propietario")}
                  >
                    <Edit />
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {editingOwner && (
          <EditarPropietarioModal
            propietario={editingOwner}
            isOpen={isEditOwnerOpen}
            onClose={() => setIsEditOwnerOpen(false)}
            onPropietarioActualizado={(updatedOwner) =>
              setPropietariosBD((prev) =>
                prev.map((p) => (p.id === updatedOwner.id ? updatedOwner : p))
              )
            }
          />
        )}
      </main>
    </div>
  )
}
