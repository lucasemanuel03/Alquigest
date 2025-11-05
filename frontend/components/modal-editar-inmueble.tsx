'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ESTADOS_INMUEBLE, ESTADOS_INMUEBLE_EDIT, TIPOS_INMUEBLES } from "@/utils/constantes"
import { Propietario } from "@/types/Propietario"
import React, { useState } from "react"

// Tipo local para el estado de edición, permitiendo strings en selects/inputs
export type EditingInmueble = {
  id?: number
  propietarioId: string | number
  direccion: string
  tipoInmuebleId: string | number
  estado: string | number
  superficie: string | number
  esAlquilado: boolean
  esActivo: boolean
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingInmueble: EditingInmueble
  setEditingInmueble: React.Dispatch<React.SetStateAction<any>>
  propietarios: Propietario[]
  onSubmit: () => Promise<void> | void
}

export default function ModalEditarInmueble({
  open,
  onOpenChange,
  editingInmueble,
  setEditingInmueble,
  propietarios,
  onSubmit,
}: Props) {
  const [submitting, setSubmitting] = useState(false)
  const propietarioTexto = React.useMemo(() => {
    const prop = propietarios.find((p) => p.id.toString() === editingInmueble.propietarioId?.toString())
    return prop ? `${prop.nombre} ${prop.apellido}` : "Desconocido"
  }, [propietarios, editingInmueble.propietarioId]) // nuevo estado para loading

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Inmueble</DialogTitle>
        </DialogHeader>

        {editingInmueble && (
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault()
              try {
                setSubmitting(true)
                await onSubmit()
              } finally {
                setSubmitting(false)
              }
            }}
          >
            <div>
              <Label htmlFor="edit-direccion">Dirección</Label>
              <Input
                id="edit-direccion"
                value={editingInmueble.direccion}
                onChange={(e) =>
                  setEditingInmueble({ ...editingInmueble, direccion: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="edit-propietario">Propietario</Label>
              <Input id="edit-propietario" value={propietarioTexto} disabled className="bg-muted" />
            </div>

            <div>
              <Label htmlFor="edit-superficie">Superficie</Label>
              <Input
                id="edit-superficie"
                type="number"
                min={0}
                max={1000}
                value={editingInmueble.superficie as any}
                onChange={(e) =>
                  setEditingInmueble({ ...editingInmueble, superficie: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="edit-tipoInmueble">Tipo de Inmueble</Label>
              <Select
                disabled={!!editingInmueble.esAlquilado}
                value={(editingInmueble.tipoInmuebleId ?? "").toString()}
                onValueChange={(value) =>
                  setEditingInmueble({ ...editingInmueble, tipoInmuebleId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo de inmueble" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_INMUEBLES.map((tipo) => (
                    <SelectItem key={tipo.id} value={tipo.id.toString()} className="overflow-auto text-ellipsis">
                      {tipo.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-estado">Estado</Label>
              <Select
                disabled={!!editingInmueble.esAlquilado}
                value={(editingInmueble.estado ?? "").toString()}
                onValueChange={(value) => setEditingInmueble({ ...editingInmueble, estado: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  {(editingInmueble.esAlquilado ? ESTADOS_INMUEBLE : ESTADOS_INMUEBLE_EDIT).map(
                    (estado) => (
                      <SelectItem key={estado.id} value={estado.id.toString()} className="overflow-auto text-ellipsis">
                        {estado.nombre}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1" loading={submitting} disabled={submitting}>
                Guardar Cambios
              </Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Cancelar
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
