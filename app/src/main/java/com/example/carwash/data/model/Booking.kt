package com.example.carwash.data.model

data class Booking(
    val id: Int,
    val address: String,
    val date: String,
    val time: String,
    val service: String,
    var status: BookingStatus,
    val vehicle: String = "No especificado",
    val paymentMethod: String = "Efectivo"
)


