package com.example.carwash.data.repository

import com.example.carwash.data.model.User
import com.example.carwash.data.model.Vehicle
import com.google.firebase.firestore.FirebaseFirestore

class UserRepository {

    private val db = FirebaseFirestore.getInstance()

    fun saveUser(uid: String, user: User, onResult: (Boolean) -> Unit) {
        db.collection("users").document(uid)
            .set(user)
            .addOnSuccessListener { onResult(true) }
            .addOnFailureListener { onResult(false) }
    }

    fun getUser(uid: String, onResult: (User?) -> Unit) {
        db.collection("users").document(uid)
            .get()
            .addOnSuccessListener { doc ->
                onResult(doc.toObject(User::class.java))
            }
            .addOnFailureListener { onResult(null) }
    }

    fun updateField(uid: String, field: String, value: Any, onResult: (Boolean) -> Unit) {
        db.collection("users").document(uid)
            .update(field, value)
            .addOnSuccessListener { onResult(true) }
            .addOnFailureListener { onResult(false) }
    }

    // ── Vehicles (subcollection) ──────────────────────────

    fun addVehicle(uid: String, vehicle: Vehicle, onResult: (Boolean, String) -> Unit) {
        val ref = db.collection("users").document(uid)
            .collection("vehicles").document()
        ref.set(vehicle)
            .addOnSuccessListener { onResult(true, ref.id) }
            .addOnFailureListener { onResult(false, "") }
    }

    fun getVehicles(uid: String, onResult: (List<Vehicle>) -> Unit) {
        db.collection("users").document(uid)
            .collection("vehicles")
            .get()
            .addOnSuccessListener { snap ->
                onResult(snap.toObjects(Vehicle::class.java))
            }
            .addOnFailureListener { onResult(emptyList()) }
    }

    fun deleteVehicle(uid: String, vehicleId: String, onResult: (Boolean) -> Unit) {
        db.collection("users").document(uid)
            .collection("vehicles").document(vehicleId)
            .delete()
            .addOnSuccessListener { onResult(true) }
            .addOnFailureListener { onResult(false) }
    }
}
