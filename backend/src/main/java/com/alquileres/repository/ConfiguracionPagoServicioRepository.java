package com.alquileres.repository;

import com.alquileres.model.ConfiguracionPagoServicio;
import com.alquileres.model.ServicioContrato;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConfiguracionPagoServicioRepository extends JpaRepository<ConfiguracionPagoServicio, Integer> {

    // Buscar por servicio contrato
    Optional<ConfiguracionPagoServicio> findByServicioContrato(ServicioContrato servicioContrato);

    // Buscar por ID de servicio contrato
    @Query("SELECT c FROM ConfiguracionPagoServicio c WHERE c.servicioContrato.id = :servicioContratoId")
    Optional<ConfiguracionPagoServicio> findByServicioContratoId(@Param("servicioContratoId") Integer servicioContratoId);

    // Buscar configuraciones activas
    List<ConfiguracionPagoServicio> findByEsActivo(Boolean esActivo);

    // Buscar configuraciones con pagos pendientes de generar (proximoPago <= fecha actual)
    // Solo incluye configuraciones activas Y cuyo servicio esté activo
    @Query("SELECT c FROM ConfiguracionPagoServicio c WHERE c.esActivo = true AND c.servicioContrato.esActivo = true AND c.proximoPago <= :fechaActual")
    List<ConfiguracionPagoServicio> findConfiguracionesConPagosPendientes(@Param("fechaActual") String fechaActual);

    // Buscar configuraciones por contrato
    @Query("SELECT c FROM ConfiguracionPagoServicio c WHERE c.servicioContrato.contrato.id = :contratoId")
    List<ConfiguracionPagoServicio> findByContratoId(@Param("contratoId") Long contratoId);

    // Verificar si existe configuración para un servicio contrato
    @Query("SELECT COUNT(c) > 0 FROM ConfiguracionPagoServicio c WHERE c.servicioContrato.id = :servicioContratoId")
    boolean existsByServicioContratoId(@Param("servicioContratoId") Integer servicioContratoId);
}
