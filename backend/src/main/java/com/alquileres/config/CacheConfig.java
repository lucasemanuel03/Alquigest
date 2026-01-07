package com.alquileres.config;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Bean;
import org.springframework.cache.CacheManager;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;

import java.time.Duration;

/**
 * Configuración de caché para la aplicación
 *
 * Habilita caché con dos opciones:
 * - Redis (si está disponible en producción)
 * - ConcurrentMapCacheManager (para desarrollo local)
 */
@Configuration
@EnableCaching
public class CacheConfig {

    /**
     * Configuración de Redis Cache para producción
     * TTL: 1 hora para contratos y datos relacionados
     */
    @Bean
    @ConditionalOnProperty(name = "spring.data.redis.host", matchIfMissing = false)
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofHours(1));

        return RedisCacheManager.create(connectionFactory);
    }

    /**
     * Configuración de caché en memoria para desarrollo
     * Útil cuando Redis no está disponible
     */
    @Bean
    @ConditionalOnProperty(name = "spring.data.redis.host", matchIfMissing = true)
    public CacheManager devCacheManager() {
        return new ConcurrentMapCacheManager(
                "contratos",
                "contratos-vigentes",
                "contratos-vigentes-count",
                "contratos-no-vigentes",
                "contratos-proximos-vencer",
                "contratos-proximos-vencer-count",
                "contratos-inmueble",
                "contratos-inquilino",
                "contrato-id",
                "contrato-existe",
                "inmueble-contrato-vigente",
                "servicios-contrato"
        );
    }
}

