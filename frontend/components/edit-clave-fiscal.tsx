'use client'

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Copy, EyeOff, PenLine, Save } from 'lucide-react';
import { fetchWithToken } from '@/utils/functions/auth-functions/fetchWithToken';
import BACKEND_URL from '@/utils/backendURL';
import ModalInput from '@/components/modal-input';
import ModalError from '@/components/modal-error';
import { Input } from './ui/input';

interface ClaveFiscalSecuraProps {
  propietarioId: string;
  claveFiscalEnmascarada: string | null;
  setClaveFiscalActualizada: (nuevaClave: string) => void;
  claveFiscalActualizada: string;
}

export default function EditarClaveFiscal({
  propietarioId,
  claveFiscalEnmascarada,
  setClaveFiscalActualizada,
  claveFiscalActualizada
}: ClaveFiscalSecuraProps) {
  const [claveFiscalVisible, setClaveFiscalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalPasswordOpen, setModalPasswordOpen] = useState(false);
  const [errorModal, setErrorModal] = useState({ open: false, mensaje: "" });



  const revelarClaveFiscal = async (password: string) => {
    setLoading(true);
    setModalPasswordOpen(false);

    try {
      const response = await fetchWithToken(
        `${BACKEND_URL}/propietarios/${propietarioId}/clave-fiscal/revelar`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ password })
        }
      );
      setClaveFiscalActualizada(response.claveFiscal);
      setClaveFiscalVisible(true);

    } catch (error: any) {
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        setErrorModal({ open: true, mensaje: "Contraseña incorrecta" });
      } else {
        setErrorModal({ open: true, mensaje: error.message || "Error al revelar la clave fiscal" });
      }
      console.error("Error revelando clave fiscal:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevelarClick = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setModalPasswordOpen(true);
  };


  return (
    <div className="flex flex-col gap-2">
      {!claveFiscalVisible ? (
        <div className="flex items-center gap-2">
          <Input
            value={claveFiscalEnmascarada || claveFiscalActualizada}
            onChange={(e) => setClaveFiscalActualizada(e.target.value)}
            disabled={!!claveFiscalEnmascarada}
            placeholder='No posee clave fiscal registrada'
          />

          <Button
            onClick={handleRevelarClick}
            disabled={loading || !claveFiscalEnmascarada}
            variant="outline"
            size="sm"
          >
            {loading ? (
              <>Cargando...</>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Revelar para Editar
              </>
            )}
          </Button>
        </div>
      ) : (

          <Input
            value={claveFiscalActualizada}
            onChange={(e) => setClaveFiscalActualizada(e.target.value)}
          />

      )}

      <ModalInput
        titulo="Verificación de Identidad"
        descripcion="Por seguridad, ingresa tu contraseña para revelar la clave fiscal"
        label="Contraseña"
        type="password"
        placeholder="Ingresa tu contraseña..."
        open={modalPasswordOpen}
        onOpenChange={setModalPasswordOpen}
        onConfirm={revelarClaveFiscal}
        textoConfirmar="Revelar"
      />

      {errorModal.open && (
        <ModalError
          titulo="Error"
          mensaje={errorModal.mensaje}
          onClose={() => setErrorModal({ open: false, mensaje: "" })}
        />
      )}
    </div>
  );
}

