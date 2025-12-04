"use client"

import { useState } from "react"

import { KeySquare } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import BACKEND_URL from "@/utils/backendURL";
import ModalDefault from "../modal-default";
import ModalError from "../modal-error";

export default function NuevaContrasenaCard({token}: {token?: string}) {
  const [nuevaContrasena, setNuevaContrasena] = useState("")
  const [confirmarContrasena, setConfirmarContrasena] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [mostrarExito, setMostrarExito] = useState(false)
  const [mostrarError, setMostrarError] = useState(false)
  const [mensajeError, setMensajeError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validación: las contraseñas deben coincidir
    if (nuevaContrasena !== confirmarContrasena) {
      setError("Las contraseñas no coinciden")
      return
    }

    // Validación: contraseña no vacía
    if (!nuevaContrasena || nuevaContrasena.trim().length === 0) {
      setError("La contraseña no puede estar vacía")
      return
    }

    if (!token) {
      setError("Token inválido o no proporcionado")
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${BACKEND_URL}/auth/resetear-contrasena`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          token: token,
          nuevaContrasena: nuevaContrasena,
          confirmarContrasena: confirmarContrasena,
        }),
      })

      if (!response.ok) {
        // Intentar parsear mensaje de error del backend
        let mensaje = "Error al cambiar la contraseña"
        try {
          const errorData = await response.json()
          mensaje = errorData.message || mensaje
        } catch {
          // Si no se puede parsear, usar mensaje genérico
        }
        throw new Error(mensaje)
      }

      // Éxito
      setMostrarExito(true)
      setNuevaContrasena("")
      setConfirmarContrasena("")
    } catch (err: any) {
      console.error("Error al resetear contraseña:", err)
      setMensajeError(err.message || "Error al cambiar la contraseña")
      setMostrarError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="max-w-md w-full shadow-md">
        <Card>
          <CardHeader className="mb-5">
            <CardTitle className="text-lg">Ingrese aquí su nueva contraseña</CardTitle>
            <CardDescription>Recuerde que debe tener como mínimo 6 caracteres.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nueva-contrasena" className="block text-sm font-medium text-foreground">
                  Nueva Contraseña
                </Label>
                <Input
                  type="password"
                  id="nueva-contrasena"
                  placeholder="Ingrese su nueva contraseña"
                  value={nuevaContrasena}
                  minLength={6}
                  onChange={(e) => setNuevaContrasena(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="confirmar-contrasena" className="block text-sm font-medium text-foreground">
                  Confirmar Contraseña
                </Label>
                <Input
                  type="password"
                  id="confirmar-contrasena"
                  placeholder="Confirme su nueva contraseña"
                  value={confirmarContrasena}
                  minLength={6}
                  onChange={(e) => setConfirmarContrasena(e.target.value)}
                  required
                />
              </div>
              
              {error && <p className="text-red-500 text-sm">{error}</p>}
              
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                <KeySquare className="mr-2" />
                {loading ? "Cambiando..." : "Cambiar Contraseña"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {mostrarExito && (
        <ModalDefault
          titulo="Contraseña Cambiada"
          mensaje="Su contraseña ha sido cambiada exitosamente. Ya puede iniciar sesión con su nueva contraseña."
          onClose={() => {
            setMostrarExito(false)
            window.location.href = "/"
          }}
        />
      )}

      {mostrarError && (
        <ModalError
          titulo="Error al Cambiar Contraseña"
          mensaje={mensajeError}
          onClose={() => setMostrarError(false)}
        />
      )}
    </>
  )
}