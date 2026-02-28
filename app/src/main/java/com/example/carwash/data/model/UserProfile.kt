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