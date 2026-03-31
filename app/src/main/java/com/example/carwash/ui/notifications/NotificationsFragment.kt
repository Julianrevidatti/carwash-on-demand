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
import com.google.firebase.firestore.ListenerRegistration

class NotificationsFragment : Fragment() {

    private lateinit var auth: FirebaseAuth
    private lateinit var db: FirebaseFirestore

    private lateinit var tvWashStatus: TextView
    private lateinit var tvWashDetails: TextView

    // Guardamos el listener para poder cancelarlo
    private var snapshotListener: ListenerRegistration? = null

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

    override fun onDestroyView() {
        super.onDestroyView()
        // Cancelamos el listener cuando el fragment se destruye
        snapshotListener?.remove()
        snapshotListener = null
    }

    private fun loadWashStatus() {
        val user = auth.currentUser ?: return

        snapshotListener = db.collection("bookings")
            .whereEqualTo("userId", user.uid)
            .addSnapshotListener { snapshot, e ->
                // Si el fragment ya no está adjunto, no hacemos nada
                if (!isAdded) return@addSnapshotListener

                if (e != null) {
                    tvWashStatus.text = "Error obteniendo estado: ${e.message}"
                    return@addSnapshotListener
                }

                if (snapshot != null && !snapshot.isEmpty) {
                    val document = snapshot.documents
                        .sortedByDescending { it.getString("date") ?: "" }
                        .firstOrNull()

                    if (document != null) {
                        val status = document.getString("status") ?: "Pendiente"
                        val service = document.getString("serviceType") ?: "Servicio"
                        val date = document.getString("date") ?: ""

                        tvWashStatus.text = "Estado: $status"
                        tvWashDetails.text = "$service programado para $date"

                        if (status.uppercase() == "COMPLETADO") {
                            tvWashStatus.setTextColor(
                                requireContext().getColor(android.R.color.holo_green_dark)
                            )
                            tvWashStatus.setOnClickListener {
                                showRatingDialog(document.id)
                            }
                        } else {
                            tvWashStatus.setTextColor(
                                requireContext().getColor(android.R.color.holo_orange_dark)
                            )
                        }
                    }
                } else {
                    tvWashStatus.text = "No tienes lavados en curso."
                    tvWashDetails.text = "Podés agendar un lavado desde Inicio."
                }
            }
    }

    private fun showRatingDialog(bookingId: String) {
        if (!isAdded) return
        val dialogView = layoutInflater.inflate(R.layout.dialog_rating, null)
        val ratingBar = dialogView.findViewById<android.widget.RatingBar>(R.id.ratingBar)

        androidx.appcompat.app.AlertDialog.Builder(requireContext())
            .setTitle("Calificar servicio")
            .setView(dialogView)
            .setPositiveButton("Enviar") { _, _ ->
                saveRating(bookingId, ratingBar.rating)
            }
            .setNegativeButton("Cancelar", null)
            .show()
    }

    private fun saveRating(bookingId: String, rating: Float) {
        db.collection("bookings")
            .document(bookingId)
            .update("rating", rating)
            .addOnSuccessListener {
                if (isAdded) tvWashDetails.text = "Gracias por calificar ⭐ $rating"
            }
            .addOnFailureListener {
                if (isAdded) tvWashDetails.text = "Error al guardar calificación"
            }
    }
}