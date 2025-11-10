package com.alquileres.controller;

import com.alquileres.dto.JwtResponse;
import com.alquileres.dto.LoginRequest;
import com.alquileres.dto.MessageResponse;
import com.alquileres.dto.SignupRequest;
import com.alquileres.dto.RecuperarContrasenaDTO;
import com.alquileres.dto.ResetearContrasenaDTO;
import com.alquileres.model.Rol;
import com.alquileres.model.RolNombre;
import com.alquileres.model.Usuario;
import com.alquileres.repository.RolRepository;
import com.alquileres.repository.UsuarioRepository;
import com.alquileres.security.JwtUtils;
import com.alquileres.security.UserDetailsImpl;
import com.alquileres.service.PermisosService;
import com.alquileres.service.ContratoActualizacionService;
import com.alquileres.service.ServicioActualizacionService;
import com.alquileres.service.AlquilerActualizacionService;
import com.alquileres.service.LoginAttemptService;
import com.alquileres.service.PasswordResetService;
import com.alquileres.service.EmailService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Autenticación", description = "API para autenticación y registro de usuarios")
public class AuthController {

    @Value("${app.jwt.cookieName:accessToken}")
    private String jwtCookieName;

    @Value("${app.jwt.cookieMaxAge:3600}") // 1 hora por defecto
    private int cookieMaxAge;

    @Value("${app.cors.allowedOrigins:http://localhost:3000}")
    private String allowedOrigins;

    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UsuarioRepository usuarioRepository;

    @Autowired
    RolRepository rolRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    @Autowired
    com.alquileres.security.UserDetailsServiceImpl userDetailsService;

    @Autowired
    PermisosService permisosService;

    @Autowired
    ContratoActualizacionService contratoActualizacionService;

    @Autowired
    ServicioActualizacionService servicioActualizacionService;

    @Autowired
    AlquilerActualizacionService alquilerActualizacionService;

    @Autowired
    LoginAttemptService loginAttemptService;

    @Autowired
    PasswordResetService passwordResetService;

    @Autowired
    EmailService emailService;

