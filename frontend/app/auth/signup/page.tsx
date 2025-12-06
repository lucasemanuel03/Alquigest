"use client"

import ModalDefault from "@/components/modal-default";
import ModalError from "@/components/modal-error";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import BACKEND_URL from "@/utils/backendURL";
import { ROLES_USUARIO, ROLES_USUARIO_CREATE } from "@/utils/constantes";
import { fetchWithToken } from "@/utils/functions/auth-functions/fetchWithToken";

import { ArrowLeft, Save, User } from "lucide-react";

import { useEffect, useState } from "react";

export default function RegistrarNuevoUser() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    role: [], // Inicializamos como un array vacío
    password: "",
  });

  const [usuarioCargado, setUsuarioCargado] = useState(false);
  const [passwordVerif, setPasswordVerif] = useState("");
  const [passwordValidMessage, setPasswordValidMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  const [errorCarga, setErrorCarga] = useState("");
  const [mostrarError, setMostrarError] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      role: [value],
    }));
  };

  const handlePasswordValid = () => {
    if (formData.password.length >= 6) {
      setPasswordValidMessage("Ok");
    } else {
      setPasswordValidMessage(
        "Formato ¡No Válido! (Debe tener más de 6 caracteres)"
      );
    }
  };

  const handlePasswordVerifBlur = () => {
    if (passwordValidMessage === "Ok") {
      if (passwordVerif === formData.password) {
        setPasswordMessage("Ok");
      } else {
        setPasswordMessage("Las contraseñas no coinciden");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.username ||
      !formData.email ||
      formData.role.length === 0 || // Verificamos que `role` no esté vacío
      !formData.password
    ) {
      setErrorCarga("Por favor, complete todos los campos obligatorios.");
      setMostrarError(true);
      return;
    }

    if (passwordMessage !== "Ok") {
      setErrorCarga("Las contraseñas no coinciden.");
      setMostrarError(true);
      return;
    }

    try {
      const createdUsuario = await fetchWithToken(`${BACKEND_URL}/auth/signup`, {
        method: "POST",
        body: JSON.stringify(formData),
      });
      console.log("Usuario creado con éxito");

        setUsuarioCargado(true);

      // Limpiamos el formulario
      setFormData({
        username: "",
        email: "",
        role: [],
        password: "",
      });
      setPasswordVerif("");
      setPasswordValidMessage("");
      setPasswordMessage("");
    } catch (error: any) {
      console.error("Error al crear usuario:", error);
      setErrorCarga(error.message || "No se pudo conectar con el servidor");
      setMostrarError(true);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background ">
        <main className="container mx-auto px-6 py-8 pt-25 sm:pt-28">
          <div className="flex flex-col gap-3 mb-8">
          <Button variant="outline" onClick={() => window.history.back()} className="w-fit">
            <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
          </Button>
          <div className="flex items-center m-5 gap-1">
            <User className="h-11 w-11" />
            <h1 className="text-3xl font-bold">Nuevo usuario</h1>
          </div>
          </div>

          <Card className="max-w-4xl mx-auto mt-5">
            <CardHeader>
              <CardTitle className="font-sans">
                Complete los campos de datos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="username">Nombre de Usuario</Label>
                    <Input
                      id="username"
                      maxLength={50}
                      placeholder="Ingrese un nombre de usuario"
                      required
                      value={formData.username}
                      onChange={(e) =>
                        handleInputChange("username", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      maxLength={50}
                      placeholder="Ingrese un correo electrónico"
                      required
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                    />
                  </div>

                  <Separator aria-setsize={4} color="yellow"></Separator>
                  <div className="space-y-2">
                    <Label htmlFor="password">Cree una contraseña</Label>
                    <Input
                      id="password"
                      type="password"
                      minLength={6}
                      maxLength={50}
                      placeholder="Debe tener como mínimo 6 caracteres"
                      onBlur={handlePasswordValid}
                      onChange={(e) =>
                        handleInputChange("password", e.target.value)
                      }
                      required
                      value={formData.password}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-verif">Repita la contraseña</Label>
                    <Input
                      id="password-verif"
                      type="password"
                      minLength={6}
                      maxLength={50}
                      placeholder="Escriba nuevamente la contraseña creada"
                      value={passwordVerif}
                      onChange={(e) => setPasswordVerif(e.target.value)}
                      onBlur={handlePasswordVerifBlur}
                      required
                    />
                  </div>
                  <Separator aria-setsize={4} color="yellow"></Separator>

                  <div className="space-y-2">
                    <Label htmlFor="rol">¿Cual será el Rol?</Label>
                    <div className="flex flex-1 min-w-0 gap-2 ">
                      <Select
                        value={formData.role[0] || ""} // Usamos el primer elemento del array
                        onValueChange={handleRoleChange}
                      >
                        <SelectTrigger>
                          <SelectValue
                            className="overflow-hidden text-ellipsis"
                            placeholder="Seleccione un Rol"
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES_USUARIO_CREATE.map((rol) => (
                            <SelectItem
                              key={rol.id}
                              value={rol.rolId}
                              className="overflow-auto"
                            >
                              {rol.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 pt-6">
                  <Button type="submit" className="flex-1">
                    <Save className="h-4 w-4 mr-2" />
                    Registrar Usuario
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </main>

        {/*MODALES*/}
        {usuarioCargado && (
          <ModalDefault 
              titulo="¡Usuario Registrado!"
              mensaje={`El usuario ${formData.username} fue registrado correctamente.`}
              onClose={() => setUsuarioCargado(false)}/>
        )}
        {mostrarError && (
          <ModalError
              titulo="Error al Registrar usuario"
              mensaje={errorCarga}
              onClose={() => setMostrarError(false)}/>
        )}
      </div>
    </ProtectedRoute>
  );
}