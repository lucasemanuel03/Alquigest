package com.alquileres.service;

import com.alquileres.security.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Service
public class TokenBlacklistService {

    @Autowired
    @Lazy
    private JwtUtils jwtUtils;

    // Almacenamos el token junto con su fecha de expiración
    private final Map<String, Date> blacklistedTokens = new ConcurrentHashMap<>();
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);

    public TokenBlacklistService() {
        // Limpiar tokens expirados cada hora
        scheduler.scheduleAtFixedRate(this::cleanupExpiredTokens, 1, 1, TimeUnit.HOURS);
    }

    /**
     * Agrega un token a la blacklist con su fecha de expiración
     */
    public void blacklistToken(String token) {
        try {
            Date expirationDate = jwtUtils.getExpirationDateFromToken(token);
            blacklistedTokens.put(token, expirationDate);
        } catch (Exception e) {
            // Si no se puede obtener la fecha de expiración, usar fecha actual + 24 horas
            Date fallbackExpiration = new Date(System.currentTimeMillis() + 24 * 60 * 60 * 1000);
            blacklistedTokens.put(token, fallbackExpiration);
        }
    }

    /**
     * Verifica si un token está en la blacklist y no ha expirado
     */
    public boolean isTokenBlacklisted(String token) {
        Date expirationDate = blacklistedTokens.get(token);

        if (expirationDate == null) {
            return false; // Token no está en blacklist
        }

        // Si el token ya expiró naturalmente, lo removemos de la blacklist
        if (expirationDate.before(new Date())) {
            blacklistedTokens.remove(token);
            return false;
        }

        return true; // Token está en blacklist y aún no ha expirado
    }

    /**
     * Limpia tokens que ya expiraron de la blacklist para liberar memoria
     */
    private void cleanupExpiredTokens() {
        Date now = new Date();
        blacklistedTokens.entrySet().removeIf(entry -> entry.getValue().before(now));

        System.out.println("Limpieza de blacklist completada. Tokens activos en blacklist: " + blacklistedTokens.size());
    }

    /**
     * Obtiene el tamano actual de la blacklist (útil para monitoreo)
     */
    public int getBlacklistSize() {
        return blacklistedTokens.size();
    }

    /**
     * Limpia manualmente todos los tokens de la blacklist
     */
    public void clearBlacklist() {
        blacklistedTokens.clear();
    }

    /**
     * Cierra el scheduler cuando el servicio se destruye
     */
    public void shutdown() {
        scheduler.shutdown();
    }
}
