// Detecta automáticamente el entorno
const BACKEND_URL = process.env.NODE_ENV === 'production'
  ? process.env.NEXT_PUBLIC_BACKEND_URL || 'https://alquigest.onrender.com/api'
  : "http://localhost:8081/api";

export default BACKEND_URL;