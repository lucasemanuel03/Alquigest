"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Blocks, Save, Edit } from "lucide-react";
import { ServicioContrato } from "@/types/ServicioContrato";
import { fetchWithToken } from "@/utils/functions/auth-functions/fetchWithToken";
import BACKEND_URL from "@/utils/backendURL";
import ModalError from "@/components/modal-error";
import ModalDefault from "@/components/modal-default";
import ServicioCard from "./nuevo/ServicioCard";
import { fechaActualValida } from "@/utils/functions/fechas";
import LoadingSmall from "../loading-sm";

interface ModalEditarServiciosProps {
  contratoId: number;
  fechaInicioContrato: string;
  onServiciosActualizados?: () => void;
  disabled: boolean;
}

const serviciosInicial: ServicioContrato[] = [
  { tipoServicioId: 1, nroCuenta: null, contratoId: null, nroContrato: '', esDeInquilino: true, esActivo: false, esAnual: false, fechaInicio: '', nroContratoServicio: null }, // Agua
  { tipoServicioId: 2, nroCuenta: null, contratoId: null, nroContrato: '', esDeInquilino: true, esActivo: false, esAnual: false, fechaInicio: '', nroContratoServicio: null }, // Luz
  { tipoServicioId: 3, nroCuenta: null, contratoId: null, nroContrato: '', esDeInquilino: true, esActivo: false, esAnual: false, fechaInicio: '', nroContratoServicio: null }, // Gas
  { tipoServicioId: 4, nroCuenta: null, contratoId: null, nroContrato: '', esDeInquilino: true, esActivo: false, esAnual: true, fechaInicio: '', nroContratoServicio: null },  // Municipal
  { tipoServicioId: 5, nroCuenta: null, contratoId: null, nroContrato: '', esDeInquilino: true, esActivo: false, esAnual: true, fechaInicio: '', nroContratoServicio: null },  // Otros
];

