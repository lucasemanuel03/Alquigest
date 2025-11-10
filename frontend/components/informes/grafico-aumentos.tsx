
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";


export default function GraficoAumentosContrato({ contrato } : { contrato: any }) {
  const data = contrato.aumentos.map(a => ({
    fecha: new Date(a.fechaAumento).toLocaleDateString("es-AR", { month: "short", year: "2-digit" }),
    montoNuevo: a.montoNuevo,
  })).reverse(); // Ordena cronológicamente

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="fecha" />
        <YAxis />
        <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
        <Legend />
        <Line type="monotone" dataKey="montoNuevo" stroke="#8884d8" name={`Contrato ${contrato.direccionInmueble}`} />
      </LineChart>
    </ResponsiveContainer>
  );
}