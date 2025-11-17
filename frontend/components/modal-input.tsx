'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"

type ModalInputProps = {
  titulo: string
  descripcion?: string
  label: string
  placeholder?: string
  type?: "text" | "password" | "email" | "number"
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (value: string) => void
  onCancel?: () => void
  textoConfirmar?: string
  textoCancelar?: string
}

export default function ModalInput({ 
  titulo, 
  descripcion,
  label,
  placeholder = "",
  type = "text",
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar"
}: ModalInputProps) {
  const [value, setValue] = useState("")

  const handleClose = () => {
    setValue("")
    onOpenChange(false)
    if (onCancel) onCancel()
  }

  const handleConfirm = () => {
    if (value.trim()) {
      onConfirm(value)
      setValue("")
      onOpenChange(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && value.trim()) {
      handleConfirm()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
      <DialogContent 
        className="flex flex-col gap-3" 
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-foreground font-bold">{titulo}</DialogTitle>
        </DialogHeader>
        
        {descripcion && (
          <p className="font-sans text-sm text-muted-foreground">{descripcion}</p>
        )}

        <div className="space-y-2 mt-3">
          <Label htmlFor="modal-input">{label}</Label>
          <Input
            id="modal-input"
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        </div>

        <DialogFooter className="flex gap-2">
          <Button onClick={handleClose} variant="outline">
            {textoCancelar}
          </Button>
          <Button onClick={handleConfirm} disabled={!value.trim()}>
            {textoConfirmar}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
