import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Heart, Code, Sparkles } from "lucide-react";

export default function EquipoPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header Section */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Users className="h-10 w-10 text-primary" />
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            El Equipo Alquigest
          </h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Conocé a las personas detrás de la plataforma que revoluciona la gestión de alquileres
        </p>
      </div>

      {/* Main Card */}
      <Card className="overflow-hidden border-2 shadow-xl">
        <CardHeader className="">
          <CardTitle className="text-2xl flex items-center gap-2">
            <Sparkles className="h-6 w-6" />
            Nuestro Equipo
          </CardTitle>
          <CardDescription className="text-base">
            Un grupo apasionado de desarrolladores comprometidos con crear la mejor experiencia para la gestión de propiedades
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6">
          {/* Team Image */}
          <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-lg mb-6">
            <Image
              src="/alquigest-team.jpeg"
              alt="Equipo de Alquigest"
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Team Description */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Code className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Desarrollo con Pasión</h3>
                <p className="text-muted-foreground">
                  Nuestro equipo combina experiencia técnica con una visión innovadora para crear 
                  soluciones que realmente marcan la diferencia en la gestión de propiedades de alquiler.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Heart className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Compromiso con la Excelencia</h3>
                <p className="text-muted-foreground">
                  Cada línea de código, cada diseño y cada funcionalidad están pensados para 
                  facilitar tu día a día y optimizar la gestión de tus inmuebles.
                </p>
              </div>
            </div>
          </div>

          {/* Stats/Badges */}
          <div className="flex flex-wrap gap-2 mt-8 justify-center">
            <Badge variant="secondary" className="text-sm py-2 px-4">
              🚀 Innovación Constante
            </Badge>
            <Badge variant="secondary" className="text-sm py-2 px-4">
              💡 Soluciones Inteligentes
            </Badge>
            <Badge variant="secondary" className="text-sm py-2 px-4">
              🎯 Enfoque en el Usuario
            </Badge>
            <Badge variant="secondary" className="text-sm py-2 px-4">
              ⚡ Desarrollo Ágil
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Mission Section */}
      <div className="mt-12 grid md:grid-cols-3 gap-6">
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">🎯 Nuestra Misión</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Simplificar la gestión de alquileres mediante tecnología intuitiva y confiable
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">👁️ Nuestra Visión</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Ser la plataforma líder en gestión inmobiliaria, reconocida por su innovación y eficiencia
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">💪 Nuestros Valores</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Excelencia, transparencia, innovación y compromiso con nuestros usuarios
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
