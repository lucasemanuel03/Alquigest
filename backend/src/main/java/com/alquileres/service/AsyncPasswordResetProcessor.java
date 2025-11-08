package com.alquileres.service;

import com.alquileres.model.Usuario;
import com.alquileres.repository.UsuarioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;

/**
 * Servicio separado para procesamiento asíncrono de recuperación de contraseña.
 * Esto es necesario porque Spring no puede interceptar llamadas @Async dentro de la misma clase.
 */
@Service
public class AsyncPasswordResetProcessor {

    private static final Logger logger = LoggerFactory.getLogger(AsyncPasswordResetProcessor.class);

    private final UsuarioRepository usuarioRepository;
    private final EmailService emailService;
    private final Random random;
    private final long tokenExpirationTime;

    public AsyncPasswordResetProcessor(
            UsuarioRepository usuarioRepository,
            EmailService emailService) {
        this.usuarioRepository = usuarioRepository;
        this.emailService = emailService;
        this.random = new Random();
        this.tokenExpirationTime = 3600000; // 1 hora por defecto
    }

    /**
     * Procesa la recuperación de contraseña de forma asíncrona.
     * Se ejecuta en un hilo separado, por lo que no bloquea la respuesta al cliente.
     *
     * @param email Email del usuario
     */
    @Async
    public void procesarRecuperacionAsync(String email) {
        try {
            Optional<Usuario> usuario = usuarioRepository.findByEmail(email);

            if (usuario.isEmpty()) {
                logger.warn("Intento de recuperación con email no registrado: {}", email);

                // Delay aleatorio: media de 4 segundos con desviación de 1 segundo
                // Genera un número aleatorio entre 3000 y 5000 milisegundos (3-5 segundos)
                int delayMs = 3000 + random.nextInt(2001); // 3000 + [0, 2000]

                try {
                    Thread.sleep(delayMs);
                    logger.debug("Delay aplicado de {} ms para email no encontrado", delayMs);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    logger.warn("Delay interrumpido: {}", e.getMessage());
                }

                // No hacer nada más, pero tampoco revelar que el email no existe
                return;
            }

            Usuario u = usuario.get();
            String token = UUID.randomUUID().toString();
            LocalDateTime expiryDate = LocalDateTime.now().plusNanos(tokenExpirationTime * 1_000_000L);

            u.setPasswordResetToken(token);
            u.setPasswordResetTokenExpiry(expiryDate);
            usuarioRepository.save(u);

            logger.info("Proceso de recuperación iniciado para: {}", email);

            // Enviar email de forma asíncrona en otro hilo
            enviarEmailAsync(email, u.getUsername(), token);

        } catch (Exception e) {
            logger.error("Error al procesar recuperación de contraseña para {}: {}", email, e.getMessage(), e);
        }
    }

    /**
     * Envía el email de recuperación de forma asíncrona.
     * Esto permite que el proceso de recuperación retorne más rápido.
     *
     * @param email Email del destinatario
     * @param username Nombre de usuario
     * @param token Token de recuperación
     */
    @Async
    public void enviarEmailAsync(String email, String username, String token) {
        try {
            emailService.enviarEmailRecuperacionContrasena(email, username, token);
            logger.info("Email de recuperación de contraseña enviado a: {}", email);
        } catch (Exception e) {
            logger.error("Error al enviar email de recuperación a {}: {}", email, e.getMessage(), e);
        }
    }
}

