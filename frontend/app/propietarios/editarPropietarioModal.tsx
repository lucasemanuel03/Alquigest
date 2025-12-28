'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useState } from "react"
import ModalError from "@/components/modal-error"
import EditarClaveFiscal from "@/components/edit-clave-fiscal"
import { useEditarPropietario } from "@/hooks/useEditarPropietario"

type EditarPropietarioModalProps = {
  propietario: any
  isOpen: boolean
  onClose: () => void
  onPropietarioActualizado: (propietarioActualizado: any) => void
}

export default function EditarPropietarioModal({ propietario, isOpen, onClose, onPropietarioActualizado,} : EditarPropietarioModalProps) {
  const [editingOwner, setEditingOwner] = useState(propietario)
  const [claveFiscalActualizada, setClaveFiscalActualizada] = useState("")
  const { actualizarPropietario, desactivarPropietario, loading, error, mostrarError, setMostrarError } = useEditarPropietario()

  // Sincronizar el estado interno con la prop `propietario` cuando esta cambie
  useEffect(() => { setEditingOwner(propietario); setClaveFiscalActualizada("") }, [propietario])

  // Resetear la clave fiscal cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      setClaveFiscalActualizada("")
    }
  }, [isOpen])

const handleBajaPropietarioInmueble = async () => {
  const resultado = await desactivarPropietario(editingOwner.id)
  
  // Si no hubo error (el hook ya maneja mostrar el error)
  if (resultado !== null || !mostrarError) {
    // Crear manualmente el propietario desactivado ya que el endpoint retorna 204
    const propietarioDesactivado = {
      ...editingOwner,
      esActivo: false
    }
    onPropietarioActualizado(propietarioDesactivado)
    onClose()
  }
}

const handleUpdateOwner = async () => {
  const resultado = await actualizarPropietario(
    editingOwner.id, 
    editingOwner,
    claveFiscalActualizada
  )

  if (resultado) {
    onPropietarioActualizado(resultado)
    setClaveFiscalActualizada("") // Resetear la clave fiscal actualizada
    onClose()
  }
}

  return (
    <div>
        <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
            <DialogHeader>
            <DialogTitle>Editar Locador</DialogTitle>
            </DialogHeader>

            {editingOwner && (
            <form
                className="space-y-4"
                onSubmit={(e) => {
                e.preventDefault()
                
                if (editingOwner.esActivo == false) {
                    handleBajaPropietarioInmueble()
                }
                if(editingOwner.esActivo == true){
                  handleUpdateOwner()
              }}
              }
            >
                <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="edit-nombre">Nombre</Label>
                    <Input
                    required
                    id="edit-nombre"
                    value={editingOwner.nombre}
                    onChange={(e) => setEditingOwner({ ...editingOwner, nombre: e.target.value })}
                    />
                </div>
                <div>
                    <Label htmlFor="edit-apellido">Apellido</Label>
                    <Input
                    required
                    id="edit-apellido"
                    value={editingOwner.apellido}
                    onChange={(e) => setEditingOwner({ ...editingOwner, apellido: e.target.value })}
                    />
                </div>
                </div>

                <div>
                  <Label htmlFor="edit-cuil">CUIL</Label>
                  <Input id="edit-cuil" value={editingOwner.cuil} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground mt-1">El CUIL no se puede modificar</p>
                </div>

                <div>
                  <Label>Clave Fiscal</Label>
                  <EditarClaveFiscal 
                    propietarioId={editingOwner.id} 
                    claveFiscalEnmascarada={editingOwner.claveFiscal}
                    setClaveFiscalActualizada={setClaveFiscalActualizada}
                    claveFiscalActualizada={claveFiscalActualizada}/>
                </div>

                <div>
                  <Label htmlFor="edit-telefono">Teléfono</Label>
                  <Input
                    id="edit-telefono"
                    type="tel"
                    maxLength={15} // Limitar la longitud máxima del teléfono
                    value={editingOwner.telefono}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9()+\-\s]/g, ""); // Permitir solo números, paréntesis, guiones, + y espacios
                      setEditingOwner({ ...editingOwner, telefono: value });
                    }}
                    placeholder="(351) 445-5667"
                  />
                </div>

                <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                    required
                    id="edit-email"
                    type="email"
                    value={editingOwner.email}
                    onChange={(e) => setEditingOwner({ ...editingOwner, email: e.target.value })}
                />
                </div>

                <div>
                <Label htmlFor="edit-direccion">Dirección</Label>
                <Input
                    id="edit-direccion"
                    value={editingOwner.direccion}
                    onChange={(e) => setEditingOwner({ ...editingOwner, direccion: e.target.value })}
                />
                </div>
                <div>
                <Label htmlFor="edit-barrio">Barrio</Label>
                <Input
                    id="edit-barrio"
                    value={editingOwner.barrio}
                    onChange={(e) => setEditingOwner({ ...editingOwner, barrio: e.target.value })}
                />
                </div>

                <div>
                <Label htmlFor="edit-estado">Estado</Label>
                <Select
                    value={editingOwner.esActivo === true ? "true" : "false"}
                    onValueChange={(value) =>
                    setEditingOwner({ ...editingOwner, esActivo: value === "true" })
                    }
                >
                    <SelectTrigger>
                    <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="true">Activo</SelectItem>
                    <SelectItem value="false">Inactivo</SelectItem>
                    </SelectContent>
                </Select>
                </div>

                <div className="flex gap-2 pt-4">
                <Button 
                  type="submit" 
                  className="flex-1"
                  loading={loading}
                >
                    Guardar Cambios
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose} 
                  className="flex-1"
                  disabled={loading}
                >
                    Cancelar
                </Button>
                </div>
            </form>
            )}
        </DialogContent>
        </Dialog>

        {/* Modal de error */}
            {mostrarError && (
                <ModalError
                titulo="Error al editar Propietario"
                mensaje={error || "Error desconocido"}
                onClose={() => setMostrarError(false)} // Restablecer el estado al cerrar el modal
                />
            )}
    </div>
  )
}