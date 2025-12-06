"use client";
import NuevaContrasenaCard from "@/components/contrasenas/nueva-contrasena-card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, KeyRound, LockKeyholeOpen } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function NuevaContrasenaPage() {

    const searchParams = useSearchParams()
    const [hayToken, setHayToken] = useState(false)
    const [token, setToken] = useState<string>("")

    useEffect(() => {
    // Obtener el parámetro 'token' de la URL
    const tokenParam = searchParams.get('token')
    setToken(tokenParam || "")
    
    if (tokenParam) {
        console.log('Token recibido')
        setHayToken(true)
      // Aquí podés hacer lo que necesites con el token
    } else {
        console.log('No hay token en la URL')
        setHayToken(false)
    }
  }, [searchParams])


  return (
        <main className="container h-screen mx-auto px-6 py-8 pt-25 sm:pt-28">
            {hayToken ? (
                <>
                    <div className="flex flex-col gap-3 mb-8">
                        <Button variant="outline" onClick={() => window.history.back()} className="w-fit">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Volver
                        </Button>
                        <div className="flex items-center m-5 gap-2">
                            <LockKeyholeOpen className="h-11 w-11" />
                            <h1 className="text-3xl font-bold">Nueva contraseña</h1>
                        </div>
                    </div>
                    <div className="flex items-center justify-center">
                        <NuevaContrasenaCard token={token}/>
                    </div>
                </>) : (
            <div className="p-4 text-center">
              <p className="text-sm text-gray-500">Inicie Sesion para continuar.</p>
            </div>
        )}
    </main>
  )
}