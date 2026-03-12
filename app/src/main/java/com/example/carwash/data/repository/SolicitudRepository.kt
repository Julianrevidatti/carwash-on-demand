package com.example.carwash.data.repository

import com.example.carwash.data.model.Pago
import com.example.carwash.data.model.Solicitud
import com.example.carwash.data.model.Turno
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query

class SolicitudRepository {

    private val db = FirebaseFirestore.getInstance()

    // Crear solicitud + turno en una batch (los dos o ninguno)
    fun crearSolicitud(
        solicitud: Solicitud,
        turno: Turno,
        onResult: (Boolean, String) -> Unit
    ) {
        val solicitudRef = db.collection("solicitudes").document()
        val turnoRef     = db.collection("turnos").document()

        val batch = db.batch()
        batch.set(solicitudRef, solicitud)
        batch.set(turnoRef, turno.copy(id_solicitud = solicitudRef.id))

        batch.commit()
            .addOnSuccessListener { onResult(true, solicitudRef.id) }
            .addOnFailureListener { onResult(false, "") }
    }

    // Historial de solicitudes del usuario (más recientes primero)
    fun getSolicitudesDeUsuario(
        idUsuario: String,
        onResult: (List<Solicitud>) -> Unit
    ) {
        db.collection("solicitudes")
            .whereEqualTo("id_usuario", idUsuario)
            .orderBy("creado_en", Query.Direction.DESCENDING)
            .get()
            .addOnSuccessListener { snap ->
                onResult(snap.toObjects(Solicitud::class.java))
            }
            .addOnFailureListener { onResult(emptyList()) }
    }

    // Cola de trabajos del lavador (activos primero)
    fun getSolicitudesDeLavador(
        idLavador: String,
        onResult: (List<Solicitud>) -> Unit
    ) {
        db.collection("solicitudes")
            .whereEqualTo("id_lavador", idLavador)
            .whereIn("estado", listOf("PENDIENTE", "PROGRAMADO", "EN_CURSO"))
            .orderBy("fecha_programada", Query.Direction.ASCENDING)
            .get()
            .addOnSuccessListener { snap ->
                onResult(snap.toObjects(Solicitud::class.java))
            }
            .addOnFailureListener { onResult(emptyList()) }
    }

    // Obtener una solicitud por ID
    fun getSolicitud(idSolicitud: String, onResult: (Solicitud?) -> Unit) {
        db.collection("solicitudes").document(idSolicitud)
            .get()
            .addOnSuccessListener { doc ->
                onResult(doc.toObject(Solicitud::class.java))
            }
            .addOnFailureListener { onResult(null) }
    }

    // Cambiar estado de la solicitud
    // Usá los estados: PENDIENTE → PROGRAMADO → EN_CURSO → FINALIZADO | CANCELADO
    fun actualizarEstado(
        idSolicitud: String,
        nuevoEstado: String,
        onResult: (Boolean) -> Unit
    ) {
        db.collection("solicitudes").document(idSolicitud)
            .update("estado", nuevoEstado)
            .addOnSuccessListener { onResult(true) }
            .addOnFailureListener { onResult(false) }
    }

    // Escuchar cambios en tiempo real (para el lavador que ve su cola en vivo)
    fun escucharSolicitud(
        idSolicitud: String,
        onChange: (Solicitud?) -> Unit
    ) {
        db.collection("solicitudes").document(idSolicitud)
            .addSnapshotListener { snap, _ ->
                onChange(snap?.toObject(Solicitud::class.java))
            }
    }

    // ── Pagos (subcolección) ──────────────────────────────

    fun registrarPago(
        idSolicitud: String,
        pago: Pago,
        onResult: (Boolean) -> Unit
    ) {
        db.collection("solicitudes").document(idSolicitud)
            .collection("pagos").document()
            .set(pago)
            .addOnSuccessListener { onResult(true) }
            .addOnFailureListener { onResult(false) }
    }

    fun getPago(idSolicitud: String, onResult: (Pago?) -> Unit) {
        db.collection("solicitudes").document(idSolicitud)
            .collection("pagos")
            .limit(1)
            .get()
            .addOnSuccessListener { snap ->
                onResult(snap.documents.firstOrNull()?.toObject(Pago::class.java))
            }
            .addOnFailureListener { onResult(null) }
    }

    fun actualizarEstadoPago(
        idSolicitud: String,
        idPago: String,
        nuevoEstado: String,   // "APROBADO" | "RECHAZADO"
        onResult: (Boolean) -> Unit
    ) {
        db.collection("solicitudes").document(idSolicitud)
            .collection("pagos").document(idPago)
            .update("estado_pago", nuevoEstado)
            .addOnSuccessListener { onResult(true) }
            .addOnFailureListener { onResult(false) }
    }
}
