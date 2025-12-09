# ⚡ Optimización del Tiempo de Carga Inicial

## 🔍 Diagnóstico: ¿Qué causa la demora?

Con los **logs agregados**, ahora puedes ver en la consola del navegador (F12) exactamente dónde está el problema:

```
🔍 [AUTH] Iniciando verificación de sesión...
🌐 [AUTH] Enviando petición a: https://alquigest.onrender.com/api/auth/me
⏱️ [AUTH] Petición completada en: 2847.30ms  ← AQUÍ VERÁS EL TIEMPO REAL
✅ [AUTH] Sesión activa: username
📊 [AUTH] Parsing JSON: 1.20ms
🏁 [AUTH] Verificación total completada en: 2850.15ms
```

---

## 🎯 Causas Probables de Demora

### 1. **Cold Start de Render (Plan Gratuito)** ❄️
**Probabilidad: ALTA**

**¿Qué es?**
- Render pone tu backend en "sleep" después de 15 minutos sin actividad
- Al primer request, tarda **30-60 segundos** en "despertar"
- Los requests subsiguientes son rápidos (~200-500ms)

**Cómo identificarlo:**
- Primera carga: 30-60 segundos
- Recargas subsiguientes: < 1 segundo
- Después de 15 min sin usar: Vuelve a tardar

**Solución:**
- ✅ **Gratis**: Keep-alive ping (ver más abajo)
- 💰 **Pago**: Upgrade a plan pago de Render ($7/mes)

---

### 2. **Latencia de Red Internacional** 🌍
**Probabilidad: MEDIA**

**¿Qué es?**
- Frontend (Vercel) → Backend (Render) pueden estar en regiones diferentes
- Cada "salto" de red agrega latencia

**Cómo identificarlo:**
```
⏱️ [AUTH] Petición completada en: 800-1500ms
```
(Si es menos de 2 segundos, NO es cold start, es latencia normal)

**Solución:**
- Desplegar frontend y backend en la misma región
- Usar CDN para recursos estáticos

---

### 3. **Vercel Edge Functions (Primera Visita)** 🚀
**Probabilidad: BAJA**

**¿Qué es?**
- Primera carga de la página en Vercel puede ser lenta
- Edge functions se "calientan" con el primer request

**Cómo identificarlo:**
```
🎨 [RENDER] Estado actual: { isLoading: true, ... }
(demora ANTES de ver el log de AUTH)
```

**Solución:**
- Vercel automáticamente optimiza esto
- Implementar Incremental Static Regeneration (ISR)

---

## ✅ Soluciones Implementadas

### 1. **Logs de Performance** 📊
```typescript
// AuthProvider.tsx
const startTime = performance.now();
// ... código ...
console.log(`⏱️ Petición completada en: ${(fetchEnd - fetchStart).toFixed(2)}ms`);
```

**Beneficio:** Ahora puedes identificar exactamente dónde está el problema.

---

### 2. **Mensaje Informativo para Usuario** 💬
```tsx
<p>Verificando sesión...</p>
<p className="text-xs text-gray-500">
  Si esto tarda mucho, puede ser que el servidor esté iniciando (cold start)
</p>
```

**Beneficio:** El usuario entiende por qué espera.

---

## 🚀 Optimizaciones Recomendadas

### Opción 1: Keep-Alive Automático (Gratis) ⭐
Evita que Render ponga el backend en sleep.

**Crear un servicio de keep-alive:**

#### **Backend: Endpoint de health check**
Ya existe en tu `AuthController`:
```java
@GetMapping("/health")
public ResponseEntity<?> health() {
    return ResponseEntity.ok("OK");
}
```

