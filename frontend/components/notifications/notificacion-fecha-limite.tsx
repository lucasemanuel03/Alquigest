"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, FileText, Handshake, Home, User } from "lucide-react"
import { fetchWithToken } from "@/utils/functions/auth-functions/fetchWithToken"
import BACKEND_URL from "@/utils/backendURL"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import LoadingSmall from "../loading-sm"

interface AlquilerNoPagado {
  idContrato: number
  idInmueble: number
  idInquilino: number
  direccion: string
  apellidoInquilino: string
  nombreInquilino: string
}

interface NotificacionFechaLimiteProps {
  onClose?: () => void
}

export default function NotificacionFechaLimite({ onClose }: NotificacionFechaLimiteProps) {
  const date = new Date()
  const diaActual = date.getDate()
  const mostrarNotificacion = diaActual === 24 || diaActual === 25

  const [alquileresNoPagados, setAlquileresNoPagados] = useState<AlquilerNoPagado[]>([])
  const [loading, setLoading] = useState(false)
  const [mostrarDetalles, setMostrarDetalles] = useState(false)

  useEffect(() => {
    const fetchAlquileresNoPagados = async () => {
      if (!mostrarNotificacion) return
      
      setLoading(true)
      try {
        const data = await fetchWithToken(`${BACKEND_URL}/alquileres/notificaciones/mes`)
        setAlquileresNoPagados(data || [])
      } catch (error) {
        console.error("Error al cargar alquileres no pagados:", error)
        setAlquileresNoPagados([])
      } finally {
        setLoading(false)
      }
    }

    fetchAlquileresNoPagados()
  }, [mostrarNotificacion])

  if(loading){
    return(
      <div>
        <LoadingSmall text="Cargando..."/>
      </div>
    )
  }

  if (!mostrarNotificacion) {
    return null
  }

  if (alquileresNoPagados.length === 0) {
    return null
  }

  return (
    <div className="">
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border-muted border-1 rounded-xl">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1">
            <p className="font-bold flex items-center gap-2">
              <Handshake className="h-5 w-5 text-yellow-600" />
              Alquileres Pendientes de Pago
            </p>
            <p className="text-sm mt-2">
              Hay{" "}
              <Badge variant="outline" className="mx-1 bg-yellow-200 text-yellow-900">
                {alquileresNoPagados.length}
              </Badge>
              {alquileresNoPagados.length === 1 ? "Locatario" : "Locatarios"} que aún no han pagado
              su alquiler este mes.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setMostrarDetalles(!mostrarDetalles)}
          className="w-full mt-2 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900 dark:hover:bg-yellow-900/50 border-yellow-300"
        >
          {mostrarDetalles ? (
            <>
              <ChevronUp className="h-4 w-4 mr-2" />
              Ocultar Detalles
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-2" />
              Ver Detalles
            </>
          )}
        </Button>

        {mostrarDetalles && (
          <div className="mt-3 space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {alquileresNoPagados.map((alquiler) => (
              <Link
                key={alquiler.idContrato}
                href={`/contratos/${alquiler.idContrato}`}
                className="block"
                onClick={onClose}
              >
                <div className="p-3 bg-white dark:bg-yellow-950/40 rounded-lg border border-muted hover:border-primary hover:shadow-md transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div className="flex gap-2 min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">
                        {alquiler.nombreInquilino} {alquiler.apellidoInquilino}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        de {alquiler.direccion}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(234, 179, 8, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(234, 179, 8, 0.7);
        }
      `}</style>
    </div>
  )
}