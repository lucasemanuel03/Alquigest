import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, User, Edit, MapPin, Eye } from "lucide-react";
import Link from "next/link";
import { Propietario } from "@/types/Propietario";


export default function PropietarioCard(
    { propietario, showList, tienePermiso, handleEditOwner }: 
    { propietario: Propietario, showList: boolean, tienePermiso: boolean, handleEditOwner: (owner: Propietario) => void }) {
    return (
        <>
            <Card key={propietario.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <User className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {propietario.apellido}, {propietario.nombre}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">CUIL: {propietario.cuil}</p>
                    </div>
                  </div>
                  <Badge
                    variant={propietario.esActivo === true? "default" : "secondary"}
                    className={propietario.esActivo === true ? "bg-accent w-18" : "w-18"}
                  >
                    {propietario.esActivo=== true ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {!showList && (
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-muted-foreground truncate">{propietario.email}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-muted-foreground">{propietario.telefono || "No Especificado"}</span>
                    </div>
                    <div className="flex items-start text-sm">
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground mt-0.5" />
                      <span className="text-muted-foreground text-xs leading-relaxed">{propietario.direccion || "No Especificado"}{`, ${propietario.barrio}`}</span>
                    </div>
                  </div>
                )}
                

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Link href={`/propietarios/${propietario.id}`}>
                    <Button variant="outline" size="sm" className="w-full bg-transparent">
                      <Eye />
                      Ver Detalles
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full bg-transparent"
                    onClick={() => handleEditOwner(propietario)}
                    disabled={!tienePermiso}
                  >
                    <Edit />
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
        </>


);
}