import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import BACKEND_URL from "@/utils/backendURL";
import { fetchWithToken } from "@/utils/functions/auth-functions/fetchWithToken";
import { useEffect, useState } from "react";
import { FileText, ExternalLink } from "lucide-react";

export default function PDFContratoCard({idContrato, tienePDF}: {idContrato: number, tienePDF: boolean}) {

        const [pdfUrl, setPdfUrl] = useState<string | null>(null);
        const [errorMsg, setErrorMsg] = useState<string | null>(null);
        const [loading, setLoading] = useState(false);

        // limpiar URL creada cuando el componente se desmonta o se reemplaza el pdf
        useEffect(() => {
            return () => {
                if (pdfUrl) URL.revokeObjectURL(pdfUrl);
            };
        }, [pdfUrl]);

        const handleVerPdf = async () => {
            setErrorMsg(null);
            setLoading(true);
            try {
                // Endpoint de descarga del PDF
                const blob = await fetchWithToken(`${BACKEND_URL}/contratos/${idContrato}/pdf`);
                if (blob instanceof Blob) {
                    const url = URL.createObjectURL(blob);
                    // liberar URL anterior si existía
                    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
                    setPdfUrl(url);
                    // abrir en nueva pestaña
                    window.open(url, "_blank");
                } else {
                    setErrorMsg("La respuesta no fue un PDF válido");
                }
            } catch (err: any) {
                setErrorMsg(err.message || "No se pudo obtener el PDF del contrato");
            } finally {
                setLoading(false);
            }
        };

  return (
    <div className="w-full">
        <div>
            <div className="flex items-center">
                <FileText className="h-7 w-7 mr-2 text-primary" />
                <h2 className="text-xl font-bold text-foreground font-sans">Documento PDF del Contrato</h2>
            </div>
        </div> 
        <div className="mt-10 sm:ml-5">
            <Card >
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5"/>
                        <CardTitle className="font-bold">Documento PDF del Contrato</CardTitle>
                    </div>
                </CardHeader>

                <CardContent>
                    <div className="flex flex-col gap-4">
                        {tienePDF ? (
                             <p className="text-sm text-muted-foreground">
                            Visualice el documento PDF del contrato si ha sido cargado previamente.
                            </p>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                            Este contrato no tiene un documento PDF cargado.
                            </p>
                        )}
                       
                        <div className="flex items-center gap-3">
                            <Button onClick={handleVerPdf} loading={loading} variant="default" disabled={!tienePDF}>
                                <FileText className="h-4 w-4 mr-2" />
                                Ver PDF del Contrato
                            </Button>
                            {pdfUrl && (
                                <Button
                                    variant="outline"
                                    onClick={() => window.open(pdfUrl, "_blank")}
                                >
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Abrir en nueva pestaña
                                </Button>
                            )}
                        </div>
                        {errorMsg && (
                            <div className="mt-2 p-3 bg-destructive/10 border border-destructive/20 dark:bg-destructive/20 w-fit rounded-md">
                                <p className="text-sm text-foreground">{errorMsg}</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
  )
}
