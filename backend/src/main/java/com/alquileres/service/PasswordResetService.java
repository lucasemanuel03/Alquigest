package com.alquileres.service;

import com.alquileres.model.Usuario;
import com.alquileres.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class PasswordResetService {

    private static final Logger logger = LoggerFactory.getLogger(PasswordResetService.class);

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${app.password-reset-token-expiration-ms:3600000}")
    private long tokenExpirationTime;

    public void solicitarRecuperacionContrasena(String email) {
        Optional<Usuario> usuario = usuarioRepository.findByEmail(email);

        if (usuario.isEmpty()) {
            logger.warn("Intento de recuperación con email no registrado: {}", email);
            throw new RuntimeException("El email no está registrado en el sistema");
        }

        Usuario u = usuario.get();
        String token = UUID.randomUUID().toString();
        LocalDateTime expiryDate = LocalDateTime.now().plusNanos(tokenExpirationTime * 1_000_000L);

        u.setPasswordResetToken(token);
        u.setPasswordResetTokenExpiry(expiryDate);
        usuarioRepository.save(u);

        emailService.enviarEmailRecuperacionContrasena(email, u.getUsername(), token);
        logger.info("Email de recuperación de contraseña enviado a: {}", email);
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

