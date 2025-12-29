import { useState, useEffect, useCallback } from "react";
import { PagoAlquiler } from "@/types/PagoAlquiler";
import { alquileresService } from "@/utils/services/AlquileresService";

/**
 * Interfaz del retorno del hook useAlquileresPendientes
 */
interface UseAlquileresPendientesReturn {
  alquileres: PagoAlquiler[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  clearError: () => void;
}

/**
 * Hook personalizado para manejar la lógica de alquileres pendientes
 * Responsabilidades:
 * - Gestionar estado de alquileres pendientes
 * - Proporcionar métodos de refetch
 * - Centralizar manejo de errores
 */
export const useAlquileresPendientes = (): UseAlquileresPendientesReturn => {
  const [alquileres, setAlquileres] = useState<PagoAlquiler[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch de alquileres pendientes
   */
  const fetchAlquileres = useCallback(async () => {
    setLoading(true);
    try {
      const data = await alquileresService.getAlquileresPendientes();
      setAlquileres(data);
      setError(null);
    } catch (err: any) {
      const errorMsg = err?.message || "Error al cargar alquileres pendientes";
      setError(errorMsg);
      console.error("Error en fetchAlquileres:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Efecto inicial: cargar datos al montar el componente
   */
  useEffect(() => {
    fetchAlquileres();
  }, [fetchAlquileres]);

  /**
   * Refetch de todos los datos
   */
  const refetch = useCallback(async () => {
    await fetchAlquileres();
  }, [fetchAlquileres]);

  return {
    alquileres,
    loading,
    error,
    refetch,
    clearError: () => setError(null),
  };
};
