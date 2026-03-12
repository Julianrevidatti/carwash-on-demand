package com.example.carwash.data.model

import com.google.firebase.Timestamp
import com.google.firebase.firestore.GeoPoint

// ── Usuario ───────────────────────────────────────────────
data class Usuario(
    val nombre: String = "",
    val apellido: String = "",
    val dni: String = "",
    val email: String = "",
    val telefono: String = "",
    val direccion_base: String = "",
    val creado_en: Timestamp = Timestamp.now()
)

// ── Vehículo (subcolección de usuario) ───────────────────
data class Vehiculo(
    val marca: String = "",
    val modelo: String = "",
    val tipo: String = "",
    val patente: String = "",
    val creado_en: Timestamp = Timestamp.now()
)

// ── Lavador ───────────────────────────────────────────────
data class Lavador(
    val nombre: String = "",
    val apellido: String = "",
    val telefono: String = "",
    val zona_cobertura: String = "",
    val ubicacion: GeoPoint = GeoPoint(0.0, 0.0),
    val estado_disponibilidad: String = "DISPONIBLE",
    val reputacion_promedio: Double = 5.0,
    val total_resenas: Long = 0,
    val suma_puntajes: Double = 0.0,
    val creado_en: Timestamp = Timestamp.now()
)

// ── Servicio (catálogo) ───────────────────────────────────
data class Servicio(
    val nombre: String = "",
    val descripcion: String = "",
    val precio_base: Double = 0.0,
    val duracion_estimada: Int = 0,
    val tipo_vehiculo: String = "todos",
    val estado: String = "activo"
)

// ── Snapshots (embebidos en Solicitud) ────────────────────
data class UsuarioSnapshot(
    val nombre: String = "",
    val apellido: String = "",
    val telefono: String = ""
)

data class VehiculoSnapshot(
    val marca: String = "",
    val modelo: String = "",
    val patente: String = "",
    val tipo: String = ""
)

data class ServicioSnapshot(
    val id_servicio: String = "",
    val nombre: String = "",
    val precio_base: Double = 0.0
)

data class LavadorSnapshot(
    val nombre: String = "",
    val apellido: String = "",
    val telefono: String = ""
)

// ── Solicitud ─────────────────────────────────────────────
data class Solicitud(
    val id_usuario: String = "",
    val id_lavador: String = "",
    val id_vehiculo: String = "",
    val usuario_snapshot: UsuarioSnapshot = UsuarioSnapshot(),
    val vehiculo_snapshot: VehiculoSnapshot = VehiculoSnapshot(),
    val servicio_snapshot: ServicioSnapshot = ServicioSnapshot(),
    val lavador_snapshot: LavadorSnapshot = LavadorSnapshot(),
    val fecha_programada: Timestamp = Timestamp.now(),
    val franja_horaria: String = "",
    val ubicacion: GeoPoint = GeoPoint(0.0, 0.0),
    val direccion_encuentro: String = "",
    val monto_final: Double = 0.0,
    val estado: String = "PENDIENTE",  // PENDIENTE | PROGRAMADO | EN_CURSO | FINALIZADO | CANCELADO
    val creado_en: Timestamp = Timestamp.now()
)

// ── Pago (subcolección de Solicitud) ─────────────────────
data class Pago(
    val metodo_pago: String = "",       // DIGITAL | EFECTIVO
    val estado_pago: String = "PENDIENTE", // PENDIENTE | APROBADO | RECHAZADO
    val comprobante_url: String = "",
    val creado_en: Timestamp = Timestamp.now()
)

// ── Reseña (subcolección de Solicitud) ───────────────────
data class Resena(
    val id_usuario: String = "",
    val id_lavador: String = "",
    val puntaje: Int = 0,               // 1 a 5
    val comentario: String = "",
    val creado_en: Timestamp = Timestamp.now()
)

// ── Turno ─────────────────────────────────────────────────
data class Turno(
    val id_solicitud: String = "",
    val id_lavador: String = "",
    val fecha: Timestamp = Timestamp.now(),
    val hora: String = "",
    val ubicacion: GeoPoint = GeoPoint(0.0, 0.0),
    val estado_turno: String = "CONFIRMADO"  // CONFIRMADO | CANCELADO | COMPLETADO
)
