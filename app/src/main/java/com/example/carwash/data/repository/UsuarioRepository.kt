package com.example.carwash.data.repository

import com.example.carwash.data.model.Usuario
import com.example.carwash.data.model.Vehiculo
import com.google.firebase.firestore.FirebaseFirestore

class UsuarioRepository {

    private val db = FirebaseFirestore.getInstance()

    // Crear o actualizar perfil de usuario
    // Llamá esto justo después del registro con Firebase Auth
    fun guardarUsuario(uid: String, usuario: Usuario, onResult: (Boolean) -> Unit) {
        db.collection("usuarios").document(uid)
            .set(usuario)
            .addOnSuccessListener { onResult(true) }
            .addOnFailureListener { onResult(false) }
    }

    // Obtener datos del usuario logueado
    fun getUsuario(uid: String, onResult: (Usuario?) -> Unit) {
        db.collection("usuarios").document(uid)
            .get()
            .addOnSuccessListener { doc ->
                onResult(doc.toObject(Usuario::class.java))
            }
            .addOnFailureListener { onResult(null) }
    }

    // Actualizar campo puntual (ej: nuevo teléfono)
    fun actualizarCampo(uid: String, campo: String, valor: Any, onResult: (Boolean) -> Unit) {
        db.collection("usuarios").document(uid)
            .update(campo, valor)
            .addOnSuccessListener { onResult(true) }
            .addOnFailureListener { onResult(false) }
    }

    // ── Vehículos (subcolección) ──────────────────────────

    fun agregarVehiculo(uid: String, vehiculo: Vehiculo, onResult: (Boolean, String) -> Unit) {
        val ref = db.collection("usuarios").document(uid)
            .collection("vehiculos").document()
        ref.set(vehiculo)
            .addOnSuccessListener { onResult(true, ref.id) }
            .addOnFailureListener { onResult(false, "") }
    }

    fun getVehiculos(uid: String, onResult: (List<Vehiculo>) -> Unit) {
        db.collection("usuarios").document(uid)
            .collection("vehiculos")
            .get()
            .addOnSuccessListener { snap ->
                val lista = snap.toObjects(Vehiculo::class.java)
                onResult(lista)
            }
            .addOnFailureListener { onResult(emptyList()) }
    }

    fun eliminarVehiculo(uid: String, idVehiculo: String, onResult: (Boolean) -> Unit) {
        db.collection("usuarios").document(uid)
            .collection("vehiculos").document(idVehiculo)
            .delete()
            .addOnSuccessListener { onResult(true) }
            .addOnFailureListener { onResult(false) }
    }
}
