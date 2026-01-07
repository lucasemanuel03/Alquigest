# Etapa 1: Build
FROM maven:3.9.9-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Copiar solo pom.xml primero (cache de dependencias)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copiar el resto del código y compilar
COPY src ./src
RUN mvn clean package -DskipTests -B

# Etapa 2: Runtime
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Crear usuario no-root
RUN addgroup -g 1001 appuser && \
    adduser -D -u 1001 -G appuser appuser

# Copiar el JAR de la etapa de build
COPY --from=build /app/target/*.jar app.jar

# Cambiar al usuario no-root
USER appuser

# Exponer puerto
EXPOSE 8080

# Variables de entorno por defecto
ENV JAVA_OPTS="-Xms256m -Xmx512m" \
    SPRING_PROFILES_ACTIVE=production

# Ejecutar la aplicación
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]