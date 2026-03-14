package com.example.carwash.utils.Timer

object WashDuration {

    fun getDurationMinutes(service: String): Int {
        return when (service.trim().lowercase()) {
            "base" -> 30
            "premium" -> 45
            "express" -> 20
            "detailing" -> 60
            else -> 30
        }
    }
}