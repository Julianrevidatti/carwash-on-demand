package com.example.carwash.utils

import com.example.carwash.data.model.*
import com.google.firebase.Timestamp
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.GeoPoint
import java.util.Date

/**
 * SOLO PARA DESARROLLO — cargá datos de prueba una vez y luego
 * eliminá las llamadas (o desactivá el botón de debug).
 *
 * Uso desde MainActivity (solo en debug):
 *   if (BuildConfig.DEBUG) FirebaseSeed.cargarTodo()
 */
object FirebaseSeed {

    private val db = FirebaseFirestore.getInstance()

    fun cargarTodo() {
        cargarServicios()
        cargarLavadores()
    }

    // ── Servicios ─────────────────────────────────────────
    private fun cargarServicios() {
        val servicios = mapOf(
            "svc_001" to Servicio(
                nombre = "Lavado exterior básico",
                descripcion = "Lavado completo exterior con agua y jabón neutro",
                precio_base = 3500.0,
                duracion_estimada = 30,
                tipo_vehiculo = "todos",
                estado = "activo"
            ),
            "svc_002" to Servicio(
                nombre = "Lavado exterior + interior",
                descripcion = "Exterior completo y aspirado + limpieza de tablero",
                precio_base = 6000.0,
                duracion_estimada = 60,
                tipo_vehiculo = "todos",
                estado = "activo"
            ),
            "svc_003" to Servicio(
                nombre = "Lavado premium SUV",
                descripcion = "Lavado completo, encerado y limpieza profunda de interior",
                precio_base = 9500.0,
                duracion_estimada = 90,
                tipo_vehiculo = "suv",
                estado = "activo"
            ),
            "svc_004" to Servicio(
                nombre = "Lavado de motor",
                descripcion = "Limpieza y desengrase de compartimento motor",
                precio_base = 4500.0,
                duracion_estimada = 45,
                tipo_vehiculo = "todos",
                estado = "activo"
            )
        )

        servicios.forEach { (id, servicio) ->
            db.collection("servicios").document(id).set(servicio)
        }
    }

    // ── Lavadores ─────────────────────────────────────────
    private fun cargarLavadores() {
        val lavadores = mapOf(
            "lav_001" to Lavador(
                nombre = "Carlos",
                apellido = "Méndez",
                telefono = "1134567890",
                zona_cobertura = "Palermo",
                ubicacion = GeoPoint(-34.5889, -58.4270),
                estado_disponibilidad = "DISPONIBLE",
                reputacion_promedio = 4.8,
                total_resenas = 24,
                suma_puntajes = 115.2
            ),
            "lav_002" to Lavador(
                nombre = "Sofía",
                apellido = "Romero",
                telefono = "1145678901",
                zona_cobertura = "Belgrano",
                ubicacion = GeoPoint(-34.5608, -58.4558),
                estado_disponibilidad = "DISPONIBLE",
                reputacion_promedio = 4.5,
                total_resenas = 18,
                suma_puntajes = 81.0
            ),
            "lav_003" to Lavador(
                nombre = "Diego",
                apellido = "Torres",
                telefono = "1156789012",
                zona_cobertura = "Villa Urquiza",
                ubicacion = GeoPoint(-34.5780, -58.4890),
                estado_disponibilidad = "OCUPADO",
                reputacion_promedio = 4.2,
                total_resenas = 11,
                suma_puntajes = 46.2
            )
        )

        lavadores.forEach { (id, lavador) ->
            db.collection("lavadores").document(id).set(lavador)
        }
    }

    // ── Usuario demo con vehículo y solicitud ─────────────
    // Llamá esto pasando el UID real del usuario registrado:
    //   FirebaseSeed.cargarUsuarioDemo(uid)
    fun cargarUsuarioDemo(uid: String) {
        val usuarioRef = db.collection("usuarios").document(uid)

        val usuario = Usuario(
            nombre = "Martina",
            apellido = "García",
            dni = "38123456",
            email = "martina.garcia@gmail.com",
            telefono = "1167890123",
            direccion_base = "Av. Santa Fe 2500, CABA"
        )

        usuarioRef.set(usuario).addOnSuccessListener {

            val vehiculoRef = usuarioRef.collection("vehiculos").document("veh_001")
            val vehiculo = Vehiculo(
                marca = "Volkswagen",
                modelo = "Polo",
                tipo = "sedan",
                patente = "AB123CD"
            )

            vehiculoRef.set(vehiculo).addOnSuccessListener {
                crearSolicitudDemo(uid)
            }
        }
    }

    private fun crearSolicitudDemo(idUsuario: String) {
        val solicitudRef = db.collection("solicitudes").document()
        val turnoRef     = db.collection("turnos").document()

        val solicitud = Solicitud(
            id_usuario  = idUsuario,
            id_lavador  = "lav_001",
            id_vehiculo = "veh_001",
            usuario_snapshot = UsuarioSnapshot("Martina", "García", "1167890123"),
            vehiculo_snapshot = VehiculoSnapshot("Volkswagen", "Polo", "AB123CD", "sedan"),
            servicio_snapshot = ServicioSnapshot("svc_002", "Lavado exterior + interior", 6000.0),
            lavador_snapshot  = LavadorSnapshot("Carlos", "Méndez", "1134567890"),
            fecha_programada  = Timestamp(Date()),
            franja_horaria    = "10:00-12:00",
            ubicacion         = GeoPoint(-34.5889, -58.4270),
            direccion_encuentro = "Av. Santa Fe 2500, CABA",
            monto_final       = 6000.0,
            estado            = "PENDIENTE"
        )

        val turno = Turno(
            id_solicitud = solicitudRef.id,
            id_lavador   = "lav_001",
            fecha        = Timestamp(Date()),
            hora         = "10:00",
            ubicacion    = GeoPoint(-34.5889, -58.4270),
            estado_turno = "CONFIRMADO"
        )

        val batch = db.batch()
        batch.set(solicitudRef, solicitud)
        batch.set(turnoRef, turno)
        batch.set(
            solicitudRef.collection("pagos").document(),
            Pago(metodo_pago = "DIGITAL", estado_pago = "PENDIENTE")
        )
        batch.commit()
    }
}
