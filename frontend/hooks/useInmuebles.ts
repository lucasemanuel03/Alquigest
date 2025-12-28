// hooks/useInmuebles.ts
import { useState, useEffect, useCallback } from "react";
import { Inmueble } from "@/types/Inmueble";
import { InmueblesService, FiltroInmuebles } from "@/utils/services/inmueblesService";

interface UseInmueblesReturn {
  inmuebles: Inmueble[];
  loading: boolean;
  error: string | null;
  refetch: (filtro?: FiltroInmuebles) => Promise<void>;
  create: (data: Omit<Inmueble, "id" | "tipo">) => Promise<Inmueble>;
  update: (id: string | number, data: Partial<Inmueble>) => Promise<Inmueble>;
  desactivar: (id: string | number) => Promise<void>;
  clearError: () => void;
}

/**
 * Hook para gestionar inmuebles con filtros dinámicos
 * 
 * @param filtroInicial - Filtro inicial (activos, inactivos, alquilados, disponibles)
 * @returns Estado y métodos CRUD
 * 
 * @example
 * ```tsx
 * const { inmuebles, loading, create, update } = useInmuebles("activos");
 * ```
 */
export const useInmuebles = (
  filtroInicial: FiltroInmuebles = "activos"
): UseInmueblesReturn => {
  const [inmuebles, setInmuebles] = useState<Inmueble[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroActual, setFiltroActual] = useState(filtroInicial);

  /**
   * Fetch data con manejo de errores centralizado
   */
  const fetchData = useCallback(async (filtro = filtroActual) => {
    try {
      setLoading(true);
      setError(null);

      const data = await InmueblesService.getByFiltro(filtro);
      setInmuebles(data);
      setFiltroActual(filtro);
    } catch (err: any) {
      const errorMsg = err?.message || "Error al cargar inmuebles";
      setError(errorMsg);
      console.error(`Error en useInmuebles:`, err);
    } finally {
      setLoading(false);
    }
  }, [filtroActual]);

  /**
   * Efecto inicial: cargar datos al montar
   */
  useEffect(() => {
    fetchData();
  }, []);

  /**
   * CREATE
   */
  const create = async (data: Omit<Inmueble, "id" | "tipo">): Promise<Inmueble> => {
    try {
      setError(null);
      const newEntity = await InmueblesService.create(data);
      setInmuebles((prev) => [...prev, newEntity]);
      return newEntity;
    } catch (err: any) {
      const errorMsg = err?.message || "Error al crear inmueble";
      setError(errorMsg);
      throw err;
    }
  };

  /**
   * UPDATE
   */
  const update = async (id: string | number, data: Partial<Inmueble>): Promise<Inmueble> => {
    try {
      setError(null);
      const updated = await InmueblesService.update(id, data);
      setInmuebles((prev) =>
        prev.map((entity) => (entity.id === id || entity.id === Number(id) ? updated : entity))
      );
      return updated;
    } catch (err: any) {
      const errorMsg = err?.message || "Error al actualizar inmueble";
      setError(errorMsg);
      throw err;
    }
  };

  /**
   * DESACTIVAR
   */
  const desactivar = async (id: string | number): Promise<void> => {
    try {
      setError(null);
      await InmueblesService.desactivar(id);
      setInmuebles((prev) => prev.filter((entity) => entity.id !== id && entity.id !== Number(id)));
    } catch (err: any) {
      const errorMsg = err?.message || "Error al desactivar inmueble";
      setError(errorMsg);
      throw err;
    }
  };

  /**
   * REFETCH
   */
  const refetch = useCallback(
    async (filtro?: FiltroInmuebles) => {
      await fetchData(filtro);
    },
    [fetchData]
  );

  return {
    inmuebles,
    loading,
    error,
    refetch,
    create,
    update,
    desactivar,
    clearError: () => setError(null),
  };
};
