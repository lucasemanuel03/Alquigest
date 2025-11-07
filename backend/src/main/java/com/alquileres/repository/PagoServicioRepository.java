package com.alquileres.repository;

import com.alquileres.model.PagoServicio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PagoServicioRepository extends JpaRepository<PagoServicio, Integer> {

    // Buscar pagos por contrato
    @Query("SELECT p FROM PagoServicio p WHERE p.servicioXContrato.contrato.id = :contratoId")
    List<PagoServicio> findByContratoId(@Param("contratoId") Long contratoId);

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

    // Contar pagos activos del mes actual (independientemente si están pagados o no) - solo contratos vigentes
    @Query("SELECT COUNT(p) FROM PagoServicio p " +
           "JOIN p.servicioXContrato.contrato c " +
           "JOIN c.estadoContrato e " +
           "WHERE p.servicioXContrato.esActivo = true " +
           "AND p.periodo = :periodo " +
           "AND e.nombre = 'Vigente'")
    Long countPagosActivosPorPeriodo(@Param("periodo") String periodo);

    // Contar pagos activos no pagados del mes actual - solo contratos vigentes
    @Query("SELECT COUNT(p) FROM PagoServicio p " +
           "JOIN p.servicioXContrato.contrato c " +
           "JOIN c.estadoContrato e " +
           "WHERE p.servicioXContrato.esActivo = true " +
           "AND p.estaPagado = false " +
           "AND p.periodo = :periodo " +
           "AND e.nombre = 'Vigente'")
    Long countPagosPendientesPorPeriodo(@Param("periodo") String periodo);

    // Buscar pagos no pagados del mes actual por contrato (solo contratos vigentes)
    @Query("SELECT p FROM PagoServicio p " +
           "JOIN p.servicioXContrato.contrato c " +
           "JOIN c.estadoContrato e " +
           "WHERE c.id = :contratoId " +
           "AND p.servicioXContrato.esActivo = true " +
           "AND p.estaPagado = false " +
           "AND p.periodo = :periodo " +
           "AND e.nombre = 'Vigente'")
    List<PagoServicio> findPagosNoPagadosPorContratoYPeriodo(
        @Param("contratoId") Long contratoId,
        @Param("periodo") String periodo
    );

    // Contar pagos no pagados del mes actual agrupados por contrato (solo contratos vigentes)
    @Query("SELECT p.servicioXContrato.contrato.id, COUNT(p) " +
           "FROM PagoServicio p " +
           "JOIN p.servicioXContrato.contrato c " +
           "JOIN c.estadoContrato e " +
           "WHERE p.servicioXContrato.esActivo = true " +
           "AND p.estaPagado = false " +
           "AND p.periodo = :periodo " +
           "AND e.nombre = 'Vigente' " +
           "GROUP BY p.servicioXContrato.contrato.id")
    List<Object[]> countPagosNoPagadosPorContratoYPeriodo(@Param("periodo") String periodo);
}