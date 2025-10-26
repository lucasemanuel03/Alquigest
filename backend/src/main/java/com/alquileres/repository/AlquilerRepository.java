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

    // Buscar alquileres activos por contrato ID
    @Query("SELECT a FROM Alquiler a WHERE a.contrato.id = :contratoId AND a.esActivo = true")
    List<Alquiler> findByContratoId(@Param("contratoId") Long contratoId);

    // Buscar alquileres activos pagados o no pagados
    @Query("SELECT a FROM Alquiler a WHERE a.estaPagado = :estaPagado AND a.esActivo = true")
    List<Alquiler> findByEstaPagado(@Param("estaPagado") Boolean estaPagado);

    // Buscar alquileres activos pendientes de pago por contrato
    @Query("SELECT a FROM Alquiler a WHERE a.contrato.id = :contratoId AND a.estaPagado = false AND a.esActivo = true")
    List<Alquiler> findAlquileresPendientesByContratoId(@Param("contratoId") Long contratoId);

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

    // Buscar alquileres activos del mes actual (de contratos vigentes)
    @Query("SELECT a FROM Alquiler a WHERE a.esActivo = true AND YEAR(CAST(a.fechaVencimientoPago AS date)) = YEAR(CURRENT_DATE) AND MONTH(CAST(a.fechaVencimientoPago AS date)) = MONTH(CURRENT_DATE)")
    List<Alquiler> findAlquileresDelMes();

    // Buscar alquileres activos no pagados del mes actual con sus datos asociados
    @Query("SELECT a FROM Alquiler a WHERE a.estaPagado = false AND a.esActivo = true AND YEAR(CAST(a.fechaVencimientoPago AS date)) = YEAR(CURRENT_DATE) AND MONTH(CAST(a.fechaVencimientoPago AS date)) = MONTH(CURRENT_DATE)")
    List<Alquiler> findAlquileresNoPagadosDelMes();

    // Obtener el último alquiler activo de un contrato (ordenado por fecha de vencimiento descendente)
    @Query("SELECT a FROM Alquiler a WHERE a.contrato.id = :contratoId AND a.esActivo = true ORDER BY CAST(a.fechaVencimientoPago AS date) DESC LIMIT 1")
    Optional<Alquiler> findUltimoAlquilerByContratoId(@Param("contratoId") Long contratoId);

    // Obtener el último alquiler activo de un contrato (usando objeto Contrato)
    @Query("SELECT a FROM Alquiler a WHERE a.contrato = :contrato AND a.esActivo = true ORDER BY CAST(a.fechaVencimientoPago AS date) DESC LIMIT 1")
    Optional<Alquiler> findTopByContratoOrderByFechaVencimientoPagoDesc(@Param("contrato") Contrato contrato);
}

