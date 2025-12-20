'use client'

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import BACKEND_URL from "@/utils/backendURL"
import ModalError from "@/components/modal-error"
import { fetchWithToken } from "@/utils/functions/auth-functions/fetchWithToken"
import auth from "@/utils/functions/auth-functions/auth"
import { useAuth } from "@/contexts/AuthProvider"


type NuevoPropietarioModalProps = {
  text?: string
  disabled?: boolean
  onPropietarioCreado?: (nuevo: any) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
  showTrigger?: boolean
}

export default function NuevoPropietarioModal(props: NuevoPropietarioModalProps) {

  const { hasPermission, hasRole, user } = useAuth();

  const { text = "Nuevo Locador", onPropietarioCreado, disabled, open, onOpenChange, showTrigger = true } = props;
  const [errorCarga, setErrorCarga] = useState("")
  const [mostrarError, setMostrarError] = useState(false)
  const [loadingCreacion, setLoadingCreacion] = useState(false) // nuevo estado para loading
  const [isNuevoPropietarioOpen, setIsNuevoPropietarioOpen] = useState(false)
  const isControlled = open !== undefined
  const isOpen = isControlled ? !!open : isNuevoPropietarioOpen
  const setOpenSafe = (value: boolean) => {
    if (isControlled) {
      onOpenChange?.(value)
    } else {
      setIsNuevoPropietarioOpen(value)
    }
  }
  const [nuevoPropietario, setNuevoPropietario] = useState({
    nombre: "",
    apellido: "",
    cuil: "",
    claveFiscal: "",
    telefono: "",
    email: "",
    direccion: "",
    barrio: ""
  })
  const [puedeCrear, setPuedeCrear] = useState(false)

  useEffect(() => {
    setPuedeCrear(hasPermission("crear_propietario"));
  }, []);

  const handleNuevoPropietario = async () => {
    setLoadingCreacion(true); // Activar loading
    try {
      const response = await fetchWithToken(`${BACKEND_URL}/propietarios`, {
        method: "POST",
        body: JSON.stringify(nuevoPropietario),
      })

      const jsonNuevoPropietario = await response

      if (onPropietarioCreado) {
        onPropietarioCreado(jsonNuevoPropietario)
      }

      // Limpiar form y cerrar modal
      setNuevoPropietario({
        nombre: "",
        apellido: "",
        cuil: "",
        claveFiscal: "",
        telefono: "",
        email: "",
        direccion: "",
        barrio: ""
      })
  setOpenSafe(false)
    } catch (error) {
      console.error("Error al crear propietario:", error)
      const mensajeError = (error instanceof Error && error.message) ? error.message : "Error al conectarse al servidor";
      setErrorCarga(mensajeError)
      setMostrarError(true) // Mostrar el modal de error
    } finally {
      setLoadingCreacion(false); // Desactivar loading
    }
  }

  return (
    <div>
      <Dialog open={isOpen} onOpenChange={setOpenSafe}>
        {showTrigger && (
          <DialogTrigger asChild>
            <Button 
              type="button"
              disabled={!puedeCrear || disabled}
              onClick={(e) => e.stopPropagation()}
            > 
              <Plus />
              {text}
            </Button>
          </DialogTrigger>
        )}

        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Nuevo Locador</DialogTitle>
          </DialogHeader>

          {/* FORMULARIO */}
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation() // Evitar que se propague al formulario padre
              handleNuevoPropietario()
            }}
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  required
                  maxLength={50}
                  value={nuevoPropietario.nombre}
                  onChange={(e) =>
                    setNuevoPropietario({ ...nuevoPropietario, nombre: e.target.value })
                  }
                  placeholder="Nombre"
                />
              </div>

              <div>
                <Label htmlFor="apellido">Apellido</Label>
                <Input
                  id="apellido"
                  required
                  maxLength={50}
                  value={nuevoPropietario.apellido}
                  onChange={(e) =>
                    setNuevoPropietario({ ...nuevoPropietario, apellido: e.target.value })
                  }
                  placeholder="Apellido"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="cuil">CUIL</Label>
              <Input
                id="cuil"
                type="text"
                required
                minLength={8}
                maxLength={14}
                value={nuevoPropietario.cuil}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 13)
                  setNuevoPropietario({ ...nuevoPropietario, cuil: value })
                }}
                placeholder="Ej. 20-12345678-0"
              />
          </div>

          <div>
              <Label htmlFor="clave-fiscal">Clave Fiscal</Label>
              <Input
                id="clave-fiscal"
                type="text"
                minLength={8}
                maxLength={64}
                value={nuevoPropietario.claveFiscal}
                onChange={(e) => {
                  setNuevoPropietario({ ...nuevoPropietario, claveFiscal: e.target.value})
                }}
                placeholder="Opcional, ingrese la clave fiscal del Locador"
              />
          </div>

            <div>
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                type="tel"
                maxLength={15} // Limitar la longitud máxima del teléfono
                value={nuevoPropietario.telefono}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9()+-\s]/g, ""); // Permitir solo números, guiones, paréntesis y espacios
                  setNuevoPropietario({ ...nuevoPropietario, telefono: value });
                }}
                placeholder="(351) 4455667"
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                required
                maxLength={50}
                type="email"
                value={nuevoPropietario.email}
                onChange={(e) =>
                  setNuevoPropietario({ ...nuevoPropietario, email: e.target.value })
                }
                placeholder="email@ejemplo.com"
              />
            </div>

            <div>
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                required
                maxLength={50}
                value={nuevoPropietario.direccion}
                onChange={(e) =>
                  setNuevoPropietario({ ...nuevoPropietario, direccion: e.target.value })
                }
                placeholder="Calle, número"
              />
            </div>
            <div>
              <Label htmlFor="barrio">Barrio</Label>
              <Input
                id="barrio"
                required
                maxLength={50}
                value={nuevoPropietario.barrio}
                onChange={(e) =>
                  setNuevoPropietario({ ...nuevoPropietario, barrio: e.target.value })
                }
                placeholder="Ingrese el barrio"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                type="submit" 
                className="flex-1"
                loading={loadingCreacion}
              >
                Registrar Locador
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation() // Evitar propagación
                  setOpenSafe(false)
                }}
                className="flex-1"
                disabled={loadingCreacion}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de error */}
      {mostrarError && (
        <ModalError
          titulo="Error al crear Propietario"
          mensaje={errorCarga}
          onClose={() => setMostrarError(false)} // Restablecer el estado al cerrar el modal
        />
      )}
    </div>
  )
}