// hooks/usePropietarios.ts
import { useEffect, useState } from "react"
import { Propietario } from "@/types/Propietario"
import { PropietariosService } from "@/utils/services/propietarioService"

export function usePropietarios() {
  const [propietariosBD, setPropietariosBD] = useState<Propietario[]>([])
  const [propietariosMostrar, setPropietariosMostrar] = useState<Propietario[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroInactivos, setFiltroInactivos] = useState(false)

  useEffect(() => {
    const fetchPropietarios = async () => {
      setLoading(true)
      try {
        const data = filtroInactivos
          ? await PropietariosService.getInactivos()
          : await PropietariosService.getActivos()

        const ordenados = data.sort((a, b) =>
          a.apellido.localeCompare(b.apellido)
        )

        setPropietariosBD(ordenados)
        setPropietariosMostrar(ordenados)
      } catch (error) {
        console.error("Error al traer propietarios", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPropietarios()
  }, [filtroInactivos])

  return {
    propietariosBD,
    propietariosMostrar,
    setPropietariosMostrar,
    loading,
    filtroInactivos,
    toggleFiltroInactivos: () => setFiltroInactivos(prev => !prev),
    agregarPropietario: (p: Propietario) =>
      setPropietariosBD(prev => [...prev, p]),
    actualizarPropietario: (p: Propietario) =>
      setPropietariosBD(prev =>
        prev.map(o => o.id === p.id ? p : o)
      )
  }
}