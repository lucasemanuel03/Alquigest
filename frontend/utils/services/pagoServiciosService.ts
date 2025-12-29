import { fetchWithToken } from "@/utils/functions/auth-functions/fetchWithToken";
import BACKEND_URL from "@/utils/backendURL";

/**
 * Interfaz para los datos de contadores de servicios
 */
export interface ContadoresServicios {
  serviciosPendientes: number;
  serviciosTotales: number;
}

/**
 * Servicio centralizado para operaciones relacionadas con pago de servicios
 * Responsabilidades:
 * - Abstraer URLs de la API
 * - Manejar transformaciones de datos
 * - Consolidar lógica de negocio
 * - Validar respuestas
 */
export const pagoServiciosService = {
  /**
   * GET: Obtiene los contadores de servicios (totales y pendientes)
   * @returns Objeto con cantidades de servicios pendientes y totales
   */
  getContadores: async (): Promise<ContadoresServicios> => {
    try {
      const data = await fetchWithToken(`${BACKEND_URL}/pagos-servicios/count/pendientes`);
      
      if (!data || typeof data.serviciosPendientes === "undefined" || typeof data.serviciosTotales === "undefined") {
        throw new Error("El servidor no retornó los contadores esperados");
      }

      return {
        serviciosPendientes: data.serviciosPendientes,
        serviciosTotales: data.serviciosTotales,
      };
    } catch (error) {
      console.error("Error al obtener contadores:", error);
      throw error;
    }
  },

  /**
   * GET: Obtiene los servicios no pagados por contrato en el mes actual
   * @returns Objeto con mapping de contratoId -> cantidad de servicios no pagados
   */
  getServiciosNoPagadosPorContrato: async (): Promise<Record<string, number>> => {
    try {
      const data = await fetchWithToken(
        `${BACKEND_URL}/pagos-servicios/no-pagados/mes-actual/por-contrato`
      );
      return data || {};
    } catch (error) {
      console.error("Error al obtener servicios no pagados por contrato:", error);
      throw error;
    }
  },

  /**
   * Método auxiliar: refrescar todos los datos relacionados con servicios
   * Útil cuando se registra un nuevo pago
   */
  refrescarDatos: async (): Promise<{
    contadores: ContadoresServicios;
    serviciosNoPagados: Record<string, number>;
  }> => {
    try {
      const [contadores, serviciosNoPagados] = await Promise.all([
        pagoServiciosService.getContadores(),
        pagoServiciosService.getServiciosNoPagadosPorContrato(),
      ]);

      return {
        contadores,
        serviciosNoPagados,
      };
    } catch (error) {
      console.error("Error al refrescar datos de pago de servicios:", error);
      throw error;
    }
  },
};
