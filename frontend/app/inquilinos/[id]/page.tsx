"use client";
import HeaderAlquigest from "@/components/header";
import Loading from "@/components/loading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Inquilino } from "@/types/Inquilino";
import BACKEND_URL from "@/utils/backendURL";
import { fetchWithToken } from "@/utils/functions/auth-functions/fetchWithToken";
import { User } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function DetalleInquilino() {
  const params = useParams();
  const id = params.id as string;
  const [inquilino, setInquilino] = useState<Inquilino | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithToken(`${BACKEND_URL}/inquilinos/${id}`)
      .then((data) => {
        setInquilino(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error al traer inquilino:", err);
        setLoading(false);
      });
  }, [id]);

  if (loading) return (
    <div>
      <Loading text="Cargando datos del Locatario..." />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-8 pt-25 sm:pt-28">
        <div className="mb-8 flex flex-col gap-3">
          <Button variant="outline" onClick={() => window.history.back()} className="w-fit">
            ← Volver
          </Button>
          <div className="flex items-center m-5">
            <User className="h-17 w-17 mr-2 text-blue-700" />
            <div>
              <h2 className="text-3xl font-bold text-foreground font-sans">{inquilino?.apellido}, {inquilino?.nombre}</h2>
              <p className="text-muted-foreground font-sans text-lg">Locatario</p>
            </div>
          </div>
        </div>

        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <CardTitle className="font-bold">Datos Personales</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 justify-between">
              <div className="flex gap-3">
                <h2 className="font-bold">Cuil:</h2>
                <p>{inquilino?.cuil}</p>
              </div>
              <div className="flex gap-3">
                <h2 className="font-bold">Teléfono:</h2>
                <p>{inquilino?.telefono || "No especifica"}</p>
              </div>
              <div className="flex gap-3">
                <h2 className="font-bold">Dirección Real:</h2>
                <p>{inquilino?.direccion || "No especifica"}, {inquilino?.barrio}</p>
              </div>
              {/* Email eliminado, no existe en el modelo Inquilino */}
              <div className="flex gap-3">
                <h2 className="font-bold">Estado:</h2>
                <p>{inquilino?.esActivo ? "Activo" : "Inactivo"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
