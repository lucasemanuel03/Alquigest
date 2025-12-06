'use client'

import InmuebleIcon from "@/components/inmueble-icon";
import Loading from "@/components/loading";
import ClaveFiscalSecura from "@/components/clave-fiscal-secura";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Inmueble } from "@/types/Inmueble";
import { Propietario } from "@/types/Propietario";
import BACKEND_URL from "@/utils/backendURL";
import auth from "@/utils/functions/auth-functions/auth";
import { fetchWithToken } from "@/utils/functions/auth-functions/fetchWithToken";
import tiposInmueble from "@/utils/tiposInmuebles";
import { ArrowLeft, Building, Building2, Eye, User } from "lucide-react";
import Link from "next/link"
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthProvider";


export default function PropietarioDetalles() {
    const { hasPermission, hasRole, user } = useAuth();

    const params = useParams(); 
    const id = params.id as string; 
    const [propietario, setPropietario] = useState<Propietario | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWithToken(`${BACKEND_URL}/propietarios/${id}`)
            .then((data) => {
                setPropietario(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error al traer propietario:", err);
                setLoading(false);
            });
    }, [id]);

    // PARA VER SUS INMUEBLES
    const [susInmuebles, setSusInmuebles] = useState<Inmueble[]>([]);
    useEffect(() => {
        fetchWithToken(`${BACKEND_URL}/inmuebles/propietario/${id}`)
            .then((data) => {
                setSusInmuebles(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error al traer inmuebles del propietario:", err);
                setLoading(false);
            });
    }, [id]);
        
    if (loading) return(
        <div>
          <Loading text="Cargando datos del propietario..."/>
        </div>
      )

    return(
        <div className="min-h-screen bg-background">
            <main className="container mx-auto px-6 py-8 pt-25 sm:pt-28">
                {/* Page Title */}
                <div className="mb-8 flex flex-col gap-3">
                        <Button variant="outline" onClick={() => window.history.back()} className="w-fit">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                            Volver
                        </Button>
                    <div className="flex items-center m-5">
                            <User className="h-17 w-17 mr-2 text-yellow-700" />
                        <div className="">
                            <h2 className="text-3xl font-bold text-foreground font-sans">{propietario?.apellido}, {propietario?.nombre}</h2>
                            <p className="text-muted-foreground font-sans text-lg">Propietario</p>
                        </div>
                    </div>
                </div>

                <Card className="max-w-4xl mx-auto">
                    <CardHeader >
                        <div className="flex items-center gap-2">
                            <User className="h-5 w-5"/>
                            <CardTitle className="font-bold">Datos Personales</CardTitle>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 justify-between">
                            <div className="flex gap-3">
                                <h2 className="font-bold">CUIL:</h2>
                                <p>{propietario?.cuil}</p>
                            </div>
                            {(hasRole("ROLE_SECRETARIA") || hasRole("ROLE_ABOGADA")) && (
                                <div className="flex flex-col gap-2">
                                    <h2 className="font-bold">Clave Fiscal:</h2>
                                    <ClaveFiscalSecura
                                        propietarioId={id}
                                        claveFiscalEnmascarada={propietario?.claveFiscal || null}
                                    />
                                </div>
                            )}
                            <div className="flex gap-3">
                                <h2 className="font-bold">Telefono:</h2>
                                <p>{propietario?.telefono || "No especifica"}</p>
                            </div>
                            <div className="flex gap-3">
                                <h2 className="font-bold">Email:</h2>
                                <p>{propietario?.email}</p>
                            </div>
                            <div className="flex gap-3">
                                <h2 className="font-bold">Dirección:</h2>
                                <p>{propietario?.direccion || "No especifica"}{`, ${propietario?.barrio}`}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="max-w-4xl mx-auto mt-10">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Building2 className="h-5 w-5"/>
                            <CardTitle className="font-bold">Sus inmuebles</CardTitle>
                        </div>
                    </CardHeader>

                    <CardContent>
                        {susInmuebles.length === 0 ? (
                            <p className="text-muted-foreground">Este propietario no tiene inmuebles registrados.</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {susInmuebles.map((inmueble) => (
                                <Card key={inmueble.id} className="p-5 gap-2">
                                <div className="flex items-center gap-2">
                                    <InmuebleIcon tipoInmuebleId={inmueble.tipoInmuebleId} className="h-5 w-5"/>
                                    <h3 className="font-bold">{inmueble.direccion}</h3>
                                </div>
                                <p><span className="font-semibold">Estado:</span> {inmueble.esAlquilado === true ? "En Alquiler" : "No Alquilado"}</p>
                                <p><span className="font-semibold">Tipo:</span> {tiposInmueble.find(tipo => tipo.id === inmueble.tipoInmuebleId)?.nombre || "Desconocido"}</p>
                                <p><span className="font-semibold">Superficie:</span> {inmueble.superficie !== null ? `${inmueble.superficie} m²` : "No especificada"}  </p>

                                <Link href={`/inmuebles/${inmueble.id}`}>
                                    <Button variant="outline" size="sm" className="mt-2">
                                        <Eye />
                                        Ver detalles
                                    </Button>
                                </Link>
                                </Card>
                            ))}
                            </div>
                        )}
                    </CardContent>

                </Card>

            </main>

        
        </div>

        )

}