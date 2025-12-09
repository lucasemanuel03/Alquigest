import { useEffect } from 'react';
import BACKEND_URL from '@/utils/backendURL';

/**
 * Hook para mantener el backend activo (evitar cold start en Render free tier)
 * 
 * Envía un ping cada 10 minutos al endpoint /health del backend
 * Solo se ejecuta en producción
 */
export function useKeepAlive() {
  useEffect(() => {
    // Solo en producción
    if (process.env.NODE_ENV !== 'production') {
      console.log('🏓 [KEEP-ALIVE] Deshabilitado en desarrollo');
      return;
    }

    const PING_INTERVAL = 10 * 60 * 1000; // 10 minutos
    let pingCount = 0;

    const ping = async () => {
      try {
        const startTime = performance.now();
        
        await fetch(`${BACKEND_URL}/health`, { 
          method: 'GET',
          cache: 'no-store'
        });
        
        const endTime = performance.now();
        pingCount++;
        
        console.log(`🏓 [KEEP-ALIVE] Ping #${pingCount} exitoso (${(endTime - startTime).toFixed(2)}ms)`);
      } catch (error) {
        console.error('❌ [KEEP-ALIVE] Error en ping:', error);
      }
    };

    // Primer ping al cargar
    ping();

    // Ping periódico cada 10 minutos
    const interval = setInterval(ping, PING_INTERVAL);

    console.log('✅ [KEEP-ALIVE] Iniciado. Ping cada 10 minutos.');

    return () => {
      clearInterval(interval);
      console.log('🛑 [KEEP-ALIVE] Detenido');
    };
  }, []);
}
