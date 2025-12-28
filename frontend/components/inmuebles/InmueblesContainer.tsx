"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Inmueble } from "@/types/Inmueble"
import { Propietario } from "@/types/Propietario"
import BACKEND_URL from "@/utils/backendURL"
import { fetchWithToken } from "@/utils/functions/auth-functions/fetchWithToken"
import Loading from "@/components/loading"
import InmueblesHeader from "@/components/inmuebles/InmueblesHeader"
import InmueblesGrid from "@/components/inmuebles/InmueblesGrid"
import ModalEditarInmueble, { EditingInmueble } from "@/components/modal-editar-inmueble"
import ModalError from "@/components/modal-error"
import BarraBusqueda from "../busqueda/barra-busqueda"
import { useAuth } from "@/contexts/AuthProvider"
import { useInmuebles } from "@/hooks/useInmuebles"
import { FiltroInmuebles } from "@/utils/services/inmueblesService"

export default function InmueblesContainer() {
  const { hasPermission } = useAuth();
  const searchParams = useSearchParams()
  const router = useRouter()

  // Leer filtro desde URL o usar "activos" por defecto
  const filtroFromURL = (searchParams.get("filtro") as FiltroInmuebles) || "activos"
  const filtrosValidos: FiltroInmuebles[] = ["activos", "inactivos", "alquilados", "disponibles"]
  const filtroInicial = filtrosValidos.includes(filtroFromURL) ? filtroFromURL : "activos"

  const [filtro, setFiltro] = useState<FiltroInmuebles>(filtroInicial)
  const { inmuebles, loading, error, refetch, update } = useInmuebles(filtro)

  const [inmueblesMostrar, setInmueblesMostrar] = useState<Inmueble[]>([])
  const [propietariosBD, setPropietariosBD] = useState<Propietario[]>([])

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
    router.push(`/inmuebles?filtro=${nuevoFiltro}`, { scroll: false })
    refetch(nuevoFiltro)
  }

  // Sincronizar inmueblesMostrar con inmuebles cuando cambien
  useEffect(() => {
    setInmueblesMostrar(inmuebles)
  }, [inmuebles])

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

      // Convertir datos si es necesario
      const dataToUpdate: Partial<Inmueble> = {
        propietarioId: typeof editingInmueble.propietarioId === "string" 
          ? parseInt(editingInmueble.propietarioId) 
          : editingInmueble.propietarioId,
        direccion: editingInmueble.direccion,
        tipoInmuebleId: typeof editingInmueble.tipoInmuebleId === "string"
          ? parseInt(editingInmueble.tipoInmuebleId)
          : editingInmueble.tipoInmuebleId,
        estado: typeof editingInmueble.estado === "string"
          ? parseInt(editingInmueble.estado)
          : editingInmueble.estado,
        superficie: typeof editingInmueble.superficie === "string"
          ? parseFloat(editingInmueble.superficie)
          : editingInmueble.superficie,
        esAlquilado: editingInmueble.esAlquilado,
        esActivo: editingInmueble.esActivo,
      }

      await update(editingInmueble.id, dataToUpdate)

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
        count={inmuebles.length}
        onInmuebleCreado={(nuevo) => {
          setInmueblesMostrar((prev) => [...prev, nuevo])
          refetch(filtro)
        }}
      />

      <BarraBusqueda 
        arrayDatos={inmuebles}
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
        <ModalError titulo="Error al editar Inmueble" mensaje={errorCarga} onClose={() => setMostrarError(false)} />
      )}

      {error && (
        <ModalError titulo="Error al cargar Inmuebles" mensaje={error} onClose={() => setMostrarError(false)} />
      )}
    </main>
  )
}
