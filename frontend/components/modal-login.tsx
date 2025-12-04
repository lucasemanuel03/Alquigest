"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useState, FormEvent, useEffect } from "react"
import { Input } from "./ui/input"
import { useAuth } from "@/contexts/AuthProvider"
import { DialogDescription } from "@radix-ui/react-dialog"
import Link from "next/link"

type ModalDefaultProps = {
  onClose: (username: string, justLoggedIn: boolean) => void,
  isDarkMode: Boolean,
  open?: boolean // control opcional desde el padre
}

export default function ModalLogin({ onClose, isDarkMode, open}: ModalDefaultProps) {
  const { login } = useAuth();
  const [isOpen, setIsOpen] = useState(open ?? true)
  const [username, setUsernameInput] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loadingInicioSesion, setLoadingInicioSesion] = useState(false)

  const urlLogoAlquigest = isDarkMode? "/alquigest-white.png" : "/alquigest-dark.png"

  // Sincroniza el estado interno con el padre cuando se controla vía prop
  useEffect(() => {
    if (typeof open === 'boolean') {
      setIsOpen(open)
    }
  }, [open])
  const handleClose = () => {

    setIsOpen(false)
    setError("") // Limpia el mensaje de error al cerrar el modal
  }

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setLoadingInicioSesion(true);
    try {
      // Llamar a la función de login del AuthProvider
      await login(username, password);
      // Login exitoso - cerrar modal
      setIsOpen(false);
      onClose(username, true);
    } catch (err: any) {
      // Mostrar mensajes específicos devueltos por el backend
      setError(err?.message || "No se pudo iniciar sesión. Verifique su conexión e intente nuevamente.");
    } finally {
      setLoadingInicioSesion(false);
    }
  }

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(v) => {
        setIsOpen(v)
        if (!v) {
          // Notificar al padre para que cierre también
          onClose("", false)
        }
      }}
    >
      <DialogContent className="flex flex-col gap-12">
        <DialogHeader className="flex flex-col justify-center items-center">
          <img src={urlLogoAlquigest} className="h-7 object-contain md:h-12"></img>
          <DialogTitle className="text-foreground font-bold text-2xl">¡Bienvenido!</DialogTitle>
          <DialogDescription className="text-lg">Inicie Sesión para continuar</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleLogin} className="flex flex-col gap-3">
          <Input
            type="text"
            required
            placeholder="Usuario"
            value={username}
            onChange={(e) => setUsernameInput(e.target.value)}
            className="mb-2"
          />
          <Input 
            type="password"
            required
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-4 "
          />
          {error && <p className="text-red-500">{error}</p>}
          <Button
            type="submit"
            loading={loadingInicioSesion}
            onClick={() => setError("")} // Limpia el error al hacer clic
            className="bg-accent hover:bg-accent/80 text-gray-900 text-md"
          >
            Iniciar sesión
          </Button>
        </form>

        <div className="flex items-center justify-center">
          <Link href={"/auth/recuperar-contrasena"} onClick={handleClose}>
            <p className="hover:text-amber-900">¿Olvidó su Contraseña?</p>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  )
}