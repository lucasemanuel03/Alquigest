# Guía de Deploy con Cache - Alquigest Backend

## 📋 Resumen

El sistema de cache ha sido implementado en Alquigest para mejorar el rendimiento, especialmente en consultas de contratos. Esta guía explica cómo hacer deploy con el nuevo sistema de cache tanto en desarrollo como en producción.

## 🚀 Requisitos Previos

### Desarrollo Local
- Maven 3.9+
- Java 21
- Base de datos PostgreSQL (Supabase)

### Producción (Render)
- Docker configurado
- Redis disponible (recomendado) o cache en memoria
- Base de datos PostgreSQL (Supabase)

## 💻 Deploy en Desarrollo Local

### 1. Clonar/Actualizar el Repositorio
```bash
cd ~/Repositorios/Alquigest/backend
git pull origin main
```

### 2. Compilar el Proyecto
```bash
mvn clean compile
# Debería mostrar: BUILD SUCCESS
```

### 3. Ejecutar Pruebas (Opcional)
```bash
mvn test
```

### 4. Ejecutar la Aplicación
```bash
mvn spring-boot:run
```

**Salida esperada:**
```
2025-12-06 15:30:45.123  INFO 1 --- [main] c.a.AlquigestApplication : 
	Inicializando cache...
2025-12-06 15:30:45.456  INFO 1 --- [main] o.s.b.w.e.tomcat.TomcatWebServer  : 
	Tomcat started on port(s): 8080 (http)
```

### 5. Probar Cache en Desarrollo

**Verificar que cache está habilitado:**
```bash
# Primer request (sin cache - más lento)
time curl http://localhost:8080/api/contratos

# Segundo request (con cache - más rápido)
time curl http://localhost:8080/api/contratos
```

**Esperado:** El segundo request es significativamente más rápido.

## 🐳 Deploy en Producción (Render)

### Opción 1: Usar el render.yaml existente

El proyecto ya incluye un `render.yaml` configurado. Para hacer deploy:

```bash
cd ~/Repositorios/Alquigest/backend
git add .
git commit -m "Feat: Implementar sistema de cache para contratos"
git push origin main
```

Render detectará automáticamente el `render.yaml` y hará el deploy.

### Opción 2: Configuración Manual en Render

1. **Ir a Render Dashboard**: https://dashboard.render.com

2. **Crear nuevo Web Service**
   - Conectar repositorio GitHub
   - Seleccionar rama: `main`
   - Root Directory: `backend`

3. **Configurar Variables de Entorno**
   ```
   PORT=8080
   SPRING_PROFILES_ACTIVE=production
   SPRING_DATASOURCE_URL=jdbc:postgresql://...
   SPRING_DATASOURCE_USERNAME=...
   SPRING_DATASOURCE_PASSWORD=...
   ALLOWED_ORIGINS=https://*.vercel.app,https://*.onrender.com
   JWT_SECRET=...
   JWT_EXPIRATION_MS=86400000
   ENCRYPTION_KEY=...
   MAIL_USERNAME=...
   MAIL_PASSWORD=...
   PASSWORD_RESET_TOKEN_EXPIRATION_MS=3600000
   
   # Cache Configuration
   SPRING_CACHE_TYPE=simple (sin Redis) o redis (con Redis)
   ```

4. **Build Command**
   ```
   mvn clean package -DskipTests
   ```

5. **Start Command**
   ```
   java $JAVA_OPTS -jar target/*.jar
   ```

6. **Desplegar**
   - Click en "Deploy"
   - Esperar a que termine la compilación y despliegue

### Redis en Producción (Opcional)

Si quieres usar Redis en producción para mejor rendimiento:

1. **Agregar variables de entorno en Render:**
   ```
   SPRING_DATA_REDIS_HOST=redis.example.com
   SPRING_DATA_REDIS_PORT=6379
   SPRING_DATA_REDIS_PASSWORD=***
   SPRING_CACHE_TYPE=redis
   SPRING_CACHE_REDIS_TIME_TO_LIVE=3600000
   ```

2. **O usar Redis Cloud (Recomendado):**
   - Ir a https://redis.com/cloud/
   - Crear base de datos gratuita
   - Copiar credenciales a Render

## 📊 Validar Deploy en Producción

### 1. Verificar que la aplicación está corriendo
```bash
curl https://alquigest.onrender.com/api/health
```

**Respuesta esperada:**
```json
{
  "status": "UP",
  "message": "Health check passed"
}
```

### 2. Verificar que cache está funcionando
```bash
# Primer request
curl -w "\nTiempo: %{time_total}s\n" https://alquigest.onrender.com/api/contratos

# Segundo request (debería ser más rápido)
curl -w "\nTiempo: %{time_total}s\n" https://alquigest.onrender.com/api/contratos
```

### 3. Monitorear logs en Render
```
Ir a: https://dashboard.render.com/services/[tu-servicio]/logs
Buscar: "Cache hit" o "Cache miss"
```

