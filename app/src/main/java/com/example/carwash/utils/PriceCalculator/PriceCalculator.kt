package com.example.carwash.utils

object PriceCalculator {

    private val basePrices = mapOf(
        "Base" to 10000.0,
        "Express" to 15000.0,
        "Premium" to 25000.0,
        "Detailing" to 50000.0
    )

    private val typeMultipliers = mapOf(
        "Hatchback" to 1.0,
        "Sedan" to 1.2,
        "Coupé" to 1.2,
        "Monovolumen" to 1.3,
        "Furgón" to 1.4,
        "SUV" to 1.5,
        "Pickup" to 1.6
    )

    fun calculate(serviceName: String, vehicleType: String): Double {
        val base = basePrices[serviceName] ?: 0.0
        val multiplier = typeMultipliers[vehicleType] ?: 1.0
        return base * multiplier
    }

    fun format(price: Double): String {
        return "$${"%,.0f".format(price).replace(",", ".")}"
    }
}