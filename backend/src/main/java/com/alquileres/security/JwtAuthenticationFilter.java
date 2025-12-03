package com.alquileres.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Value("${app.jwt.cookieName:accessToken}")
    private String jwtCookieName;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.equals("/health") ||
               path.equals("/api/health") ||
               path.startsWith("/api/auth/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                  FilterChain filterChain) throws ServletException, IOException {
        try {
            String jwt = parseJwt(request);
            if (jwt != null && jwtUtils.validateJwtToken(jwt)) {
                String username = jwtUtils.getUserNameFromJwtToken(jwt);

                UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authentication);

                // Verificar si el token necesita refresh automático
                if (jwtUtils.shouldRefreshToken(jwt)) {
                    try {
                        // Generar nuevo token
                        String newToken = jwtUtils.generateJwtToken(authentication);

                        // Crear nueva cookie con el token actualizado
                        Cookie jwtCookie = new Cookie(jwtCookieName, newToken);
                        jwtCookie.setHttpOnly(true);
                        jwtCookie.setSecure(false); // Cambiar a true en producción
                        jwtCookie.setPath("/");
                        jwtCookie.setMaxAge(3600); // 1 hora
                        response.addCookie(jwtCookie);

                        // Agregar headers informativos
                        response.setHeader("Token-Refreshed", "true");

                        // Invalidar el token anterior
                        jwtUtils.invalidateToken(jwt);

                        logger.info("Token refreshed automatically for user: " + username);
                    } catch (Exception e) {
                        logger.warn("Failed to refresh token automatically: " + e.getMessage());
                    }
                }
            }
        } catch (Exception e) {
            logger.error("Cannot set user authentication: " + e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    private String parseJwt(HttpServletRequest request) {
        // Primero intentar obtener el token desde la cookie (preferido)
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (jwtCookieName.equals(cookie.getName())) {
                    String token = cookie.getValue();
                    if (StringUtils.hasText(token)) {
                        return token;
                    }
                }
            }
        }

        // Fallback: intentar obtener desde el header Authorization (para compatibilidad)
        String headerAuth = request.getHeader("Authorization");
        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7);
        }

        return null;
    }
}
