// hooks/useEditarPropietario.ts
import { useState } from "react"
import { Propietario } from "@/types/Propietario"
import { PropietariosService } from "@/utils/services/propietarioService"
import BACKEND_URL from "@/utils/backendURL"
import { fetchWithToken } from "@/utils/functions/auth-functions/fetchWithToken"

export function useEditarPropietario() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mostrarError, setMostrarError] = useState(false)

  const actualizarPropietario = async (
    id: string,
    data: Partial<Propietario>,
    claveFiscalActualizada?: string
  ): Promise<Propietario | null> => {
    setLoading(true)
    setError(null)

    try {
      // Crear objeto sin la clave fiscal para enviar al PATCH
      const { claveFiscal, ...propietarioSinClaveFiscal } = data

      // Si hay una clave fiscal actualizada, incluirla en el request
      const dataToSend = claveFiscalActualizada !== "" && claveFiscalActualizada !== undefined
        ? { ...propietarioSinClaveFiscal, claveFiscal: claveFiscalActualizada }
        : propietarioSinClaveFiscal

      return await PropietariosService.patch(id, dataToSend)
    } catch (error: any) {
      console.error("Error al actualizar propietario:", error)
      const mensajeError = (error instanceof Error && error.message) 
        ? error.message 
        : "Error al conectarse al servidor"
      setError(mensajeError)
      setMostrarError(true)
      return null
    } finally {
      setLoading(false)
    }
  }

  const desactivarPropietario = async (id: string): Promise<Propietario | null> => {
    setLoading(true)
    setError(null)

    try {
      // El endpoint /desactivar retorna 204 sin contenido
      await fetchWithToken(`${BACKEND_URL}/propietarios/${id}/desactivar`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      })

      // Como no hay respuesta, retornar null para indicar éxito
      // El componente deberá manejar la actualización localmente
      return null
    } catch (error: any) {
      console.error("Error al desactivar propietario:", error)
      const mensajeError = (error instanceof Error && error.message)
        ? error.message
        : "Error al conectarse al servidor"
      setError(mensajeError)
      setMostrarError(true)
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    actualizarPropietario,
    desactivarPropietario,
    loading,
    error,
    mostrarError,
    setMostrarError,
  }
}
