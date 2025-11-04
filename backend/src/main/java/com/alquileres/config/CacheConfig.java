package com.alquileres.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;

/**
 * Configuración de Cache para la aplicación.
 * Utiliza ConcurrentMapCache en memoria por defecto.
 * 
 * Para usar Redis en producción, agrega las siguientes configuraciones en application.properties:
 * spring.redis.host=localhost
 * spring.redis.port=6379
 * spring.cache.type=redis
 */
@Configuration
@EnableCaching
public class CacheConfig {

    /**
     * CacheManager usando cache en memoria.
     * Perfecto para desarrollo y pequeñas aplicaciones.
     * Para producción con múltiples instancias, considera usar Redis.
     */
    @Bean
    public CacheManager cacheManager() {
        return new ConcurrentMapCacheManager(
                "contratos",
                "inmuebles",
                "inquilinos",
                "propietarios",
                "pagosAlquiler",
                "pagosServicios",
                "servicios",
                "estadosContrato",
                "alquileres-no-pagados",
                "contratos-por-vencer"
        );
    }
}
