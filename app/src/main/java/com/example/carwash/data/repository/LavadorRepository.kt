package com.example.carwash.data.repository

import com.example.carwash.data.model.Lavador
import com.example.carwash.data.model.Resena
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.FieldValue

class LavadorRepository {

    private val db = FirebaseFirestore.getInstance()

    // Obtener todos los lavadores disponibles en una zona
    fun getLavadoresDisponibles(zona: String, onResult: (List<Lavador>) -> Unit) {
        db.collection("lavadores")
            .whereEqualTo("zona_cobertura", zona)
            .whereEqualTo("estado_disponibilidad", "DISPONIBLE")
            .get()
            .addOnSuccessListener { snap ->
                onResult(snap.toObjects(Lavador::class.java))
            }
            .addOnFailureListener { onResult(emptyList()) }
    }

    // Obtener un lavador por ID
    fun getLavador(idLavador: String, onResult: (Lavador?) -> Unit) {
        db.collection("lavadores").document(idLavador)
            .get()
            .addOnSuccessListener { doc ->
                onResult(doc.toObject(Lavador::class.java))
            }
            .addOnFailureListener { onResult(null) }
    }

    // Cambiar disponibilidad del lavador
    fun actualizarDisponibilidad(
        idLavador: String,
        estado: String,   // "DISPONIBLE" | "OCUPADO" | "INACTIVO"
        onResult: (Boolean) -> Unit
    ) {
        db.collection("lavadores").document(idLavador)
            .update("estado_disponibilidad", estado)
            .addOnSuccessListener { onResult(true) }
            .addOnFailureListener { onResult(false) }
    }

    // Agregar reseña y actualizar reputación en una sola transacción atómica
    fun agregarResena(
        idSolicitud: String,
        idLavador: String,
        idUsuario: String,
        puntaje: Int,
        comentario: String,
        onResult: (Boolean) -> Unit
    ) {
        val resenaRef = db.collection("solicitudes")
            .document(idSolicitud)
            .collection("resenas")
            .document()

        val lavadorRef = db.collection("lavadores").document(idLavador)

        db.runTransaction { transaction ->
            val lavadorSnap = transaction.get(lavadorRef)

            val totalActual = lavadorSnap.getLong("total_resenas") ?: 0L
            val sumaActual  = lavadorSnap.getDouble("suma_puntajes") ?: 0.0

            val nuevoTotal    = totalActual + 1
            val nuevaSuma     = sumaActual + puntaje
            val nuevoPromedio = nuevaSuma / nuevoTotal

            // Escribir reseña
            transaction.set(resenaRef, mapOf(
                "id_usuario"  to idUsuario,
                "id_lavador"  to idLavador,
                "puntaje"     to puntaje,
                "comentario"  to comentario,
                "creado_en"   to com.google.firebase.Timestamp.now()
            ))

            // Actualizar reputación del lavador
            transaction.update(lavadorRef, mapOf(
                "total_resenas"       to nuevoTotal,
                "suma_puntajes"       to nuevaSuma,
                "reputacion_promedio" to nuevoPromedio
            ))
        }
        .addOnSuccessListener { onResult(true) }
        .addOnFailureListener { onResult(false) }
    }

    // Obtener reseñas de un lavador (desde sus solicitudes)
    fun getResenasDeSolicitud(idSolicitud: String, onResult: (List<Resena>) -> Unit) {
        db.collection("solicitudes").document(idSolicitud)
            .collection("resenas")
            .get()
            .addOnSuccessListener { snap ->
                onResult(snap.toObjects(Resena::class.java))
            }
            .addOnFailureListener { onResult(emptyList()) }
    }
}
