package com.example.carwash.data.model

data class Booking(
    val id: Int,
    val address: String,
    val date: String,
    val time: String,
    val service: String,
    var status: BookingStatus,
    val vehicle: String = "No especificado",
    val paymentMethod: String = "Efectivo",
    val durationMinutes: Int = 0,
    val startTimestamp: Long = 0L,
    val endTimestamp: Long = 0L
)