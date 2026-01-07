package com.alquileres.config;

import com.alquileres.security.JwtAuthenticationFilter;
import com.alquileres.security.UserDetailsServiceImpl;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
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

    @Value("${ALLOWED_ORIGINS:http://localhost:3000}")
    private String allowedOrigins;

    private final UserDetailsServiceImpl userDetailsService;

    public SecurityConfig(UserDetailsServiceImpl userDetailsService) {
        this.userDetailsService = userDetailsService;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public JwtAuthenticationFilter authenticationJwtTokenFilter() {
        return new JwtAuthenticationFilter();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth

                // Endpoints públicos de autenticación
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/auth/signup").hasAnyRole("ABOGADA", "SECRETARIA")

                // Swagger/OpenAPI (público)
                .requestMatchers("/swagger-ui/**", "/swagger-ui.html").permitAll()
                .requestMatchers("/v3/api-docs/**", "/v3/api-docs.yaml", "/v3/api-docs").permitAll()
                .requestMatchers("/swagger-resources/**").permitAll()
                .requestMatchers("/webjars/**").permitAll()

                // TIPOS DE INMUEBLE
                .requestMatchers(HttpMethod.GET, "/api/tipos-inmueble").hasAnyRole("ABOGADA", "SECRETARIA")
                .requestMatchers(HttpMethod.GET, "/api/tipos-inmueble/{id}").hasAnyRole("ABOGADA", "SECRETARIA")
                .requestMatchers("/api/tipos-inmueble/**").hasRole("ADMINISTRADOR")

                // ESTADOS DE CONTRATO
                .requestMatchers(HttpMethod.GET, "/api/estados-contrato/**").hasAnyRole("ABOGADA", "SECRETARIA")
                .requestMatchers("/api/estados-contrato/**").hasRole("ADMINISTRADOR")

                // CONTRATOS - Lectura: todos los roles, Escritura: ABOGADA
                .requestMatchers(HttpMethod.GET, "/api/contratos/**").hasAnyRole("ABOGADA", "SECRETARIA")
                .requestMatchers("/api/contratos/**").hasAnyRole("ABOGADA")

                // INMUEBLES - Lectura: todos los roles, Escritura: ABOGADA
                .requestMatchers(HttpMethod.GET, "/api/inmuebles/**").hasAnyRole("ABOGADA", "SECRETARIA")
                .requestMatchers("/api/inmuebles/**").hasAnyRole("ABOGADA")

                // INQUILINOS - Lectura: todos los roles, Escritura: ABOGADA
                .requestMatchers(HttpMethod.GET, "/api/inquilinos/**").hasAnyRole("ABOGADA", "SECRETARIA")
                .requestMatchers("/api/inquilinos/**").hasAnyRole("ABOGADA")

                // PROPIETARIOS - Lectura: todos los roles, Escritura: ABOGADA
                .requestMatchers(HttpMethod.GET, "/api/propietarios/**").hasAnyRole("ABOGADA", "SECRETARIA")
                .requestMatchers("/api/propietarios/**").hasAnyRole("ABOGADA")

                // AMBITOS PDF - Lectura: todos los roles autenticados
                .requestMatchers(HttpMethod.GET, "/api/ambito-pdfs/**").hasAnyRole("ABOGADA", "SECRETARIA")

                // ALQUILERES - Lectura: todos los roles, Escritura: ABOGADA
                .requestMatchers(HttpMethod.GET, "/api/alquileres/**").hasAnyRole("ABOGADA", "SECRETARIA")
                .requestMatchers(HttpMethod.GET, "/api/alquileres/honorarios").hasAnyRole("ABOGADA")
                .requestMatchers(HttpMethod.GET, "/api/alquileres/{id}/honorarios").hasAnyRole("ABOGADA")
                .requestMatchers("/api/alquileres/**").hasAnyRole("ABOGADA")

                // SERVICIOS POR CONTRATO - Lectura: todos los roles, Escritura: ABOGADA
                .requestMatchers(HttpMethod.GET, "/api/servicios-contrato/**").hasAnyRole("ABOGADA", "SECRETARIA")
                .requestMatchers("/api/servicios-contrato/**").hasAnyRole("ABOGADA")

                // PAGOS DE SERVICIO - Lectura: todos los roles, Escritura: ABOGADA
                .requestMatchers(HttpMethod.GET, "/api/pagos-servicios/**").hasAnyRole("ABOGADA", "SECRETARIA")
                .requestMatchers("/api/pagos-servicio/**").hasAnyRole("ABOGADA")

                // CANCELACIONES DE CONTRATO - Lectura: todos los roles, Escritura: ABOGADA
                .requestMatchers(HttpMethod.GET, "/api/cancelaciones-contratos/**").hasAnyRole("ABOGADA", "SECRETARIA")
                .requestMatchers("/api/cancelaciones/**").hasAnyRole("ABOGADA")

                // MOTIVOS DE CANCELACIÓN
                .requestMatchers(HttpMethod.GET, "/api/motivos-cancelacion/**").hasAnyRole("ABOGADA", "SECRETARIA")
                .requestMatchers("/api/motivos-cancelacion/**").hasRole("ADMINISTRADOR")

                // ACTUALIZACIONES DE SERVICIO - Lectura: todos los roles, Escritura: ABOGADA
                .requestMatchers(HttpMethod.GET, "/api/servicios-actualizacion/**").hasAnyRole("ABOGADA", "SECRETARIA")
                .requestMatchers("/api/actualizaciones-servicio/**").hasAnyRole("ABOGADA")

                // BACKUP
                .requestMatchers("/api/backup/descargar").hasRole("ABOGADA")
                .requestMatchers("/api/backup/**").hasRole("ADMINISTRADOR")

                // HEALTH CHECK - Público
                .requestMatchers("/health", "/api/health", "/api/health/**").permitAll()

                // Cualquier otra petición requiere autenticación
                .anyRequest().authenticated()
            );

        // Autenticacion JWT
         http.authenticationProvider(authenticationProvider());
         http.addFilterBefore(authenticationJwtTokenFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        String[] origins = allowedOrigins.split(",");
        configuration.setAllowedOriginPatterns(Arrays.asList(origins));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setExposedHeaders(Arrays.asList("Token-Refreshed"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
