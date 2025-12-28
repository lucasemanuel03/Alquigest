import { fetchWithToken } from "@/utils/functions/auth-functions/fetchWithToken";
import { Inquilino } from "@/types/Inquilino";

/**
 * Servicio centralizado para operaciones CRUD de Inquilinos
 * Responsabilidades:
 * - Abstraer URLs de la API
 * - Manejar transformaciones de datos
 * - Consolidar lógica condicional
 */
export const inquilinosService = {
  /**
   * Obtiene inquilinos activos ordenados por apellido
   */
  getActivosOrdenados: async (): Promise<Inquilino[]> => {
    const data = await fetchWithToken("/inquilinos/activos");
    return data.sort((a: Inquilino, b: Inquilino) =>
      a.apellido.localeCompare(b.apellido)
    );
  },

  /**
   * Obtiene inquilinos inactivos ordenados por apellido
   */
  getInactivosOrdenados: async (): Promise<Inquilino[]> => {
    const data = await fetchWithToken("/inquilinos/inactivos");
    return data.sort((a: Inquilino, b: Inquilino) =>
      a.apellido.localeCompare(b.apellido)
    );
  },

  /**
   * Obtiene el listado dinámicamente según estado
   */
  getByEstado: async (esActivo: boolean): Promise<Inquilino[]> => {
    return esActivo
      ? inquilinosService.getActivosOrdenados()
      : inquilinosService.getInactivosOrdenados();
  },

  /**
   * Actualiza datos del inquilino (PUT)
   */
  update: async (id: number, data: Partial<Inquilino>): Promise<Inquilino> => {
    const response = await fetchWithToken(`/inquilinos/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });

    // ✅ Validación centralizada
    if (!response || !response.id) {
      throw new Error("El servidor no retornó el inquilino actualizado");
    }

    return response;
  },

  /**
   * Desactiva un inquilino (PATCH)
   */
  deactivate: async (id: number): Promise<void> => {
    await fetchWithToken(`/inquilinos/${id}/desactivar`, {
      method: "PATCH",
    });
  },

  /**
   * Lógica smart: desactiva O actualiza según el estado
   * @param id - ID del inquilino
   * @param data - Datos a actualizar (incluye esActivo)
   */
  updateOrDeactivate: async (
    id: number,
    data: Partial<Inquilino>
  ): Promise<Inquilino> => {
    if (data.esActivo === false) {
      await inquilinosService.deactivate(id);
      return { ...data, id } as Inquilino;
    }

    return inquilinosService.update(id, data);
  },
};