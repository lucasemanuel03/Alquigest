"use client"

import Loading from "@/components/loading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContratoDetallado } from "@/types/ContratoDetallado";
import BACKEND_URL from "@/utils/backendURL";
import { fetchWithToken } from "@/utils/functions/auth-functions/fetchWithToken";
import { ArrowLeft, Blocks, Building, Contact, FileText, FileUp, User, History } from "lucide-react";
import ChangeEstadoContrato from "@/components/contratos/change-estado-contrato";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ProximoAumentoBadge from "@/components/contratos/proximo-aumento-badge";
import formatPrice from "@/utils/functions/price-convert";
import ServiciosContratoPage from "./servicios-contrato";
import ModalCargarPdf from "@/components/contratos/modal-cargar-pdf";
import ModalDefault from "@/components/modal-default";
import ModalError from "@/components/modal-error";
import PDFContratoCard from "./pdf-contrato-card";
import { useAuth } from "@/contexts/AuthProvider"


export default function DetalleContratoPage({contratoDetallado} : {contratoDetallado?: ContratoDetallado}) {

    const { hasPermission, hasRole, user } = useAuth();
    const router = useRouter();

    const params = useParams(); 
    const id = params.id as string;

    const [contratoBD, setContatoBD] = useState<ContratoDetallado>() //CAMBIAR EL NULL
    const [loading, setLoading] = useState(true);
    const [cancelacionDetalle, setCancelacionDetalle] = useState<any>(null); // Datos de cancelación
    const [loadingCancelacion, setLoadingCancelacion] = useState(false);
    // Estado modal cargar PDF
    const [openModalPdf, setOpenModalPdf] = useState(false);
    const [pdfOkMsg, setPdfOkMsg] = useState<string | null>(null);
    const [pdfErrMsg, setPdfErrMsg] = useState<string | null>(null);
    const [esVigente, setEsVigente] = useState(false);

    
    useEffect(() => {
        const fetchContrato = async () => {
            if(contratoDetallado !== undefined){
                setContatoBD(contratoDetallado);
                setLoading(false);
            }
            else{
                console.log("Ejecutando fetch de Contratos...");
                try {
                    const data = await fetchWithToken(`${BACKEND_URL}/contratos/${id}`);
                    setContatoBD(data);
    
                    setEsVigente(data?.estadoContratoId === 1);
                    
                    // Si el contrato está rescindido (estadoContratoId === 3), cargar detalles de cancelación
                    if (data?.estadoContratoId === 3) {
                        await fetchCancelacionDetalle(data.id);
                    }
                } catch (err: any) {
                    console.error("Error al traer Contratos:", err.message);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchContrato();
    }, [id]);

    const fetchCancelacionDetalle = async (contratoId: number) => {
        try {
            setLoadingCancelacion(true);
            const cancelacion = await fetchWithToken(`${BACKEND_URL}/cancelaciones-contratos/contrato/${contratoId}`);
            setCancelacionDetalle(cancelacion);
        } catch (error) {
            console.error("Error al cargar detalles de cancelación:", error);
            // No mostrar error al usuario si no encuentra cancelación, es opcional
        } finally {
            setLoadingCancelacion(false);
        }
    };

    // Función para actualizar estado y cargar cancelación si es necesario
    const handleEstadoActualizado = async (nuevoEstadoId: number) => {
        setContatoBD(prev => prev ? { ...prev, estadoContratoId: nuevoEstadoId } : prev);
        
        // Si cambió a rescindido, cargar detalles de cancelación
        if (nuevoEstadoId === 3 && contratoBD) {
            await fetchCancelacionDetalle(contratoBD.id);
        } else if (nuevoEstadoId !== 3) {
            // Si cambió a otro estado, limpiar datos de cancelación
            setCancelacionDetalle(null);
        }
    };

    // Función para formatear fecha de cancelación
    const formatearFechaCancelacion = (fechaISO: string) => {
        const fecha = new Date(fechaISO);
        return fecha.toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

      // Mostrar un mensaje de carga mientras los datos se están obteniendo
  if(loading){
    return(
      <div>
        <Loading text={`Cargando datos del contrato Nro. ${id}...`}/>
      </div>
    )
  }


      // Verificar si `contratoBD` es null antes de renderizar
  if (!contratoBD) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-lg font-bold text-red-700">No se encontró el contrato.</p>
      </div>
    );
  }
    return(
        <div className="min-h-screen bg-background">
           
            <main className="container mx-auto px-4 py-8 pt-25 sm:pt-28">
                    <div className="mb-8 flex flex-col gap-3">
                        <Button variant="outline" onClick={() => window.history.back()} className="w-fit">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                            Volver
                        </Button>
                    <div className="grid sm:grid-cols-2 items-center w-full my-5 sm:justify-between">
                        <div className="flex gap-2">
                            <FileText className="h-15 w-15 text-yellow-700" />
                            <div>
                                <h2 className="text-xl font-bold text-foreground font-sans">Contrato Nro. {contratoBD.id}</h2>
                                <p className="text-2xl font-medium font-sans text-secondary">{contratoBD.direccionInmueble}</p>
                            </div>
                        </div>
                        <div className="flex flex-col md:flex-row items-center md:justify-end gap-3 my-4">
                            <Button className="w-42" variant="outline" onClick={() => router.push(`/alquileres/${id}/historial-pago-alquiler`)}>
                                <History className="h-4 w-4 mr-2" /> Historial de Pagos
                            </Button>
                            <Button className="w-42" variant="outline" onClick={() => setOpenModalPdf(true)} disabled={contratoBD.estadoContratoId !== 1}>
                                <FileUp className="h-4 w-4 mr-2" /> Cargar PDF
                            </Button>
                            {contratoBD && (
                                <ChangeEstadoContrato
                                    disabled={!hasPermission("cambiar_estado_contrato")}
                                    contratoId={contratoBD.id}
                                    estadoActualId={contratoBD.estadoContratoId || 1}
                                    onEstadoActualizado={handleEstadoActualizado}
                                />
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/*Card DATOS CONTRATO*/}
                    <Card className="max-w-4xl ">
                        <CardHeader className="flex justify-between">
                            <div className="flex items-center gap-2">
                                <FileText className="h-5 w-5"/>
                                <CardTitle className="font-bold">Datos del Contrato</CardTitle>
                            </div>
                            {contratoBD.estadoContratoId === 1 &&
                            <ProximoAumentoBadge fechaAumento={contratoBD.fechaAumento} />
                            }
                        </CardHeader>

                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 justify-between">
                                <div className="flex gap-3">
                                    <h2 className="font-bold">Inicio:</h2>
                                    <p className="text-card-foreground">{contratoBD.fechaInicio}</p>
                                </div>
                                <div className="flex gap-3">
                                    <h2 className="font-bold">Finalización:</h2>
                                    <p className="text-orange-700 font-bold">{contratoBD.fechaFin}</p>
                                </div>
                                <div className="flex gap-3">
                                    <h2 className="font-bold">Peridos de Aumentos:</h2>
                                    <p className="text-card-foreground">Cada {contratoBD.periodoAumento} mes/es</p>
                                </div>
                                <div className="flex gap-3">
                                    <h2 className="font-bold">Próximo Aumento:</h2>
                                    <p className="text-orange-500 font-bold">
                                        {(() => {
                                            if (!contratoBD.fechaAumento) return "No especificado";
                                            const raw = String(contratoBD.fechaAumento).trim();
                                            // Si viene como dd/mm/aaaa, extraemos mm/aaaa directamente
                                            const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
                                            if (m) {
                                            const mes = m[2].padStart(2, "0");
                                            const anio = m[3];
                                            return `${mes}/${anio}`;
                                            }
                                            // Último recurso: devolver el string original
                                            return raw;
                                        })()}
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <h2 className="font-bold">Tipo de Aumento:</h2>
                                    <p className="text-card-foreground">{contratoBD.aumentaConIcl? "ICL" : "Porcentaje Fijo"}</p>
                                </div>
                                {(contratoBD.aumentaConIcl === false) &&(
                                    <div className="flex gap-3">
                                        <h2 className="font-bold">% Aumento:</h2>
                                        <p className="text-card-foreground">{contratoBD.porcentajeAumento}%</p>
                                    </div>
                                )}
                                <div className="flex gap-3">
                                    <h2 className="font-bold">Monto Inicial de Alquiler:</h2>
                                    <p className="text-card-foreground">{formatPrice(contratoBD.monto)}</p>
                                </div>

                                <div className="flex gap-3">
                                    <h2 className="font-bold">% Honorarios:</h2>
                                    <p className="text-card-foreground">{contratoBD.porcentajeHonorario}%</p>
                                </div>

                                {/* Detalles de Cancelación - Solo si está rescindido */}
                                {contratoBD.estadoContratoId === 3 && (
                                    <>
                                        <div className="col-span-full border-t pt-4 mt-4">
                                            <h3 className="font-bold text-red-500 mb-3 flex items-center gap-2">
                                                <FileText className="h-4 w-4" />
                                                Detalles de Rescisión
                                            </h3>
                                        </div>
                                        
                                        {loadingCancelacion ? (
                                            <div className="col-span-full flex items-center gap-2 text-muted-foreground">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                                Cargando detalles de rescisión...
                                            </div>
                                        ) : cancelacionDetalle ? (
                                            <>
                                                <div className="flex gap-3">
                                                    <h2 className="font-bold">Fecha de Rescisión:</h2>
                                                    <p className="text-red-500 font-bold">
                                                        {formatearFechaCancelacion(cancelacionDetalle.fechaCancelacion)}
                                                    </p>
                                                </div>
                                                <div className="flex gap-3">
                                                    <h2 className="font-bold">Motivo:</h2>
                                                    <p className="text-card-foreground font-medium">
                                                        {cancelacionDetalle.motivoCancelacionNombre}
                                                    </p>
                                                </div>
                                                <div className="col-span-full flex flex-col gap-2">
                                                    <h2 className="font-bold">Observaciones:</h2>
                                                    <p className="text-card-foreground bg-muted p-3 rounded-md text-sm">
                                                        {cancelacionDetalle.observaciones}
                                                    </p>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="col-span-full text-muted-foreground text-sm">
                                                No se encontraron detalles de rescisión.
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/*Card DATOS INMUEBLE*/}
                    <Card className="max-w-4xl">
                        <CardHeader >
                            <div className="flex items-center gap-2">
                                <Building className="h-5 w-5"/>
                                <CardTitle className="font-bold">Datos del Inmueble</CardTitle>
                            </div>
                        </CardHeader>

                        <CardContent>
                            <div className="grid grid-cols-1 gap-4 justify-between">
                                <div className="flex gap-3">
                                    <h2 className="font-bold">Dirección:</h2>
                                    <p className="text-card-foreground font-bold">{contratoBD.direccionInmueble}</p>
                                </div>
                                <div className="flex gap-3">
                                    <h2 className="font-bold">Tipo:</h2>
                                    <p className="text-card-foreground">{contratoBD.tipoInmueble}</p>
                                </div>
                                <div className="flex gap-3">
                                    <h2 className="font-bold">Superficie:</h2>
                                    <p className="text-card-foreground">{contratoBD.superficieInmueble !== null ? `${contratoBD.superficieInmueble} m²` : "No especificada"}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/*Card DATOS LOCATARIO*/}
                    <Card className="max-w-4xl">
                        <CardHeader >
                            <div className="flex items-center gap-2">
                                <User className="h-5 w-5"/>
                                <CardTitle className="font-bold">Datos del Locatario</CardTitle>
                            </div>
                        </CardHeader>

                        <CardContent>
                            <div className="grid grid-cols-1 gap-4 justify-between">
                                <div className="flex gap-3">
                                    <h2 className="font-bold">Nombre:</h2>
                                    <p className="text-card-foreground font-bold">{contratoBD.apellidoInquilino}, {contratoBD.nombreInquilino}</p>
                                </div>
                                <div className="flex gap-3">
                                    <h2 className="font-bold">CUIL:</h2>
                                    <p className="text-card-foreground">{contratoBD.cuilInquilino}</p>
                                </div>
                                <div className="flex gap-3">
                                    <h2 className="font-bold">Telefono:</h2>
                                    <p className="text-card-foreground">{`${contratoBD.telefonoInquilino}` || "No Especificado" }</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/*Card DATOS LOCADOR*/}
                    <Card className="max-w-4xl">
                        <CardHeader >
                            <div className="flex items-center gap-2">
                                <User className="h-5 w-5"/>
                                <CardTitle className="font-bold">Datos del Locador</CardTitle>
                            </div>
                        </CardHeader>

                        <CardContent>
                            <div className="grid grid-cols-1 gap-4 justify-between">
                                <div className="flex gap-3">
                                    <h2 className="font-bold">Nombre:</h2>
                                    <p className="text-card-foreground font-bold">{contratoBD.apellidoPropietario}, {contratoBD.nombrePropietario} </p>
                                </div>
                                <div className="flex gap-3">
                                    <h2 className="font-bold">DNI: </h2>
                                    <p className="text-card-foreground">{contratoBD.dniPropietario}</p>
                                </div>
                                <div className="flex gap-3">
                                    <h2 className="font-bold">Telefono: </h2>
                                    <p className="text-card-foreground">{`${contratoBD.telefonoPropietario}` || "No Especificado" }</p>
                                </div>
                                <div className="flex gap-3">
                                    <h2 className="font-bold">Email:</h2>
                                    <p className="text-card-foreground">{contratoBD.emailPropietario}</p>
                                </div>
                                <div className="flex gap-3">
                                    <h2 className="font-bold">Dirección:</h2>
                                    <p className="text-card-foreground">{`${contratoBD.direccionPropietario}` || "No Especificado" }</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                </div>

                <ServiciosContratoPage 
                    esVigente={esVigente} 
                    idContrato={contratoBD.id} 
                    fechaInicioContrato={contratoBD.fechaInicio}
                />

                <PDFContratoCard idContrato={contratoBD.id} tienePDF={contratoBD.tienePDF} />
            </main>
            {/* Modal para cargar PDF */}
            <ModalCargarPdf
                open={openModalPdf}
                onOpenChange={setOpenModalPdf}
                contratoId={contratoBD.id}
                onUploaded={(resp) => {
                    const msg = typeof resp === 'string' ? resp : 'El PDF se cargó correctamente.';
                    setPdfOkMsg(msg);
                }}
                onError={(m) => setPdfErrMsg(m)}
            />

            {pdfOkMsg && (
                <ModalDefault
                    titulo="PDF del Contrato"
                    mensaje={pdfOkMsg}
                    onClose={() => setPdfOkMsg(null)}
                />
            )}

            {pdfErrMsg && (
                <ModalError
                    titulo="Error al cargar PDF"
                    mensaje={pdfErrMsg}
                    onClose={() => setPdfErrMsg(null)}
                />
            )}
        </div>
    )
}
