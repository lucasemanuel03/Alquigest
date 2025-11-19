package com.alquileres.config;

import com.alquileres.model.Rol;
import com.alquileres.model.RolNombre;
import com.alquileres.model.Usuario;
import com.alquileres.model.TipoInmueble;
import com.alquileres.model.EstadoContrato;
import com.alquileres.model.EstadoInmueble;
import com.alquileres.model.MotivoCancelacion;
import com.alquileres.model.TipoServicio;
import com.alquileres.model.AmbitoPDF;
import com.alquileres.repository.RolRepository;
import com.alquileres.repository.UsuarioRepository;
import com.alquileres.repository.TipoInmuebleRepository;
import com.alquileres.repository.EstadoContratoRepository;
import com.alquileres.repository.EstadoInmuebleRepository;
import com.alquileres.repository.MotivoCancelacionRepository;
import com.alquileres.repository.TipoServicioRepository;
import com.alquileres.repository.AmbitoPDFRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Set;

@Component
public class DataInitializer implements CommandLineRunner {

    private final RolRepository rolRepository;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final TipoInmuebleRepository tipoInmuebleRepository;
    private final EstadoContratoRepository estadoContratoRepository;
    private final EstadoInmuebleRepository estadoInmuebleRepository;
    private final MotivoCancelacionRepository motivoCancelacionRepository;
    private final TipoServicioRepository tipoServicioRepository;
    private final AmbitoPDFRepository ambitoPDFRepository;

    public DataInitializer(
            RolRepository rolRepository,
            UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder,
            TipoInmuebleRepository tipoInmuebleRepository,
            EstadoContratoRepository estadoContratoRepository,
            EstadoInmuebleRepository estadoInmuebleRepository,
            MotivoCancelacionRepository motivoCancelacionRepository,
            TipoServicioRepository tipoServicioRepository,
            AmbitoPDFRepository ambitoPDFRepository) {
        this.rolRepository = rolRepository;
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.tipoInmuebleRepository = tipoInmuebleRepository;
        this.estadoContratoRepository = estadoContratoRepository;
        this.estadoInmuebleRepository = estadoInmuebleRepository;
        this.motivoCancelacionRepository = motivoCancelacionRepository;
        this.tipoServicioRepository = tipoServicioRepository;
        this.ambitoPDFRepository = ambitoPDFRepository;
    }

    @Override
    public void run(String... args) {
        // Inicializar roles si no existen
        if (rolRepository.count() == 0) {
            rolRepository.save(new Rol(RolNombre.ROLE_ADMINISTRADOR));
            rolRepository.save(new Rol(RolNombre.ROLE_ABOGADA));
            rolRepository.save(new Rol(RolNombre.ROLE_SECRETARIA));

            System.out.println("Roles inicializados en la base de datos");
        }

        // Inicializar tipos de inmueble si no existen
        if (tipoInmuebleRepository.count() == 0) {
            tipoInmuebleRepository.save(new TipoInmueble("Departamento"));
            tipoInmuebleRepository.save(new TipoInmueble("Casa"));
            tipoInmuebleRepository.save(new TipoInmueble("Local Comercial"));
            tipoInmuebleRepository.save(new TipoInmueble("Oficina"));
            tipoInmuebleRepository.save(new TipoInmueble("Depósito"));
            tipoInmuebleRepository.save(new TipoInmueble("Terreno"));
            tipoInmuebleRepository.save(new TipoInmueble("Otro"));

            System.out.println("Tipos de inmueble inicializados en la base de datos");
        }

        // Inicializar estados de contrato si no existen
        if (estadoContratoRepository.count() == 0) {
            estadoContratoRepository.save(new EstadoContrato("Vigente"));
            estadoContratoRepository.save(new EstadoContrato("No Vigente"));
            estadoContratoRepository.save(new EstadoContrato("Cancelado"));

            System.out.println("Estados de contrato inicializados en la base de datos");
        }

        // Inicializar estados de inmueble si no existen
        if (estadoInmuebleRepository.count() == 0) {
            estadoInmuebleRepository.save(new EstadoInmueble("Disponible"));
            estadoInmuebleRepository.save(new EstadoInmueble("En Reparacion"));
            estadoInmuebleRepository.save(new EstadoInmueble("Inactivo"));
            estadoInmuebleRepository.save(new EstadoInmueble("Alquilado"));

            System.out.println("Estados de inmueble inicializados en la base de datos");
        }

        // Inicializar motivos de cancelación si no existen
        if (motivoCancelacionRepository.count() == 0) {
            motivoCancelacionRepository.save(new MotivoCancelacion("Locador Rescinde", "Se violaron cláusulas específicas del contrato"));
            motivoCancelacionRepository.save(new MotivoCancelacion("Locatario Rescinde", "Otros motivos"));
            motivoCancelacionRepository.save(new MotivoCancelacion("Mal Cargado", "El contrato fue cargado con datos incorrectos"));

            System.out.println("Motivos de cancelación inicializados en la base de datos");
        }

        // Inicializar tipos de servicio si no existen
        if (tipoServicioRepository.count() == 0) {
            tipoServicioRepository.save(new TipoServicio("Luz"));
            tipoServicioRepository.save(new TipoServicio("Agua"));
            tipoServicioRepository.save(new TipoServicio("Gas"));
            tipoServicioRepository.save(new TipoServicio("Rentas"));
            tipoServicioRepository.save(new TipoServicio("Municipalidad"));

            System.out.println("Tipos de servicio inicializados en la base de datos");
        }

        // Inicializar ámbitos de PDF si no existen
        if (ambitoPDFRepository.count() == 0) {
            ambitoPDFRepository.save(new AmbitoPDF("CONTRATO"));
            ambitoPDFRepository.save(new AmbitoPDF("PAGO_SERVICIO"));
            ambitoPDFRepository.save(new AmbitoPDF("PAGO_ALQUILER"));

            System.out.println("Ámbitos de PDF inicializados en la base de datos");
        }

        // Crear usuario administrador por defecto si no existe ningún usuario con rol ADMINISTRADOR
        Rol adminRole = rolRepository.findByNombre(RolNombre.ROLE_ADMINISTRADOR)
                .orElseThrow(() -> new RuntimeException("Error: Rol ADMINISTRADOR no encontrado."));

        // Verificar si el usuario "admin" ya existe
        if (!usuarioRepository.existsByUsername("admin")) {
            // Crear el usuario administrador por defecto
            Usuario adminUsuario = new Usuario("admin", "admin@alquileres.com", passwordEncoder.encode("123456"));
            adminUsuario.setEsActivo(true);

            // Asignar el rol de administrador
            Set<Rol> adminRoles = new HashSet<>();
            adminRoles.add(adminRole);
            adminUsuario.setRoles(adminRoles);

            usuarioRepository.save(adminUsuario);

            System.out.println("Usuario administrador por defecto creado: username='admin', password='123456'");
        } else {
            System.out.println("Usuario administrador 'admin' ya existe en la base de datos");
        }
    }
}
