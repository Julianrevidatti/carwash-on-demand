package com.example.carwash.ui.notifications

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.fragment.app.Fragment
import com.example.carwash.R
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query

class NotificationsFragment : Fragment() {

    private lateinit var auth: FirebaseAuth
    private lateinit var db: FirebaseFirestore

    private lateinit var tvWashStatus: TextView
    private lateinit var tvWashDetails: TextView

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val root = inflater.inflate(R.layout.fragment_notifications, container, false)

        auth = FirebaseAuth.getInstance()
        db = FirebaseFirestore.getInstance()

        tvWashStatus = root.findViewById(R.id.tvWashStatus)
        tvWashDetails = root.findViewById(R.id.tvWashDetails)

        loadWashStatus()

        return root
    }

    private fun saveRating(bookingId: String, rating: Float) {
        db.collection("bookings")
            .document(bookingId)
            .update("rating", rating)
            .addOnSuccessListener {
                tvWashDetails.text = "Gracias por calificar ⭐ $rating"
            }
            .addOnFailureListener {
                tvWashDetails.text = "Error al guardar calificación"
            }
    }

    private fun showRatingDialog(bookingId: String) {
        val dialogView = layoutInflater.inflate(R.layout.dialog_rating, null)

        val ratingBar = dialogView.findViewById<android.widget.RatingBar>(R.id.ratingBar)

        androidx.appcompat.app.AlertDialog.Builder(requireContext())
            .setTitle("Calificar servicio")
            .setView(dialogView)
            .setPositiveButton("Enviar") { _, _ ->
                val rating = ratingBar.rating

                saveRating(bookingId, rating)
            }
            .setNegativeButton("Cancelar", null)
            .show()
    }

    private fun loadWashStatus() {
        val user = auth.currentUser
        if (user != null) {
            // BUGFIX: Obtenemos TODOS los lavados del usuario y ordenamos locamente
            // Esto evita usar orderBy con whereEqualTo que demanda un Composite Index de Firestore.
            db.collection("bookings")
                .whereEqualTo("userId", user.uid)
                .addSnapshotListener { snapshot, e ->
                    if (e != null) {
                        tvWashStatus.text = "Error obteniendo estado: ${e.message}"
                        return@addSnapshotListener
                    }

                    if (snapshot != null && !snapshot.isEmpty) {
                        // Ordenamiento local simple en memoria
                        val document = snapshot.documents.sortedByDescending { it.getString("date") ?: "" }.firstOrNull()

                        if (document != null) {
                            val status = document.getString("status") ?: "Pendiente"
                            val service = document.getString("serviceType") ?: "Servicio"
                            val date = document.getString("date") ?: ""

                            tvWashStatus.text = "Estado: $status"
                            tvWashDetails.text = "$service programado para $date"

                            // Personalizamos el color u mensaje de acuerdo al estado
                            if (status.uppercase() == "COMPLETADO") {
                                tvWashStatus.setTextColor(resources.getColor(android.R.color.holo_green_dark, null))
                                tvWashStatus.setOnClickListener {
                                    showRatingDialog(document.id)
                                }
                            } else {
                                tvWashStatus.setTextColor(resources.getColor(android.R.color.holo_orange_dark, null))
                            }
                        }
                    } else {
                        tvWashStatus.text = "No tienes lavados en curso."
                        tvWashDetails.text = "Puedes agendar un lavado desde Inicio."
                    }
                }
        }
    }
}
