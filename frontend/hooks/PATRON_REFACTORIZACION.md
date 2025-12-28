# Patrón de Refactorización Modular - Estructura Reutilizable

## 1. Estructura de Carpetas por Módulo

utils/services/
├── [moduloService].ts # API calls + lógica de negocio
├── [moduloService].types.ts # (Opcional) DTOs específicos del servicio
└── index.ts # Export centralizado

hooks/
├── use[Modulo].ts # State management + refetch logic
└── index.ts # Export centralizado

components/[modulo]/
├── [modulo]-card.tsx # Componente presentacional (read-only)
├── [modulo]-form.tsx # Formulario reutilizable (create/edit)
├── [modulo]-list.tsx # (Opcional) Listado sin lógica
├── edit-[modulo]-form.tsx # Formulario específico de edición
└── index.ts # Export centralizado

app/[modulo]/
├── page.tsx # Orquestador ligero (usa hook + componentes)
├── nuevo[Modulo]Modal.tsx # Modal para crear
└── layout.tsx # Layout específico del módulo

---

## 2. Template: El Patrón Base (3 Capas)

### **Capa 1: Service Layer**

```typescript
// filepath: /home/lucas/Documentos/SeminarioUTN/Alquigest/frontend/utils/services/[moduloService].ts

import { fetchWithToken } from "@/utils/functions/auth-functions/fetchWithToken";
import { [Entidad] } from "@/types/[Entidad]";

/**
 * Servicio centralizado para operaciones CRUD de [Entidad]
 * Responsabilidades:
 * - Abstraer URLs de la API
 * - Manejar transformaciones de datos
 * - Consolidar lógica condicional
 * - Validar respuestas
 */
export const [modulo]Service = {
  /**
   * GET: Obtiene todos los [entidades]
   */
  getAll: async (): Promise<[Entidad][]> => {
    const data = await fetchWithToken("/[endpoint]");
    return data || [];
  },

  /**
   * GET: Obtiene [entidades] por filtro (ej: estado)
   */
  getByFiltro: async (filtro: string, valor: any): Promise<[Entidad][]> => {
    const data = await fetchWithToken(`/[endpoint]?${filtro}=${valor}`);
    return data || [];
  },

  /**
   * GET: Obtiene un [entidad] por ID
   */
  getById: async (id: string): Promise<[Entidad]> => {
    const response = await fetchWithToken(`/[endpoint]/${id}`);
    if (!response || !response.id) {
      throw new Error("El servidor no retornó la entidad");
    }
    return response;
  },

  /**
   * POST: Crea un nuevo [entidad]
   */
  create: async (data: Omit<[Entidad], "id">): Promise<[Entidad]> => {
    const response = await fetchWithToken("/[endpoint]", {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (!response || !response.id) {
      throw new Error("El servidor no retornó la entidad creada");
    }

    return response;
  },

  /**
   * PUT: Actualiza un [entidad] completo
   */
  update: async (id: string, data: Partial<[Entidad]>): Promise<[Entidad]> => {
    const response = await fetchWithToken(`/[endpoint]/${id}`, {
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
  patch: async (id: string, data: Partial<[Entidad]>): Promise<[Entidad]> => {
    return fetchWithToken(`/[endpoint]/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  /**
   * DELETE: Elimina un [entidad]
   */
  delete: async (id: string): Promise<void> => {
    await fetchWithToken(`/[endpoint]/${id}`, {
      method: "DELETE",
    });
  },

  /**
   * BULK: Operaciones en lote
   */
  bulkUpdate: async (ids: string[], data: Partial<[Entidad]>): Promise<[Entidad][]> => {
    return fetchWithToken("/[endpoint]/bulk", {
      method: "PUT",
      body: JSON.stringify({ ids, data }),
    });
  },
};


```

---

## CAPA 2: Hook Custom (State Management)

```typescript

// filepath: /home/lucas/Documentos/SeminarioUTN/Alquigest/frontend/hooks/use[Modulo].ts

import { useState, useEffect, useCallback } from "react";
import { [Entidad] } from "@/types/[Entidad]";
import { [modulo]Service } from "@/utils/services/[moduloService]";

interface Use[Modulo]Return {
  [entidades]: [Entidad][];
  loading: boolean;
  error: string | null;
  refetch: (filtro?: { clave: string; valor: any }) => Promise<void>;
  create: (data: Omit<[Entidad], "id">) => Promise<[Entidad]>;
  update: (id: string, data: Partial<[Entidad]>) => Promise<[Entidad]>;
  delete: (id: string) => Promise<void>;
  clearError: () => void;
}

export const use[Modulo] = (
  filtroInicial?: { clave: string; valor: any }
): Use[Modulo]Return => {
  const [[entidades], set[Entidades]] = useState<[Entidad][]>([]);
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

      let data: [Entidad][];

      if (filtro) {
        data = await [modulo]Service.getByFiltro(filtro.clave, filtro.valor);
      } else {
        data = await [modulo]Service.getAll();
      }

      set[Entidades](data);
      setFiltroActual(filtro);
    } catch (err: any) {
      const errorMsg = err?.message || "Error al cargar datos";
      setError(errorMsg);
      console.error(`Error en use[Modulo]:`, err);
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
  const create = async (data: Omit<[Entidad], "id">): Promise<[Entidad]> => {
    try {
      setError(null);
      const newEntity = await [modulo]Service.create(data);
      set[Entidades]((prev) => [...prev, newEntity]);
      return newEntity;
    } catch (err: any) {
      const errorMsg = err?.message || "Error al crear";
      setError(errorMsg);
      throw err;
    }
  };

  /**
   * UPDATE
   */
  const update = async (id: string, data: Partial<[Entidad]>): Promise<[Entidad]> => {
    try {
      setError(null);
      const updated = await [modulo]Service.update(id, data);
      set[Entidades]((prev) =>
        prev.map((entity) => (entity.id === id ? updated : entity))
      );
      return updated;
    } catch (err: any) {
      const errorMsg = err?.message || "Error al actualizar";
      setError(errorMsg);
      throw err;
    }
  };

  /**
   * DELETE
   */
  const deleteEntity = async (id: string): Promise<void> => {
    try {
      setError(null);
      await [modulo]Service.delete(id);
      set[Entidades]((prev) => prev.filter((entity) => entity.id !== id));
    } catch (err: any) {
      const errorMsg = err?.message || "Error al eliminar";
      setError(errorMsg);
      throw err;
    }
  };

  /**
   * REFETCH
   */
  const refetch = useCallback(
    async (filtro?: { clave: string; valor: any }) => {
      await fetchData(filtro);
    },
    [fetchData]
  );

  return {
    [entidades],
    loading,
    error,
    refetch,
    create,
    update,
    delete: deleteEntity,
    clearError: () => setError(null),
  };
};

```