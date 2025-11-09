package com.alquileres.dto;

import com.alquileres.model.PagoServicio;
import com.alquileres.model.ServicioContrato;

import java.math.BigDecimal;

public class PagoServicioResponseDTO {

    private Integer id;
    private Boolean estaPagado;
    private Boolean estaVencido;
    private String fechaPago;
    private String medioPago;
    private BigDecimal monto;
    private String pdfPath;
    private String periodo;
    private ServicioContratoMiniDTO servicioContrato;

    public PagoServicioResponseDTO() {
    }

    public PagoServicioResponseDTO(PagoServicio pago) {
        this.id = pago.getId();
        this.estaPagado = pago.getEstaPagado();
        this.estaVencido = pago.getEstaVencido();
        this.fechaPago = pago.getFechaPago();
        this.medioPago = pago.getMedioPago();
        this.monto = pago.getMonto();
        this.pdfPath = pago.getPdfPath();
        this.periodo = pago.getPeriodo();

        ServicioContrato sc = pago.getServicioContrato();
        if (sc != null) {
            this.servicioContrato = new ServicioContratoMiniDTO(sc);
        }
    }

    // Getters y setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Boolean getEstaPagado() { return estaPagado; }
    public void setEstaPagado(Boolean estaPagado) { this.estaPagado = estaPagado; }

    public Boolean getEstaVencido() { return estaVencido; }
    public void setEstaVencido(Boolean estaVencido) { this.estaVencido = estaVencido; }

    public String getFechaPago() { return fechaPago; }
    public void setFechaPago(String fechaPago) { this.fechaPago = fechaPago; }

    public String getMedioPago() { return medioPago; }
    public void setMedioPago(String medioPago) { this.medioPago = medioPago; }

    public BigDecimal getMonto() { return monto; }
    public void setMonto(BigDecimal monto) { this.monto = monto; }

    public String getPdfPath() { return pdfPath; }
    public void setPdfPath(String pdfPath) { this.pdfPath = pdfPath; }

    public String getPeriodo() { return periodo; }
    public void setPeriodo(String periodo) { this.periodo = periodo; }

    public ServicioContratoMiniDTO getServicioContrato() { return servicioContrato; }
    public void setServicioContrato(ServicioContratoMiniDTO servicioContrato) { this.servicioContrato = servicioContrato; }

    // DTOs anidados
    public static class ServicioContratoMiniDTO {
        private Integer id;
        private String nroCuenta;
        private String nroContratoServicio;
        private Boolean esDeInquilino;
        private Boolean esAnual;
        private Boolean esActivo;
        private TipoServicioDTO tipoServicio;

        public ServicioContratoMiniDTO() { }

        public ServicioContratoMiniDTO(ServicioContrato sc) {
            this.id = sc.getId();
            this.nroCuenta = sc.getNroCuenta();
            this.nroContratoServicio = sc.getNroContratoServicio();
            this.esDeInquilino = sc.getEsDeInquilino();
            this.esAnual = sc.getEsAnual();
            this.esActivo = sc.getEsActivo();
            if (sc.getTipoServicio() != null) {
                this.tipoServicio = new TipoServicioDTO(sc.getTipoServicio().getId(), sc.getTipoServicio().getNombre());
            }
        }

        public Integer getId() { return id; }
        public void setId(Integer id) { this.id = id; }

        public String getNroCuenta() { return nroCuenta; }
        public void setNroCuenta(String nroCuenta) { this.nroCuenta = nroCuenta; }

        public String getNroContratoServicio() { return nroContratoServicio; }
        public void setNroContratoServicio(String nroContratoServicio) { this.nroContratoServicio = nroContratoServicio; }

        public Boolean getEsDeInquilino() { return esDeInquilino; }
        public void setEsDeInquilino(Boolean esDeInquilino) { this.esDeInquilino = esDeInquilino; }

        public Boolean getEsAnual() { return esAnual; }
        public void setEsAnual(Boolean esAnual) { this.esAnual = esAnual; }

        public Boolean getEsActivo() { return esActivo; }
        public void setEsActivo(Boolean esActivo) { this.esActivo = esActivo; }

        public TipoServicioDTO getTipoServicio() { return tipoServicio; }
        public void setTipoServicio(TipoServicioDTO tipoServicio) { this.tipoServicio = tipoServicio; }
    }

    public static class TipoServicioDTO {
        private Integer id;
        private String nombre;

        public TipoServicioDTO() { }

        public TipoServicioDTO(Integer id, String nombre) {
            this.id = id;
            this.nombre = nombre;
        }

        public Integer getId() { return id; }
        public void setId(Integer id) { this.id = id; }

        public String getNombre() { return nombre; }
        public void setNombre(String nombre) { this.nombre = nombre; }
    }
}

