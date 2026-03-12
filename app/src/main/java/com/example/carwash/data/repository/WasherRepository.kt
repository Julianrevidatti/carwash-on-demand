package com.example.carwash.data.repository

import com.example.carwash.data.model.Review
import com.example.carwash.data.model.Washer
import com.google.firebase.Timestamp
import com.google.firebase.firestore.FirebaseFirestore

class WasherRepository {

    private val db = FirebaseFirestore.getInstance()

    fun getAvailableWashers(zone: String, onResult: (List<Washer>) -> Unit) {
        db.collection("washers")
            .whereEqualTo("coverageZone", zone)
            .whereEqualTo("availabilityStatus", "AVAILABLE")
            .get()
            .addOnSuccessListener { snap ->
                onResult(snap.toObjects(Washer::class.java))
            }
            .addOnFailureListener { onResult(emptyList()) }
    }

    fun getWasher(washerId: String, onResult: (Washer?) -> Unit) {
        db.collection("washers").document(washerId)
            .get()
            .addOnSuccessListener { doc ->
                onResult(doc.toObject(Washer::class.java))
            }
            .addOnFailureListener { onResult(null) }
    }

    fun updateAvailability(
        washerId: String,
        status: String,   // "AVAILABLE" | "BUSY" | "INACTIVE"
        onResult: (Boolean) -> Unit
    ) {
        db.collection("washers").document(washerId)
            .update("availabilityStatus", status)
            .addOnSuccessListener { onResult(true) }
            .addOnFailureListener { onResult(false) }
    }

    fun addReview(
        bookingId: String,
        washerId: String,
        userId: String,
        score: Int,
        comment: String,
        onResult: (Boolean) -> Unit
    ) {
        val reviewRef = db.collection("bookings")
            .document(bookingId)
            .collection("reviews")
            .document()

        val washerRef = db.collection("washers").document(washerId)

        db.runTransaction { transaction ->
            val washerSnap = transaction.get(washerRef)

            val currentTotal = washerSnap.getLong("totalReviews") ?: 0L
            val currentScore = washerSnap.getDouble("totalScore") ?: 0.0

            val newTotal   = currentTotal + 1
            val newScore   = currentScore + score
            val newAverage = newScore / newTotal

            transaction.set(reviewRef, mapOf(
                "userId"    to userId,
                "washerId"  to washerId,
                "score"     to score,
                "comment"   to comment,
                "createdAt" to Timestamp.now()
            ))

            transaction.update(washerRef, mapOf(
                "totalReviews"  to newTotal,
                "totalScore"    to newScore,
                "averageRating" to newAverage
            ))
        }
        .addOnSuccessListener { onResult(true) }
        .addOnFailureListener { onResult(false) }
    }

    fun getReviewsForBooking(bookingId: String, onResult: (List<Review>) -> Unit) {
        db.collection("bookings").document(bookingId)
            .collection("reviews")
            .get()
            .addOnSuccessListener { snap ->
                onResult(snap.toObjects(Review::class.java))
            }
            .addOnFailureListener { onResult(emptyList()) }
    }
}
