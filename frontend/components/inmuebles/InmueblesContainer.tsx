"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Inmueble } from "@/types/Inmueble"
import { Propietario } from "@/types/Propietario"
import BACKEND_URL from "@/utils/backendURL"
import { fetchWithToken } from "@/utils/functions/auth-functions/fetchWithToken"
import Loading from "@/components/loading"
import InmueblesHeader, { FiltroInmuebles } from "@/components/inmuebles/InmueblesHeader"
import InmueblesGrid from "@/components/inmuebles/InmueblesGrid"
import ModalEditarInmueble, { EditingInmueble } from "@/components/modal-editar-inmueble"
import ModalError from "@/components/modal-error"
import BarraBusqueda from "../busqueda/barra-busqueda"
import { set } from "lodash"
import { useAuth } from "@/contexts/AuthProvider"

export default function InmueblesContainer() {
  const { hasPermission } = useAuth();
  const searchParams = useSearchParams()
  const router = useRouter()

  // Leer filtro desde URL o usar "activos" por defecto
  const filtroFromURL = (searchParams.get("filtro") as FiltroInmuebles) || "activos"
  const filtrosValidos: FiltroInmuebles[] = ["activos", "inactivos", "alquilados", "disponibles"]
  const filtroInicial = filtrosValidos.includes(filtroFromURL) ? filtroFromURL : "activos"

  const [inmueblesBD, setInmueblesBD] = useState<Inmueble[]>([])
  const [inmueblesMostrar, setInmueblesMostrar] = useState<Inmueble[]>([])
  const [propietariosBD, setPropietariosBD] = useState<Propietario[]>([])

  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<FiltroInmuebles>(filtroInicial)

  const [isEditInmuebleOpen, setIsEditInmuebleOpen] = useState(false)
  const [editingInmueble, setEditingInmueble] = useState<EditingInmueble>({
    id: undefined,
    propietarioId: "",
    direccion: "",
    tipoInmuebleId: "",
    estado: "",
    superficie: "",
    esAlquilado: true,
    esActivo: true,
  })

  const [errorCarga, setErrorCarga] = useState("")
  const [mostrarError, setMostrarError] = useState(false)

  const canEdit = hasPermission("modificar_inmueble")

  // Función para cambiar filtro y actualizar URL
  const handleChangeFiltro = (nuevoFiltro: FiltroInmuebles) => {
    setFiltro(nuevoFiltro)
    // Actualizar URL sin recargar la página
    router.push(`/inmuebles?filtro=${nuevoFiltro}`, { scroll: false })
  }

  useEffect(() => {
    const fetchPropietarios = async () => {
      try {
        const data = await fetchWithToken(`${BACKEND_URL}/propietarios`)
        setPropietariosBD(data)
  
      } catch (err) {
        console.error("Error al traer propietarios:", err)
      }
    }

    fetchPropietarios()
  }, [filtro])

  useEffect(() => {
    const fetchInmuebles = async () => {

      setLoading(true)
      
      // Mapear filtro a endpoint
      const endpointMap: Record<FiltroInmuebles, string> = {
        activos: "inmuebles/activos",
        inactivos: "inmuebles/inactivos",
        alquilados: "inmuebles/alquilados",
        disponibles: "inmuebles/disponibles",
      }

      const url = `${BACKEND_URL}/${endpointMap[filtro]}`

      try {
        const data: Inmueble[] = await fetchWithToken(url)
        setInmueblesBD(data)
        setInmueblesMostrar(data)
        setLoading(false)
      } catch (error) {
        console.error("Error al obtener inmuebles:", error)
      }
    }

    fetchInmuebles()
  }, [filtro])

  const handleEditInmueble = (inmueble: Inmueble) => {
    setEditingInmueble({
      id: inmueble.id,
      propietarioId: inmueble.propietarioId,
      direccion: inmueble.direccion,
      tipoInmuebleId: inmueble.tipoInmuebleId,
      estado: inmueble.estado,
      superficie: inmueble.superficie,
      esAlquilado: inmueble.esAlquilado,
      esActivo: inmueble.esActivo,
    })
    setIsEditInmuebleOpen(true)
  }

  const handleUpdateInmueble = async () => {
    try {
      if (!editingInmueble || !editingInmueble.id) {
        throw new Error("Inmueble no válido para editar")
      }
      let updatedInmueble


      // Si estado actual es "Inactivo", llamar a endpoint de desactivación
      if (editingInmueble.estado === 3 || editingInmueble.estado === "3") {
        editingInmueble.esActivo = false
        await fetchWithToken(`${BACKEND_URL}/inmuebles/${editingInmueble.id}/desactivar`, { method: "PATCH" })
        updatedInmueble = { ...editingInmueble, esActivo: false }
      }

      // Si estado actual es distinto de "Inactivo", llamar a endpoint de actualización normal
      if (editingInmueble.estado !== 3 && editingInmueble.estado !== "3") {
        editingInmueble.esActivo = true
      }
      
      updatedInmueble = await fetchWithToken(`${BACKEND_URL}/inmuebles/${editingInmueble.id}`, {
          method: "PUT",
          body: JSON.stringify(editingInmueble)
      })

      if (!updatedInmueble || !updatedInmueble.id) {
        throw new Error("El servidor no retornó el inmueble actualizado")
      }

      setInmueblesBD((prev) => prev.map((p) => (p.id === updatedInmueble.id ? updatedInmueble : p)))

      setIsEditInmuebleOpen(false)
      setEditingInmueble({
        id: undefined,
        propietarioId: "",
        direccion: "",
        tipoInmuebleId: "",
        estado: "",
        superficie: "",
        esAlquilado: true,
        esActivo: true,
      })
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Error del servidor..."
      setErrorCarga(msg)
      setMostrarError(true)
    }
  }

  if (loading) {
    return (
      <div>
        <Loading text="Cargando Inmuebles" />
      </div>
    )
  }

  return (
    <main className="container mx-auto px-6 py-8 pt-25 sm:pt-28">
      <InmueblesHeader
        filtro={filtro}
        onChangeFiltro={handleChangeFiltro}
        count={inmueblesBD.length}
        onInmuebleCreado={(nuevo) => {
          setInmueblesBD((prev) => [...prev, nuevo])
          setInmueblesMostrar((prev) => [...prev, nuevo])
        }}
      />

      <BarraBusqueda 
        arrayDatos={inmueblesBD}
        placeholder="Buscar por dirección..." 
        setDatosFiltrados={setInmueblesMostrar} 
        propiedadesBusqueda={["direccion"]}/>

      <InmueblesGrid
        inmuebles={inmueblesMostrar}
        propietarios={propietariosBD}
        canEdit={canEdit}
        onEdit={handleEditInmueble}
      />

      <ModalEditarInmueble
        open={isEditInmuebleOpen}
        onOpenChange={setIsEditInmuebleOpen}
        editingInmueble={editingInmueble as any}
        setEditingInmueble={setEditingInmueble as any}
        propietarios={propietariosBD}
        onSubmit={handleUpdateInmueble}
      />

      {mostrarError && (
        <ModalError titulo="Error al crear Inmueble" mensaje={errorCarga} onClose={() => setMostrarError(false)} />
      )}
    </main>
  )
}
