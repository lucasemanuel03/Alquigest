"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save, ArrowLeft } from "lucide-react";
import ModalError from "@/components/modal-error";
import ModalDefault from "@/components/modal-default";
import { fetchWithToken } from "@/utils/functions/auth-functions/fetchWithToken";
import BACKEND_URL from "@/utils/backendURL";
import { Progress } from "@/components/ui/progress";
import { useNuevoContratoForm } from "@/hooks/useNuevoContratoForm";
import Paso1InmuebleLocatario from "@/components/contratos/nuevo/Paso1InmuebleLocatario";
import Paso2Fechas from "@/components/contratos/nuevo/Paso2Fechas";
import Paso3DatosAlquiler from "@/components/contratos/nuevo/Paso3DatosAlquiler";
import Paso4Resumen from "@/components/contratos/nuevo/Paso4Resumen";
import Paso4CargaServicios from "@/components/contratos/nuevo/Paso4CargaServicios";
import PasoCargaPdf from "@/components/contratos/nuevo/pasoExtraCargaPdf";
import Loading from "@/components/loading";

export default function NuevoContratoPage() {
  const {
    formData,
    datosAdicionales,
    serviciosContrato,
    setServiciosContrato,   
    pdfFile,
    setPdfFile,
    step,
    setStep,
    montoDisplay,
    handleInputChange,
    handleMontoChange,
    onBlurMonto,
    selectInmueble,
    selectInquilino,
    isStepValid,
    resetForm,
    prepararContratoParaEnvio,
    construirServiciosContrato,
    formatMontoVisual,
  } = useNuevoContratoForm();
  const [contratoCargado, setContratoCargado] = useState(false);
  const [datosNuevoContrato, setDatosNuevoContrato] = useState<any>(null);
  const [errorCarga, setErrorCarga] = useState("");
  const [mostrarError, setMostrarError] = useState(false);
  const [loadingCreacion, setLoadingCreacion] = useState(false); // nuevo estado para loading
  const [inmueblesDisponibles, setInmueblesDisponibles] = useState<any[]>([]);
  const [propietarios, setPropietarios] = useState<any[]>([]);
  const [inquilinosDisponibles, setInquilinosDisponibles] = useState<any[]>([]);


  // Traer inmuebles disponibles
  useEffect(() => {
    fetchWithToken(`${BACKEND_URL}/inmuebles/disponibles`)
      .then((data) => setInmueblesDisponibles(data))
      .catch((err) => console.error("Error inmuebles:", err));
  }, [contratoCargado]);

  // Traer propietarios activos
  useEffect(() => {
    fetchWithToken(`${BACKEND_URL}/propietarios`)
      .then((data) => setPropietarios(data))
      .catch((err) => console.error("Error propietarios:", err));
  }, [contratoCargado]);

  // Traer inquilinos disponibles
  useEffect(() => {
    fetchWithToken(`${BACKEND_URL}/inquilinos/activos`)
      .then((data) => {
        // Ordenar alfabeticamente por apellido (insensible a acentos y mayúsculas)
        const ordenados = [...data].sort((a, b) => {
          const apA = a?.apellido || "";
          const apB = b?.apellido || "";
            return apA.localeCompare(apB, 'es', { sensitivity: 'base' });
        });
        setInquilinosDisponibles(ordenados);
      })
      .catch((err) => console.error("Error inquilinos:", err));
  }, [contratoCargado]);

  const handleNewContrato = async () => {
    const contratoEnviar = prepararContratoParaEnvio();
     
    try {
      const nuevoContrato = await fetchWithToken(`${BACKEND_URL}/contratos`, {
        method: "POST",
        body: JSON.stringify(contratoEnviar),
      });
      setDatosNuevoContrato(nuevoContrato);
      
      // Retornar el contrato para usarlo inmediatamente
      return nuevoContrato;
    } catch (error: any) {
      console.error("Error al crear contrato:", error);
      setErrorCarga(error.message || "No se pudo conectar con el servidor");
      setMostrarError(true);
      throw error; // Re-lanzar el error para manejarlo en handleSubmit
    }
  };

  const handleCargarServicios = async (contratoId: number) => {
    const serviciosParaEnvio = construirServiciosContrato();
    
    if (!contratoId) {
      console.error("No hay contrato cargado para asociar servicios");
      return;
    }
    
    // Asociar el contratoId a cada servicio
    const serviciosConContrato = serviciosParaEnvio.map((s: any) => ({
      ...s,
      contratoId: contratoId,
      nroContrato: contratoId.toString(),
    }));
    
    console.log("Servicios a enviar (array):", serviciosConContrato);

    try {
      // Enviar todos los servicios en un solo array
      await fetchWithToken(`${BACKEND_URL}/servicios-contrato`, {
        method: "POST",
        body: JSON.stringify(serviciosConContrato),
      });
      
      console.log("Servicios cargados exitosamente");
    } catch (error: any) {
      console.error("Error al cargar servicios:", error);
      setErrorCarga(error.message || "No se pudo conectar con el servidor");
      setMostrarError(true);
      // No interrumpir el flujo principal, solo loguear el error
    }
  }

  // Cargar PDF si fue seleccionado
  const handleSubirPdf = async (contratoId: number) => {
    try {
      if (!pdfFile) return; // opcional
      const form = new FormData();
      form.append('file', pdfFile);
      await fetchWithToken(`${BACKEND_URL}/contratos/${contratoId}/pdf`, {
        method: 'POST',
        body: form,
      });
    } catch (error: any) {
      console.error('Error al subir PDF:', error);
      setErrorCarga(error.message || 'No se pudo cargar el PDF');
      setMostrarError(true);
    }
  };

  // Función que coordina todo el proceso
  const handleSubmitContrato = async () => {
    setLoadingCreacion(true); // Activar loading
    try {
      // Paso 1: Crear el contrato y esperar la respuesta
      const nuevoContrato = await handleNewContrato();
      
      if (nuevoContrato && nuevoContrato.id) {
        // Paso 2: Cargar los servicios usando el ID del contrato recién creado
        await handleCargarServicios(nuevoContrato.id);
        // Paso 3: Subir PDF si corresponde
        await handleSubirPdf(nuevoContrato.id);
        
        // Paso 4: Mostrar éxito y resetear
        setContratoCargado(true);
        resetForm();
      }
    } catch (error) {
      console.error("Error en el proceso de creación del contrato:", error);
      // El error ya fue manejado en handleNewContrato
    } finally {
      setLoadingCreacion(false); // Desactivar loading
    }
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Paso1InmuebleLocatario
            inmuebles={inmueblesDisponibles}
            propietarios={propietarios}
            inquilinos={inquilinosDisponibles}
            formData={formData}
            datosAdicionales={datosAdicionales}
            onSelectInmueble={(inmueble, propietario) => selectInmueble(inmueble, propietario)}
            onSelectInquilino={(inquilino) => selectInquilino(inquilino)}
            onInquilinoCreado={(nuevo) => {
              setInquilinosDisponibles(prev => {
                const arr = [...prev, nuevo];
                return arr.sort((a,b) => (a?.apellido || "").localeCompare(b?.apellido || "", 'es', { sensitivity: 'base' }));
              });
              selectInquilino(nuevo);
            }}
            onInmuebleCreado={(data) => {
              const { inmueble, propietario } = data;
              setInmueblesDisponibles(prev => [...prev, inmueble]);
              
              // Si viene un propietario nuevo, agregarlo a la lista
              if (propietario) {
                setPropietarios(prev => {
                  // Evitar duplicados
                  const exists = prev.some(p => p.id === propietario.id);
                  return exists ? prev : [...prev, propietario];
                });
              }
              
              // Buscar el propietario (ya sea del array o el nuevo)
              const propietarioFinal = propietario || propietarios.find(p => p.id === inmueble.propietarioId);
              selectInmueble(inmueble, propietarioFinal);
            }}
            onPropietarioCreado={(nuevo) => {
              setPropietarios(prev => {
                // Evitar duplicados
                const exists = prev.some(p => p.id === nuevo.id);
                return exists ? prev : [...prev, nuevo];
              });
            }}
          />
        );
      case 2:
        return <Paso2Fechas formData={formData} onChange={handleInputChange} />;
      case 3:
        return (
          <Paso3DatosAlquiler
            formData={formData}
            montoDisplay={montoDisplay}
            onMontoChange={handleMontoChange}
            onMontoBlur={onBlurMonto}
            onChange={handleInputChange}
            formatMontoVisual={formatMontoVisual}
          />
        );
      case 4:
        return (
          <Paso4CargaServicios
            setServiciosContrato={setServiciosContrato}
            formData={formData}
            datosAdicionales={datosAdicionales}
            serviciosContrato={serviciosContrato}
            formatMontoVisual={formatMontoVisual}
          />
        );

      case 5:
        return (
          <PasoCargaPdf
            pdfFile={pdfFile}
            setPdfFile={setPdfFile}
          />
        );
      case 6:
        return (
          <Paso4Resumen
            serviciosContrato={serviciosContrato}
            formData={formData}
            datosAdicionales={datosAdicionales}
            formatMontoVisual={formatMontoVisual}
            pdfFile={pdfFile}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background pt-25">
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8 flex flex-col gap-3">
            <Button variant="outline" onClick={() => window.history.back()} className="w-fit">
              <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
            </Button>
          <div>
            <h2 className="text-3xl font-bold text-foreground">
              Registrar Nuevo Contrato
            </h2>
            <p>Complete el formulario con los datos solicitados</p>
          </div>
        </div>

        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Paso {step} de 6</CardTitle>
            <Progress value={(step * 100)/6} />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {renderStep()}
              <div className="flex justify-between pt-6">
                {step > 1 && (
                  <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>Anterior</Button>
                )}
                {step < 6 ? (
                  <Button type="button" onClick={() => setStep(step + 1)} disabled={!isStepValid(step)}>Siguiente</Button>
                ) : (
                  <Button 
                    type="button" 
                    onClick={handleSubmitContrato} 
                    disabled={!isStepValid(step)}
                    loading={loadingCreacion}
                  >
                    <Save className="h-4 w-4 mr-2" />Confirmar y Registrar
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {mostrarError && (
        <ModalError
          titulo="Error al crear Contrato"
          mensaje={errorCarga}
          onClose={() => setMostrarError(false)}
        />
      )}
      {contratoCargado && (
        <ModalDefault
          titulo="Nuevo Contrato"
          mensaje="El contrato se ha creado correctamente."
          onClose={() => setContratoCargado(false)}
        />
      )}
    </div>
  );
}
