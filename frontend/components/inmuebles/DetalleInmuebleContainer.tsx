"use client"

import { useEffect, useMemo, useState } from "react"
import Loading from "@/components/loading"
import LoadingSmall from "@/components/loading-sm"
import InmuebleHeader from "@/components/inmuebles/InmuebleHeader"
import InmuebleDatosCard from "@/components/inmuebles/InmuebleDatosCard"
import PropietarioCard from "@/components/inmuebles/PropietarioCard"
import ContratoResumenCard from "@/components/inmuebles/ContratoResumenCard"
import { Inmueble } from "@/types/Inmueble"
import { Propietario } from "@/types/Propietario"
import { ContratoDetallado } from "@/types/ContratoDetallado"
import BACKEND_URL from "@/utils/backendURL"
import { TIPOS_INMUEBLES, ESTADOS_INMUEBLE } from "@/utils/constantes"
import { fetchWithToken } from "@/utils/functions/auth-functions/fetchWithToken"

export default function DetalleInmuebleContainer({ id }: { id: string }) {
  const [inmueble, setInmueble] = useState<Inmueble | null>(null)
  const [propietario, setPropietario] = useState<Propietario | null>(null)
  const [contratos, setContratos] = useState<ContratoDetallado[]>([])

  const [loadingInmueble, setLoadingInmueble] = useState(true)
  const [loadingPropietario, setLoadingPropietario] = useState(true)
  const [loadingContratos, setLoadingContratos] = useState(true)

  useEffect(() => {
    let isMounted = true
    setLoadingInmueble(true)

    fetchWithToken(`${BACKEND_URL}/inmuebles/${id}`)
      .then((data) => {
        if (!isMounted) return
        setInmueble(data)
        setLoadingInmueble(false)
      })
      .catch((err) => {
        console.error("Error al traer inmueble:", err)
        setLoadingInmueble(false)
      })

    return () => {
      isMounted = false
    }
  }, [id])

  useEffect(() => {
    if (!inmueble) return

    setLoadingPropietario(true)
    setLoadingContratos(true)

    const fetchPropietario = async () => {
      if (inmueble.propietarioId === -1) {
        setPropietario(null)
        setLoadingPropietario(false)
        return
      }
      try {
        const data = await fetchWithToken(`${BACKEND_URL}/propietarios/${inmueble.propietarioId}`)
        setPropietario(data)
      } catch (err) {
        console.error("Error al traer propietario:", err)
      } finally {
        setLoadingPropietario(false)
      }
    }

    const fetchContratos = async () => {
      try {
        // Primero verificar si tiene contrato vigente
        const tieneContratoVigente = await fetchWithToken(
          `${BACKEND_URL}/contratos/inmueble/${inmueble.id}/tiene-contrato-vigente`
        )
        
        // Si tiene contrato vigente, traer los contratos
        if (tieneContratoVigente) {
          const data = await fetchWithToken(`${BACKEND_URL}/contratos/inmueble/${inmueble.id}`)
          setContratos(data)
        } else {
          setContratos([])
        }
      } catch (err) {
        console.error("Error al traer contrato vigente:", err)
        setContratos([])
      } finally {
        setLoadingContratos(false)
      }
    }

    fetchPropietario()
    fetchContratos()
  }, [inmueble])

  const tipoNombre = useMemo(() => {
    if (!inmueble) return ""
    return TIPOS_INMUEBLES[inmueble.tipoInmuebleId - 1]?.nombre || ""
  }, [inmueble])

  const estadoNombre = useMemo(() => {
    if (!inmueble) return ""
    return ESTADOS_INMUEBLE[inmueble.estado - 1]?.nombre || ""
  }, [inmueble])

  if (loadingInmueble) {
    return (
      <div>
        <Loading text="Cargando datos del inmueble..." />
      </div>
    )
  }

  if (!inmueble) {
    return (
      <div className="container mx-auto px-6 py-8">
        <p>No se encontró el inmueble solicitado.</p>
      </div>
    )
  }

  return (
    <main className="container mx-auto px-6 py-8 pt-25 sm:pt-28">
      <InmuebleHeader direccion={inmueble.direccion} tipoInmuebleId={inmueble.tipoInmuebleId} tipoNombre={tipoNombre} />

      <div>
        <InmuebleDatosCard
          direccion={inmueble.direccion}
          tipoNombre={tipoNombre}
          estadoNombre={estadoNombre}
          superficie={inmueble.superficie}
        />

        {loadingPropietario ? (
          <LoadingSmall text="Cargando datos del Locador" />
        ) : (
          <PropietarioCard
            propietario={
              propietario
                ? {
                    id: propietario.id,
                    apellido: propietario.apellido,
                    nombre: propietario.nombre,
                    cuil: propietario.cuil,
                    telefono: propietario.telefono,
                    email: propietario.email,
                    direccion: propietario.direccion,
                  }
                : undefined
            }
          />
        )}

        <ContratoResumenCard
          contratos={contratos.map((c) => ({
            id: c.id,
            apellidoInquilino: c.apellidoInquilino,
            nombreInquilino: c.nombreInquilino,
            fechaInicio: c.fechaInicio,
            fechaFin: c.fechaFin,
          }))}
        />
      </div>
    </main>
  )
}
