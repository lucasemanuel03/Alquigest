package com.alquileres.repository;

import com.alquileres.model.PagoServicio;
import com.alquileres.model.ServicioXContrato;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PagoServicioRepository extends JpaRepository<PagoServicio, Integer> {

    // Buscar por servicio x contrato
    List<PagoServicio> findByServicioXContrato(ServicioXContrato servicioXContrato);

    // Buscar por ID de servicio x contrato
    @Query("SELECT p FROM PagoServicio p WHERE p.servicioXContrato.id = :servicioXContratoId")
    List<PagoServicio> findByServicioXContratoId(@Param("servicioXContratoId") Integer servicioXContratoId);

    // Buscar por está pagado
    List<PagoServicio> findByEstaPagado(Boolean estaPagado);

    // Buscar por está vencido
    List<PagoServicio> findByEstaVencido(Boolean estaVencido);

    // Buscar pagos pendientes (no pagados)
    @Query("SELECT p FROM PagoServicio p WHERE p.estaPagado = false")
    List<PagoServicio> findPagosPendientes();

    // Buscar pagos vencidos
    @Query("SELECT p FROM PagoServicio p WHERE p.estaVencido = true AND p.estaPagado = false")
    List<PagoServicio> findPagosVencidos();

    // Buscar pagos por contrato
    @Query("SELECT p FROM PagoServicio p WHERE p.servicioXContrato.contrato.id = :contratoId")
    List<PagoServicio> findByContratoId(@Param("contratoId") Long contratoId);

    // Contar pagos pendientes
    @Query("SELECT COUNT(p) FROM PagoServicio p WHERE p.estaPagado = false AND p.servicioXContrato.esActivo = true")
    Long countPagosPendientes();

    // Contar pagos vencidos
    @Query("SELECT COUNT(p) FROM PagoServicio p WHERE p.estaVencido = true AND p.estaPagado = false")
    Long countPagosVencidos();

    // Buscar pago específico por servicio x contrato y período
    @Query("SELECT p FROM PagoServicio p WHERE p.servicioXContrato.id = :servicioXContratoId AND p.periodo = :periodo")
    Optional<PagoServicio> findByServicioXContratoIdAndPeriodo(@Param("servicioXContratoId") Integer servicioXContratoId, @Param("periodo") String periodo);

    // Verificar si existe un pago para un servicio y período
    @Query("SELECT COUNT(p) > 0 FROM PagoServicio p WHERE p.servicioXContrato.id = :servicioXContratoId AND p.periodo = :periodo")
    boolean existsByServicioXContratoIdAndPeriodo(@Param("servicioXContratoId") Integer servicioXContratoId, @Param("periodo") String periodo);

    // Buscar pagos no pagados por contrato y tipo de servicio
    @Query("SELECT p FROM PagoServicio p WHERE p.servicioXContrato.contrato.id = :contratoId " +
           "AND p.servicioXContrato.tipoServicio.id = :tipoServicioId " +
           "AND p.estaPagado = false")
    List<PagoServicio> findPagosNoPagadosByContratoAndTipoServicio(
        @Param("contratoId") Long contratoId,
        @Param("tipoServicioId") Integer tipoServicioId
    );

    // Buscar todos los pagos no pagados por contrato
    @Query("SELECT p FROM PagoServicio p WHERE p.servicioXContrato.contrato.id = :contratoId AND p.estaPagado = false")
    List<PagoServicio> findPagosNoPagadosByContrato(@Param("contratoId") Long contratoId);

    // Contar pagos activos del mes actual (independientemente si están pagados o no)
    @Query("SELECT COUNT(p) FROM PagoServicio p WHERE p.servicioXContrato.esActivo = true AND p.periodo = :periodo")
    Long countPagosActivosPorPeriodo(@Param("periodo") String periodo);

    // Contar pagos activos no pagados del mes actual
    @Query("SELECT COUNT(p) FROM PagoServicio p WHERE p.servicioXContrato.esActivo = true AND p.estaPagado = false AND p.periodo = :periodo")
    Long countPagosPendientesPorPeriodo(@Param("periodo") String periodo);
}