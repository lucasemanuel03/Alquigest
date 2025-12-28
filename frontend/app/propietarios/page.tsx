"use client"

import { Button } from "@/components/ui/button"
import {  ArrowLeft, Menu, Grid, SquareCheck, SquareX } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { Propietario } from "@/types/Propietario"
import NuevoPropietarioModal from "./nuevoPropietarioModal"
import EditarPropietarioModal from "./editarPropietarioModal"
import Loading from "@/components/loading"
import BarraBusqueda from "@/components/busqueda/barra-busqueda"
import { useAuth } from "@/contexts/AuthProvider"
import PropietarioCard from "@/components/propietarios/propietario-card"
import { usePropietarios } from "@/hooks/usePropietarios"

export default function PropietariosPage() {

  const { hasPermission } = useAuth();
  const { propietariosBD, propietariosMostrar, setPropietariosMostrar, loading, filtroInactivos, agregarPropietario, toggleFiltroInactivos, actualizarPropietario } = usePropietarios();
  const [isEditOwnerOpen, setIsEditOwnerOpen] = useState(false)
  const [editingOwner, setEditingOwner] = useState<Propietario | null>(null)
  const [showList, setShowList] = useState(false)

  const displayStyle = showList? "grid grid-cols-1 gap-6" : "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"



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

      <main className="container mx-auto px-6 py-8 pt-25 sm:pt-28">
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
                onPropietarioCreado={(nuevo) => agregarPropietario(nuevo)}
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
                onClick={() => toggleFiltroInactivos()} 
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
            <PropietarioCard
              key={propietario.id}
              propietario={propietario}
              showList={showList}
              tienePermiso={hasPermission("modificar_propietario")}
              handleEditOwner={handleEditOwner}
            />
          ))}
        </div>

        {editingOwner && (
          <EditarPropietarioModal
            propietario={editingOwner}
            isOpen={isEditOwnerOpen}
            onClose={() => setIsEditOwnerOpen(false)}
            onPropietarioActualizado={(updatedOwner) =>
              actualizarPropietario(updatedOwner)
            }
          />
        )}
      </main>
    </div>
  )
}
