package com.example.carwash.utils.Timer

object WashDuration {

    private const val DEBUG_MODE = true  // ← cambiá a false para producción

    fun getDurationMinutes(service: String): Int {
        if (DEBUG_MODE) return 1  // 1 minuto para testear

        return when (service.trim().lowercase()) {
            "base" -> 30
            "premium" -> 45
            "express" -> 20
            "detailing" -> 60
            else -> 30
        }
    }
}