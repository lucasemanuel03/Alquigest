#!/bin/bash

# Script para testear el deployment localmente con Docker
# Este script simula el ambiente de Render

set -e

echo "🚀 Testeando despliegue de Alquigest Backend con Docker"
echo "========================================================"

# Verificar que Docker esté instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker no está instalado"
    exit 1
fi

# Verificar que exista el archivo .env
if [ ! -f .env ]; then
    echo "❌ Error: No se encuentra el archivo .env"
    echo "Crea un archivo .env basado en .env.example"
    exit 1
fi

# Nombre de la imagen
IMAGE_NAME="alquigest-backend"
CONTAINER_NAME="alquigest-backend-test"

# Limpiar contenedores anteriores
echo ""
echo "🧹 Limpiando contenedores anteriores..."
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

# Construir la imagen
echo ""
echo "🔨 Construyendo imagen Docker..."
docker build -t $IMAGE_NAME .

if [ $? -ne 0 ]; then
    echo "❌ Error al construir la imagen"
    exit 1
fi

echo "✅ Imagen construida exitosamente"

# Ejecutar el contenedor
echo ""
echo "🐳 Iniciando contenedor..."
docker run -d \
    --name $CONTAINER_NAME \
    --env-file .env \
    -p 8080:8080 \
    $IMAGE_NAME

if [ $? -ne 0 ]; then
    echo "❌ Error al iniciar el contenedor"
    exit 1
fi

echo "✅ Contenedor iniciado"

# Esperar a que la aplicación inicie
echo ""
echo "⏳ Esperando a que la aplicación inicie (puede tomar 30-60 segundos)..."
MAX_ATTEMPTS=60
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if curl -s http://localhost:8080/api/health > /dev/null 2>&1; then
        echo "✅ Aplicación iniciada correctamente"
        break
    fi
    ATTEMPT=$((ATTEMPT + 1))
    echo -n "."
    sleep 1
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo ""
    echo "❌ La aplicación no respondió a tiempo"
    echo ""
    echo "📋 Logs del contenedor:"
    docker logs $CONTAINER_NAME
    exit 1
fi

# Testear el endpoint de health
echo ""
echo "🔍 Testeando endpoint de health..."
RESPONSE=$(curl -s http://localhost:8080/api/health)
echo "Respuesta: $RESPONSE"

if echo "$RESPONSE" | grep -q "UP"; then
    echo "✅ Health check exitoso"
else
    echo "❌ Health check falló"
    echo ""
    echo "📋 Logs del contenedor:"
    docker logs $CONTAINER_NAME
    exit 1
fi

# Mostrar información
echo ""
echo "=================================================="
echo "✅ Despliegue local exitoso!"
echo "=================================================="
echo ""
echo "📍 URL: http://localhost:8080"
echo "🏥 Health: http://localhost:8080/api/health"
echo "📚 Swagger: http://localhost:8080/swagger-ui"
echo ""
echo "Comandos útiles:"
echo "  - Ver logs: docker logs -f $CONTAINER_NAME"
echo "  - Detener: docker stop $CONTAINER_NAME"
echo "  - Reiniciar: docker restart $CONTAINER_NAME"
echo "  - Eliminar: docker rm -f $CONTAINER_NAME"
echo ""

