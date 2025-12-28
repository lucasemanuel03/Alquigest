import { fetchWithToken } from "@/utils/functions/auth-functions/fetchWithToken";
import { Inmueble } from "@/types/Inmueble";

/**
 * Servicio centralizado para operaciones de Inmueble
 * - Abstrae URLs de la API
 * - Maneja transformaciones y validaciones
 * - Consolida lógica condicional de endpoints (ej. desactivar)
 */
export type FiltroInmuebles = "activos" | "inactivos" | "alquilados" | "disponibles";

export const InmueblesService = {
	/**
	 * GET: Lista de inmuebles según filtro
	 */
	getByFiltro: async (filtro: FiltroInmuebles): Promise<Inmueble[]> => {
		const endpointMap: Record<FiltroInmuebles, string> = {
			activos: "/inmuebles/activos",
			inactivos: "/inmuebles/inactivos",
			alquilados: "/inmuebles/alquilados",
			disponibles: "/inmuebles/disponibles",
		};
		const data = await fetchWithToken(endpointMap[filtro]);
		return data || [];
	},

	/**
	 * GET: Obtiene todos los inmuebles
	 */
	getAll: async (): Promise<Inmueble[]> => {
		const data = await fetchWithToken("/inmuebles");
		return data || [];
	},

	/**
	 * GET: Obtiene un inmueble por ID
	 */
	getById: async (id: string | number): Promise<Inmueble> => {
		const response = await fetchWithToken(`/inmuebles/${id}`);
		if (!response || !response.id) {
			throw new Error("El servidor no retornó el inmueble");
		}
		return response;
	},

	/**
	 * GET: Busca por dirección exacta o similar (según backend)
	 */
	buscarPorDireccion: async (direccion: string): Promise<Inmueble[]> => {
		const params = new URLSearchParams({ direccion });
		const data = await fetchWithToken(`/inmuebles/buscar-direccion?${params.toString()}`);
		return data || [];
	},

	/**
	 * POST: Crear inmueble
	 */
	create: async (data: Omit<Inmueble, "id" | "tipo">): Promise<Inmueble> => {
		const response = await fetchWithToken("/inmuebles", {
			method: "POST",
			body: JSON.stringify(data),
		});
		if (!response || !response.id) {
			throw new Error("El servidor no retornó el inmueble creado");
		}
		return response;
	},

	/**
	 * PUT: Actualizar inmueble
	 * Nota: Si el estado indica inactivo (3), realizar desactivación previa
	 */
	update: async (id: string | number, data: Partial<Inmueble>): Promise<Inmueble> => {
		// Desactivar si corresponde
		if (data.estado === 3 || data.estado === ("3" as any)) {
			await InmueblesService.desactivar(id);
		}
		const response = await fetchWithToken(`/inmuebles/${id}`, {
			method: "PUT",
			body: JSON.stringify(data),
		});
		if (!response || !response.id) {
			throw new Error("El servidor no retornó el inmueble actualizado");
		}
		return response;
	},

	/**
	 * PATCH: Desactivar inmueble (baja lógica)
	 */
	desactivar: async (id: string | number): Promise<void> => {
		await fetchWithToken(`/inmuebles/${id}/desactivar`, { method: "PATCH" });
	},
};

