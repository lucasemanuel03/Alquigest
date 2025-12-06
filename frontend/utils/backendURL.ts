// Usar variable de entorno o fallback a producción
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://alquigest.onrender.com/api";

//const BACKEND_URL = "http://localhost:8081/api";

export default BACKEND_URL;