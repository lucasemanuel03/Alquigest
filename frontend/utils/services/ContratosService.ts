import { fetchWithToken } from "@/utils/functions/auth-functions/fetchWithToken";
import BACKEND_URL from "@/utils/backendURL";
import { ContratoDetallado } from "@/types/ContratoDetallado";

/**
 * Servicio centralizado para operaciones relacionadas con contratos
 * Responsabilidades:
 * - Abstraer URLs de la API de contratos
 * - Manejar transformaciones de datos de contratos
 * - Consolidar lógica de negocio de contratos
 * - Validar respuestas
 */
export const contratosService = {
  /**
   * GET: Obtiene todos los contratos vigentes
   * @returns Array de contratos vigentes con servicios bajo control
   */
  getContratosVigentes: async (): Promise<ContratoDetallado[]> => {
    try {
      const data = await fetchWithToken(`${BACKEND_URL}/contratos/vigentes`);
      return data || [];
    } catch (error) {
      console.error("Error al obtener contratos vigentes:", error);
      throw error;
    }
  },
};
