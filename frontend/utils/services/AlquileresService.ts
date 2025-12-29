import { fetchWithToken } from "@/utils/functions/auth-functions/fetchWithToken";
import BACKEND_URL from "@/utils/backendURL";
import { PagoAlquiler } from "@/types/PagoAlquiler";

/**
 * Servicio centralizado para operaciones relacionadas con alquileres
 * Responsabilidades:
 * - Abstraer URLs de la API de alquileres
 * - Manejar transformaciones de datos de alquileres
 * - Consolidar lógica de negocio de alquileres
 * - Validar respuestas
 */
export const alquileresService = {
  /**
   * GET: Obtiene todos los alquileres pendientes
   * @returns Array de alquileres pendientes de pago
   */
  getAlquileresPendientes: async (): Promise<PagoAlquiler[]> => {
    try {
      const data = await fetchWithToken(`${BACKEND_URL}/alquileres/pendientes`);
      return data || [];
    } catch (error) {
      console.error("Error al obtener alquileres pendientes:", error);
      throw error;
    }
  },
};
