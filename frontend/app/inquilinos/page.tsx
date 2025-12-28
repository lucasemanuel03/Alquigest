"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import { useInquilinos } from "@/hooks/useInquilinos";
import { Inquilino } from "@/types/Inquilino";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Link from "next/link";
import EditInquilinoForm from "@/components/inquilinos/editInquilinoForm";
import Loading from "@/components/loading";
import ModalError from "@/components/modal-error";
import NuevoInquilinoModal from "./nuevoInquilinoModal";
import BarraBusqueda from "@/components/busqueda/barra-busqueda";
import InquilinoCard from "@/components/inquilinos/inquilino-card"// Componente presentacional
import { SquareX, SquareCheck } from "lucide-react";

export default function InquilinosPage() {
  const { hasPermission } = useAuth();
  
  // ✅ TODO: State management consolidado en hook
  const [esActivo, setEsActivo] = useState(true);
  const { inquilinos, loading, error, refetch, update } = useInquilinos(esActivo);
  
  // ✅ Solo state de UI local
  const [filtrados, setFiltrados] = useState<Inquilino[]>([]);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingInquilino, setEditingInquilino] = useState<Partial<Inquilino> | null>(null);
  const [loadingActualizacion, setLoadingActualizacion] = useState(false);
  const [mostrarError, setMostrarError] = useState(false);

  const handleUpdateInquilino = async () => {
    if (!editingInquilino?.id) return;

    setLoadingActualizacion(true);
    try {
      await update(editingInquilino.id, editingInquilino);
      setIsEditOpen(false);
      setEditingInquilino(null);
    } catch (err) {
      setMostrarError(true);
    } finally {
      setLoadingActualizacion(false);
    }
  };

  if (loading) return <Loading text="Cargando Locatarios..." />;

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-8 pt-25 sm:pt-28">
        {/* Page Header */}
        <div className="mb-8 flex flex-col gap-5">
          <div className="mt-8 flex items-center justify-between">
            <Link href="/"><Button variant="outline">← Volver</Button></Link>
            <NuevoInquilinoModal
              onInquilinoCreado={(nuevo) => refetch()}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">
                {esActivo ? "Locatarios Activos" : "Locatarios Inactivos"}
              </h2>
              <p className="text-muted-foreground">
                Cantidad Actual: {inquilinos.length}
              </p>
            </div>
            <Button
              onClick={() => setEsActivo(!esActivo)}
              variant="outline"
            >
              {!esActivo ? (
                <div className="flex gap-2 items-center">
                  <SquareX /> Ver Inactivos
                </div>
              ) : (
                <div className="flex gap-2 items-center">
                  <SquareCheck /> Ver Activos
                </div>
              )}
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <BarraBusqueda
          arrayDatos={inquilinos}
          placeholder="Buscar por nombre, apellido o CUIL..."
          setDatosFiltrados={setFiltrados}
          propiedadesBusqueda={["apellido", "nombre", "cuil"]}
        />

        {/* Grid de Inquilinos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtrados.map((inquilino) => (
            <InquilinoCard
              key={inquilino.id}
              inquilino={inquilino}
              onEdit={() => {
                setEditingInquilino(inquilino);
                setIsEditOpen(true);
              }}
              canEdit={hasPermission("modificar_inquilino")}
            />
          ))}
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Locatario</DialogTitle>
            </DialogHeader>
            <EditInquilinoForm
              editingInquilino={editingInquilino}
              setEditingInquilino={(updated) => setEditingInquilino(updated)}
              handleUpdateInquilino={handleUpdateInquilino}
              loadingActualizacion={loadingActualizacion}
              setIsEditInquilinoOpen={(isOpen) => setIsEditOpen(isOpen)}
            />
          </DialogContent>
        </Dialog>
      </main>

      {error && (
        <ModalError
          titulo="Error al editar Locatario"
          mensaje={error}
          onClose={() => setMostrarError(false)}
        />
      )}
    </div>
  );
}