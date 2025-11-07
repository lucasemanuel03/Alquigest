"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save, Building2, Calendar, User, DollarSign, AlertCircle } from "lucide-react"
import { ContratoDetallado } from "@/types/ContratoDetallado"
import { PagoAlquiler } from "@/types/PagoAlquiler"
import { fetchWithToken } from "@/utils/functions/auth-functions/fetchWithToken"
import BACKEND_URL from "@/utils/backendURL"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Loading from "@/components/loading-sm"
import ModalDefault from "@/components/modal-default"

interface ModalRegistrarPagoAlquilerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contrato: ContratoDetallado
  onPagoRegistrado?: () => void
}

export default function ModalRegistrarPagoAlquiler({
  open,
  onOpenChange,
  contrato,
  onPagoRegistrado
}: ModalRegistrarPagoAlquilerProps) {
  
  const [pagosPendientes, setPagosPendientes] = useState<PagoAlquiler[]>([])
  const [pagoSeleccionado, setPagoSeleccionado] = useState<PagoAlquiler | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  // Estado para el modal de mensajes de error
  const [modalError, setModalError] = useState<{ titulo: string; mensaje: string } | null>(null)
  
  // Estado para el modal de confirmación
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false)
  
  const [formData, setFormData] = useState({
    cuentaBanco: "",
    titularDePago: "",
    metodo: ""
  })

  // Fetch pagos pendientes cuando se abre el modal
  useEffect(() => {
    if (open && contrato?.id) {
      fetchPagosPendientes()
    }
  }, [open, contrato?.id])

  const fetchPagosPendientes = async () => {
    setLoading(true)
    try {
      const data = await fetchWithToken(`${BACKEND_URL}/alquileres/contrato/${contrato.id}/pendientes`)
      console.log("Pagos pendientes del backend:", data)
      setPagosPendientes(data)
      
      // Seleccionar el primer pago por defecto
      if (data && data.length > 0) {
        const primerPago = data[0]
        setPagoSeleccionado(primerPago)
        
        // Precargar datos si existen
        setFormData({
          cuentaBanco: primerPago.cuentaBanco || "",
          titularDePago: primerPago.titularDePago || "",
          metodo: primerPago.metodo || ""
        })
      }
    } catch (err: any) {
      console.error("Error al traer pagos pendientes:", err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSeleccionPago = (pago: PagoAlquiler) => {
    setPagoSeleccionado(pago)
    setFormData({
      cuentaBanco: pago.cuentaBanco || "",
      titularDePago: pago.titularDePago || "",
      metodo: pago.metodo || ""
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!pagoSeleccionado) {
      setModalError({
        titulo: "Error",
        mensaje: "Por favor seleccione un pago"
      })
      return
    }
    
    // Validaciones básicas
    if ( !formData.titularDePago || !formData.metodo) {
      setModalError({
        titulo: "Error",
        mensaje: "Por favor complete todos los campos obligatorios"
      })
      return
    }

    // Mostrar modal de confirmación
    setMostrarConfirmacion(true)
  }

  const confirmarRegistroPago = async () => {
    if (!pagoSeleccionado) return

    setSubmitting(true)
    
    try {
      await fetchWithToken(`${BACKEND_URL}/alquileres/${pagoSeleccionado.id}/pagar`, {
        method: "PATCH",
        body: JSON.stringify({
          cuentaBanco: formData.cuentaBanco,
          titularDePago: formData.titularDePago,
          metodo: formData.metodo
        })
      })
      
      // Cerrar ambos modales
      setMostrarConfirmacion(false)
      onOpenChange(false)
      
      // Callback opcional para refrescar datos
      if (onPagoRegistrado) {
        onPagoRegistrado()
      }
    } catch (err: any) {
      console.error("Error al registrar el pago:", err.message)
      setMostrarConfirmacion(false)
      setModalError({
        titulo: "Error",
        mensaje: `Error al registrar el pago: ${err.message}`
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Reset cuando se cierra el modal
  useEffect(() => {
    if (!open) {
      setPagosPendientes([])
      setPagoSeleccionado(null)
      setFormData({
        cuentaBanco: "",
        titularDePago: "",
        metodo: ""
      })
    }
  }, [open])

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-green-600" />
              Pago de Alquiler
            </DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="py-8">
              <Loading />
            </div>
          ) : pagosPendientes.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No hay pagos pendientes para este contrato.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Información del contrato */}
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <div className="font-bold flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Contrato Nro. {contrato.id} - {contrato.direccionInmueble}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Locatario</p>
                    <p className="font-semibold">
                      {contrato.apellidoInquilino}, {contrato.nombreInquilino}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Locador</p>
                    <p className="font-semibold">
                      {contrato.apellidoPropietario}, {contrato.nombrePropietario}
                    </p>
                  </div>
                </div>
              </div>

              {/* Información del pago seleccionado */}
              {pagoSeleccionado && (
                <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Monto del Alquiler</p>
                      <p className="font-bold text-lg">
                        ${pagoSeleccionado.monto.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Vencimiento</p>
                      <div className="flex items-center gap-1 font-semibold">
                        <Calendar className="h-4 w-4" />
                        {new Date(pagoSeleccionado.fechaVencimientoPago).toLocaleDateString('es-AR')}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Selector de pagos pendientes si hay más de uno */}
              {pagosPendientes.length > 1 && (
                <div className="space-y-2">
                  <Label className="text-base font-semibold">
                    Seleccionar Pago ({pagosPendientes.length} pendientes)
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {pagosPendientes.map((pago) => (
                      <div
                        key={pago.id}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          pagoSeleccionado?.id === pago.id
                            ? 'border-green-600 bg-green-50 dark:bg-green-950'
                            : 'border-border hover:border-primary'
                        }`}
                        onClick={() => handleSeleccionPago(pago)}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-medium">Pago #{pago.id}</span>
                          {pagoSeleccionado?.id === pago.id && (
                            <span className="text-green-600 text-xs font-bold">✓</span>
                          )}
                        </div>
                        <p className="text-sm font-bold text-green-600">
                          ${pago.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(pago.fechaVencimientoPago).toLocaleDateString('es-AR')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Formulario */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Método de Pago */}
                  <div className="space-y-2">
                    <Label htmlFor="metodo">
                      Método de Pago <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.metodo}
                      onValueChange={(value) => handleChange("metodo", value)}
                      required
                    >
                      <SelectTrigger id="metodo">
                        <SelectValue placeholder="Seleccione un método" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Débito">Débito</SelectItem>
                        <SelectItem value="Transferencia">Transferencia bancaria</SelectItem>
                        <SelectItem value="Efectivo">Efectivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Cuenta de Banco */}
                  <div className="space-y-2">
                    <Label htmlFor="cuentaBanco">
                      Cuenta de Banco <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="cuentaBanco"
                      type="text"
                      placeholder="Número de cuenta o CBU"
                      value={formData.cuentaBanco}
                      onChange={(e) => handleChange("cuentaBanco", e.target.value)}
                    />
                  </div>

                  {/* Titular del Pago */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="titularDePago">
                      Titular del Pago <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="titularDePago"
                        type="text"
                        placeholder="Nombre completo del titular"
                        value={formData.titularDePago}
                        onChange={(e) => handleChange("titularDePago", e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Nota informativa */}
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    <strong>Nota:</strong> Los datos mostrados provienen del sistema y pueden ser editados.
                    Verifique que toda la información sea correcta antes de registrar.
                  </p>
                </div>

                {/* Botones de acción */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={submitting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700"
                    disabled={submitting}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {submitting ? "Registrando..." : "Registrar Pago"}
                  </Button>
                </div>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de mensajes de error */}
      {modalError && (
        <ModalDefault
          titulo={modalError.titulo}
          mensaje={modalError.mensaje}
          onClose={() => setModalError(null)}
        />
      )}

      {/* Modal de confirmación */}
      {mostrarConfirmacion && pagoSeleccionado && (
        <Dialog open={mostrarConfirmacion} onOpenChange={setMostrarConfirmacion}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
                ¿Los datos ingresados son correctos?
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Resumen del pago */}
              <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Monto</p>
                    <p className="font-bold text-green-600">
                      ${pagoSeleccionado.monto.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-3 space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Método de Pago</p>
                    <p className="font-semibold">{formData.metodo}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Cuenta de Banco</p>
                    <p className="font-semibold">{formData.cuentaBanco}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Titular del Pago</p>
                    <p className="font-semibold">{formData.titularDePago}</p>
                  </div>
                </div>
              </div>

              {/* Advertencia */}
              <Alert className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-900 dark:text-yellow-100">
                  Verifique que todos los datos sean correctos antes de confirmar el registro del pago.
                </AlertDescription>
              </Alert>
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setMostrarConfirmacion(false)}
                disabled={submitting}
              >
                Volver
              </Button>
              <Button
                type="button"
                className="bg-green-600 hover:bg-green-700"
                onClick={confirmarRegistroPago}
                disabled={submitting}
              >
                <Save className="h-4 w-4 mr-2" />
                {submitting ? "Registrando..." : "Registrar Pago"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
