#!/bin/bash

# Script para generar secrets seguros para variables de entorno
# Úsalo antes de desplegar en producción

echo "🔐 Generador de Secrets para Alquigest"
echo "======================================"
echo ""

# Verificar que openssl esté instalado
if ! command -v openssl &> /dev/null; then
    echo "❌ Error: openssl no está instalado"
    echo "Instálalo con: sudo apt-get install openssl (Ubuntu/Debian)"
    exit 1
fi

echo "Generando secrets seguros..."
echo ""

# Generar JWT_SECRET
JWT_SECRET=$(openssl rand -hex 32)
echo "✅ JWT_SECRET generado:"
echo "JWT_SECRET=$JWT_SECRET"
echo ""

# Generar ENCRYPTION_KEY
ENCRYPTION_KEY=$(openssl rand -hex 32)
echo "✅ ENCRYPTION_KEY generado:"
echo "ENCRYPTION_KEY=$ENCRYPTION_KEY"
echo ""

# Crear archivo .env.production con los secrets
cat > .env.production << EOF
# ⚠️ ARCHIVO DE PRODUCCIÓN - NO SUBIR A GIT ⚠️
# Generado el $(date)

PORT=8080

# Base de datos - Supabase Transaction Pooler
SPRING_DATASOURCE_URL=jdbc:postgresql://aws-1-sa-east-1.pooler.supabase.com:6543/postgres?user=postgres.tenoiqaislbaxtzysjod&prepareThreshold=0
SPRING_DATASOURCE_USERNAME=postgres.tenoiqaislbaxtzysjod
SPRING_DATASOURCE_PASSWORD=TU_PASSWORD_AQUI

# CORS - URLs permitidas (ACTUALIZAR CON TU DOMINIO)
ALLOWED_ORIGINS=https://tu-frontend.vercel.app,https://*.onrender.com

# JWT - Secret ÚNICO generado
JWT_SECRET=$JWT_SECRET
JWT_EXPIRATION_MS=86400000

# Encriptación - Clave ÚNICA generada
ENCRYPTION_KEY=$ENCRYPTION_KEY

# Email - Configuración de Gmail (ACTUALIZAR)
MAIL_USERNAME=tu-email@gmail.com
MAIL_PASSWORD=tu-app-password

# Password Reset
PASSWORD_RESET_TOKEN_EXPIRATION_MS=3600000
EOF

echo "✅ Archivo .env.production creado"
echo ""
echo "📝 IMPORTANTE:"
echo "   1. Edita .env.production y actualiza:"
echo "      - SPRING_DATASOURCE_PASSWORD"
echo "      - ALLOWED_ORIGINS"
echo "      - MAIL_USERNAME"
echo "      - MAIL_PASSWORD"
echo ""
echo "   2. En el dashboard de Render, copia estos valores:"
echo "      - JWT_SECRET=$JWT_SECRET"
echo "      - ENCRYPTION_KEY=$ENCRYPTION_KEY"
echo ""
echo "   3. NUNCA subas .env.production a Git"
echo ""
echo "⚠️  Guarda estos secrets en un lugar seguro (1Password, Vault, etc.)"

