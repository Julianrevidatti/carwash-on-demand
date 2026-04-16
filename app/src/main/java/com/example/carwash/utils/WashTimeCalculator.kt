package com.example.carwash.utils

object WashTimeCalculator {
    fun getEstimatedMinutes(serviceName: String, speedFactor: Double): Int {
        val baseMinutes = when (serviceName) {
            "Lavado Base" -> 1
            "Lavado Premium" -> 1
            "Lavado Express" -> 1
            "Servicio Detailing" -> 1
            else -> 1
        }
        return baseMinutes.toInt()
    }
}
