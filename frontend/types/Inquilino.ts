export interface Inquilino {
  id: number;
  nombre: string;
  apellido: string;
  cuil?: string;  // Optional since it can be null in the DER
  telefono?: string;  // Optional since it can be null in the DER
  esActivo: boolean;
  direccion?: string; // Optional since it can be null in the DER
  barrio?: string;    // Optional since it can be null in the DER
}