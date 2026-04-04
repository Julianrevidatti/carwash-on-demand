package com.example.carwash.utils.validators

import com.example.carwash.data.model.*
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.GeoPoint

/**
 * FOR DEVELOPMENT ONLY — run once to populate the database,
 * then comment out the calls in MainActivity.
 */
object FirebaseSeed {

    private val db = FirebaseFirestore.getInstance()

    fun loadAll() {
        loadWashers()
    }

    private fun loadWashers() {
        val washers = mapOf(
            "wsh_001" to Washer(
                name = "Carlos",
                lastName = "Méndez",
                phone = "1134567890",
                coverageZone = "Zona Norte",
                specialties = listOf("Base", "Premium", "Express"),
                speedFactor = 0.8, // Lavador rápido
                location = GeoPoint(-34.5889, -58.4270),
                availabilityStatus = "AVAILABLE",
                averageRating = 4.8
            ),
            "wsh_002" to Washer(
                name = "Sofía",
                lastName = "Romero",
                phone = "1145678901",
                coverageZone = "Zona Sur",
                specialties = listOf("Base", "Express"),
                speedFactor = 1.0, // Lavador promedio
                location = GeoPoint(-34.5608, -58.4558),
                availabilityStatus = "AVAILABLE",
                averageRating = 4.5
            ),
            "wsh_003" to Washer(
                name = "Diego",
                lastName = "Torres",
                phone = "1156789012",
                coverageZone = "CABA",
                specialties = listOf("Premium", "Detailing"),
                speedFactor = 1.2, // Lavador detallista (más lento)
                location = GeoPoint(-34.5780, -58.4890),
                availabilityStatus = "AVAILABLE",
                averageRating = 4.9
            ),
            "wsh_004" to Washer(
                name = "Lucía",
                lastName = "García",
                phone = "1167890123",
                coverageZone = "Zona Oeste",
                specialties = listOf("Base", "Premium", "Express", "Detailing"),
                speedFactor = 0.7, // Lavador detallista (más lento)
                location = GeoPoint(-34.6037, -58.3816),
                availabilityStatus = "AVAILABLE",
                averageRating = 4.7
            )
        )

        washers.forEach { (id, washer) ->
            db.collection("washers").document(id).set(washer)
                .addOnSuccessListener { android.util.Log.d("SEED", "Washer $id loaded with speedFactor") }
                .addOnFailureListener { e -> android.util.Log.e("SEED", "Error washer $id: $e") }
        }
    }
}
