package com.example.carwash.data.repository

import com.example.carwash.data.model.FirebaseAppointment
import com.example.carwash.data.model.FirebaseBooking
import com.example.carwash.data.model.Payment
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query

class BookingRepositoryDB {

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
            .orderBy("createdAt", Query.Direction.DESCENDING)
            .get()
            .addOnSuccessListener { snap ->
                onResult(snap.toObjects(FirebaseBooking::class.java))
            }
            .addOnFailureListener { onResult(emptyList()) }
    }

    fun getWasherBookings(
        washerId: String,
        onResult: (List<FirebaseBooking>) -> Unit
    ) {
        db.collection("bookings")
            .whereEqualTo("washerId", washerId)
            .whereIn("status", listOf("PENDING", "SCHEDULED", "IN_PROGRESS"))
            .orderBy("scheduledDate", Query.Direction.ASCENDING)
            .get()
            .addOnSuccessListener { snap ->
                onResult(snap.toObjects(FirebaseBooking::class.java))
            }
            .addOnFailureListener { onResult(emptyList()) }
    }

    fun getBooking(bookingId: String, onResult: (FirebaseBooking?) -> Unit) {
        db.collection("bookings").document(bookingId)
            .get()
            .addOnSuccessListener { doc ->
                onResult(doc.toObject(FirebaseBooking::class.java))
            }
            .addOnFailureListener { onResult(null) }
    }

    fun updateStatus(
        bookingId: String,
        newStatus: String,  // PENDING | SCHEDULED | IN_PROGRESS | COMPLETED | CANCELLED
        onResult: (Boolean) -> Unit
    ) {
        db.collection("bookings").document(bookingId)
            .update("status", newStatus)
            .addOnSuccessListener { onResult(true) }
            .addOnFailureListener { onResult(false) }
    }

    fun listenToBooking(
        bookingId: String,
        onChange: (FirebaseBooking?) -> Unit
    ) {
        db.collection("bookings").document(bookingId)
            .addSnapshotListener { snap, _ ->
                onChange(snap?.toObject(FirebaseBooking::class.java))
            }
    }

    // ── Payments (subcollection) ──────────────────────────

    fun registerPayment(
        bookingId: String,
        payment: Payment,
        onResult: (Boolean) -> Unit
    ) {
        db.collection("bookings").document(bookingId)
            .collection("payments").document()
            .set(payment)
            .addOnSuccessListener { onResult(true) }
            .addOnFailureListener { onResult(false) }
    }

    fun getPayment(bookingId: String, onResult: (Payment?) -> Unit) {
        db.collection("bookings").document(bookingId)
            .collection("payments")
            .limit(1)
            .get()
            .addOnSuccessListener { snap ->
                onResult(snap.documents.firstOrNull()?.toObject(Payment::class.java))
            }
            .addOnFailureListener { onResult(null) }
    }

    fun updatePaymentStatus(
        bookingId: String,
        paymentId: String,
        newStatus: String,  // APPROVED | REJECTED
        onResult: (Boolean) -> Unit
    ) {
        db.collection("bookings").document(bookingId)
            .collection("payments").document(paymentId)
            .update("paymentStatus", newStatus)
            .addOnSuccessListener { onResult(true) }
            .addOnFailureListener { onResult(false) }
    }
}
