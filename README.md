# Alquigest - Sistema de Gestión de Alquileres

Sistema completo para la gestión de alquileres de inmuebles, dividido en backend (API REST) y frontend (interfaz de usuario).

## Estructura del Proyecto

```
Alquigest/
├── backend/                    # API REST con Spring Boot
│   ├── src/
│   ├── pom.xml
│   └── README.md
├── frontend/                   # Interfaz de usuario (por desarrollar)
│   └── README.md
└── README.md                   # Este archivo
```

## Tecnologías

### Backend
- **Java 17**
- **Spring Boot 3.2.0**
- **Spring Data JPA**
- **SQLite** (Base de datos)
- **Maven** (Gestión de dependencias)
- **Swagger/OpenAPI** (Documentación de API)

### Frontend
- **TypeScript**
- **React 18 + Next.js 14**
- **NPM** (Gestión de dependencias)
- **TailwindCSS**

## Inicio Rápido

### Backend
```bash
cd backend
mvn spring-boot:run
```
La API estará disponible en: `http://localhost:8081`

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Para construir el proyecto para producción:
```bash
npm run build
npm start
```

## Documentación

- **Backend**: Ver `backend/README.md`
- **Frontend**: Ver `frontend/README.md`
- **API Docs**: `http://localhost:8081/swagger-ui.html` (después de ejecutar el backend)

## Funcionalidades Implementadas

### ✅ Backend (API REST)
- **Inmuebles**: CRUD completo
- **Propietarios**: CRUD completo
- **Base de datos SQLite** con esquemas optimizados
- **Documentación automática** con Swagger
- **Configuración CORS** para integración frontend

### 🔄 Frontend
- Integración con API del backend
- Gestión de inmuebles
- Gestión de Locatarios
- Gestión de Locadores
- Gestión de Pago de servicios de un alquiler
- Gestión de Alquileres/Contratos Vigentes
- Historial de Contratos
- Gestión de usuarios/Autenticación

## APIs Disponibles

### Inmuebles
- `GET /api/inmuebles` - Listar todos
- `GET /api/inmuebles/{id}` - Obtener por ID
- `POST /api/inmuebles` - Crear nuevo
- `PUT /api/inmuebles/{id}` - Actualizar
- `DELETE /api/inmuebles/{id}` - Eliminar

### Propietarios
- `GET /api/propietarios` - Listar todos  
- `GET /api/propietarios/{id}` - Obtener por ID
- `POST /api/propietarios` - Crear nuevo
- `PUT /api/propietarios/{id}` - Actualizar
- `DELETE /api/propietarios/{id}` - Eliminar

## Requisitos

### Backend
- **Java 17** o superior
- **Maven 3.6** o superior
- **Git**

### Frontend
- [Node.js](https://nodejs.org/) **>=18**
- [npm](https://www.npmjs.com/) **>=9**