## 🔄 Comportamiento del Cache en Producción

### Lectura (GET)
```
Primera vez: Query BD → Cache (1 hora) → Respuesta
Segunda+ veces: Cache → Respuesta (sin BD queries)
```

### Escritura (POST/PUT/DELETE)
```
Modificación → Invalida todo cache → Próxima lectura query BD
```

## ⚙️ Configuración de Cache

### Development (application.properties)
```properties
spring.cache.type=simple
spring.cache.simple.cache-names=contratos,contratos-vigentes,contratos-no-vigentes,contratos-proximos-vencer,contratos-inmueble,contratos-inquilino,contrato-id,contrato-existe,inmueble-contrato-vigente,servicios-contrato
```

### Production (application-production.properties)
```properties
# Con Redis
spring.cache.type=redis
spring.data.redis.host=${REDIS_HOST}
spring.data.redis.port=${REDIS_PORT}
spring.data.redis.password=${REDIS_PASSWORD}
spring.cache.redis.time-to-live=3600000

# O sin Redis (cache en memoria)
spring.cache.type=simple
```

## 🐛 Troubleshooting

### Problema: "Cache not working"

**Solución 1:** Verificar que @EnableCaching está activo
```bash
curl -X POST http://localhost:8080/api/contratos
# Debería invalidar cache
```

**Solución 2:** Verificar logs
```bash
# Si ves "Cache hit" o "Cache miss" en logs, está funcionando
tail -f logs/application.log | grep -i cache
```

### Problema: "Redis connection refused"

**Si en producción:**
- Verificar que REDIS_HOST y REDIS_PASSWORD están configurados
- O cambiar a `spring.cache.type=simple` (sin Redis)

**Si en desarrollo:**
- Ignorar (usará ConcurrentMapCacheManager automáticamente)

### Problema: "Cache inconsistent"

**Causa:** Datos inconsistentes en cache
**Solución:**
```bash
# Manual cache clear (requiere endpoint adicional):
POST /api/admin/cache/clear

# O reiniciar la aplicación en Render:
Dashboard → Service → Manual Restart
```

## 📈 Monitoreo del Cache

### Métricas Importantes

1. **Cache Hit Ratio**
   ```
   Hit Rate = (Cache Hits) / (Total Requests)
   Esperado: > 80% para GET /api/contratos
   ```

2. **Query Reduction**
   ```
   Sin cache: ~100 queries/minuto
   Con cache: ~5 queries/minuto (con TTL de 1 hora)
   Mejora: 95% menos queries
   ```

3. **Tiempo de Respuesta**
   ```
   Sin cache: 500-1000ms
   Con cache: 10-50ms
   Mejora: 50x más rápido
   ```

## 🔐 Seguridad

### Cache y Datos Sensibles
- **Contratos**: Sí, cachear (públicos dentro de la app)
- **Datos de Usuario**: No cachear directamente
- **PDFs**: Sí, cachear en BD (no en Redis)

### Invalidación de Cache en Seguridad
```
User Login → Invalidar cache de permisos
User Logout → Invalidar cache del usuario
Change Password → Invalidar cache
```

## 📚 Referencias Rápidas

| Endpoint | Cache | TTL |
|----------|-------|-----|
| GET /api/contratos | CONTRATOS | 1h |
| GET /api/contratos/{id} | CONTRATO_POR_ID | 1h |
| GET /api/contratos/vigentes | CONTRATOS_VIGENTES | 1h |
| POST /api/contratos | - | Invalida todos |
| PATCH /api/contratos/{id}/estado | - | Invalida todos |

## ✅ Checklist de Deploy

- [ ] Código compilado exitosamente (`mvn clean compile`)
- [ ] Sin errores críticos (solo warnings tolerables)
- [ ] Tests locales pasados (`mvn test`)
- [ ] Variables de entorno configuradas en Render
- [ ] Base de datos PostgreSQL accesible
- [ ] Redis configurado (opcional) o cache en memoria habilitado
- [ ] Dockerfile actualizado con Java 21
- [ ] Healthcheck respondiendo correctamente
- [ ] Cache está siendo usado (verificar en logs)
- [ ] Frontend conectado y consumiendo endpoints

## 🎯 Próximos Pasos

1. **Monitorear rendimiento:**
   ```bash
   # Visualizar hit/miss ratio en Render logs
   ```

2. **Optimizar TTL según necesidad:**
   ```properties
   # Ajustar si necesita más/menos cache
   spring.cache.redis.time-to-live=3600000
   ```

3. **Implementar cachés adicionales:**
   - Alquileres
   - Servicios
   - Notificaciones

4. **Configurar alertas:**
   - Redis memory usage
   - Cache invalidation frequency
   - Query response times

---

**Última actualización**: 6 de Diciembre, 2025
**Estado**: ✅ Listo para Deploy

