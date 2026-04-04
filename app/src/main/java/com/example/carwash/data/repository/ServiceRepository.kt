package com.example.carwash.data.repository

import com.example.carwash.data.model.Service
import com.google.firebase.firestore.FirebaseFirestore

class ServiceRepository {

    private val db = FirebaseFirestore.getInstance()

    fun getServices(onResult: (List<Service>) -> Unit) {
        db.collection("services")
            .whereEqualTo("status", "active")
            .get()
            .addOnSuccessListener { snap ->
                onResult(snap.toObjects(Service::class.java))
            }
            .addOnFailureListener { onResult(emptyList()) }
    }

    fun getServicesByVehicleType(vehicleType: String, onResult: (List<Service>) -> Unit) {
        db.collection("services")
            .whereEqualTo("status", "active")
            .whereIn("vehicleType", listOf("all", vehicleType))
            .get()
            .addOnSuccessListener { snap ->
                onResult(snap.toObjects(Service::class.java))
            }
            .addOnFailureListener { onResult(emptyList()) }
    }

    fun getService(serviceId: String, onResult: (Service?) -> Unit) {
        db.collection("services").document(serviceId)
            .get()
            .addOnSuccessListener { doc ->
                onResult(doc.toObject(Service::class.java))
            }
            .addOnFailureListener { onResult(null) }
    }
}
