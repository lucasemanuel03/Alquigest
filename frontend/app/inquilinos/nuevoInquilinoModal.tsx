'use client'

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import BACKEND_URL from "@/utils/backendURL"
import ModalError from "@/components/modal-error"
import { fetchWithToken } from "@/utils/functions/auth-functions/fetchWithToken"
import { useAuth } from "@/contexts/AuthProvider"


type NuevoInquilinoModalProps = {
  text?: string
  disabled?: boolean
  onInquilinoCreado?: (nuevo: any) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
  showTrigger?: boolean
}

export default function NuevoInquilinoModal({ text = "Nuevo Locatario", onInquilinoCreado, disabled, open, onOpenChange, showTrigger = true }: NuevoInquilinoModalProps) {

  const { hasPermission, hasRole, user } = useAuth();

  const [errorCarga, setErrorCarga] = useState("")
  const [mostrarError, setMostrarError] = useState(false)
  const [loadingCreacion, setLoadingCreacion] = useState(false) // nuevo estado para loading
  const [isNuevoInquilinoOpen, setIsNuevoInquilinoOpen] = useState(false)
  const isControlled = open !== undefined
  const isOpen = isControlled ? !!open : isNuevoInquilinoOpen
  const setOpenSafe = (value: boolean) => {
    if (isControlled) {
      onOpenChange?.(value)
    } else {
      setIsNuevoInquilinoOpen(value)
    }
  }
  const [nuevoInquilino, setNuevoInquilino] = useState({
    nombre: "",
    apellido: "",
    cuil: "",
    telefono: "",
    esActivo: "true",
    direccion: "",
    barrio: ""
  })
  const [puedeCrear, setPuedeCrear] = useState(false)

  // Verificar permisos solo en cliente y después de montar
  useEffect(() => {
    setPuedeCrear(hasPermission("crear_inquilino"));
  }, []);

  const handleNuevoInquilino = async () => {
    setLoadingCreacion(true); // Activar loading
    try {
      const response = await fetchWithToken(`${BACKEND_URL}/inquilinos`, {
        method: "POST",
        body: JSON.stringify(nuevoInquilino),
      });

      const jsonNuevoInquilino = await response

      
      if (onInquilinoCreado) {
        onInquilinoCreado(jsonNuevoInquilino)
      }

      // Limpiar form y cerrar modal
      setNuevoInquilino({
        nombre: "",
        apellido: "",
        cuil: "",
        telefono: "",
        esActivo: "true",
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
  <div className="">
    <Dialog open={isOpen} onOpenChange={setOpenSafe}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button disabled={!puedeCrear || disabled}> 
            <Plus/>
            {text}
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Nuevo Locatario</DialogTitle>
        </DialogHeader>

        {/* FORMULARIO */}
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            handleNuevoInquilino()
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                maxLength={50}
                required
                value={nuevoInquilino.nombre}
                onChange={(e) =>
                  setNuevoInquilino({ ...nuevoInquilino, nombre: e.target.value })
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
                value={nuevoInquilino.apellido}
                onChange={(e) =>
                  setNuevoInquilino({ ...nuevoInquilino, apellido: e.target.value })
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
              value={nuevoInquilino.cuil}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 13)
                setNuevoInquilino({ ...nuevoInquilino, cuil: value })
              }}
              placeholder="Ej. 20-12345678-0"
            />
          </div>

            <div>
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                type="tel"
                maxLength={12}
                value={nuevoInquilino.telefono}
                onChange={(e) =>{
                  const value = e.target.value.replace(/[^0-9()+-\s]/g, "");
                  setNuevoInquilino({ ...nuevoInquilino, telefono: value })
                }}
                placeholder="351-4455667"
              />
            </div>

            <div>
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                required
                maxLength={50}
                value={nuevoInquilino.direccion}
                onChange={(e) =>
                  setNuevoInquilino({ ...nuevoInquilino, direccion: e.target.value })
                }
                placeholder="Ingrese la dirrección del domicilio real"
              />
            </div>
                        <div>
              <Label htmlFor="barrio">Barrio</Label>
              <Input
                id="barrio"
                required
                maxLength={50}
                value={nuevoInquilino.barrio}
                onChange={(e) =>
                  setNuevoInquilino({ ...nuevoInquilino, barrio: e.target.value })
                }
                placeholder="Ingrese el barrio del domicilio real"
              />
            </div>

          <div className="flex gap-2 pt-4">
            <Button 
              type="submit" 
              className="flex-1"
              loading={loadingCreacion}
            >
              Registrar Locatario
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenSafe(false)}
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
              titulo="Error al crear Inquilino"
              mensaje={errorCarga}
              onClose={() => setMostrarError(false)} // Restablecer el estado al cerrar el modal
            />
          )}
  </div>
)}