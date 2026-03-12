package com.example.carwash.utils

import com.example.carwash.data.model.*
import com.google.firebase.Timestamp
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.GeoPoint
import java.util.Date

object FirebaseSeedUsuarios {

    private val db = FirebaseFirestore.getInstance()

    // Llamá esto UNA sola vez desde MainActivity:
    //   FirebaseSeedUsuarios.cargarTodo()
    fun cargarTodo() {
        cargarUsuarios()
    }

    private fun cargarUsuarios() {

        val usuarios = listOf(

            Triple(
                "usr_001",
                Usuario(
                    nombre = "Martina",
                    apellido = "García",
                    dni = "38123456",
                    email = "martina.garcia@gmail.com",
                    telefono = "1167890123",
                    direccion_base = "Av. Santa Fe 2500, Palermo, CABA"
                ),
                listOf(
                    Vehiculo(marca = "Volkswagen", modelo = "Polo",    tipo = "sedan", patente = "AB123CD"),
                    Vehiculo(marca = "Ford",       modelo = "EcoSport", tipo = "suv",   patente = "GH789IJ")
                )
            ),

            Triple(
                "usr_002",
                Usuario(
                    nombre = "Luciano",
                    apellido = "Pérez",
                    dni = "35678901",
                    email = "luciano.perez@hotmail.com",
                    telefono = "1145678901",
                    direccion_base = "Cabildo 1200, Belgrano, CABA"
                ),
                listOf(
                    Vehiculo(marca = "Toyota",  modelo = "Corolla", tipo = "sedan", patente = "CD456EF"),
                    Vehiculo(marca = "Renault", modelo = "Duster",  tipo = "suv",   patente = "KL012MN")
                )
            ),

            Triple(
                "usr_003",
                Usuario(
                    nombre = "Valentina",
                    apellido = "Romero",
                    dni = "40234567",
                    email = "valen.romero@gmail.com",
                    telefono = "1156789012",
                    direccion_base = "Av. Triunvirato 3400, Villa Urquiza, CABA"
                ),
                listOf(
                    Vehiculo(marca = "Chevrolet", modelo = "Onix",   tipo = "sedan", patente = "EF789GH"),
                    Vehiculo(marca = "Jeep",      modelo = "Renegade", tipo = "suv", patente = "OP345QR")
                )
            ),

            Triple(
                "usr_004",
                Usuario(
                    nombre = "Mateo",
                    apellido = "López",
                    dni = "37890123",
                    email = "mateo.lopez@outlook.com",
                    telefono = "1178901234",
                    direccion_base = "Corrientes 4500, Almagro, CABA"
                ),
                listOf(
                    Vehiculo(marca = "Honda",  modelo = "Civic",  tipo = "sedan", patente = "IJ012KL"),
                    Vehiculo(marca = "Nissan", modelo = "Kicks",  tipo = "suv",   patente = "ST678UV")
                )
            ),

            Triple(
                "usr_005",
                Usuario(
                    nombre = "Camila",
                    apellido = "Fernández",
                    dni = "41345678",
                    email = "camila.fernandez@gmail.com",
                    telefono = "1189012345",
                    direccion_base = "Rivadavia 6700, Flores, CABA"
                ),
                listOf(
                    Vehiculo(marca = "Peugeot", modelo = "208",   tipo = "sedan", patente = "MN345OP"),
                    Vehiculo(marca = "Fiat",    modelo = "Pulse", tipo = "suv",   patente = "WX901YZ")
                )
            ),

            Triple(
                "usr_006",
                Usuario(
                    nombre = "Santiago",
                    apellido = "Martínez",
                    dni = "36456789",
                    email = "santi.martinez@gmail.com",
                    telefono = "1190123456",
                    direccion_base = "Av. San Juan 2100, San Telmo, CABA"
                ),
                listOf(
                    Vehiculo(marca = "Volkswagen", modelo = "Golf",    tipo = "sedan", patente = "QR678ST"),
                    Vehiculo(marca = "Toyota",     modelo = "Hilux",   tipo = "pickup", patente = "AB234CD")
                )
            ),

            Triple(
                "usr_007",
                Usuario(
                    nombre = "Florencia",
                    apellido = "González",
                    dni = "39567890",
                    email = "flor.gonzalez@hotmail.com",
                    telefono = "1101234567",
                    direccion_base = "Libertador 5200, Núñez, CABA"
                ),
                listOf(
                    Vehiculo(marca = "Renault", modelo = "Sandero", tipo = "sedan", patente = "UV901WX"),
                    Vehiculo(marca = "Ford",    modelo = "Territory", tipo = "suv", patente = "EF567GH")
                )
            ),

            Triple(
                "usr_008",
                Usuario(
                    nombre = "Tomás",
                    apellido = "Díaz",
                    dni = "42678901",
                    email = "tomas.diaz@gmail.com",
                    telefono = "1112345678",
                    direccion_base = "Nazca 1800, Villa del Parque, CABA"
                ),
                listOf(
                    Vehiculo(marca = "Citroën", modelo = "C3",      tipo = "sedan", patente = "YZ234AB"),
                    Vehiculo(marca = "Chevrolet", modelo = "Tracker", tipo = "suv", patente = "IJ890KL")
                )
            )
        )

        usuarios.forEach { (uid, usuario, vehiculos) ->
            val usuarioRef = db.collection("usuarios").document(uid)

            usuarioRef.set(usuario)
                .addOnSuccessListener {
                    android.util.Log.d("SEED", "Usuario $uid (${usuario.nombre}) cargado")

                    vehiculos.forEachIndexed { index, vehiculo ->
                        val vidx = "veh_${uid}_${index + 1}"
                        usuarioRef.collection("vehiculos").document(vidx)
                            .set(vehiculo)
                            .addOnSuccessListener {
                                android.util.Log.d("SEED", "  Vehiculo ${vehiculo.patente} cargado")
                                // Crear solicitud de ejemplo para el primer vehículo
                                if (index == 0) crearSolicitudEjemplo(uid, vidx, usuario, vehiculo)
                            }
                    }
                }
                .addOnFailureListener { e ->
                    android.util.Log.e("SEED", "Error usuario $uid: $e")
                }
        }
    }

