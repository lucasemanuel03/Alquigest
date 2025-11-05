"use client";

import { Search } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useEffect, useState } from "react";

export default function BarraBusqueda({
    arrayDatos,
    setDatosFiltrados,
    propiedadesBusqueda,
    placeholder = "Buscar..."
}: {
    arrayDatos: any[];
    setDatosFiltrados: (datos: any[]) => void;
    propiedadesBusqueda: string[];
    placeholder?: string;
}) {

    const [query, setQuery] = useState("");
    const [resultados, setResultados] = useState<any[]>([]);

    const doFilter = (qInput: string) => {
        const q = (qInput ?? "").trim().toLowerCase();

        if (!q) {
            setResultados(arrayDatos ?? []);
            setDatosFiltrados(arrayDatos ?? []);
            return;
        }

        const r = (arrayDatos ?? []).filter((item) => {
            // Buscar coincidencia en cualquiera de las propiedades especificadas
            return propiedadesBusqueda.some((propiedad) => {
                const value = item?.[propiedad];
                if (typeof value === "string") return value.toLowerCase().includes(q);
                if (typeof value === "number") return value.toString().toLowerCase().includes(q);
                return false;
            });
        });

        setResultados(r);
        setDatosFiltrados(r);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // Ejecuta filtrado inmediato cuando se presiona enter o el botón
        doFilter(query);
    };

    // Filtrado dinámico con debounce mientras escribe el usuario
    useEffect(() => {
        const timeout = setTimeout(() => {
            doFilter(query);
        }, 100); // debounce 100ms
        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query, arrayDatos, propiedadesBusqueda]);

    return (
        <div className="flex flex-col gap-3 items-center justify-center mb-8">
            <form onSubmit={handleSubmit} className="w-full flex justify-center max-w-md">
                <div className="flex items-center gap-2 w-full">
                    <Input
                        type="text"
                        rightIcon={<Search className="w-5 h-5" />}
                        name="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={placeholder}
                        className="shadow-md hover:shadow-lg transition-shadow font-semibold"
                    />

                </div>
            </form>
            <div className="text-sm text-secondary">
                {query ? <p >Hay {resultados.length} coincidencias</p> : <p>. </p>}
            </div>
        </div>
    );
}