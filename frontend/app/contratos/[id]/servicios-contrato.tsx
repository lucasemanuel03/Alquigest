"use client";

import { fetchWithToken } from "@/utils/functions/auth-functions/fetchWithToken";
import BACKEND_URL from "@/utils/backendURL";
import { useState } from "react";
import { Blocks } from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthProvider"

import TipoServicioIcon from "@/components/tipoServicioIcon";
import LoadingSmall from "@/components/loading-sm";
import ModalEditarServicios from "@/components/contratos/modal-editar-servicios";

export default function ServiciosContratoPage({esVigente, idContrato, fechaInicioContrato}: {esVigente: boolean, idContrato: number, fechaInicioContrato?: string}) {
    const [serviciosContrato, setServiciosContrato] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);


    const fetchServiciosContrato = async () => {
        console.log("Ejecutando fetch de Servicios del Contrato...");
        try {
            const data = await fetchWithToken(`${BACKEND_URL}/servicios-contrato/contrato/${idContrato}`);
            console.log("Datos parseados de servicios:", data);
            setServiciosContrato(data);
        } catch (err: any) {
            console.error("Error al traer Servicios del Contrato:", err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServiciosContrato();
    }, [idContrato]);

    if(loading){
        return(
            <div>
                <LoadingSmall text={`Cargando datos de servicios del contrato Nro. ${idContrato}...`}/>
            </div>
    )
    }

    return(
    <div className="w-full mb-15">
        
        <div className="flex flex-col  mt-10">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 items-center justify-between mb-4">
                <div className="flex items-center">
                    <Blocks className="h-7 w-7 mr-2 text-green-700" />
                    <h2 className="text-xl font-bold text-foreground font-sans">Servicios Controlados</h2>
                </div>
                <ModalEditarServicios 
                    serviciosActuales={serviciosContrato}
                    disabled={!esVigente || !useAuth().hasPermission("editar_servicios")}
                    contratoId={idContrato}
                    fechaInicioContrato={fechaInicioContrato || new Date().toISOString().split('T')[0]}
                    onServiciosActualizados={fetchServiciosContrato}
                />
            </div>

            <div className="sm:ml-5">
                {serviciosContrato.length === 0 ? (
                    <p className="mt-5 text-lg">No hay servicios asociados a este contrato.</p>
                ) : (
                    <div className="mt-5">
                        {serviciosContrato.map((servicio) => (
                            <div key={servicio.id} className="mb-4 p-4 border rounded-xl shadow-sm bg-card">
                                <div className="flex gap-2 items-center mb-4">
                                    <TipoServicioIcon tipoServicio={servicio.tipoServicioId} className="h-7 w-7" />
                                    <h3 className="text-lg font-semibold">{servicio.tipoServicioNombre}</h3>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <p><span className="font-semibold">Número de Cuenta:</span> {servicio.nroCuenta || "No asignado"}</p>
                                    {(servicio.nroContratoServicio !== null && servicio.nroContratoServicio !== "") &&(
                                        <p><span className="font-semibold">Nro. de Contrato de Servicio:</span> {servicio.nroContratoServicio || "No asignado"}</p>
                                    )}
                                    <p><span className="font-semibold">Responsable del Pago:</span> {servicio.esDeInquilino ? "Inquilino" : "Estudio Jurídico"}</p>
                                    <p><span className="font-semibold">Activo:</span> {servicio.esActivo ? "Sí" : "No"}</p>
                                    <p><span className="font-semibold">Tipo de Cobro:</span> {servicio.esAnual ? "Anual" : "Mensual"}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </div>
            
        </div>
                

    </div>
    )
}