"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { Propietario } from "@/types/Propietario"
import BACKEND_URL from "@/utils/backendURL"
import NuevoPropietarioModal from "@/app/propietarios/nuevoPropietarioModal"
import ModalError from "@/components/modal-error"
import ModalDefault from "@/components/modal-default"
import { fetchWithToken } from "@/utils/functions/auth-functions/fetchWithToken"
import { ESTADOS_INMUEBLE, ESTADOS_NUEVO_INMUEBLE } from "@/utils/constantes"
import ModalConfirmacion from "@/components/modal-confirmacion"

export default function NuevoInmueblePage() {

  const [inmuebleCargado, setInmuebleCargado] = useState(false)
  const [errorCarga, setErrorCarga] = useState("")
  const [mostrarError, setMostrarError] = useState(false)
  const [loadingCreacion, setLoadingCreacion] = useState(false) // nuevo estado para loading

  // Modal de confirmación por dirección duplicada
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false)
  const [continuarRegistro, setContinuarRegistro] = useState(false)

  // PARA DATOS PROPIETARIOS
  const [propietariosBD, setPropietariosBD] = useState<Propietario[]>([]);
  const [isNewOwnerOpen, setIsNewOwnerOpen] = useState(true)

  const [formData, setFormData] = useState({
    propietarioId: "",
    direccion: "",
    estado: "1", // valor por defecto
    tipoInmuebleId: "",
    superficie: "",
    esActivo: "true",
    esAlquilado: "false",
  });

  // Traer propietarios (solo fetch, sin mutar formData directamente)
  useEffect(() => {
    fetchWithToken(`${BACKEND_URL}/propietarios/activos`)
      .then((data) => {
        setPropietariosBD(data);
      })
      .catch((err) => {
        console.error("Error al traer propietarios:", err);
      });
  }, []);

  // Mantener esActivo / esAlquilado consistentes cuando cambie estado
  useEffect(() => {
    setFormData(prev => {
      const estado = prev.estado || "1";
      return {
        ...prev,
        esActivo: estado !== "3" ? "true" : "false",
        esAlquilado: estado === "4" ? "true" : "false",
      };
    });
  }, [formData.estado]);

    // Verificar dirección antes de crear
  const verificarDireccion = async () => {
    try {
      const params = new URLSearchParams({ direccion: formData.direccion })
      const url = `${BACKEND_URL}/inmuebles/buscar-direccion?${params.toString()}`
      
      const result = await fetchWithToken(url, { method: "GET" })

      // Si el endpoint devuelve algo → existe
      if (result.length > 0) {
        setMostrarConfirmacion(true)
        return false
      }
      return true
    } catch (err) {
      console.warn("Error al verificar dirección, continuando...", err)
      return true
    }
  }


  const handleNewInmueble = async () => {
    setLoadingCreacion(true); // Activar loading
    try {
      const createdInmueble = await fetchWithToken(`${BACKEND_URL}/inmuebles`, {
        method: "POST",
        body: JSON.stringify(formData),
      });
      console.log("Inmueble creado con éxito:", createdInmueble);

      setInmuebleCargado(true);

      setFormData({
        propietarioId: "",
        direccion: "",
        tipoInmuebleId: "",
        estado: "1",
        superficie: "",
        esActivo: "true",
        esAlquilado: "false",
      });
      setIsNewOwnerOpen(false);
    } catch (error: any) {
      console.error("Error al crear Inmueble:", error);
      setErrorCarga(error.message || "No se pudo conectar con el servidor");
      setMostrarError(true);
    } finally {
      setLoadingCreacion(false); // Desactivar loading
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!formData.direccion || !formData.tipoInmuebleId || !formData.estado || !formData.propietarioId) {
        setErrorCarga("Por favor, complete todos los campos obligatorios.");
        setMostrarError(true);
        return;
      }

      if (!continuarRegistro) {
        const puedeContinuar = await verificarDireccion()
        if (!puedeContinuar) return // se abre modal de confirmación
      }

      handleNewInmueble();
      setContinuarRegistro(false) // reset
    };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-8 pt-25 sm:pt-28">
        <div className="mb-8 flex flex-col gap-3">
          <div>
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Registrar Nuevo Inmueble</h2>
        </div>

        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="font-sans">Complete los datos del inmueble a registrar</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="direccion">Dirección *</Label>
                  <Input
                    id="direccion"
                    placeholder="Ej: Calle Mayor 123, Madrid"
                    value={formData.direccion}
                    onChange={(e) => handleInputChange("direccion", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipoInmueble">Tipo de Inmueble *</Label>
                  <Select 
                    required
                    value={formData.tipoInmuebleId} 
                    onValueChange={(value) => handleInputChange("tipoInmuebleId", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Departamento</SelectItem>
                      <SelectItem value="2">Casa</SelectItem>
                      <SelectItem value="3">Local Comercial</SelectItem>
                      <SelectItem value="4">Oficina</SelectItem>
                      <SelectItem value="5">Depósito</SelectItem>
                      <SelectItem value="6">Terreno</SelectItem>
                      <SelectItem value="7">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="superficie">Superficie (m²)</Label>
                  <Input
                    id="superficie"
                    type="number"
                    min={0}
                    placeholder="Ej: 85"
                    value={formData.superficie}
                    onChange={(e) => handleInputChange("superficie", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="propietario">Locador *</Label>
                  <div className="flex flex-1 min-w-0 gap-2 ">
                    <Select
                      required
                      value={formData.propietarioId}
                      onValueChange={(value) => handleInputChange("propietarioId", value)}
                    >
                      <SelectTrigger className="w-55">
                        <SelectValue className="overflow-hidden text-ellipsis" placeholder="Seleccionar Locador" />
                      </SelectTrigger>
                      <SelectContent className="">
                        {propietariosBD.map((propietario) => (
                          <SelectItem
                            key={propietario.id}
                            value={propietario.id.toString()}
                            className="overflow-auto text-ellipsis"
                          >
                            {propietario.nombre} {propietario.apellido} | CUIL: {propietario.cuil}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* BOTON PARA ABRIR MODAL NUEVO PROPIETARIO */}
                    <NuevoPropietarioModal 
                      text="Nuevo" 
                      onPropietarioCreado={(nuevo) => {
                        // agrego a la lista y selecciono el nuevo propietario automáticamente
                        setPropietariosBD(prev => [...prev, nuevo]);
                        setFormData(prev => ({ ...prev, propietarioId: nuevo.id.toString() }));
                        setErrorCarga("");
                        setMostrarError(false);
                      }}
                    /> 
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-4 pt-6">
                <Link href="/inmuebles" className="flex-1">
                  <Button 
                    onClick={() => setIsNewOwnerOpen(false)} 
                    type="button" 
                    variant="outline" 
                    className="w-full bg-transparent"
                    disabled={loadingCreacion}
                  >
                    Cancelar
                  </Button>
                </Link>
                <Button 
                  type="submit" 
                  className="flex-1"
                  loading={loadingCreacion}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Registrar Inmueble
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      {mostrarError && (
        <ModalError
          titulo="Error al crear Inmueble"
          mensaje={errorCarga}
          onClose={() => setMostrarError(false)}
        />
      )}

      {inmuebleCargado && (
        <ModalDefault
          titulo="Nuevo Inmueble"
          mensaje="El inmueble se ha creado correctamente."
          onClose={() => setInmuebleCargado(false)}
        />
      )}

      {mostrarConfirmacion && (
        <ModalConfirmacion
          open={mostrarConfirmacion}
          titulo="Dirección duplicada"
          mensaje="Ya existe un inmueble con esa dirección, ¿desea registrarlo igual?"
          onCancel={() => setMostrarConfirmacion(false)}
          onConfirm={() => {
            setMostrarConfirmacion(false)
            setContinuarRegistro(true)
            handleNewInmueble()
          }}
        />
      )}
    </div>
  )
}