    @PostMapping("/signin")
    @Operation(summary = "Iniciar sesión")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest, HttpServletResponse response) {

        try {
            // Verificar intentos previos y aplicar delay si es necesario
            loginAttemptService.checkAndApplyDelay(loginRequest.getUsername());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return ResponseEntity
                    .status(429) // Too Many Requests
                    .body(new MessageResponse("Demasiados intentos fallidos. Por favor, espere antes de intentar nuevamente."));
        }

        // Ejecutar procesos de actualización automáticos de manera segura
        // Estos procesos NO afectarán el resultado del login si fallan
        ejecutarProcesosAutomaticos();

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

            // Login exitoso - limpiar intentos fallidos
            loginAttemptService.loginSucceeded(loginRequest.getUsername());

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = jwtUtils.generateJwtToken(authentication);

            // Configurar cookie HttpOnly con el JWT
            Cookie jwtCookie = new Cookie(jwtCookieName, jwt);
            jwtCookie.setHttpOnly(true);  // No accesible desde JavaScript
            jwtCookie.setSecure(false);   // Cambiar a true en producción con HTTPS
            jwtCookie.setPath("/");
            jwtCookie.setMaxAge(cookieMaxAge); // Duración en segundos
            // jwtCookie.setAttribute("SameSite", "Strict"); // Protección CSRF - descomentar si usas Spring 6.1+
            response.addCookie(jwtCookie);

            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            List<String> roles = userDetails.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.toList());

            // Obtener permisos basados en los roles del usuario
            Map<String, Boolean> permisos = obtenerPermisosUsuario(userDetails.getId());

            // Devolver datos del usuario sin el token (ahora está en la cookie)
            return ResponseEntity.ok(new JwtResponse(null, // No enviar token en el body
                    userDetails.getId(),
                    userDetails.getUsername(),
                    userDetails.getEmail(),
                    roles,
                    permisos));
        } catch (BadCredentialsException e) {
            // Login fallido - registrar intento
            loginAttemptService.loginFailed(loginRequest.getUsername());

            int attempts = loginAttemptService.getFailedAttempts(loginRequest.getUsername());
            String message;

            if (attempts == 2) {
                message = "Credenciales incorrectas. Advertencia: El próximo intento fallido tendrá un delay de 5 segundos.";
            } else if (attempts == 3) {
                message = "Credenciales incorrectas. Advertencia: Los próximos intentos fallidos tendrán un delay de 30 segundos.";
            } else if (attempts > 3) {
                message = "Credenciales incorrectas. Debe esperar 30 segundos antes de cada intento.";
            } else {
                message = "Credenciales incorrectas.";
            }

            return ResponseEntity
                    .status(401)
                    .body(new MessageResponse(message));
        }
    }

    /**
     * Ejecuta los procesos automáticos de actualización de forma segura.
     * Si alguno falla, se loguea el error pero NO afecta el resultado del login.
     */
    private void ejecutarProcesosAutomaticos() {
        try {
            contratoActualizacionService.actualizarContratosVencidos();
        } catch (Exception ignored) {
        }

        try {
            servicioActualizacionService.procesarPagosPendientes();
        } catch (Exception ignored) {
        }

        try {
            alquilerActualizacionService.procesarAlquileresPendientes();
        } catch (Exception ignored) {
        }
    }

    /**
     * Obtiene los permisos de un usuario basado en sus roles
     */
    private Map<String, Boolean> obtenerPermisosUsuario(Long userId) {
        try {
            // Obtener el usuario y sus roles
            Usuario usuario = usuarioRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            // Extraer los nombres de los roles
            List<RolNombre> rolesNombre = usuario.getRoles().stream()
                    .map(Rol::getNombre)
                    .collect(Collectors.toList());

            // Obtener permisos consolidados para todos los roles del usuario
            return permisosService.obtenerPermisosConsolidados(rolesNombre);

        } catch (Exception e) {
            System.err.println("Error al obtener permisos del usuario: " + e.getMessage());
            // En caso de error, devolver permisos vacíos por seguridad
            return permisosService.obtenerPermisosConsolidados(List.of());
        }
    }

    @PostMapping("/signup")
    @Operation(summary = "Registrar nuevo usuario")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        if (usuarioRepository.existsByUsername(signUpRequest.getUsername())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: El nombre de usuario ya está en uso!"));
        }

        if (usuarioRepository.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: El email ya está en uso!"));
        }

        // Crear nueva cuenta de usuario
        Usuario usuario = new Usuario(signUpRequest.getUsername(),
                signUpRequest.getEmail(),
                encoder.encode(signUpRequest.getPassword()));

        Set<String> strRoles = signUpRequest.getRole();
        Set<Rol> roles = new HashSet<>();

        if (strRoles == null) {
            Rol secretariaRole = rolRepository.findByNombre(RolNombre.ROLE_SECRETARIA)
                    .orElseThrow(() -> new RuntimeException("Error: Rol no encontrado."));
            roles.add(secretariaRole);
        } else {
            strRoles.forEach(role -> {
                switch (role) {
                    case "admin":
                        Rol adminRole = rolRepository.findByNombre(RolNombre.ROLE_ADMINISTRADOR)
                                .orElseThrow(() -> new RuntimeException("Error: Rol no encontrado."));
                        roles.add(adminRole);
                        break;
                    case "abogada":
                        Rol abogadaRole = rolRepository.findByNombre(RolNombre.ROLE_ABOGADA)
                                .orElseThrow(() -> new RuntimeException("Error: Rol no encontrado."));
                        roles.add(abogadaRole);
                        break;
                    default:
                        Rol secretariaRole = rolRepository.findByNombre(RolNombre.ROLE_SECRETARIA)
                                .orElseThrow(() -> new RuntimeException("Error: Rol no encontrado."));
                        roles.add(secretariaRole);
                }
            });
        }

        usuario.setRoles(roles);
        usuarioRepository.save(usuario);

        return ResponseEntity.ok(new MessageResponse("Usuario registrado exitosamente!"));
    }

    @PostMapping("/recuperar-contrasena")
    @Operation(summary = "Solicitar recuperación de contraseña",
               description = "Solicita el envío de un email de recuperación. El procesamiento se realiza de forma asíncrona. " +
                           "Siempre devuelve el mismo mensaje por razones de seguridad, independientemente de si el email existe o no.")
    public ResponseEntity<?> recuperarContrasena(@Valid @RequestBody RecuperarContrasenaDTO dto) {
        // Procesar de forma asíncrona (no bloquea la respuesta)
        passwordResetService.solicitarRecuperacionContrasena(dto.getEmail());

        // Siempre devolver el mismo mensaje, sin importar si el email existe o no
        // Esto evita que se pueda determinar qué emails están registrados en el sistema
        return ResponseEntity.ok(new MessageResponse(
            "Si el email existe en nuestro sistema, recibirás un correo con instrucciones para recuperar tu contraseña."
        ));
    }

    @PostMapping("/resetear-contrasena")
    @Operation(summary = "Resetear contraseña con token")
    public ResponseEntity<?> resetearContrasena(@Valid @RequestBody ResetearContrasenaDTO dto) {
        try {
            passwordResetService.resetearContrasena(dto.getToken(), dto.getNuevaContrasena(), dto.getConfirmarContrasena());
            return ResponseEntity.ok(new MessageResponse("Contraseña actualizada exitosamente!"));
        } catch (Exception e) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        }
    }

    @GetMapping("/validar-token-reseteo/{token}")
    @Operation(summary = "Validar token de recuperación")
    public ResponseEntity<?> validarTokenReset(@PathVariable String token) {
        boolean valido = passwordResetService.validarToken(token);
        return ResponseEntity.ok(new MessageResponse(valido ? "Token válido" : "Token inválido o expirado"));
    }

    @PostMapping("/test-email")
    @Operation(summary = "Enviar email de prueba")
    public ResponseEntity<?> enviarEmailPrueba(@RequestParam String destinatario) {
        try {
            emailService.enviarEmailPrueba(destinatario);
            return ResponseEntity.ok(new MessageResponse("Email de prueba enviado a: " + destinatario));
        } catch (Exception e) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error al enviar email: " + e.getMessage()));
        }
    }

    @GetMapping("/diagnostico-email")
    @Operation(summary = "Diagnosticar conexión SMTP")
    public ResponseEntity<?> diagnosticoEmail() {
        try {
            return ResponseEntity.ok(new MessageResponse("Conexión SMTP funcionando correctamente"));
        } catch (Exception e) {
            return ResponseEntity
                    .status(500)
                    .body(new MessageResponse("Error de conexión: " + e.getMessage()));
        }
    }

    @PostMapping("/logout")
    @Operation(summary = "Cerrar sesión")
    public ResponseEntity<?> logoutUser(HttpServletRequest request, HttpServletResponse response) {
        try {
            // Limpiar cookie
            Cookie jwtCookie = new Cookie(jwtCookieName, null);
            jwtCookie.setHttpOnly(true);
            jwtCookie.setSecure(false); // Cambiar a true en producción
            jwtCookie.setPath("/");
            jwtCookie.setMaxAge(0); // Eliminar cookie
            response.addCookie(jwtCookie);

            // Obtener el token de la cookie para invalidarlo en la blacklist
            Cookie[] cookies = request.getCookies();
            if (cookies != null) {
                for (Cookie cookie : cookies) {
                    if (jwtCookieName.equals(cookie.getName())) {
                        String jwt = cookie.getValue();
                        if (jwt != null && !jwt.isEmpty()) {
                            jwtUtils.invalidateToken(jwt);
                        }
                        break;
                    }
                }
            }

            // Limpiar el contexto de seguridad
            SecurityContextHolder.clearContext();

            return ResponseEntity.ok(new MessageResponse("Sesión cerrada exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error al cerrar sesión: " + e.getMessage()));
        }
    }

    @GetMapping("/me")
    @Operation(summary = "Obtener información del usuario autenticado")
    public ResponseEntity<?> getCurrentUser(HttpServletRequest request) {
        try {
            // Obtener el token de la cookie
            String jwt = null;
            Cookie[] cookies = request.getCookies();
            if (cookies != null) {
                for (Cookie cookie : cookies) {
                    if (jwtCookieName.equals(cookie.getName())) {
                        jwt = cookie.getValue();
                        break;
                    }
                }
            }

            if (jwt == null || jwt.isEmpty()) {
                return ResponseEntity.status(401)
                        .body(new MessageResponse("No autenticado"));
            }

            // Validar el token
            if (!jwtUtils.validateJwtToken(jwt)) {
                return ResponseEntity.status(401)
                        .body(new MessageResponse("Token inválido o expirado"));
            }

            // Obtener el usuario del token
            String username = jwtUtils.getUserNameFromJwtToken(jwt);
            UserDetailsImpl userDetails = (UserDetailsImpl) userDetailsService.loadUserByUsername(username);

            List<String> roles = userDetails.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.toList());

            // Obtener permisos actualizados
            Map<String, Boolean> permisos = obtenerPermisosUsuario(userDetails.getId());

            // Devolver datos del usuario sin el token
            return ResponseEntity.ok(new JwtResponse(null,
                    userDetails.getId(),
                    userDetails.getUsername(),
                    userDetails.getEmail(),
                    roles,
                    permisos));

        } catch (Exception e) {
            return ResponseEntity.status(401)
                    .body(new MessageResponse("Error al obtener información del usuario: " + e.getMessage()));
        }
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refrescar token JWT")
    public ResponseEntity<?> refreshToken(HttpServletRequest request, HttpServletResponse response) {
        try {
            // Obtener el token de la cookie
            String jwt = null;
            Cookie[] cookies = request.getCookies();
            if (cookies != null) {
                for (Cookie cookie : cookies) {
                    if (jwtCookieName.equals(cookie.getName())) {
                        jwt = cookie.getValue();
                        break;
                    }
                }
            }

            if (jwt == null || jwt.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("Token no proporcionado"));
            }

            // Verificar si el token es válido (no expirado y no en blacklist)
            if (!jwtUtils.validateJwtToken(jwt)) {
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("Token inválido o expirado"));
            }

            // Obtener el usuario del token
            String username = jwtUtils.getUserNameFromJwtToken(jwt);
            UserDetailsImpl userDetails = (UserDetailsImpl) userDetailsService.loadUserByUsername(username);

            // Invalidar el token actual
            jwtUtils.invalidateToken(jwt);

            // Crear nueva autenticación
            UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

            // Generar nuevo token
            String newJwt = jwtUtils.generateJwtToken(authentication);

            // Configurar nueva cookie con el nuevo JWT
            Cookie jwtCookie = new Cookie(jwtCookieName, newJwt);
            jwtCookie.setHttpOnly(true);
            jwtCookie.setSecure(false); // Cambiar a true en producción
            jwtCookie.setPath("/");
            jwtCookie.setMaxAge(cookieMaxAge);
            response.addCookie(jwtCookie);

            List<String> roles = userDetails.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.toList());

            // Obtener permisos actualizados
            Map<String, Boolean> permisos = obtenerPermisosUsuario(userDetails.getId());

            return ResponseEntity.ok(new JwtResponse(null, // No enviar token en el body
                    userDetails.getId(),
                    userDetails.getUsername(),
                    userDetails.getEmail(),
                    roles,
                    permisos));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error al refrescar token: " + e.getMessage()));
        }
    }
}



