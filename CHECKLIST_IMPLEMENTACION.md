# 🚀 Checklist de Implementación - Fix Cookies en Producción

## ✅ Cambios Ya Realizados

### Backend
- ✅ `AuthController.java` - `/signin`: Cookie agregada al response
- ✅ `AuthController.java` - `/logout`: Cookie agregada al response (maxAge=0)
- ✅ `AuthController.java` - `/refresh`: Cookie agregada al response

### Frontend
- ✅ `utils/backendURL.ts`: URL dinámica según entorno
- ✅ `.env.example`: Plantilla para configuración
- ✅ `.gitignore`: Protege archivos de ambiente

---

## 🔧 Pasos para Completar

### 1. Configurar Frontend

**Crear archivo `.env.production` o `.env.local` en `/frontend`:**

```bash
cd frontend
touch .env.production
```

**Agregar la URL real de tu backend:**
```bash
NEXT_PUBLIC_BACKEND_URL=https://[TU-BACKEND-RENDER].onrender.com/api
```

> ⚠️ **IMPORTANTE**: Reemplaza `[TU-BACKEND-RENDER]` con la URL exacta de tu servicio en Render.

---

### 2. Actualizar ALLOWED_ORIGINS en Backend

**Opción A: Actualizar `render.yaml`** (Recomendado)

```yaml
- key: ALLOWED_ORIGINS
  value: http://localhost:3000,https://[TU-FRONTEND].vercel.app,https://[TU-FRONTEND].onrender.com
```

**Opción B: Configurar en Panel de Render**

1. Ve a tu servicio backend en Render
2. Settings → Environment
3. Edita `ALLOWED_ORIGINS`
4. Agrega: `https://[TU-FRONTEND-URL-EXACTA]`

> 🎯 **CRÍTICO**: Debe ser la URL **EXACTA** del frontend, sin wildcards.

---

### 3. Rebuild y Deploy

#### Backend (si cambiaste `render.yaml` o variables):
```bash
git add .
git commit -m "fix: cookies HttpOnly en producción"
git push origin main
```
Render detectará los cambios automáticamente.

#### Frontend:
```bash
cd frontend
git add .env.production
git commit -m "fix: configurar URL backend producción"
git push origin main
```

---

### 4. Verificación Post-Deploy

#### A) Verificar Backend está recibiendo las peticiones correctas

1. Abre la consola de tu frontend desplegado
2. F12 → Console
3. Busca errores de CORS o fetch

#### B) Verificar Cookie en el Navegador

1. Login en producción
2. F12 → Application → Cookies
3. Busca: `accessToken`
4. Debe tener:
   - ✅ HttpOnly: Sí
   - ✅ Secure: Sí
   - ✅ SameSite: None
   - ✅ Domain: Tu dominio backend

#### C) Verificar Headers en Network

**Request a /signin:**
```
POST https://tu-backend.com/api/auth/signin
Content-Type: application/json

Request Payload:
{"username":"test","password":"test"}
```

**Response esperado:**
```
Status: 200 OK

Response Headers:
Set-Cookie: accessToken=eyJhbG...; Path=/; Secure; HttpOnly; SameSite=None

Response Body:
{
  "id": 1,
  "username": "test",
  "email": "test@example.com",
  "roles": ["ROLE_SECRETARIA"],
  "permisos": {...}
}
```

**Request subsiguiente (ej: /auth/me):**
```
GET https://tu-backend.com/api/auth/me

Request Headers:
Cookie: accessToken=eyJhbG...
```

---

## 🐛 Troubleshooting

### Problema 1: "Cookie not set"
**Síntomas:** Cookie no aparece en DevTools

**Posibles causas:**
1. URL del backend incorrecta
2. CORS bloqueando la cookie
3. Backend no envía `Set-Cookie` header

**Solución:**
```bash
# Verificar en Network tab
# Response Headers debe incluir:
Set-Cookie: accessToken=...
```

---

### Problema 2: "CORS Error"
**Síntomas:** Error en consola: "CORS policy: Response to preflight request..."

**Causas:**
- `ALLOWED_ORIGINS` no incluye tu frontend
- Falta `allowCredentials: true`

**Solución:**
1. Verifica `ALLOWED_ORIGINS` en Render
2. Debe ser la URL exacta, sin wildcards
3. Reinicia el servicio backend

---

### Problema 3: Cookie se guarda pero no se envía
**Síntomas:** Cookie visible en DevTools pero peticiones fallan con 401

**Causas:**
- `credentials: 'include'` falta en algún fetch
- Domain de la cookie no coincide

**Solución:**
Verifica TODOS los fetch del frontend:
```typescript
fetch(url, {
  credentials: 'include'  // ⭐ DEBE estar en TODOS
})
```

---

### Problema 4: Funciona en localhost pero no en producción
**Causas:**
- `.env.production` no configurado
- `NEXT_PUBLIC_BACKEND_URL` vacía

**Solución:**
```bash
# Verificar que la variable está definida
echo $NEXT_PUBLIC_BACKEND_URL

# En el código, agregar debug temporal:
console.log('Backend URL:', BACKEND_URL)
```

---

## 🔍 Testing Rápido

### Test 1: Backend Responde
```bash
curl https://tu-backend.com/health
# Esperado: { "status": "UP" }
```

### Test 2: Login Funciona
```bash
curl -v -X POST https://tu-backend.com/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}' \
  | grep -i set-cookie
# Esperado: Set-Cookie: accessToken=...
```

### Test 3: Cookie Persiste
```bash
# Guardar cookie
curl -c cookies.txt -X POST https://tu-backend.com/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'

# Usar cookie guardada
curl -b cookies.txt https://tu-backend.com/api/auth/me
# Esperado: Datos del usuario
```

---

## 📋 URLs que Necesitas Configurar

Completa esta lista con tus URLs reales:

```bash
# Backend (Render)
BACKEND_URL=https://_________________.onrender.com

# Frontend (Vercel/Render/Netlify)
FRONTEND_URL=https://_________________.vercel.app
# o
FRONTEND_URL=https://_________________.onrender.com
```

---

## 🎯 Resumen de Archivos Modificados

### Backend:
- ✅ `AuthController.java` (3 endpoints corregidos)

### Frontend:
- ✅ `utils/backendURL.ts`
- ✅ `.env.example` (nuevo)
- ✅ `.gitignore`

### Configuración:
- ⚠️ `render.yaml` o Panel de Render → `ALLOWED_ORIGINS`
- ⚠️ Frontend → `.env.production` (crear)

---

## 📞 ¿Necesitas Ayuda?

Si después de seguir estos pasos el problema persiste:

1. Captura un screenshot de:
   - DevTools → Network → Headers del request de /signin
   - DevTools → Application → Cookies
   - Console (errores)

2. Verifica los logs del backend en Render

3. Comparte:
   - URL del frontend
   - URL del backend
   - Variables de entorno configuradas (sin secrets)

---

**Última actualización:** 4 de diciembre de 2025
**Autor:** GitHub Copilot
