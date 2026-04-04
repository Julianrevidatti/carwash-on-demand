package com.example.carwash.utils

object WashTimeCalculator {
    fun getEstimatedMinutes(serviceName: String, speedFactor: Double): Int {
        val baseMinutes = when (serviceName) {
            "Lavado Base" -> 30
            "Lavado Premium" -> 60
            "Lavado Express" -> 20
            "Servicio Detailing" -> 120
            else -> 45
        }
        return (baseMinutes * speedFactor).toInt()
    }
}