#### **Frontend: Ping automático cada 10 minutos**
```typescript
// hooks/useKeepAlive.ts
import { useEffect } from 'react';
import BACKEND_URL from '@/utils/backendURL';

export function useKeepAlive() {
  useEffect(() => {
    // Solo en producción
    if (process.env.NODE_ENV !== 'production') return;

    const PING_INTERVAL = 10 * 60 * 1000; // 10 minutos

    const ping = async () => {
      try {
        await fetch(`${BACKEND_URL}/health`, { 
          method: 'GET',
          cache: 'no-store'
        });
        console.log('🏓 [KEEP-ALIVE] Ping enviado');
      } catch (error) {
        console.error('❌ [KEEP-ALIVE] Error:', error);
      }
    };

    // Primer ping al cargar
    ping();

    // Ping periódico
    const interval = setInterval(ping, PING_INTERVAL);

    return () => clearInterval(interval);
  }, []);
}
```

**Usar en `ClientRootLayout`:**
```tsx
import { useKeepAlive } from '@/hooks/useKeepAlive';

export default function ClientRootLayout({ children }: { children: ReactNode }) {
  useKeepAlive(); // ⭐ Agregar esta línea
  // ... resto del código
```

**⚠️ Limitación:** Funciona solo si hay usuarios navegando. Si nadie usa la app por 15 min, volverá a dormirse.

---

### Opción 2: Servicio Externo de Ping (Gratis) 🌐

**UptimeRobot** o **Cron-Job.org** pueden hacer ping cada 5 minutos.

