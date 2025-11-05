#!/bin/bash

# Script de prueba para cookies HttpOnly
# Este script prueba la funcionalidad de autenticación con cookies

echo "================================================"
echo "   Test de Autenticación con Cookies HttpOnly"
echo "================================================"
echo ""

# Variables
BACKEND_URL="http://localhost:8081"
COOKIES_FILE="test_cookies.txt"
USERNAME="admin"
PASSWORD="password"

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir con color
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Limpiar cookies anteriores
rm -f $COOKIES_FILE

# Test 1: Login
echo "Test 1: Login"
echo "-------------------"
print_info "Intentando login con username: $USERNAME"

LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND_URL/api/auth/signin" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}" \
  -c $COOKIES_FILE)

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$LOGIN_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    print_success "Login exitoso (HTTP 200)"
    echo "Respuesta:"
    echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
    echo ""
    
    # Verificar que la cookie fue guardada
    if grep -q "accessToken" $COOKIES_FILE; then
        print_success "Cookie 'accessToken' guardada correctamente"
        echo "Contenido de la cookie:"
        grep "accessToken" $COOKIES_FILE
        echo ""
    else
        print_error "Cookie 'accessToken' NO fue guardada"
        echo ""
    fi
else
    print_error "Login falló (HTTP $HTTP_CODE)"
    echo "Respuesta: $RESPONSE_BODY"
    exit 1
fi

# Test 2: Verificar sesión (/auth/me)
echo "Test 2: Verificar sesión actual"
echo "--------------------------------"
print_info "Llamando a /auth/me con la cookie"

ME_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BACKEND_URL/api/auth/me" \
  -b $COOKIES_FILE)

HTTP_CODE=$(echo "$ME_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$ME_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    print_success "Sesión verificada exitosamente (HTTP 200)"
    echo "Información del usuario:"
    echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
    echo ""
else
    print_error "Verificación de sesión falló (HTTP $HTTP_CODE)"
    echo "Respuesta: $RESPONSE_BODY"
    echo ""
fi

# Test 3: Acceder a un endpoint protegido
echo "Test 3: Acceder a endpoint protegido"
echo "-------------------------------------"
print_info "Intentando acceder a /api/inmuebles/count/activos"

PROTECTED_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BACKEND_URL/api/inmuebles/count/activos" \
  -b $COOKIES_FILE)

HTTP_CODE=$(echo "$PROTECTED_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$PROTECTED_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    print_success "Acceso al endpoint protegido exitoso (HTTP 200)"
    echo "Respuesta: $RESPONSE_BODY"
    echo ""
else
    print_error "Acceso denegado (HTTP $HTTP_CODE)"
    echo "Respuesta: $RESPONSE_BODY"
    echo ""
fi

# Test 4: Refresh token
echo "Test 4: Refresh token"
echo "---------------------"
print_info "Refrescando token JWT"

REFRESH_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND_URL/api/auth/refresh" \
  -b $COOKIES_FILE \
  -c $COOKIES_FILE)

HTTP_CODE=$(echo "$REFRESH_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$REFRESH_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    print_success "Token refrescado exitosamente (HTTP 200)"
    echo "Respuesta:"
    echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
    echo ""
else
    print_error "Refresh falló (HTTP $HTTP_CODE)"
    echo "Respuesta: $RESPONSE_BODY"
    echo ""
fi

# Test 5: Logout
echo "Test 5: Logout"
echo "--------------"
print_info "Cerrando sesión"

LOGOUT_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND_URL/api/auth/logout" \
  -b $COOKIES_FILE \
  -c $COOKIES_FILE)

HTTP_CODE=$(echo "$LOGOUT_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$LOGOUT_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    print_success "Logout exitoso (HTTP 200)"
    echo "Respuesta:"
    echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
    echo ""
else
    print_error "Logout falló (HTTP $HTTP_CODE)"
    echo "Respuesta: $RESPONSE_BODY"
    echo ""
fi

# Test 6: Verificar que la sesión fue cerrada
echo "Test 6: Verificar cierre de sesión"
echo "-----------------------------------"
print_info "Intentando acceder a /auth/me sin sesión"

NO_SESSION_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BACKEND_URL/api/auth/me" \
  -b $COOKIES_FILE)

HTTP_CODE=$(echo "$NO_SESSION_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$NO_SESSION_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "401" ]; then
    print_success "Sesión cerrada correctamente (HTTP 401 esperado)"
    echo "Respuesta: $RESPONSE_BODY"
    echo ""
else
    print_error "La sesión debería estar cerrada pero obtuvo HTTP $HTTP_CODE"
    echo "Respuesta: $RESPONSE_BODY"
    echo ""
fi

# Limpieza
echo "================================================"
print_info "Limpiando archivos temporales..."
rm -f $COOKIES_FILE
print_success "Tests completados!"
echo "================================================"
