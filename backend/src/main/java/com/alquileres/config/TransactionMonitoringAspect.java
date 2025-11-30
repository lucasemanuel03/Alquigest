package com.alquileres.config;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.After;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.HashMap;
import java.util.Map;

/**
 * Aspecto para monitorear transacciones largas y evitar connection leaks
 * Detecta métodos @Transactional que toman demasiado tiempo
 */
@Aspect
@Component
public class TransactionMonitoringAspect {

    private static final Logger logger = LoggerFactory.getLogger(TransactionMonitoringAspect.class);
    private static final long TRANSACTION_TIMEOUT_MS = 30000; // 30 segundos

    private final ThreadLocal<Map<String, Long>> transactionStartTime =
        ThreadLocal.withInitial(HashMap::new);

    @Before("@annotation(org.springframework.transaction.annotation.Transactional)")
    public void beforeTransaction(JoinPoint joinPoint) {
        String methodName = joinPoint.getSignature().getName();
        String className = joinPoint.getTarget().getClass().getSimpleName();
        long startTime = System.currentTimeMillis();

        String key = className + "." + methodName;
        transactionStartTime.get().put(key, startTime);

        logger.debug("▶️ Transaction START: {}", key);
    }

    @After("@annotation(org.springframework.transaction.annotation.Transactional)")
    public void afterTransaction(JoinPoint joinPoint) {
        String methodName = joinPoint.getSignature().getName();
        String className = joinPoint.getTarget().getClass().getSimpleName();

        String key = className + "." + methodName;
        Long startTime = transactionStartTime.get().remove(key);

        if (startTime != null) {
            long duration = System.currentTimeMillis() - startTime;

            if (duration > TRANSACTION_TIMEOUT_MS) {
                logger.warn("⚠️ LONG TRANSACTION DETECTED: {} took {} ms (threshold: {} ms)",
                           key, duration, TRANSACTION_TIMEOUT_MS);
            } else {
                logger.debug("✓ Transaction END: {} ({}ms)", key, duration);
            }
        }

        // Limpiar si está vacío
        if (transactionStartTime.get().isEmpty()) {
            transactionStartTime.remove();
        }
    }
}

