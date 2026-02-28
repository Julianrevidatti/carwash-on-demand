package com.example.carwash.data.repository

import com.example.carwash.data.model.UserProfile
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseAuthUserCollisionException
import com.google.firebase.firestore.FirebaseFirestore

class AuthRepository {

    private val auth: FirebaseAuth = FirebaseAuth.getInstance()
    private val db: FirebaseFirestore = FirebaseFirestore.getInstance()

    fun registerUser(
        profile: UserProfile,
        password: String,
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        auth.createUserWithEmailAndPassword(profile.email, password)
            .addOnSuccessListener { result ->
                val uid = result.user?.uid
                if (uid == null) {
                    onError("Error al generar el usuario")
                    return@addOnSuccessListener
                }

                db.collection("users")
                    .document(uid)
                    .set(profile)
                    .addOnSuccessListener { onSuccess() }
                    .addOnFailureListener {
                        onError("Error al guardar el perfil")
                    }
            }
            .addOnFailureListener { e ->
                val message = if (e is FirebaseAuthUserCollisionException) {
                    "El correo ya está registrado"
                } else {
                    "Error de registro: ${e.message}"
                }
                onError(message)
            }
    }
}