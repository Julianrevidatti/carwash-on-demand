package com.example.carwash.utils.Timer

object WashDuration {

    fun getDurationMinutes(service: String): Int {
        return when (service.trim().lowercase()) {
            "base" -> 1
            "premium" -> 1
            "express" -> 1
            "detailing" -> 1
            else -> 1
        }
    }
}