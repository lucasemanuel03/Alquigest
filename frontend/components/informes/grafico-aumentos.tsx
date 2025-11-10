
import { CartesianGrid, Label, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";


const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-gray-950 p-2 border border-gray-300 dark:border-black rounded-lg shadow-sm">
        <p className="font-semibold mb-2">{data.fechaAumentoLong}</p>
        <p className="text-sm">
          <span className="font-medium">Porcentaje de Aumento:</span>{" "}
          <span className="text-[#957c0a] font-bold">{data.porcentajeAumento}%</span>
        </p>
        <p className="text-sm">
          <span className="font-medium">Alquiler Anterior:</span>{" "}
          ${data.montoAnterior.toLocaleString("es-AR")}
        </p>
        <p className="text-sm">
          <span className="font-medium">Alquiler Nuevo:</span>{" "}
          <b>${data.montoNuevo.toLocaleString("es-AR")}</b>
        </p>
      </div>
    );
  }
  return null;
};

export default function GraficoAumentosContrato({ contrato } : { contrato: any }) {
  const data = contrato.aumentos.map(a => ({
    fecha: new Date(a.fechaAumento).toLocaleDateString("es-AR", { month: "short", year: "2-digit" }),
    fechaAumentoLong: new Date(a.fechaAumento).toLocaleDateString("es-AR", { month: "long", year: "numeric" }),
    porcentajeAumento: a.porcentajeAumento,
    montoNuevo: a.montoNuevo,
    montoAnterior: a.montoAnterior,
  })).reverse(); // Ordena cronológicamente

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 30, right: 50, bottom: 30, left: 50 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="fecha" label={{ value: 'Fecha de Aumento', position: 'insideBottom' }}/>
        <YAxis 
          dataKey="porcentajeAumento" 
          label={{ value: '% de Aumento', angle: -90, position: 'left' }}
          tickFormatter={(value) => `${value}%`}/>
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line type="monotone" dataKey="porcentajeAumento" stroke="#957c0a" strokeWidth={3} name={`Alquiler de ${contrato.direccionInmueble}`}/>
      </LineChart>
    </ResponsiveContainer>
  );
}