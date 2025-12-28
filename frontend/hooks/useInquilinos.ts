import { useState, useEffect } from "react";
import { Inquilino } from "@/types/Inquilino";
import { inquilinosService } from "@/utils/services/inquilinosService";

interface UseInquilinosReturn {
  inquilinos: Inquilino[];
  loading: boolean;
  error: string | null;
  refetch: (esActivo?: boolean) => Promise<void>;
  update: (id: number, data: Partial<Inquilino>) => Promise<void>;
  deactivate: (id: number) => Promise<void>;
}

export const useInquilinos = (
  esActivoInicial: boolean = true
): UseInquilinosReturn => {
  const [inquilinos, setInquilinos] = useState<Inquilino[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [esActivo, setEsActivo] = useState(esActivoInicial);

  const fetchInquilinos = async (estado = esActivo) => {
    try {
      setLoading(true);
      setError(null);
      const data = await inquilinosService.getByEstado(estado);
      setInquilinos(data);
    } catch (err: any) {
      setError(err?.message || "Error al cargar inquilinos");
      console.error("Error en useInquilinos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquilinos();
  }, [esActivo]);

  const update = async (id: number, data: Partial<Inquilino>) => {
    try {
      const updated = await inquilinosService.updateOrDeactivate(id, data);
      setInquilinos((prev) =>
        prev.map((i) => (i.id === id ? updated : i))
      );
    } catch (err: any) {
      setError(err?.message || "Error al actualizar inquilino");
      throw err;
    }
  };

  const deactivate = async (id: number) => {
    try {
      await inquilinosService.deactivate(id);
      setInquilinos((prev) => prev.filter((i) => i.id !== id));
    } catch (err: any) {
      setError(err?.message || "Error al desactivar inquilino");
      throw err;
    }
  };

  return {
    inquilinos,
    loading,
    error,
    refetch: fetchInquilinos,
    update,
    deactivate,
  };
};