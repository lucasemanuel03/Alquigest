import { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import BACKEND_URL from "@/utils/backendURL";
import ModalDefault from "../modal-default";

export default function RecuperarContrasenaPaso1() {
    const [mensaje, setMensaje] = useState("");
    const [formData, setFormData] = useState({ email: ""});
    const [errorCarga, setErrorCarga] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingSendEmail, setLoadingSendEmail] = useState(false);
    const [mostrarError, setMostrarError] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Aquí puedes manejar el envío del formulario, por ejemplo, hacer una solicitud a tu backend
        handleSendEmail(e);
    }

      const handleSendEmail = async (e: React.FormEvent) => {
        try {
            setLoadingSendEmail(true);

        // Hacemos POST al backend
        console.log("FormData: ", formData)
        const response = await fetch(`${BACKEND_URL}/auth/recuperar-contrasena`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify(formData),
        });
        console.log("Respuesta:", response);

        setLoadingSendEmail(false);

        // Limpiamos el formulario
        setFormData({ email: "" });

        } catch (error: any) {
        console.error("Error SendEmail:", error);
        setErrorCarga(error.message || "No se pudo conectar con el servidor");
        setMostrarError(true);
        }
        finally {
            setLoadingSendEmail(false);
            setMensaje("Si el email existe en nuestro sistema, se ha enviado un enlace de recuperación.");
        }
    };

  return (
    <>
        <Card className="sm:w-4xl w-auto">
        <CardHeader>
            <CardTitle className="font-sans text-lg">
              Ingrese su dirección de email asociada a su cuenta
            </CardTitle>
            <CardDescription className="text-base">
                Le enviaremos un enlace para restablecer su contraseña.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-2xl">
              <div className="flex flex-col gap-2">
                <Input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ email: e.target.value })}
                    placeholder="Ingrese un email válido"
                />
              </div>
              <Button
                type="submit"
                loading={loadingSendEmail}
                >
                Enviar enlace de recuperación
              </Button>
            </form>
          </CardContent>
      </Card>

        {mensaje && (
            <div>
                <ModalDefault
                    titulo="Correo Enviado..."
                    mensaje={mensaje}
                    onClose={ () => setMensaje("") }
                />
            </div>
        )}
    </>
  );
}
