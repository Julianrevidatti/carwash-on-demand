package com.example.carwash.ui.notifications

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.example.carwash.data.model.FirebaseBooking
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import com.google.firebase.firestore.Query

class NotificationsViewModel : ViewModel() {

    private val _latestBooking = MutableLiveData<FirebaseBooking?>()
    val latestBooking: LiveData<FirebaseBooking?> = _latestBooking

    private val _error = MutableLiveData<String?>()
    val error: LiveData<String?> = _error

    private val db = FirebaseFirestore.getInstance()
    private val auth = FirebaseAuth.getInstance()
    private var snapshotListener: ListenerRegistration? = null

    fun startListening() {
        val user = auth.currentUser ?: return
        
        // Evitar múltiples listeners
        snapshotListener?.remove()

        snapshotListener = db.collection("bookings")
            .whereEqualTo("userId", user.uid)
            .addSnapshotListener { snapshot, e ->
                if (e != null) {
                    _error.value = e.message
                    return@addSnapshotListener
                }

                if (snapshot != null && !snapshot.isEmpty) {
                    // ordenado por fecha de creacion
                    val latest = snapshot.toObjects(FirebaseBooking::class.java)
                        .sortedByDescending { it.createdAt }
                        .firstOrNull { it.status != "CANCELLED" } // ignorar cancelados

                    _latestBooking.value = latest
                } else {
                    _latestBooking.value = null
                }
            }
    }

    fun saveRating(bookingId: String, washerId: String, score: Int, comment: String, onResult: (Boolean) -> Unit) {
        val uid = FirebaseAuth.getInstance().currentUser?.uid ?: return

        val review = mapOf(
            "userId" to uid,
            "washerId" to washerId,
            "score" to score,
            "comment" to comment,
            "createdAt" to com.google.firebase.Timestamp.now()
        )

        val batch = db.batch()

        // Guardar reseña
        val reviewRef = db.collection("reviews").document()
        batch.set(reviewRef, review)

        // Marcar booking como reseñado
        val bookingRef = db.collection("bookings").document(bookingId)
        batch.update(bookingRef, "hasReview", true)

        // Actualizar rating del lavador
        val washerRef = db.collection("washers").document(washerId)
        batch.update(washerRef, "totalReviews", com.google.firebase.firestore.FieldValue.increment(1))
        batch.update(washerRef, "totalScore", com.google.firebase.firestore.FieldValue.increment(score.toLong()))

        batch.commit()
            .addOnSuccessListener { onResult(true) }
            .addOnFailureListener { onResult(false) }
    }

    override fun onCleared() {
        super.onCleared()
        snapshotListener?.remove()
    }
}
