"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {  Phone, User, Edit, SquareX, SquareCheck, Eye, MapPin } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import HeaderAlquigest from "@/components/header"
import Loading from "@/components/loading"
import NuevoInquilinoModal from "./nuevoInquilinoModal"
import { Inquilino } from "@/types/Inquilino"
import { fetchWithToken } from "@/utils/functions/auth-functions/fetchWithToken"
import { useAuth } from "@/contexts/AuthProvider"
import { Switch } from "@/components/ui/switch"
import ModalError from "@/components/modal-error"
import BarraBusqueda from "@/components/busqueda/barra-busqueda"

export default function InquilinosPage() {

  // Obtener función de verificación de permisos desde AuthProvider
  const { hasPermission } = useAuth();

  //DATOS REALES
  const [InquilinosBD, setInquilinosBD] = useState<Inquilino[]>([]);
  const [inquilinosMostrar, setInquilinosMostrar] = useState<Inquilino[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState("")
  const [mostrarError, setMostrarError] = useState(false)
  const [loadingActualizacion, setLoadingActualizacion] = useState(false)
  const [filtroInactivos, setFiltroInactivos] = useState(false);
 
  useEffect(() => {
    const fetchInquilinos = async () => {
      const url = filtroInactivos
        ? '/inquilinos/inactivos'
        : '/inquilinos/activos';

      try{
          const data = await fetchWithToken(url)
          // Ordenar por apellido ascendente
          const dataOrdenada = data.sort((a: Inquilino, b: Inquilino) =>
            a.apellido.localeCompare(b.apellido));
          setInquilinosBD(dataOrdenada)
          setLoading(false)
      } catch(err) {
        console.log("Error al traer inquilinos: ", err)
        setLoading(false)
      
      } finally {
        setLoading(false);
      }
    }
    fetchInquilinos()
  }, [filtroInactivos]);

  const [isEditInquilinoOpen, setIsEditInquilinoOpen] = useState(false)
  const [editingInquilino, setEditingInquilino] = useState({
    nombre: "",
    apellido: "",
    cuil: "",
    telefono: "",
    esActivo: true,
    barrio: "",
    direccion: ""
  })

 
  const handleEditInquilino = (inquilino: any) => {
    setEditingInquilino(inquilino)
    setIsEditInquilinoOpen(true)
  }

  const handleUpdateInquilino = async () => {
    setLoadingActualizacion(true);
    try {
      let updatedInquilino;

      // Caso: si se está desactivando al inquilino
      if (!editingInquilino.esActivo) {
        const response = await fetchWithToken(
          `/inquilinos/${(editingInquilino as any).id}/desactivar`,
          {
            method: "PATCH",
          }
        );

        // ✅ Manejar respuesta 204 (sin contenido)
        updatedInquilino = {
          ...editingInquilino,
          esActivo: false
        };

      } else {
        // Caso normal: actualización de datos
        const response = await fetchWithToken(
          `/inquilinos/${(editingInquilino as any).id}`,
          {
            method: "PUT",
            body: JSON.stringify(editingInquilino),
          }
        );

        updatedInquilino = response;
      }

      // ✅ VALIDACIÓN AGREGADA
      if (!updatedInquilino || !updatedInquilino.id) {
        console.error("Respuesta inválida del servidor:", updatedInquilino);
        throw new Error("El servidor no retornó el inquilino actualizado");
      }

      // Actualizar estado local
      setInquilinosBD((prev) =>
        prev.map((p) => (p.id === updatedInquilino.id ? updatedInquilino : p))
      );

      // Resetear form
      setIsEditInquilinoOpen(false);
      setEditingInquilino({
        nombre: "",
        apellido: "",
        cuil: "",
        telefono: "",
        esActivo: true,
        barrio: "",
        direccion: ""
      });

    } catch (error: any) {
      console.error("Error al Editar Locatario:", error);
      setErrorCarga(error?.message || "Error del servidor...");
      setMostrarError(true);
    } finally {
      setLoadingActualizacion(false);
    }
  };


  if (loading) return(
    <div>
      <Loading text="Cargando Locatarios..."/>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-8 pt-25 sm:pt-28">
        {/* Page Title */}
        <div className="mb-8 flex flex-col gap-5">
          <div className="mt-8 flex items-center justify-between">
            <Link href="/">
              <Button variant="outline">← Volver</Button>
            </Link>
            <NuevoInquilinoModal
                onInquilinoCreado={(nuevo) => setInquilinosBD(prev => [...prev, nuevo])}
              />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">{filtroInactivos? "Locatarios Inactivos":"Locatarios Activos"}</h2>
              <p className="text-muted-foreground text-sm md:text-xl font-sans">Cantidad Actual: {InquilinosBD.length}</p>
            </div>
             <Button
                onClick={() => setFiltroInactivos(!filtroInactivos)} 
                className="transition-all"
                variant="outline">
                {!filtroInactivos? <div className="flex gap-2 items-center"><SquareX/>Ver Inactivos</div> : <div className="flex gap-2 items-center"><SquareCheck/>Ver Activos</div> }
              </Button>
          </div>
        </div>

        <BarraBusqueda
            arrayDatos={InquilinosBD}
            placeholder="Buscar por nombre, apellido o CUIL..."
            setDatosFiltrados={setInquilinosMostrar}
            propiedadesBusqueda={["apellido", "nombre", "cuil"]}
          />

        {/* Inquilinos Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {inquilinosMostrar.map((inquilino) => (
            <Card key={inquilino.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <User className="h-8 w-8 text-primary" />
                    </div>
  
                    <div>
                      <CardTitle className="text-lg">
                        {inquilino.apellido}, {inquilino.nombre}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">CUIL: {inquilino.cuil}</p>
                    </div>
                
                  </div>
                  <Badge
                    variant={inquilino.esActivo === true? "default" : "secondary"}
                    className={inquilino.esActivo === true ? "bg-accent w-18" : "w-18"}
                  >
                    {inquilino.esActivo=== true ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Contact Info */}
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-muted-foreground">{inquilino.telefono || "No Especificada"}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">{inquilino.direccion || "No Especificada"}{`, ${inquilino.barrio}`}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Link href={`/inquilinos/${inquilino.id}`}>
                    <Button variant="outline" size="sm" className="w-full bg-transparent">
                      <Eye />
                      Ver Detalles
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full bg-transparent"
                    onClick={() => handleEditInquilino(inquilino)}
                    disabled={!hasPermission("modificar_inquilino")}
                  >
                    <Edit />
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={isEditInquilinoOpen} onOpenChange={setIsEditInquilinoOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Locatario</DialogTitle>
            </DialogHeader>

            {editingInquilino && (
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault()
                  handleUpdateInquilino()
                }}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-nombre">Nombre</Label>
                    <Input
                      required
                      id="edit-nombre"
                      value={editingInquilino.nombre}
                      onChange={(e) => setEditingInquilino({ ...editingInquilino, nombre: e.target.value })}
                    />
                  </div>
              
                  <div>
                    <Label htmlFor="edit-apellido">Apellido</Label>
                    <Input
                      required
                      id="edit-apellido"
                      value={editingInquilino.apellido}
                      onChange={(e) => setEditingInquilino({ ...editingInquilino, apellido: e.target.value })}
                    />
                  </div>
                  
                </div>

                <div>
                  <Label htmlFor="edit-cuil">CUIL</Label>
                  <Input id="edit-cuil" value={editingInquilino.cuil} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground mt-1">El CUIL no se puede modificar</p>
                </div>

                <div>
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    type="tel"
                    maxLength={12}
                    value={editingInquilino.telefono}
                    onChange={(e) =>{
                      const value = e.target.value.replace(/[^0-9()+-\s]/g, "");
                      setEditingInquilino({ ...editingInquilino, telefono: value })
                    }}
                    placeholder="351-4455667"
                  />
                </div>
                <div>
                    <Label htmlFor="edit-direccion">Dirección</Label>
                    <Input
                      required
                      id="edit-direccion"
                      value={editingInquilino.direccion}
                      onChange={(e) => setEditingInquilino({ ...editingInquilino, direccion: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-barrio">Barrio</Label>
                    <Input
                      required
                      id="edit-barrio"
                      value={editingInquilino.barrio}
                      onChange={(e) => setEditingInquilino({ ...editingInquilino, barrio: e.target.value })}
                    />
                  </div>

                <div>
                  <Label htmlFor="edit-estado">Estado</Label>
                  <Select
                    value={editingInquilino.esActivo ? "true" : "false"}
                    onValueChange={(value) => setEditingInquilino({ ...editingInquilino, esActivo: value === "true" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Activo</SelectItem>
                      <SelectItem value="false">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    type="submit" 
                    className="flex-1"
                    loading={loadingActualizacion}
                  >
                    Guardar Cambios
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditInquilinoOpen(false)}
                    className="flex-1"
                    disabled={loadingActualizacion}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

      </main>
            {mostrarError && (
              <ModalError
                titulo="Error al editar Locatario"
                mensaje={errorCarga}
                onClose={() => setMostrarError(false)}
              />
            )}
    </div>
  )
}