**Pasos:**
1. Ir a [uptimerobot.com](https://uptimerobot.com/) (gratis)
2. Crear monitor:
   - Type: HTTP(s)
   - URL: `https://alquigest.onrender.com/health`
   - Interval: 5 minutos
3. Listo. Tu backend nunca se dormirá.

**✅ Ventaja:** Funciona 24/7 sin depender de usuarios.

---

### Opción 3: Lazy Loading del Auth (Optimización de UX) ⚡

En lugar de bloquear TODO mientras se verifica auth, permite que algunas partes se carguen:

```tsx
// client-root-latout.tsx
if (isLoading) {
  // En lugar de bloquear todo, muestra el layout con un skeleton
  return (
    <div>
      <HeaderAlquigest
        tituloPagina="Cargando..."
        username=""
        toggleTheme={toggleTheme}
        isDarkMode={isDarkMode}
        onBellClick={() => {}}
        showNotificationDot={false}
        onLoginClick={() => {}}
      />
      
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col gap-4 items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p>Verificando sesión...</p>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
```

**Beneficio:** El usuario ve la interfaz cargando progresivamente en lugar de pantalla en blanco.

---

### Opción 4: Cache de Sesión en localStorage (Avanzado) 💾

**Idea:** Guardar temporalmente los datos del usuario en localStorage para mostrar UI instantáneamente mientras se verifica en background.

```typescript
// AuthProvider.tsx
const checkAuth = async () => {
  // Cargar datos cacheados inmediatamente (si existen)
  const cachedUser = localStorage.getItem('user_cache');
  if (cachedUser) {
    setUser(JSON.parse(cachedUser));
    setIsLoading(false); // ⚡ UI se muestra instantáneamente
  }

  try {
    const res = await fetch(`${BACKEND_URL}/auth/me`, {
      credentials: 'include'
    });

    if (res.ok) {
      const userData = await res.json();
      setUser(userData);
      localStorage.setItem('user_cache', JSON.stringify(userData)); // Actualizar cache
    } else {
      setUser(null);
      localStorage.removeItem('user_cache');
    }
  } catch (error) {
    // Si falla la verificación pero hay cache, mantener cache
    if (!cachedUser) {
      setUser(null);
    }
  } finally {
    setIsLoading(false);
  }
};
```

**⚠️ Consideraciones de Seguridad:**
- NO guardar tokens en localStorage
- Solo guardar datos del usuario (username, roles, permisos)
- Siempre verificar en background
- Si la verificación falla, limpiar cache y logout

---

## 📊 Comparación de Soluciones

| Solución | Costo | Complejidad | Efectividad | Recomendación |
|----------|-------|-------------|-------------|---------------|
| Keep-Alive Frontend | Gratis | Baja | ⭐⭐⭐ | ✅ Implementar |
| UptimeRobot | Gratis | Muy Baja | ⭐⭐⭐⭐⭐ | ✅ ALTAMENTE RECOMENDADO |
| Render Pago | $7/mes | Nula | ⭐⭐⭐⭐⭐ | Si tienes presupuesto |
| Lazy Loading | Gratis | Media | ⭐⭐⭐⭐ | ✅ Implementar |
| Cache localStorage | Gratis | Alta | ⭐⭐⭐⭐ | Solo si necesitas <100ms |

---

## 🎯 Plan de Acción Recomendado

### Paso 1: Identificar el problema (HOY) ✅
- ✅ Logs agregados
- ✅ Abrir consola en producción
- ✅ Ver cuánto tarda el fetch a `/auth/me`

### Paso 2: Solución Rápida (5 minutos)
1. Crear cuenta en UptimeRobot
2. Configurar monitor a `https://alquigest.onrender.com/health` cada 5 min
3. **Listo.** El backend nunca se dormirá.

### Paso 3: Optimización de UX (15 minutos)
1. Implementar lazy loading del layout (opción 3)
2. El usuario ve la UI progresivamente

### Paso 4: Keep-Alive Frontend (30 minutos)
1. Crear `hooks/useKeepAlive.ts`
2. Agregar al `ClientRootLayout`
3. Doble protección contra cold start

---

## 🧪 Cómo Testear

### Test 1: Medir tiempo real
1. Abrir producción en navegador
2. F12 → Console
3. Buscar logs:
   ```
   ⏱️ [AUTH] Petición completada en: XXXms
   ```

### Test 2: Simular cold start
1. Esperar 15 minutos sin usar la app
2. Recargar página
3. Medir tiempo nuevamente

### Test 3: Verificar UptimeRobot
1. Configurar UptimeRobot
2. Esperar 30 minutos
3. Cargar app → Debe ser rápido (no cold start)

---

## 📈 Resultados Esperados

### Sin Optimizaciones:
- Primera carga: **30-60 segundos** ❌
- Después de 15 min inactivo: **30-60 segundos** ❌
- Cargas subsiguientes: **< 1 segundo** ✅

### Con UptimeRobot:
- Primera carga: **< 1 segundo** ✅
- Después de 15 min inactivo: **< 1 segundo** ✅
- Cargas subsiguientes: **< 1 segundo** ✅

### Con Lazy Loading:
- Percepción del usuario: **Instantáneo** ✅
- UI visible mientras carga en background

---

## 🔧 Herramientas de Monitoreo

### 1. Performance API (Ya implementado)
```javascript
console.log(`⏱️ Petición: ${tiempo}ms`);
```

### 2. Chrome DevTools
- Network tab → Ver tiempos reales
- Performance tab → Analizar render

### 3. Lighthouse
```bash
npm install -g lighthouse
lighthouse https://tu-app.vercel.app --view
```

---

## 🆘 Troubleshooting

### Problema: "Tarda 30+ segundos en producción"
**Causa:** Cold start de Render
**Solución:** UptimeRobot (100% efectivo)

### Problema: "Tarda 2-3 segundos incluso caliente"
**Causa:** Latencia de red o query pesada
**Solución:** 
- Optimizar endpoint `/auth/me`
- Usar cache de localStorage

### Problema: "Funciona rápido pero usuarios reportan lentitud"
**Causa:** Usuarios con mala conexión
**Solución:** Lazy loading + optimistic UI

---

## 📞 Siguiente Paso

1. **Revisar logs en consola de producción** para ver tiempo exacto
2. **Configurar UptimeRobot** (5 minutos, efecto inmediato)
3. **Reportar resultados** con los tiempos medidos

---

**Última actualización:** 9 de diciembre de 2025
