import { fetchWithToken } from "@/utils/functions/auth-functions/fetchWithToken";
import { Propietario } from "@/types/Propietario";

/**
 * Servicio centralizado para operaciones CRUD de Propietario
 * Responsabilidades:
 * - Abstraer URLs de la API
 * - Manejar transformaciones de datos
 * - Consolidar lógica condicional
 * - Validar respuestas
 */
export const PropietariosService = {
  /**
   * GET: Obtiene todos los propietarios
   */
    getAll: async (): Promise<Propietario[]> => {
        const data = await fetchWithToken("/propietarios");
        return data || [];
    },

    /**
    * GET: Obtiene propietarios Activos
    */
    getActivos: async (): Promise<Propietario[]> => {
        const data = await fetchWithToken("/propietarios/activos");
        return data || [];
    },

    /**
    * GET: Obtiene propietarios Inactivos
    */
    getInactivos: async (): Promise<Propietario[]> => {
        const data = await fetchWithToken("/propietarios/inactivos");
        return data || [];
    },


    /**
     * GET: Obtiene un Propietario por ID
     */
    getById: async (id: string): Promise<Propietario> => {
        const response = await fetchWithToken(`/propietarios/${id}`);
        if (!response || !response.id) {
        throw new Error("El servidor no retornó la entidad");
        }
        return response;
    },

    /**
     * POST: Crea un nuevo Propietario
     */
    create: async (data: Omit<Propietario, "id">): Promise<Propietario> => {
        const response = await fetchWithToken("/propietarios", {
        method: "POST",
        body: JSON.stringify(data),
        });

        if (!response || !response.id) {
        throw new Error("El servidor no retornó el propietario creado");
        }

        return response;
    },

    /**
     * PUT: Actualiza un Propietario completo
     */
    update: async (id: string, data: Partial<Propietario>): Promise<Propietario> => {
        const response = await fetchWithToken(`/propietarios/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        });

        if (!response || !response.id) {
        throw new Error("El servidor no retornó la entidad actualizada");
        }

        return response;
    },

    /**
     * PATCH: Actualización parcial (ej: cambiar estado)
     */
    patch: async (id: string, data: Partial<Propietario>): Promise<Propietario> => {
        return fetchWithToken(`/propietarios/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
        });
    },

    /**
     * DELETE: Elimina un Propietario
     * NO IMPLEMENTADO: Se utilizan bajas lógicas mediante PATCH
     */

    /**
     * BULK: Operaciones en lote
     */
    bulkUpdate: async (ids: string[], data: Partial<Propietario>): Promise<Propietario[]> => {
        return fetchWithToken("/propietarios/bulk", {
        method: "PUT",
        body: JSON.stringify({ ids, data }),
        });
    },
};