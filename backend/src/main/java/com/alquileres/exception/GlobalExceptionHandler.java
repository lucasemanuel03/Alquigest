package com.alquileres.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.server.ResponseStatusException;

import jakarta.validation.ConstraintViolationException;

@ControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiError> handleBusinessException(BusinessException ex, WebRequest request) {
        ApiError apiError = new ApiError(
            ex.getHttpStatus().value(),
            ex.getHttpStatus().getReasonPhrase(),
            getPath(request),
            ex.getErrorCode(),
            ex.getMessage()
        );

        return new ResponseEntity<>(apiError, ex.getHttpStatus());
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiError> handleResponseStatusException(ResponseStatusException ex, WebRequest request) {
        ApiError apiError = new ApiError(
            ex.getStatusCode().value(),
            ex.getStatusCode().toString().split(" ", 2)[1], // Extract reason phrase
            getPath(request),
            ErrorCodes.ERROR_INTERNO,
            ex.getReason()
        );

        return new ResponseEntity<>(apiError, ex.getStatusCode());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidationException(MethodArgumentNotValidException ex, WebRequest request) {
        String message = ex.getBindingResult().getFieldErrors().stream()
            .map(error -> error.getField() + ": " + error.getDefaultMessage())
            .reduce((a, b) -> a + ", " + b)
            .orElse("Error de validación");

        ApiError apiError = new ApiError(
            HttpStatus.BAD_REQUEST.value(),
            HttpStatus.BAD_REQUEST.getReasonPhrase(),
            getPath(request),
            ErrorCodes.VALIDACION_ERROR,
            message
        );

        return new ResponseEntity<>(apiError, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiError> handleConstraintViolationException(ConstraintViolationException ex, WebRequest request) {
        ApiError apiError = new ApiError(
            HttpStatus.BAD_REQUEST.value(),
            HttpStatus.BAD_REQUEST.getReasonPhrase(),
            getPath(request),
            ErrorCodes.VALIDACION_ERROR,
            ex.getMessage()
        );

        return new ResponseEntity<>(apiError, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGenericException(Exception ex, WebRequest request) {
        // Logging detallado para diagnosticar errores
        logger.error("=== ERROR CAPTURADO ===");
        logger.error("Path: {}", getPath(request));
        logger.error("Tipo de excepción: {}", ex.getClass().getName());
        logger.error("Mensaje: {}", ex.getMessage());
        logger.error("Stack trace completo:", ex);

        ApiError apiError = new ApiError(
            HttpStatus.INTERNAL_SERVER_ERROR.value(),
            HttpStatus.INTERNAL_SERVER_ERROR.getReasonPhrase(),
            getPath(request),
            ErrorCodes.ERROR_INTERNO,
            "Ha ocurrido un error interno en el servidor"
        );

        return new ResponseEntity<>(apiError, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    private String getPath(WebRequest request) {
        String description = request.getDescription(false);
        return description.startsWith("uri=") ? description.substring(4) : description;
    }
}
