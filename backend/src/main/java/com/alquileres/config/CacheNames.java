package com.alquileres.config;

/**
 * Constantes para los nombres de los cachés en la aplicación
 *
 * Centraliza todos los nombres de cachés para evitar errores de tipeo
 * y facilitar la invalidación coordinada
 */
public class CacheNames {

    // Cachés de Contratos
    public static final String CONTRATOS = "contratos";
    public static final String CONTRATOS_VIGENTES = "contratos-vigentes";
    public static final String CONTRATOS_VIGENTES_COUNT = "contratos-vigentes-count";
    public static final String CONTRATOS_NO_VIGENTES = "contratos-no-vigentes";
    public static final String CONTRATOS_PROXIMOS_VENCER = "contratos-proximos-vencer";
    public static final String CONTRATOS_PROXIMOS_VENCER_COUNT = "contratos-proximos-vencer-count";
    public static final String CONTRATOS_POR_INMUEBLE = "contratos-inmueble";
    public static final String CONTRATOS_POR_INQUILINO = "contratos-inquilino";
    public static final String CONTRATO_POR_ID = "contrato-id";
    public static final String CONTRATO_EXISTE = "contrato-existe";
    public static final String INMUEBLE_TIENE_CONTRATO_VIGENTE = "inmueble-contrato-vigente";

    // Cachés de Servicios
    public static final String SERVICIOS_POR_CONTRATO = "servicios-contrato";

    private CacheNames() {
        // Clase de constantes, no instanciable
    }
}

