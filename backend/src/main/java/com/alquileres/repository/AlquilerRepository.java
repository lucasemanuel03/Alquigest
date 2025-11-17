package com.alquileres.repository;

import com.alquileres.model.Alquiler;
import com.alquileres.model.Contrato;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AlquilerRepository extends JpaRepository<Alquiler, Long> {

    // Buscar alquileres activos por contrato
    @Query("SELECT a FROM Alquiler a WHERE a.contrato = :contrato AND a.esActivo = true")
    List<Alquiler> findByContrato(@Param("contrato") Contrato contrato);

    // Buscar alquileres por contrato ID
    @Query("SELECT a FROM Alquiler a WHERE a.contrato.id = :contratoId")
    List<Alquiler> findByContratoId(@Param("contratoId") Long contratoId);

    // Buscar TODOS los alquileres por contrato ID (activos e inactivos) - usado para anular al dar de baja
    @Query("SELECT a FROM Alquiler a WHERE a.contrato.id = :contratoId")
    List<Alquiler> findAllByContratoId(@Param("contratoId") Long contratoId);

    // Buscar alquileres activos pagados o no pagados
    @Query("SELECT a FROM Alquiler a WHERE a.estaPagado = :estaPagado AND a.esActivo = true")
    List<Alquiler> findByEstaPagado(@Param("estaPagado") Boolean estaPagado);

    // Buscar alquileres activos pendientes de pago por contrato
    @Query("SELECT a FROM Alquiler a WHERE a.contrato.id = :contratoId AND a.estaPagado = false AND a.esActivo = true")
    List<Alquiler> findAlquileresPendientesByContratoId(@Param("contratoId") Long contratoId);

    // Buscar alquileres activos pendientes de pago por múltiples contratos (batch query)
    @Query("SELECT a FROM Alquiler a WHERE a.contrato.id IN :contratoIds AND a.estaPagado = false AND a.esActivo = true")
    List<Alquiler> findAlquileresPendientesByContratoIds(@Param("contratoIds") List<Long> contratoIds);

    // Buscar alquileres activos pendientes de pago por múltiples contratos (batch query) cuyo mes de vencimiento es el actual
    @Query("SELECT a FROM Alquiler a WHERE a.contrato.id IN :contratoIds AND a.estaPagado = false AND a.esActivo = true AND MONTH(CAST(a.fechaVencimientoPago AS date)) = :mes AND YEAR(CAST(a.fechaVencimientoPago AS date)) = :anio")
    List<Alquiler> findAlquileresPendientesByContratoIdsAndMesAnioActual(@Param("contratoIds") List<Long> contratoIds, @Param("mes") int mes, @Param("anio") int anio);

    // Buscar alquileres activos pagados por contrato
    @Query("SELECT a FROM Alquiler a WHERE a.contrato.id = :contratoId AND a.estaPagado = true AND a.esActivo = true")
    List<Alquiler> findAlquileresPagadosByContratoId(@Param("contratoId") Long contratoId);

    // Contar alquileres activos pendientes de pago
    @Query("SELECT COUNT(a) FROM Alquiler a WHERE a.estaPagado = false AND a.esActivo = true")
    Long countAlquileresPendientes();

    // Buscar alquileres activos con vencimiento próximo
    @Query("SELECT a FROM Alquiler a WHERE a.estaPagado = false AND a.esActivo = true AND a.fechaVencimientoPago BETWEEN :fechaActual AND :fechaLimite")
    List<Alquiler> findAlquileresProximosAVencer(@Param("fechaActual") String fechaActual, @Param("fechaLimite") String fechaLimite);

    // Contar alquileres activos con vencimiento próximo
    @Query("SELECT COUNT(a) FROM Alquiler a WHERE a.estaPagado = false AND a.esActivo = true AND a.fechaVencimientoPago BETWEEN :fechaActual AND :fechaLimite")
    Long countAlquileresProximosAVencer(@Param("fechaActual") String fechaActual, @Param("fechaLimite") String fechaLimite);

    // Buscar todos los alquileres pagados del mes actual (independientemente de si están activos o no)
    @Query("SELECT a FROM Alquiler a WHERE a.estaPagado = true AND YEAR(CAST(a.fechaVencimientoPago AS date)) = YEAR(CURRENT_DATE) AND MONTH(CAST(a.fechaVencimientoPago AS date)) = MONTH(CURRENT_DATE)")
    List<Alquiler> findAlquileresPagadosDelMes();

    // Buscar alquileres activos no pagados del mes actual con sus datos asociados de contratos vigentes
    @Query("SELECT a FROM Alquiler a " +
           "JOIN a.contrato c " +
           "JOIN c.estadoContrato e " +
           "WHERE a.estaPagado = false " +
           "AND a.esActivo = true " +
           "AND e.nombre = 'Vigente' " +
           "AND YEAR(CAST(a.fechaVencimientoPago AS date)) = YEAR(CURRENT_DATE) " +
           "AND MONTH(CAST(a.fechaVencimientoPago AS date)) = MONTH(CURRENT_DATE)")
    List<Alquiler> findAlquileresNoPagadosDelMes();

    // Obtener el último alquiler activo de un contrato (ordenado por fecha de vencimiento descendente)
    @Query("SELECT a FROM Alquiler a WHERE a.contrato.id = :contratoId AND a.esActivo = true ORDER BY CAST(a.fechaVencimientoPago AS date) DESC LIMIT 1")
    Optional<Alquiler> findUltimoAlquilerByContratoId(@Param("contratoId") Long contratoId);

    // Obtener el último alquiler activo de un contrato (usando objeto Contrato)
    @Query("SELECT a FROM Alquiler a WHERE a.contrato = :contrato AND a.esActivo = true ORDER BY CAST(a.fechaVencimientoPago AS date) DESC LIMIT 1")
    Optional<Alquiler> findTopByContratoOrderByFechaVencimientoPagoDesc(@Param("contrato") Contrato contrato);

    // Buscar alquileres activos que necesitan aumento manual
    @Query("SELECT a FROM Alquiler a WHERE a.necesitaAumentoManual = true AND a.esActivo = true")
    List<Alquiler> findByNecesitaAumentoManualTrueAndEsActivoTrue();

    // Para Informe 1: Alquileres pagados del mes actual de contratos vigentes
    @Query("SELECT a FROM Alquiler a " +
           "JOIN a.contrato c " +
           "JOIN c.estadoContrato e " +
           "WHERE a.estaPagado = true " +
           "AND MONTH(CAST(a.fechaVencimientoPago AS date)) = :mes " +
           "AND YEAR(CAST(a.fechaVencimientoPago AS date)) = :anio " +
           "AND e.nombre = 'Vigente'")
    List<Alquiler> findAlquileresPagadosPorMesYAnio(@Param("mes") int mes, @Param("anio") int anio);

    // Para Informe 2: Todos los alquileres del mes actual de contratos vigentes
    @Query("SELECT a FROM Alquiler a " +
           "JOIN a.contrato c " +
           "JOIN c.estadoContrato e " +
           "WHERE MONTH(CAST(a.fechaVencimientoPago AS date)) = :mes " +
           "AND YEAR(CAST(a.fechaVencimientoPago AS date)) = :anio " +
           "AND e.nombre = :estadoContrato")
    List<Alquiler> findAlquileresPorMesYAnioYEstadoContrato(
        @Param("mes") int mes,
        @Param("anio") int anio,
        @Param("estadoContrato") String estadoContrato
    );
}
