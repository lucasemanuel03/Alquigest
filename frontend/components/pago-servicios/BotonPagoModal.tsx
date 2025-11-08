"use client"

import { ReactElement, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import formatPrice from "@/utils/functions/price-convert"
import LoadingSmall from "../loading-sm"

export interface PagoResumenItem {
  id: number | string
  titulo: string
  subtitulo?: string
  monto?: number
}

interface BotonPagoModalProps {
  triggerLabel: string
  items: PagoResumenItem[]
  onConfirm: () => Promise<void> | void
  title?: string
  description?: string
  confirmLabel?: string
  iconLabel?: ReactElement
  cancelLabel?: string
  isDisabled?: boolean
  triggerVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  className?: string
}

export default function BotonPagoModal({
  triggerLabel,
  items,
  onConfirm,
  title = "Confirmar pago",
  description = "Revisá los datos antes de confirmar.",
  confirmLabel = "Confirmar pago",
  iconLabel = <></>,
  cancelLabel = "Cancelar",
  isDisabled = false,
  triggerVariant = "default",
  className,
}: BotonPagoModalProps) {
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const handleOpen = () => {
    if (isDisabled) return
    setOpen(true)
  }

  const handleConfirm = async () => {
    try {
      setConfirming(true)
      await onConfirm()
      setOpen(false)
    } finally {
      setConfirming(false)
    }
  }

  return (
    <>
      <Button onClick={handleOpen} disabled={isDisabled} variant={triggerVariant} className={className}>
        {triggerLabel}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto space-y-3 py-2">
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay ítems para pagar.</p>
            ) : (
              items.map((it) => (
                <div key={it.id} className="flex items-center justify-between border rounded-md p-2">
                  <div>
                    <p className="font-medium leading-none">{it.titulo}</p>
                    {it.subtitulo && (
                      <p className="text-xs text-muted-foreground mt-1">{it.subtitulo}</p>
                    )}
                  </div>
                  {typeof it.monto === "number" && (
                    <div className="text-sm font-semibold">{formatPrice(it.monto)}</div>
                  )}
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={confirming}>
              {cancelLabel}
            </Button>
            <Button
              loading={confirming} 
              className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2" 
              onClick={handleConfirm} 
              disabled={confirming || items.length === 0}>
                {iconLabel}
                {confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
