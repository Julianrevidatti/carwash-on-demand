package com.example.carwash.utils

import com.example.carwash.data.model.*
import com.google.firebase.Timestamp
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.GeoPoint
import java.util.Date

/**
 * FOR DEVELOPMENT ONLY — run once to populate the database,
 * then comment out the calls in MainActivity.
 *
 * Usage:
 *   if (BuildConfig.DEBUG) FirebaseSeed.loadAll()
 */
object FirebaseSeed {

    private val db = FirebaseFirestore.getInstance()

    fun loadAll() {
        loadServices()
        loadWashers()
    }

    private fun loadServices() {
        val services = mapOf(
            "svc_001" to Service(
                name = "Basic exterior wash",
                description = "Full exterior wash with water and neutral soap",
                basePrice = 3500.0,
                estimatedDuration = 30,
                vehicleType = "all",
                status = "active"
            ),
            "svc_002" to Service(
                name = "Exterior + interior wash",
                description = "Full exterior wash, vacuuming and dashboard cleaning",
                basePrice = 6000.0,
                estimatedDuration = 60,
                vehicleType = "all",
                status = "active"
            ),
            "svc_003" to Service(
                name = "Premium SUV wash",
                description = "Full wash, wax and deep interior cleaning",
                basePrice = 9500.0,
                estimatedDuration = 90,
                vehicleType = "suv",
                status = "active"
            ),
            "svc_004" to Service(
                name = "Engine wash",
                description = "Engine bay cleaning and degreasing",
                basePrice = 4500.0,
                estimatedDuration = 45,
                vehicleType = "all",
                status = "active"
            )
        )

        services.forEach { (id, service) ->
            db.collection("services").document(id).set(service)
                .addOnSuccessListener { android.util.Log.d("SEED", "Service $id loaded") }
                .addOnFailureListener { e -> android.util.Log.e("SEED", "Error service $id: $e") }
        }
    }

    private fun loadWashers() {
        val washers = mapOf(
            "wsh_001" to Washer(
                name = "Carlos",
                lastName = "Méndez",
                phone = "1134567890",
                coverageZone = "Palermo",
                location = GeoPoint(-34.5889, -58.4270),
                availabilityStatus = "AVAILABLE",
                averageRating = 4.8,
                totalReviews = 24,
                totalScore = 115.2
            ),
            "wsh_002" to Washer(
                name = "Sofía",
                lastName = "Romero",
                phone = "1145678901",
                coverageZone = "Belgrano",
                location = GeoPoint(-34.5608, -58.4558),
                availabilityStatus = "AVAILABLE",
                averageRating = 4.5,
                totalReviews = 18,
                totalScore = 81.0
            ),
            "wsh_003" to Washer(
                name = "Diego",
                lastName = "Torres",
                phone = "1156789012",
                coverageZone = "Villa Urquiza",
                location = GeoPoint(-34.5780, -58.4890),
                availabilityStatus = "BUSY",
                averageRating = 4.2,
                totalReviews = 11,
                totalScore = 46.2
            )
        )

        washers.forEach { (id, washer) ->
            db.collection("washers").document(id).set(washer)
                .addOnSuccessListener { android.util.Log.d("SEED", "Washer $id loaded") }
                .addOnFailureListener { e -> android.util.Log.e("SEED", "Error washer $id: $e") }
        }
    }
}
