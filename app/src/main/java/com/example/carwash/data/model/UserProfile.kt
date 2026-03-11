package com.example.carwash.data.model

data class UserProfile(
    val nombre: String = "",
    val apellido: String = "",
    val dni: String = "",
    val email: String = "",
    val telefono: String = "",
    val direccion: String = "",
    val createdAt: Long = System.currentTimeMillis()
)

data class Reserva(
    val id: Int,
    val servicio: String,
    val direccion: String,
    val fecha: String,
    val hora: String,
    val pago: String,
    var estado: EstadoReserva
)

enum class EstadoReserva {
    PROGRAMADO,
    FINALIZADO,
    CANCELADO
}