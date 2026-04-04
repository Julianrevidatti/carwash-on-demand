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
                    // Ordenamos por fecha de creación (o scheduledDate si no existe createdAt)
                    val latest = snapshot.toObjects(FirebaseBooking::class.java)
                        .sortedByDescending { it.createdAt }
                        .firstOrNull()
                    
                    _latestBooking.value = latest
                } else {
                    _latestBooking.value = null
                }
            }
    }

    fun saveRating(bookingId: String, rating: Float, onResult: (Boolean) -> Unit) {
        db.collection("bookings")
            .document(bookingId)
            .update("rating", rating)
            .addOnSuccessListener { onResult(true) }
            .addOnFailureListener { onResult(false) }
    }

    override fun onCleared() {
        super.onCleared()
        snapshotListener?.remove()
    }
}
