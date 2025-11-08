package com.alquileres.service;

import com.alquileres.model.Usuario;
import com.alquileres.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class PasswordResetService {

    private static final Logger logger = LoggerFactory.getLogger(PasswordResetService.class);

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final AsyncPasswordResetProcessor asyncProcessor;

    @Value("${app.password-reset-token-expiration-ms:3600000}")
    private long tokenExpirationTime;

    public PasswordResetService(
            UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder,
            AsyncPasswordResetProcessor asyncProcessor) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.asyncProcessor = asyncProcessor;
    }

    /**
     * Solicita recuperación de contraseña.
     * Este método retorna inmediatamente sin revelar si el email existe o no.
     * El procesamiento del email se realiza de forma asíncrona en segundo plano.
     *
     * @param email Email del usuario
     */
    public void solicitarRecuperacionContrasena(String email) {
        // Delegar el procesamiento real a un servicio asíncrono separado
        asyncProcessor.procesarRecuperacionAsync(email);

        // Retornar inmediatamente sin revelar información
        logger.info("Solicitud de recuperación de contraseña recibida para: {}", email);
    }


    public void resetearContrasena(String token, String nuevaContrasena, String confirmarContrasena) {
        if (!nuevaContrasena.equals(confirmarContrasena)) {
            throw new RuntimeException("Las contraseñas no coinciden");
        }

        Optional<Usuario> usuario = usuarioRepository.findByPasswordResetToken(token);

        if (usuario.isEmpty()) {
            logger.warn("Intento de reset con token inválido");
            throw new RuntimeException("Token de recuperación inválido");
        }

        Usuario u = usuario.get();

        if (u.getPasswordResetTokenExpiry() == null || LocalDateTime.now().isAfter(u.getPasswordResetTokenExpiry())) {
            logger.warn("Token expirado para usuario: {}", u.getUsername());
            throw new RuntimeException("El token de recuperación ha expirado");
        }

        u.setPassword(passwordEncoder.encode(nuevaContrasena));
        u.setPasswordResetToken(null);
        u.setPasswordResetTokenExpiry(null);
        usuarioRepository.save(u);

        logger.info("Contraseña reseteada exitosamente para usuario: {}", u.getUsername());
    }

    public boolean validarToken(String token) {
        Optional<Usuario> usuario = usuarioRepository.findByPasswordResetToken(token);

        if (usuario.isEmpty()) {
            return false;
        }

        Usuario u = usuario.get();
        return u.getPasswordResetTokenExpiry() != null && LocalDateTime.now().isBefore(u.getPasswordResetTokenExpiry());
    }
}

