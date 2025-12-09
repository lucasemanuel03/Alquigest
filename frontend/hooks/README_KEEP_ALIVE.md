# 🏓 Hook useKeepAlive

## ¿Qué hace?

Mantiene tu backend de Render activo enviando un ping cada 10 minutos al endpoint `/health`.

Esto evita que el servidor entre en "cold start" y las cargas sean lentas (30-60 segundos).

## 🚀 Cómo usar

### 1. Agregar al layout principal

```tsx
// app/client-root-latout.tsx
import { useKeepAlive } from '@/hooks/useKeepAlive';

export default function ClientRootLayout({ children }: { children: ReactNode }) {
  useKeepAlive(); // ⭐ Agregar esta línea
  
  const { user, isAuthenticated, isLoading } = useAuth();
  // ... resto del código
```

### 2. Deploy y listo

El hook:
- ✅ Solo se ejecuta en producción (no en desarrollo)
- ✅ Envía ping cada 10 minutos
- ✅ Muestra logs en consola
- ✅ No afecta el rendimiento

## 📊 Logs en Consola

Verás estos mensajes en producción:

```
✅ [KEEP-ALIVE] Iniciado. Ping cada 10 minutos.
🏓 [KEEP-ALIVE] Ping #1 exitoso (245.30ms)
🏓 [KEEP-ALIVE] Ping #2 exitoso (198.75ms)
🏓 [KEEP-ALIVE] Ping #3 exitoso (312.10ms)
```

## ⚠️ Limitaciones

- Solo funciona si hay usuarios navegando
- Si nadie usa la app por 15+ minutos, el servidor se dormirá de todos modos
- Para 100% uptime, usa [UptimeRobot](https://uptimerobot.com/) (ver `OPTIMIZACION_TIEMPO_CARGA.md`)

## 🔧 Configuración

Puedes ajustar el intervalo en `hooks/useKeepAlive.ts`:

```typescript
const PING_INTERVAL = 10 * 60 * 1000; // 10 minutos
// Cambiar a: 5 * 60 * 1000 para 5 minutos
```

⚠️ No uses intervalos < 5 minutos para no saturar el backend.
