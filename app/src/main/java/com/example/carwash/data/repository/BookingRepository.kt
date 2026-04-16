package com.example.carwash.data.repository

import com.example.carwash.data.model.FirebaseAppointment
import com.example.carwash.data.model.FirebaseBooking
import com.example.carwash.data.model.Payment
import com.example.carwash.data.model.Review
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query

object BookingRepository {

    private val db = FirebaseFirestore.getInstance()

    fun createBooking(
        booking: FirebaseBooking,
        appointment: FirebaseAppointment,
        onResult: (Boolean, String) -> Unit
    ) {
        val bookingRef     = db.collection("bookings").document()
        val appointmentRef = db.collection("appointments").document()

        val batch = db.batch()
        batch.set(bookingRef, booking)
        batch.set(appointmentRef, appointment.copy(bookingId = bookingRef.id))

        batch.commit()
            .addOnSuccessListener { onResult(true, bookingRef.id) }
            .addOnFailureListener { onResult(false, "") }
    }

    fun getUserBookings(
        userId: String,
        onResult: (List<FirebaseBooking>) -> Unit
    ) {
        db.collection("bookings")
            .whereEqualTo("userId", userId)
            .get()
            .addOnSuccessListener { snap ->
                onResult(snap.toObjects(FirebaseBooking::class.java))
            }
            .addOnFailureListener { onResult(emptyList()) }
    }

    fun updateStatus(
        bookingId: String,
        newStatus: String,
        onResult: (Boolean) -> Unit
    ) {
        db.collection("bookings").document(bookingId)
            .update("status", newStatus)
            .addOnSuccessListener { onResult(true) }
            .addOnFailureListener { onResult(false) }
    }

    fun addReview(
        bookingId: String,
        washerId: String,
        review: Review,
        onResult: (Boolean) -> Unit
    ) {
        val batch = db.batch()
        
        // Agregar la reseña
        val reviewRef = db.collection("reviews").document()
        batch.set(reviewRef, review)
        
        // Marcar el booking como reseñado
        val bookingRef = db.collection("bookings").document(bookingId)
        batch.update(bookingRef, "hasReview", true)
        
        // Actualizar el rating del lavador
        val washerRef = db.collection("washers").document(washerId)
        batch.update(washerRef, "totalReviews", FieldValue.increment(1))
        batch.update(washerRef, "totalScore", FieldValue.increment(review.score.toLong()))
        
        batch.commit()
            .addOnSuccessListener { onResult(true) }
            .addOnFailureListener { onResult(false) }
    }

    // El resto de funciones se mantienen...
}
