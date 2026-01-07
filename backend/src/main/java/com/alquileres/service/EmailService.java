package com.alquileres.service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void enviarEmailRecuperacionContrasena(String destinatario, String usuario, String token) {
        try {
            String enlace = "http://alquigest.vercel.app/auth/nueva-contrasena?token=" + token;
            String contenido = "Hola " + usuario + ",\n\n" +
                    "Ha solicitado recuperar su contraseña. Por favor haga clic en el siguiente enlace:\n" +
                    enlace + "\n\n" +
                    "Este enlace expirará en 1 hora.\n\n" +
                    "Si no solicitó esta recuperación, ignore este email.\n\n" +
                    "Saludos,\nAlquigest";

            enviarEmail(destinatario, "Recuperación de Contraseña - Alquigest", contenido);
            logger.info("Email de recuperación de contraseña enviado a: {}", destinatario);
        } catch (Exception e) {
            logger.error("Error al enviar email de recuperación de contraseña", e);
            throw new RuntimeException("Error al enviar email de recuperación: " + e.getMessage(), e);
        }
    }

    public void enviarEmailPrueba(String destinatario) {
        try {
            enviarEmail(destinatario, "Email de Prueba - Alquigest", "Este es un email de prueba de la plataforma Alquigest.");
            logger.info("Email de prueba enviado a: {}", destinatario);
        } catch (Exception e) {
            logger.error("Error al enviar email de prueba: {}", e.getMessage(), e);
            throw new RuntimeException("Error al enviar email de prueba: " + e.getMessage(), e);
        }
    }

    private void enviarEmail(String destinatario, String asunto, String contenido) {
        logger.info("=== INICIANDO ENVIO DE EMAIL ===");
        logger.info("Destinatario: {}", destinatario);
        logger.info("Asunto: {}", asunto);

        try {
            SimpleMailMessage mensaje = new SimpleMailMessage();
            mensaje.setFrom("noreply.alquigest@gmail.com");
            mensaje.setTo(destinatario);
            mensaje.setSubject(asunto);
            mensaje.setText(contenido);

            logger.debug("Intentando enviar email a través de SMTP...");
            logger.debug("Host: smtp.gmail.com, Puerto: 587");
            mailSender.send(mensaje);
            logger.info("=== EMAIL ENVIADO EXITOSAMENTE ===");
        } catch (org.springframework.mail.MailAuthenticationException e) {
            logger.error("ERROR DE AUTENTICACION SMTP: {}", e.getMessage());
            logger.error("La contraseña o usuario de Gmail es incorrecto");
            logger.error("Stack trace completo:", e);
            throw e;
        } catch (org.springframework.mail.MailSendException e) {
            logger.error("ERROR AL ENVIAR EMAIL: {}", e.getMessage());
            logger.error("Causa: {}", e.getCause());
            if (e.getCause() != null) {
                logger.error("Causa raíz: {}", e.getCause().getMessage());
            }
            logger.error("Stack trace completo:", e);
            throw e;
        } catch (Exception e) {
            logger.error("ERROR INESPERADO: {}", e.getClass().getName());
            logger.error("Mensaje: {}", e.getMessage());
            logger.error("Stack trace completo:", e);
            throw e;
        }
    }
}