    private fun crearSolicitudEjemplo(
        idUsuario: String,
        idVehiculo: String,
        usuario: Usuario,
        vehiculo: Vehiculo
    ) {
        // Rotar lavadores y servicios entre usuarios para tener variedad
        val lavadores = listOf("lav_001", "lav_002", "lav_003")
        val servicios = listOf(
            ServicioSnapshot("svc_001", "Lavado exterior básico", 3500.0),
            ServicioSnapshot("svc_002", "Lavado exterior + interior", 6000.0),
            ServicioSnapshot("svc_003", "Lavado premium SUV", 9500.0)
        )
        val franjas = listOf("08:00-10:00", "10:00-12:00", "14:00-16:00", "16:00-18:00")
        val estados = listOf("PENDIENTE", "PROGRAMADO", "EN_CURSO", "FINALIZADO", "FINALIZADO")

        val idx = idUsuario.takeLast(1).toIntOrNull() ?: 1
        val lavadorId = lavadores[(idx - 1) % lavadores.size]
        val servicio  = servicios[(idx - 1) % servicios.size]
        val franja    = franjas[(idx - 1) % franjas.size]
        val estado    = estados[(idx - 1) % estados.size]

        val lavadorNombres = mapOf(
            "lav_001" to LavadorSnapshot("Carlos", "Méndez", "1134567890"),
            "lav_002" to LavadorSnapshot("Sofía",  "Romero", "1145678901"),
            "lav_003" to LavadorSnapshot("Diego",  "Torres", "1156789012")
        )

        val solicitudRef = db.collection("solicitudes").document()
        val turnoRef     = db.collection("turnos").document()

        val solicitud = Solicitud(
            id_usuario  = idUsuario,
            id_lavador  = lavadorId,
            id_vehiculo = idVehiculo,
            usuario_snapshot  = UsuarioSnapshot(usuario.nombre, usuario.apellido, usuario.telefono),
            vehiculo_snapshot = VehiculoSnapshot(vehiculo.marca, vehiculo.modelo, vehiculo.patente, vehiculo.tipo),
            servicio_snapshot = servicio,
            lavador_snapshot  = lavadorNombres[lavadorId] ?: LavadorSnapshot(),
            fecha_programada  = Timestamp(Date()),
            franja_horaria    = franja,
            ubicacion         = GeoPoint(-34.5889, -58.4270),
            direccion_encuentro = usuario.direccion_base,
            monto_final       = servicio.precio_base,
            estado            = estado
        )

        val turno = Turno(
            id_solicitud = solicitudRef.id,
            id_lavador   = lavadorId,
            fecha        = Timestamp(Date()),
            hora         = franja.split("-")[0],
            ubicacion    = GeoPoint(-34.5889, -58.4270),
            estado_turno = if (estado == "FINALIZADO") "COMPLETADO" else "CONFIRMADO"
        )

        val batch = db.batch()
        batch.set(solicitudRef, solicitud)
        batch.set(turnoRef, turno)
        batch.set(
            solicitudRef.collection("pagos").document(),
            Pago(
                metodo_pago  = if (idx % 2 == 0) "EFECTIVO" else "DIGITAL",
                estado_pago  = if (estado == "FINALIZADO") "APROBADO" else "PENDIENTE"
            )
        )
        batch.commit()
            .addOnSuccessListener {
                android.util.Log.d("SEED", "  Solicitud creada para $idUsuario — estado: $estado")
            }
    }
}
