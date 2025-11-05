"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { fetchWithToken } from "@/utils/functions/auth-functions/fetchWithToken";
import BACKEND_URL from "@/utils/backendURL";
import { Loader2, RefreshCcw } from "lucide-react";
import ModalConfirmacion from "@/components/modal-confirmacion";

type Estado = { id: number; nombre: string };
type MotivoCancelacion = { id: number; nombre: string };

const ESTADOS: Estado[] = [
  { id: 1, nombre: "Vigente" },
  { id: 3, nombre: "Rescindido" },
];

interface Props {
  contratoId: number;
  estadoActualId: number;
  onEstadoActualizado: (nuevoEstadoId: number) => void;
  disabled?: boolean;
}

export default function ChangeEstadoContrato({ contratoId, disabled , estadoActualId, onEstadoActualizado }: Props) {
  const [open, setOpen] = useState(false);
  const [nuevoEstadoId, setNuevoEstadoId] = useState<number>(estadoActualId);
  const [motivoCancelacionId, setMotivoCancelacionId] = useState<number>(0);
  const [observaciones, setObservaciones] = useState<string>("");
  const [motivos, setMotivos] = useState<MotivoCancelacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMotivos, setLoadingMotivos] = useState(false);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const estadoActual = ESTADOS.find(e => e.id === estadoActualId)?.nombre || "Desconocido";
  const cambioBloqueado = estadoActualId === 2 || estadoActualId === 3; // No Vigente o Cancelado
  const esRescindido = nuevoEstadoId === 3;

  // Cargar motivos de cancelación cuando se necesiten
  useEffect(() => {
    const cargarMotivos = async () => {
      if (!esRescindido || motivos.length > 0) return;
      
      try {
        setLoadingMotivos(true);
        const response = await fetchWithToken(`${BACKEND_URL}/motivos-cancelacion`);
        setMotivos(response || []);
      } catch (error) {
        console.error("Error al cargar motivos:", error);
        setError("Error al cargar motivos de cancelación");
      } finally {
        setLoadingMotivos(false);
      }
    };

    cargarMotivos();
  }, [esRescindido, motivos.length]);

  const ejecutarCambio = async () => {
    if (!nuevoEstadoId || nuevoEstadoId === estadoActualId) {
      setOpen(false);
      return;
    }

    // Validar campos requeridos para rescisión
    if (esRescindido && (!motivoCancelacionId || !observaciones.trim())) {
      setError("Motivo y observaciones son requeridos para rescindir el contrato");
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      const body = esRescindido ? {
        estadoContratoId: nuevoEstadoId,
        motivoCancelacionId: motivoCancelacionId,
        observaciones: observaciones.trim()
      } : {
        estadoContratoId: nuevoEstadoId
      };

      await fetchWithToken(`${BACKEND_URL}/contratos/${contratoId}/estado`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      
      // Solo actualizar si el cambio fue exitoso en el backend
      onEstadoActualizado(nuevoEstadoId);
      setShowConfirm(false);
      setOpen(false);
      // Limpiar campos al cerrar exitosamente
      resetearCampos();
    } catch (e: any) {
      setError(e.message || "Error al actualizar estado");
    } finally {
      setLoading(false);
    }
  };

  const resetearCampos = () => {
    setMotivoCancelacionId(0);
    setObservaciones("");
    setError("");
  };

  const handleGuardar = () => {
    // Validar antes de mostrar confirmación
    if (!nuevoEstadoId || nuevoEstadoId === estadoActualId) {
      setOpen(false);
      return;
    }

    if (esRescindido && (!motivoCancelacionId || !observaciones.trim())) {
      setError("Motivo y observaciones son requeridos para rescindir el contrato");
      return;
    }

    setShowConfirm(true);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (cambioBloqueado) return;
    setOpen(isOpen);
    if (isOpen) {
      setNuevoEstadoId(estadoActualId);
      resetearCampos();
    }
  };

  const estadoNuevoNombre = ESTADOS.find(e => e.id === nuevoEstadoId)?.nombre || "(desconocido)";
  const puedeGuardar = nuevoEstadoId !== estadoActualId && (!esRescindido || (motivoCancelacionId && observaciones.trim()));

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button
            size="sm"
            className="gap-1"
            disabled={cambioBloqueado || disabled}
            title={cambioBloqueado ? "No se puede cambiar estado cuando el contrato está No Vigente o Cancelado" : "Cambiar estado"}
          >
            <RefreshCcw className="h-4 w-4" /> Cambiar Estado
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cambiar Estado del Contrato</DialogTitle>
            <p className="text-sm text-muted-foreground">Estado actual: <span className="font-medium">{estadoActual}</span></p>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Nuevo Estado</Label>
              <Select value={String(nuevoEstadoId)} onValueChange={(v) => setNuevoEstadoId(Number(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS.map(e => (
                    <SelectItem key={e.id} value={String(e.id)}>{e.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Campos adicionales para Rescindido */}
            {esRescindido && (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Motivo de Rescisión *</Label>
                  {loadingMotivos ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Cargando motivos...
                    </div>
                  ) : (
                    <Select value={motivoCancelacionId.toString()} onValueChange={(v) => setMotivoCancelacionId(Number(v))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar motivo" />
                      </SelectTrigger>
                      <SelectContent>
                        {motivos.map(motivo => (
                          <SelectItem key={motivo.id} value={String(motivo.id)}>{motivo.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Observaciones *</Label>
                  <Textarea
                    placeholder="Ingrese las observaciones sobre la rescisión..."
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancelar</Button>
            <Button onClick={handleGuardar} disabled={loading || !puedeGuardar}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin"/>}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      
      <ModalConfirmacion
        open={showConfirm}
        titulo="Confirmar cambio de estado"
        mensaje={`¿Está seguro/a de cambiar el contrato a ${estadoNuevoNombre}?${esRescindido ? '\n\nEsta acción no se puede deshacer.' : ''}`}
        onConfirm={() => {
          setShowConfirm(false);
          ejecutarCambio();
        }}
        onCancel={() => {
          setShowConfirm(false);
        }}
      />
    </>
  );
}
