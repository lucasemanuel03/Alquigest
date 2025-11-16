package com.alquileres.service;

import com.alquileres.model.RolNombre;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class PermisosService {

    /**
     * Obtiene los permisos para un rol específico
     * Los permisos siguen el formato: accion_sujeto (ej: crear_propietario)
     * Acciones: crear, modificar, consultar, eliminar, cambiar_estado, activar, desactivar
     * Sujetos: propietario, inmueble, inquilino, contrato, estado_contrato, tipo_inmueble
     */
    public Map<String, Boolean> obtenerPermisosPorRol(RolNombre rol) {
        Map<String, Boolean> permisos = new HashMap<>();

        // Inicializar todos los permisos en false
        String[] sujetos = {"propietario", "inmueble", "inquilino", "contrato", "estado_contrato", "tipo_inmueble"};
        String[] acciones = {"crear", "consultar", "modificar", "eliminar", "cambiar_estado", "activar", "desactivar"};

        for (String sujeto : sujetos) {
            for (String accion : acciones) {
                String permisoKey = accion + "_" + sujeto;
                permisos.put(permisoKey, false);
            }
        }

        // Inicializar permisos de creación de usuarios
        permisos.put("crear_usuario_secretaria", false);
        permisos.put("crear_usuario_abogada", false);
        permisos.put("crear_usuario_administrador", false);

        permisos.put("editar_servicios", false);
        permisos.put("pagar_servicios", false);

        // Asignar permisos específicos según el rol
        switch (rol) {
            case ROLE_ADMINISTRADOR:
                // El administrador tiene todos los permisos
                permisos.replaceAll((key, value) -> true);
                break;

            case ROLE_ABOGADA:
                // La abogada puede consultar todo
                permisos.put("consultar_propietario", true);
                permisos.put("consultar_inmueble", true);
                permisos.put("consultar_inquilino", true);
                permisos.put("consultar_contrato", true);
                permisos.put("consultar_estado_contrato", true);
                permisos.put("consultar_tipo_inmueble", true);

                // Propietarios: crear, modificar, activar, desactivar
                permisos.put("crear_propietario", true);
                permisos.put("modificar_propietario", true);
                permisos.put("activar_propietario", true);
                permisos.put("desactivar_propietario", true);

                // Inquilinos: crear, modificar, activar, desactivar
                permisos.put("crear_inquilino", true);
                permisos.put("modificar_inquilino", true);
                permisos.put("activar_inquilino", true);
                permisos.put("desactivar_inquilino", true);

                // Inmuebles: crear, modificar, cambiar_estado, activar, desactivar
                permisos.put("crear_inmueble", true);
                permisos.put("modificar_inmueble", true);
                permisos.put("cambiar_estado_inmueble", true);
                permisos.put("activar_inmueble", true);
                permisos.put("desactivar_inmueble", true);

                // Contratos: crear, modificar, cambiar_estado (según Endpoints.md)
                permisos.put("crear_contrato", true);
                permisos.put("modificar_contrato", true);
                permisos.put("cambiar_estado_contrato", true);

                // Usuarios: puede crear secretarias y abogadas
                permisos.put("crear_usuario_secretaria", true);
                permisos.put("crear_usuario_abogada", true);

                permisos.put("editar_servicios", true);
                permisos.put("pagar_servicios", true);

                // Estados de contrato y tipos de inmueble: solo consultar (ADMIN puede modificar)
                // Ya está configurado arriba en consultar_estado_contrato y consultar_tipo_inmueble
                break;

            case ROLE_SECRETARIA:
                // La secretaria puede consultar todo
                permisos.put("consultar_propietario", true);
                permisos.put("consultar_inmueble", true);
                permisos.put("consultar_inquilino", true);
                permisos.put("consultar_contrato", true);
                permisos.put("consultar_estado_contrato", true);
                permisos.put("consultar_tipo_inmueble", true);

                // Usuarios: solo puede crear secretarias
                permisos.put("crear_usuario_secretaria", true);

                break;
        }

        return permisos;
    }

    /**
     * Obtiene los permisos consolidados para múltiples roles
     * Si el usuario tiene múltiples roles, se aplica OR lógico (cualquier rol que tenga el permiso lo otorga)
     */
    public Map<String, Boolean> obtenerPermisosConsolidados(Iterable<RolNombre> roles) {
        Map<String, Boolean> permisosConsolidados = new HashMap<>();

        // Inicializar todos los permisos en false
        String[] sujetos = {"propietario", "inmueble", "inquilino", "contrato", "estado_contrato", "tipo_inmueble"};
        String[] acciones = {"crear", "consultar", "modificar", "eliminar", "cambiar_estado", "activar", "desactivar"};

        for (String sujeto : sujetos) {
            for (String accion : acciones) {
                String permisoKey = accion + "_" + sujeto;
                permisosConsolidados.put(permisoKey, false);
            }
        }

        // Inicializar permisos de creación de usuarios
        permisosConsolidados.put("crear_usuario_secretaria", false);
        permisosConsolidados.put("crear_usuario_abogada", false);
        permisosConsolidados.put("crear_usuario_administrador", false);

        // Aplicar OR lógico para cada rol
        for (RolNombre rol : roles) {
            Map<String, Boolean> permisosRol = obtenerPermisosPorRol(rol);

            for (Map.Entry<String, Boolean> entry : permisosRol.entrySet()) {
                String permiso = entry.getKey();
                Boolean tienePermiso = entry.getValue();

                // Si algún rol tiene el permiso, se otorga
                if (tienePermiso) {
                    permisosConsolidados.put(permiso, true);
                }
            }
        }

        return permisosConsolidados;
    }
}
