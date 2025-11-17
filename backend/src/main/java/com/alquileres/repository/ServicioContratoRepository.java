package com.alquileres.repository;

import com.alquileres.model.ServicioContrato;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ServicioContratoRepository extends JpaRepository<ServicioContrato, Integer> {

    /**
     * Busca todos los servicios de un contrato específico
     */
    List<ServicioContrato> findByContratoId(Long contratoId);

    /**
     * Busca servicios activos de un contrato
     */
    List<ServicioContrato> findByContratoIdAndEsActivoTrue(Long contratoId);

    /**
     * Busca servicios activos que requieren generación de pagos
     * (proximoPago <= fechaActual, esActivo = true y contrato vigente)
     */
    @Query("SELECT sc FROM ServicioContrato sc JOIN sc.contrato c JOIN c.estadoContrato e WHERE sc.proximoPago <= :fechaActual AND sc.esActivo = true AND e.nombre = 'Vigente'")
    List<ServicioContrato> findServiciosConPagosPendientes(@Param("fechaActual") LocalDate fechaActual);

    /**
     * Busca un servicio específico por contrato y tipo de servicio
     */
    Optional<ServicioContrato> findByContratoIdAndTipoServicioId(Long contratoId, Integer tipoServicioId);

    /**
     * Cuenta servicios activos de un contrato
     */
    long countByContratoIdAndEsActivoTrue(Long contratoId);

    /**
     * Busca todos los servicios activos
     */
    List<ServicioContrato> findByEsActivoTrue();
}

