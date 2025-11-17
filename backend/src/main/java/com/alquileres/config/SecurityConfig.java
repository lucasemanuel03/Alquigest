package com.alquileres.config;

import com.alquileres.security.JwtAuthenticationFilter;
import com.alquileres.security.UserDetailsServiceImpl;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Value("${app.cors.allowedOrigins:http://localhost:3000}")
    private String allowedOrigins;

    private final UserDetailsServiceImpl userDetailsService;

    public SecurityConfig(UserDetailsServiceImpl userDetailsService) {
        this.userDetailsService = userDetailsService;
    }

    @Bean
    public JwtAuthenticationFilter authenticationJwtTokenFilter() {
        return new JwtAuthenticationFilter();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // ToDo
    // Modificar aca los permisos de cada rol, los endpoints
    // Para activar la seguridad:
    // Comenta las líneas 65-72 (la parte activa con permitAll())
    // Descomenta las líneas 74-123 (el bloque que empieza con /* Original authentication configuration...)

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Endpoints públicos de autenticación
                .requestMatchers("/api/auth/**").permitAll()

                // Swagger/OpenAPI (público)
                .requestMatchers("/swagger-ui/**", "/swagger-ui.html").permitAll()
                .requestMatchers("/v3/api-docs/**", "/v3/api-docs.yaml", "/v3/api-docs").permitAll()
                .requestMatchers("/swagger-resources/**").permitAll()
                .requestMatchers("/webjars/**").permitAll()

                // TIPOS DE INMUEBLE - Solo ADMIN puede crear/editar/eliminar
                .requestMatchers(HttpMethod.GET, "/api/tipos-inmueble").hasAnyRole("ADMINISTRADOR", "ABOGADA", "SECRETARIA")
                .requestMatchers(HttpMethod.GET, "/api/tipos-inmueble/{id}").hasAnyRole("ADMINISTRADOR", "ABOGADA", "SECRETARIA")
                .requestMatchers("/api/tipos-inmueble/**").hasRole("ADMINISTRADOR")

                // ESTADOS DE CONTRATO - Solo ADMIN puede crear/editar/eliminar
                .requestMatchers(HttpMethod.GET, "/api/estados-contrato/**").hasAnyRole("ADMINISTRADOR", "ABOGADA", "SECRETARIA")
                .requestMatchers("/api/estados-contrato/**").hasRole("ADMINISTRADOR")

                // CONTRATOS - Lectura: todos los roles, Escritura: ADMIN y ABOGADA
                .requestMatchers(HttpMethod.GET, "/api/contratos/**").hasAnyRole("ADMINISTRADOR", "ABOGADA", "SECRETARIA")
                .requestMatchers("/api/contratos/**").hasAnyRole("ADMINISTRADOR", "ABOGADA")

                // INMUEBLES - Lectura: todos los roles, Escritura: ADMIN y ABOGADA
                .requestMatchers(HttpMethod.GET, "/api/inmuebles/**").hasAnyRole("ADMINISTRADOR", "ABOGADA", "SECRETARIA")
                .requestMatchers("/api/inmuebles/**").hasAnyRole("ADMINISTRADOR", "ABOGADA")

                // INQUILINOS - Lectura: todos los roles, Escritura: ADMIN y ABOGADA
                .requestMatchers(HttpMethod.GET, "/api/inquilinos/**").hasAnyRole("ADMINISTRADOR", "ABOGADA", "SECRETARIA")
                .requestMatchers("/api/inquilinos/**").hasAnyRole("ADMINISTRADOR", "ABOGADA")

                // PROPIETARIOS - Lectura: todos los roles, Escritura: ADMIN y ABOGADA
                .requestMatchers(HttpMethod.GET, "/api/propietarios/**").hasAnyRole("ADMINISTRADOR", "ABOGADA", "SECRETARIA")
                .requestMatchers("/api/propietarios/**").hasAnyRole("ADMINISTRADOR", "ABOGADA")

                // AMBITOS PDF - Lectura: todos los roles autenticados
                .requestMatchers(HttpMethod.GET, "/api/ambito-pdfs/**").hasAnyRole("ADMINISTRADOR", "ABOGADA", "SECRETARIA")

                // ALQUILERES - Lectura: todos los roles, Escritura: ADMIN y ABOGADA
                .requestMatchers(HttpMethod.GET, "/api/alquileres/**").hasAnyRole("ADMINISTRADOR", "ABOGADA", "SECRETARIA")
                .requestMatchers(HttpMethod.GET, "/api/alquileres/honorarios").hasAnyRole("ADMINISTRADOR", "ABOGADA")
                .requestMatchers(HttpMethod.GET, "/api/alquileres/{id}/honorarios").hasAnyRole("ADMINISTRADOR", "ABOGADA")
                .requestMatchers("/api/alquileres/**").hasAnyRole("ADMINISTRADOR", "ABOGADA")

                // SERVICIOS POR CONTRATO - Lectura: todos los roles, Escritura: ADMIN y ABOGADA
                .requestMatchers(HttpMethod.GET, "/api/servicios-contrato/**").hasAnyRole("ADMINISTRADOR", "ABOGADA", "SECRETARIA")
                .requestMatchers("/api/servicios-contrato/**").hasAnyRole("ADMINISTRADOR", "ABOGADA")

                // PAGOS DE SERVICIO - Lectura: todos los roles, Escritura: ADMIN y ABOGADA
                .requestMatchers(HttpMethod.GET, "/api/pagos-servicios/**").hasAnyRole("ADMINISTRADOR", "ABOGADA", "SECRETARIA")
                .requestMatchers("/api/pagos-servicio/**").hasAnyRole("ADMINISTRADOR", "ABOGADA")

                // CANCELACIONES DE CONTRATO - Lectura: todos los roles, Escritura: ADMIN y ABOGADA
                .requestMatchers(HttpMethod.GET, "/api/cancelaciones-contratos/**").hasAnyRole("ADMINISTRADOR", "ABOGADA", "SECRETARIA")
                .requestMatchers("/api/cancelaciones/**").hasAnyRole("ADMINISTRADOR", "ABOGADA")

                // MOTIVOS DE CANCELACIÓN - Solo ADMIN
                .requestMatchers(HttpMethod.GET, "/api/motivos-cancelacion/**").hasAnyRole("ADMINISTRADOR", "ABOGADA", "SECRETARIA")
                .requestMatchers("/api/motivos-cancelacion/**").hasRole("ADMINISTRADOR")

                // ACTUALIZACIONES DE SERVICIO - Lectura: todos los roles, Escritura: ADMIN y ABOGADA
                .requestMatchers(HttpMethod.GET, "/api/servicios-actualizacion/**").hasAnyRole("ADMINISTRADOR", "ABOGADA", "SECRETARIA")
                .requestMatchers("/api/actualizaciones-servicio/**").hasAnyRole("ADMINISTRADOR", "ABOGADA")

                // HEALTH CHECK - Público
                .requestMatchers("/api/health/**").permitAll()

                // Cualquier otra petición requiere autenticación
                .anyRequest().authenticated()
            );

        // Habilitar autenticación JWT
        http.authenticationProvider(authenticationProvider());
        http.addFilterBefore(authenticationJwtTokenFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Configurar orígenes permitidos desde application.properties
        String[] origins = allowedOrigins.split(",");
        configuration.setAllowedOrigins(Arrays.asList(origins));
        
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true); // IMPORTANTE: Permitir cookies
        configuration.setExposedHeaders(Arrays.asList("Token-Refreshed")); // Exponer header personalizado

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
