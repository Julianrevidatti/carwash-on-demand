package com.example.carwash.data.repository

import com.example.carwash.data.model.Servicio
import com.google.firebase.firestore.FirebaseFirestore

class ServicioRepository {

    private val db = FirebaseFirestore.getInstance()

    // Obtener todos los servicios activos del catálogo
    fun getServicios(onResult: (List<Servicio>) -> Unit) {
        db.collection("servicios")
            .whereEqualTo("estado", "activo")
            .get()
            .addOnSuccessListener { snap ->
                onResult(snap.toObjects(Servicio::class.java))
            }
            .addOnFailureListener { onResult(emptyList()) }
    }

    // Obtener servicios filtrados por tipo de vehículo
    // Pasa "todos" para ver los que aplican a cualquier vehículo
    fun getServiciosPorTipo(tipoVehiculo: String, onResult: (List<Servicio>) -> Unit) {
        db.collection("servicios")
            .whereEqualTo("estado", "activo")
            .whereIn("tipo_vehiculo", listOf("todos", tipoVehiculo))
            .get()
            .addOnSuccessListener { snap ->
                onResult(snap.toObjects(Servicio::class.java))
            }
            .addOnFailureListener { onResult(emptyList()) }
    }

    // Obtener un servicio por ID
    fun getServicio(idServicio: String, onResult: (Servicio?) -> Unit) {
        db.collection("servicios").document(idServicio)
            .get()
            .addOnSuccessListener { doc ->
                onResult(doc.toObject(Servicio::class.java))
            }
            .addOnFailureListener { onResult(null) }
    }
}
