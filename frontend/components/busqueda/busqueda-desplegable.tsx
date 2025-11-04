"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

export interface BusquedaDesplegableProps<T = any> {
  items: T[];
  propiedadesBusqueda: string[];
  onSelect: (item: T) => void;
  placeholder?: string;
  className?: string;
  emptyMessage?: string;
  debounceMs?: number;
  getItemKey?: (item: T, index: number) => string;
  getItemLabel?: (item: T) => React.ReactNode;
}

function defaultGetItemKey<T extends { id?: string | number }>(item: T, index: number) {
  return (item && (item as any).id != null ? String((item as any).id) : String(index)) as string;
}

function defaultGetItemLabel<T extends Record<string, any>>(item: T, propiedadesBusqueda: string[]) {
  // Concatena valores string/number de las propiedades de búsqueda
  const parts = propiedadesBusqueda
    .map((p) => item?.[p])
    .filter((v) => typeof v === "string" || typeof v === "number")
    .map((v) => String(v));
  return parts.join(" · ");
}

export default function BusquedaDesplegable<T extends Record<string, any>>({
  items,
  propiedadesBusqueda,
  onSelect,
  placeholder = "Buscar...",
  className,
  emptyMessage = "Sin resultados",
  debounceMs = 150,
  getItemKey = defaultGetItemKey,
  getItemLabel,
}: BusquedaDesplegableProps<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [filtered, setFiltered] = useState<T[]>(items ?? []);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const labelFor = useMemo(() => {
    return (item: T) => (getItemLabel ? getItemLabel(item) : defaultGetItemLabel(item, propiedadesBusqueda));
  }, [getItemLabel, propiedadesBusqueda]);

  // Filtrado con debounce
  useEffect(() => {
    const q = (query ?? "").trim().toLowerCase();
    const t = setTimeout(() => {
      if (!q) {
        setFiltered(items ?? []);
        return;
      }
      const r = (items ?? []).filter((item) =>
        propiedadesBusqueda.some((prop) => {
          const value = item?.[prop];
          if (typeof value === "string") return value.toLowerCase().includes(q);
          if (typeof value === "number") return value.toString().toLowerCase().includes(q);
          return false;
        })
      );
      setFiltered(r);
    }, debounceMs);
    return () => clearTimeout(t);
  }, [query, items, propiedadesBusqueda, debounceMs]);

  // Cerrar al clickear fuera
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const handleSelect = (item: T) => {
    onSelect(item);
    // Seteamos el input al label del item seleccionado
    const lbl = labelFor(item);
    setQuery(typeof lbl === "string" ? lbl : "");
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        placeholder={placeholder}
        rightIcon={<Search className="w-4 h-4" />}
        aria-expanded={open}
        aria-controls="busqueda-desplegable-listbox"
        role="combobox"
        autoComplete="off"
      />

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border bg-background shadow-md max-h-64 overflow-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">{emptyMessage}</div>
          ) : (
            <ul id="busqueda-desplegable-listbox" role="listbox" className="py-1">
              {filtered.map((item, idx) => (
                <li
                  key={getItemKey(item, idx)}
                  role="option"
                  tabIndex={-1}
                  className="cursor-pointer px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                  onMouseDown={(e) => e.preventDefault()} // evita que el input pierda foco antes del click
                  onClick={() => handleSelect(item)}
                >
                  {labelFor(item)}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
