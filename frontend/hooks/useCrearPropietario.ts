// hooks/useCrearPropietario.ts
import { useState } from "react"
import { Propietario } from "@/types/Propietario"
import { PropietariosService } from "@/utils/services/propietarioService"
import { set } from "lodash"

export function useCrearPropietario() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mostrarError, setMostrarError] = useState(false)

  const crearPropietario = async (
    data: Partial<Propietario>
  ): Promise<Propietario | null> => {
    setLoading(true)
    setError(null)

    try {
      return await PropietariosService.create(data as Omit<Propietario, "id">)
    } catch (error: any) {
        console.error("Error al crear propietario:", error)
        const mensajeError = (error instanceof Error && error.message) ? error.message : "Error al conectarse al servidor";
        setError(mensajeError)
        setMostrarError(true)
        return null
    } finally {
      setLoading(false)
    }
  }

  return {
    crearPropietario,
    loading,
    error,
    mostrarError,
    setMostrarError
  }
}
