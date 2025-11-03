// No local React state needed here; we rely on lifted state from the hook
import { DatosAdicionales } from "@/hooks/useNuevoContratoForm";
import { Contrato } from "@/types/Contrato";
import { ServicioContrato } from "@/types/ServicioContrato";
import { Blocks } from "lucide-react";
import ServicioCard from "./ServicioCard";

interface Paso5Props {
  formData: Contrato;
  datosAdicionales: DatosAdicionales;
  serviciosContrato: ServicioContrato[];
  setServiciosContrato: (servicios: ServicioContrato[]) => void; // <-- AGREGA EL SETTER
  formatMontoVisual: (v: number) => string;
}

export default function Paso4CargaServicios({ formData, datosAdicionales, serviciosContrato  ,setServiciosContrato }: Paso5Props) {
  // Mapa de clases de borde para Tailwind (usar literales completas para que JIT no las purgue)


  // Helper para actualizar un servicio por tipo
  const updateServicio = (tipoServicio: number, patch: Partial<ServicioContrato>) => {
    setServiciosContrato(
      serviciosContrato.map((s) =>
        s.tipoServicioId === tipoServicio ? { ...s, ...patch } : s
      )
    );
  };

  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <Blocks className="h-5 w-5" />
        <span className="font-semibold">Servicios del inmueble</span>
      </div>
      <p>Ingrese los datos de los servicios que serán controlados, puede cargarlos en otro momento también.</p>

      <div className="grid gap-2">
        {serviciosContrato.map((s) => (
          <ServicioCard key={s.tipoServicioId} s={s} updateServicio={updateServicio} />
        ))}
      </div>
    </>
  );
}