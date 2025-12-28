import { User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "@/components/ui/badge"
import { Phone, MapPin, Eye, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function InquilinoCard({key, inquilino, onEdit, canEdit}: {key: number, inquilino: any, onEdit: (inquilino: any) => void, canEdit: boolean }) {
    return(
        <>
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
                    onClick={() => onEdit(inquilino)}
                    disabled={!canEdit}
                  >
                    <Edit />
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
        </>
    )
}