export default function ModalEditarServicios({ contratoId, fechaInicioContrato, onServiciosActualizados, disabled = false }: ModalEditarServiciosProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [serviciosContrato, setServiciosContrato] = useState<ServicioContrato[]>(serviciosInicial);
  const [serviciosOriginales, setServiciosOriginales] = useState<any[]>([]); // Para comparar cambios
  const [serviciosExistentesIds, setServiciosExistentesIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorCarga, setErrorCarga] = useState("");
  const [mostrarError, setMostrarError] = useState(false);
  const [mostrarExito, setMostrarExito] = useState(false);

  // Cargar servicios existentes cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchServiciosExistentes();
    }
  }, [isOpen, contratoId]);

  const fetchServiciosExistentes = async () => {
    try {
      const data = await fetchWithToken(`${BACKEND_URL}/servicios-contrato/contrato/${contratoId}`);
      console.log("Servicios existentes:", data);
      
      // Guardar los servicios originales para comparar después
      setServiciosOriginales(data);
      
      // Guardar los servicios existentes completos para tener sus IDs
      const serviciosExistentesMap = new Map(
        data.map((s: any) => [s.tipoServicio.id, s])
      );
      
      // Mapear los servicios existentes a la estructura del formulario
      const serviciosFormateados = serviciosInicial.map(servicioBase => {
        const servicioExistente: any = serviciosExistentesMap.get(servicioBase.tipoServicioId);
        
        if (servicioExistente) {
          return {
            id: servicioExistente.id, // Importante: guardar el ID del servicio
            tipoServicioId: servicioBase.tipoServicioId,
            nroCuenta: servicioExistente.nroCuenta || "",
            contratoId: servicioExistente.contratoId,
            nroContrato: servicioExistente.nroContrato || contratoId.toString(),
            esDeInquilino: servicioExistente.esDeInquilino,
            esActivo: servicioExistente.esActivo,
            esAnual: servicioExistente.esAnual,
            fechaInicio: servicioExistente.fechaInicio || fechaInicioContrato,
          };
        }
        
        return {
          ...servicioBase,
          nroContrato: contratoId.toString(),
          fechaInicio: fechaInicioContrato,
        };
      });
      
      setServiciosContrato(serviciosFormateados as any);
      
      // Guardar los IDs de tipos de servicios que ya existen
      const idsExistentes: number[] = Array.from(serviciosExistentesMap.keys()) as number[];
      setServiciosExistentesIds(idsExistentes);
      setLoading(false);
    } catch (err) {
      console.error("Error al cargar servicios:", err);
      setErrorCarga("Error al cargar los servicios del contrato");
      setMostrarError(true);
    }
  };

  const handleGuardarServicios = async () => {
    setLoading(true);
    try {
      const errores: string[] = [];
      
      // 1. Crear servicios nuevos (no existían antes y ahora están activos)
      const serviciosNuevos = serviciosContrato
        .filter(servicio => servicio.esActivo && !serviciosExistentesIds.includes(servicio.tipoServicioId))
        .map(servicio => ({
          contratoId: contratoId,
          tipoServicioId: servicio.tipoServicioId,
          nroCuenta: servicio.nroCuenta || "",
          nroContratoServicio: servicio.nroContratoServicio || "",
          nroContrato: contratoId.toString(),
          esDeInquilino: servicio.esDeInquilino,
          esAnual: servicio.esAnual,
          fechaInicio: fechaActualValida(),
        }));

      if (serviciosNuevos.length > 0) {
        try {
          await fetchWithToken(`${BACKEND_URL}/servicios-contrato`, {
            method: "POST",
            body: JSON.stringify(serviciosNuevos),
          });
          console.log(`✅ ${serviciosNuevos.length} servicios nuevos creados exitosamente`);
        } catch (error: any) {
          console.error("❌ Error al crear servicios nuevos:", error);
          errores.push("Error al crear servicios nuevos");
        }
      }

      // 2. Actualizar servicios existentes
      const serviciosExistentesParaActualizar = serviciosContrato.filter(servicio => 
        serviciosExistentesIds.includes(servicio.tipoServicioId) && (servicio as any).id
      );

      for (const servicio of serviciosExistentesParaActualizar) {
        const servicioId = (servicio as any).id;
        
        // Buscar el servicio original para comparar
        const original = serviciosOriginales.find((s: any) => s.id === servicioId);
        
        if (!original) continue;

        // A. Si cambió el estado activo/inactivo
        if (original.esActivo !== servicio.esActivo) {
          try {
            if (servicio.esActivo) {
              // Reactivar: ahora requiere fechaInicio en el body (YYYY-MM-DD)
              await fetchWithToken(`${BACKEND_URL}/servicios-contrato/${servicioId}/reactivar`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fechaInicio: fechaActualValida() }),
              });
              console.log(`✅ Servicio ${servicioId} reactivado exitosamente`);
            } else {
              // Desactivar: sin body
              await fetchWithToken(`${BACKEND_URL}/servicios-contrato/${servicioId}/desactivar`, {
                method: "PUT",
              });
              console.log(`✅ Servicio ${servicioId} desactivado exitosamente`);
            }
          } catch (error: any) {
            console.error(`❌ Error al cambiar estado del servicio ${servicioId}:`, error);
            errores.push(`Error al ${servicio.esActivo ? 'reactivar' : 'desactivar'} servicio`);
          }
        }

        // B. Si cambió algún dato (nroCuenta, nroContratoServicio, esDeInquilino, esAnual)
        const cambiosDatos = 
          original.nroCuenta !== servicio.nroCuenta ||
          original.nroContratoServicio !== servicio.nroContratoServicio ||
          original.esDeInquilino !== servicio.esDeInquilino ||
          original.esAnual !== servicio.esAnual;

        if (cambiosDatos && servicio.esActivo) {
          try {
            await fetchWithToken(`${BACKEND_URL}/servicios-contrato/${servicioId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                nroCuenta: servicio.nroCuenta || "",
                nroContratoServicio: servicio.nroContratoServicio || "",
                esDeInquilino: servicio.esDeInquilino,
                esAnual: servicio.esAnual,
              }),
            });
            console.log(`✅ Servicio ${servicioId} actualizado exitosamente`);
          } catch (error: any) {
            console.error(`❌ Error al actualizar datos del servicio ${servicioId}:`, error);
            errores.push(`Error al actualizar datos del servicio`);
          }
        }
      }

      if (errores.length > 0) {
        setErrorCarga(errores.join(". "));
        setMostrarError(true);
      } else {
        setMostrarExito(true);
        setIsOpen(false);
      }
      
      // Notificar al componente padre para recargar los datos
      if (onServiciosActualizados) {
        onServiciosActualizados();
      }
    } catch (error: any) {
      console.error("Error general al guardar servicios:", error);
      setErrorCarga(error.message || "No se pudo guardar los servicios");
      setMostrarError(true);
    } finally {
      setLoading(false);
    }
  };

  const updateServicio = (tipoServicio: number, patch: Partial<ServicioContrato>) => {
    setServiciosContrato(
      serviciosContrato.map((s) =>
        s.tipoServicioId === tipoServicio ? { ...s, ...patch } : s
      )
    );
  };


  return (
    <>
      

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="default" disabled={disabled} >
            <Edit className="h-4 w-4 mr-2" />
            Editar Servicios
          </Button>
        </DialogTrigger>

        <DialogContent className="w-full sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Blocks className="h-5 w-5" />
              Editar Servicios del Contrato
            </DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center">
              <LoadingSmall text="Cargando servicios..." />
            </div>
            ) : (

          <div className="space-y-4">
            <p className="text-muted-foreground">
              Activá o desactivá los servicios que serán controlados, y actualizá sus datos.
            </p>

            <div className="grid gap-2">
              {serviciosContrato.map((s) => (
                <ServicioCard 
                  key={s.tipoServicioId} 
                  s={s} 
                  updateServicio={updateServicio} 
                />
              ))}
            </div>

            <div className="flex gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1"
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleGuardarServicios}
                className="flex-1"
                loading={loading}
              >
                <Save className="h-4 w-4 mr-2" />
                Guardar Cambios
              </Button>
            </div>
          </div>
          )}
        </DialogContent>
      </Dialog>
      

      {/* Modal de error */}
      {mostrarError && (
        <ModalError
          titulo="Error al guardar servicios"
          mensaje={errorCarga}
          onClose={() => setMostrarError(false)}
        />
      )}

      {/* Modal de éxito */}
      {mostrarExito && (
        <ModalDefault
          titulo="Servicios Actualizados"
          mensaje="Los servicios del contrato se han actualizado correctamente."
          onClose={() => setMostrarExito(false)}
        />
      )}

    </>
  );
}
