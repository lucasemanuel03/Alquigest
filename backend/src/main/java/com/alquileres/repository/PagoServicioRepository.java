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
    @Query("SELECT p FROM PagoServicio p WHERE p.servicioContrato.contrato.id = :contratoId")
    List<PagoServicio> findByContratoId(@Param("contratoId") Long contratoId);

    // Verificar si existe un pago para un servicio y período
    @Query("SELECT COUNT(p) > 0 FROM PagoServicio p WHERE p.servicioContrato.id = :servicioContratoId AND p.periodo = :periodo")
    boolean existsByServicioContratoIdAndPeriodo(@Param("servicioContratoId") Integer servicioContratoId, @Param("periodo") String periodo);

    // Buscar pagos no pagados por contrato y tipo de servicio
    @Query("SELECT p FROM PagoServicio p WHERE p.servicioContrato.contrato.id = :contratoId " +
           "AND p.servicioContrato.tipoServicio.id = :tipoServicioId " +
           "AND p.estaPagado = false")
    List<PagoServicio> findPagosNoPagadosByContratoAndTipoServicio(
        @Param("contratoId") Long contratoId,
        @Param("tipoServicioId") Integer tipoServicioId
    );

    // Buscar todos los pagos no pagados por contrato
    @Query("SELECT p FROM PagoServicio p WHERE p.servicioContrato.contrato.id = :contratoId AND p.estaPagado = false")
    List<PagoServicio> findPagosNoPagadosByContrato(@Param("contratoId") Long contratoId);

    // Contar pagos activos del mes actual (independientemente si están pagados o no) - solo contratos vigentes
    @Query("SELECT COUNT(p) FROM PagoServicio p " +
           "JOIN p.servicioContrato sc " +
           "JOIN sc.contrato c " +
           "JOIN c.estadoContrato e " +
           "WHERE sc.esActivo = true " +
           "AND p.periodo = :periodo " +
           "AND e.nombre = 'Vigente'")
    Long countPagosActivosPorPeriodo(@Param("periodo") String periodo);

    // Contar pagos activos no pagados del mes actual - solo contratos vigentes
    @Query("SELECT COUNT(p) FROM PagoServicio p " +
           "JOIN p.servicioContrato sc " +
           "JOIN sc.contrato c " +
           "JOIN c.estadoContrato e " +
           "WHERE sc.esActivo = true " +
           "AND p.estaPagado = false " +
           "AND p.periodo = :periodo " +
           "AND e.nombre = 'Vigente'")
    Long countPagosPendientesPorPeriodo(@Param("periodo") String periodo);

    // Buscar pagos no pagados del mes actual por contrato (solo contratos vigentes)
    @Query("SELECT p FROM PagoServicio p " +
           "JOIN p.servicioContrato sc " +
           "JOIN sc.contrato c " +
           "JOIN c.estadoContrato e " +
           "WHERE c.id = :contratoId " +
           "AND sc.esActivo = true " +
           "AND p.estaPagado = false " +
           "AND p.periodo = :periodo " +
           "AND e.nombre = 'Vigente'")
    List<PagoServicio> findPagosNoPagadosPorContratoYPeriodo(
        @Param("contratoId") Long contratoId,
        @Param("periodo") String periodo
    );

    // Contar pagos no pagados del mes actual agrupados por contrato (solo contratos vigentes)
    @Query("SELECT sc.contrato.id, COUNT(p) " +
           "FROM PagoServicio p " +
           "JOIN p.servicioContrato sc " +
           "JOIN sc.contrato c " +
           "JOIN c.estadoContrato e " +
           "WHERE sc.esActivo = true " +
           "AND p.estaPagado = false " +
           "AND p.periodo = :periodo " +
           "AND e.nombre = 'Vigente' " +
           "GROUP BY sc.contrato.id")
    List<Object[]> countPagosNoPagadosPorContratoYPeriodo(@Param("periodo") String periodo);

    // Para Informe 4: Obtener pagos de servicios del mes actual con todos los detalles
    @Query("SELECT p.id, p.fechaPago, p.monto, p.periodo, ts.nombre, p.estaPagado, " +
           "c.id, i.direccion, i.propietarioId, inq.nombre, inq.apellido, " +
           "a.id, a.monto, a.fechaVencimientoPago, a.estaPagado " +
           "FROM PagoServicio p " +
           "JOIN p.servicioContrato sc " +
           "JOIN sc.tipoServicio ts " +
           "JOIN sc.contrato c " +
           "JOIN c.inmueble i " +
           "JOIN c.inquilino inq " +
           "LEFT JOIN Alquiler a ON a.contrato.id = c.id AND a.esActivo = true " +
           "AND SUBSTRING(a.fechaVencimientoPago, 4, 7) = :periodo " +
           "WHERE p.periodo = :periodo " +
           "ORDER BY c.id, p.id")
    List<Object[]> findPagosServiciosDelMesActualConDetalle(@Param("periodo") String periodo);
}