import { useState, useEffect, useCallback } from "react";
import { ContratoDetallado } from "@/types/ContratoDetallado";
import {
  pagoServiciosService,
  ContadoresServicios,
} from "@/utils/services/pagoServiciosService";
import { contratosService } from "@/utils/services/ContratosService";

/**
 * Interfaz del retorno del hook usePagoServicios
 */
interface UsePagoServiciosReturn {
  contratos: ContratoDetallado[];
  contadores: ContadoresServicios;
  contratosServiciosNoPagos: Record<string, number>;
  loading: boolean;
  loadingContadores: boolean;
  loadingPendientes: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  refrescarDatos: (contratoId?: number) => Promise<void>;
  clearError: () => void;
}

/**
 * Hook personalizado para manejar la lógica de pago de servicios
 * Responsabilidades:
 * - Gestionar estado de contratos y contadores
 * - Manejar fetches paralelos
 * - Proporcionar métodos de refetch
 * - Centralizar manejo de errores
 */
export const usePagoServicios = (): UsePagoServiciosReturn => {
  const [contratos, setContratos] = useState<ContratoDetallado[]>([]);
  const [contadores, setContadores] = useState<ContadoresServicios>({
    serviciosPendientes: 0,
    serviciosTotales: 0,
  });
  const [contratosServiciosNoPagos, setContratosServiciosNoPagos] = useState<
    Record<string, number>
  >({});

  const [loading, setLoading] = useState(true);
  const [loadingContadores, setLoadingContadores] = useState(true);
  const [loadingPendientes, setLoadingPendientes] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch principal: contratos vigentes (bloquea el loading principal)
   */
  const fetchContratos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await contratosService.getContratosVigentes();
      setContratos(data);
      setError(null);
    } catch (err: any) {
      const errorMsg = err?.message || "Error al cargar contratos";
      setError(errorMsg);
      console.error("Error en fetchContratos:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch secundario: contadores (en background)
   */
  const fetchContadores = useCallback(async () => {
    setLoadingContadores(true);
    try {
      const data = await pagoServiciosService.getContadores();
      setContadores(data);
      setError(null);
    } catch (err: any) {
      const errorMsg = err?.message || "Error al cargar contadores";
      console.error("Error en fetchContadores:", err);
      // No establecemos el error principal para no bloquear la UI
      // pero sí lo registramos en consola
    } finally {
      setLoadingContadores(false);
    }
  }, []);

  /**
   * Fetch secundario: servicios no pagados por contrato (en background)
   */
  const fetchServiciosNoPagados = useCallback(async () => {
    setLoadingPendientes(true);
    try {
      const data = await pagoServiciosService.getServiciosNoPagadosPorContrato();
      setContratosServiciosNoPagos(data);
      setError(null);
    } catch (err: any) {
      const errorMsg = err?.message || "Error al cargar servicios pendientes";
      console.error("Error en fetchServiciosNoPagados:", err);
      // No establecemos el error principal para no bloquear la UI
    } finally {
      setLoadingPendientes(false);
    }
  }, []);

  /**
   * Efecto inicial: cargar datos al montar el componente
   * El fetch principal (contratos) bloquea, los secundarios van en background
   */
  useEffect(() => {
    const initializeData = async () => {
      // Fetch principal primero
      await fetchContratos();
      // Fetches secundarios en paralelo
      Promise.all([fetchContadores(), fetchServiciosNoPagados()]).catch(
        (err) => {
          console.error("Error en inicialización de datos secundarios:", err);
        }
      );
    };

    initializeData();
  }, [fetchContratos, fetchContadores, fetchServiciosNoPagados]);

  /**
   * Refetch de todos los datos
   */
  const refetch = useCallback(async () => {
    await Promise.all([
      fetchContratos(),
      fetchContadores(),
      fetchServiciosNoPagados(),
    ]);
  }, [fetchContratos, fetchContadores, fetchServiciosNoPagados]);

  /**
   * Refrescar solo datos secundarios (cuando se registra un pago)
   * Útil para actualizaciones parciales sin bloquear
   */
  const refrescarDatos = useCallback(
    async (contratoId?: number) => {
      try {
        const { contadores: nuevosContadores, serviciosNoPagados } =
          await pagoServiciosService.refrescarDatos();

        setContadores(nuevosContadores);
        setContratosServiciosNoPagos(serviciosNoPagados);
        setError(null);
      } catch (err: any) {
        const errorMsg = err?.message || "Error al refrescar datos";
        setError(errorMsg);
        console.error("Error en refrescarDatos:", err);
      }
    },
    []
  );

  return {
    contratos,
    contadores,
    contratosServiciosNoPagos,
    loading,
    loadingContadores,
    loadingPendientes,
    error,
    refetch,
    refrescarDatos,
    clearError: () => setError(null),
  };
};
