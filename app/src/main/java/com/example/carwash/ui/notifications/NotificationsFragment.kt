package com.example.carwash.ui.notifications

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import androidx.fragment.app.Fragment
import com.example.carwash.R
import com.example.carwash.data.repository.WasherRepository
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration

class NotificationsFragment : Fragment() {

    private lateinit var tvWashStatus: TextView
    private lateinit var tvWashDetails: TextView
    private lateinit var btnReview: Button

    private var snapshotListener: ListenerRegistration? = null
    private val db = FirebaseFirestore.getInstance()
    private val auth = FirebaseAuth.getInstance()

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val root = inflater.inflate(R.layout.fragment_notifications, container, false)

        tvWashStatus = root.findViewById(R.id.tvWashStatus)
        tvWashDetails = root.findViewById(R.id.tvWashDetails)
        btnReview = root.findViewById(R.id.btnLeaveReview)

        btnReview.visibility = View.GONE
        loadWashStatus()

        return root
    }

    override fun onDestroyView() {
        super.onDestroyView()
        snapshotListener?.remove()
        snapshotListener = null
    }

    private fun loadWashStatus() {
        val user = auth.currentUser ?: return

        snapshotListener = db.collection("bookings")
            .whereEqualTo("userId", user.uid)
            .addSnapshotListener { snapshot, e ->
                if (!isAdded) return@addSnapshotListener

                if (e != null) {
                    tvWashStatus.text = "Error obteniendo estado: ${e.message}"
                    return@addSnapshotListener
                }

                if (snapshot != null && !snapshot.isEmpty) {
                    // Tomamos el booking más reciente
                    val document = snapshot.documents
                        .sortedByDescending { it.getTimestamp("createdAt") }
                        .firstOrNull()

                    if (document != null) {
                        val status = document.getString("status") ?: "PENDING"
                        val washerSnap = document.get("washerSnapshot") as? Map<*, *>
                        val washerName = "${washerSnap?.get("name") ?: ""} ${washerSnap?.get("lastName") ?: ""}".trim()
                        val serviceSnap = document.get("serviceSnapshot") as? Map<*, *>
                        val serviceName = serviceSnap?.get("name") as? String ?: "Servicio"
                        val washerId = document.getString("washerId") ?: ""
                        val bookingId = document.id

                        when (status) {
                            "PENDING" -> {
                                tvWashStatus.text = "Estado: Pendiente"
                                tvWashStatus.setTextColor(requireContext().getColor(android.R.color.holo_orange_dark))
                                tvWashDetails.text = "Tu reserva de $serviceName está siendo procesada."
                                btnReview.visibility = View.GONE
                            }
                            "IN_PROGRESS" -> {
                                tvWashStatus.text = "Estado: En progreso"
                                tvWashStatus.setTextColor(requireContext().getColor(android.R.color.holo_blue_dark))
                                tvWashDetails.text = "$washerName está lavando tu auto."
                                btnReview.visibility = View.GONE
                            }
                            "COMPLETED" -> {
                                tvWashStatus.text = "Estado: Completado ✓"
                                tvWashStatus.setTextColor(requireContext().getColor(android.R.color.holo_green_dark))
                                tvWashDetails.text = "¡Tu auto quedó impecable! Lavado por $washerName."

                                // Mostrar botón solo si hay washerId y no dejó reseña aún
                                if (washerId.isNotEmpty()) {
                                    btnReview.visibility = View.VISIBLE
                                    btnReview.setOnClickListener {
                                        showRatingDialog(bookingId, washerId)
                                    }
                                }
                            }
                            "CANCELLED" -> {
                                tvWashStatus.text = "Estado: Cancelado"
                                tvWashStatus.setTextColor(requireContext().getColor(android.R.color.holo_red_dark))
                                tvWashDetails.text = "La reserva fue cancelada."
                                btnReview.visibility = View.GONE
                            }
                        }
                    }
                } else {
                    tvWashStatus.text = "No tenés lavados registrados."
                    tvWashDetails.text = "Podés agendar un lavado desde Inicio."
                    btnReview.visibility = View.GONE
                }
            }
    }

    private fun showRatingDialog(bookingId: String, washerId: String) {
        if (!isAdded) return

        val dialogView = layoutInflater.inflate(R.layout.dialog_rating, null)
        val ratingBar = dialogView.findViewById<android.widget.RatingBar>(R.id.ratingBar)

        androidx.appcompat.app.AlertDialog.Builder(requireContext())
            .setTitle("Calificar a tu lavador")
            .setMessage("¿Cómo fue el servicio?")
            .setView(dialogView)
            .setPositiveButton("Enviar") { _, _ ->
                val score = ratingBar.rating.toInt()
                if (score == 0) {
                    tvWashDetails.text = "Seleccioná al menos 1 estrella."
                    return@setPositiveButton
                }
                saveReview(bookingId, washerId, score)
            }
            .setNegativeButton("Cancelar", null)
            .show()
    }

    private fun saveReview(bookingId: String, washerId: String, score: Int) {
        val userId = auth.currentUser?.uid ?: return

        WasherRepository().addReview(
            bookingId = bookingId,
            washerId = washerId,
            userId = userId,
            score = score,
            comment = ""
        ) { success ->
            if (!isAdded) return@addReview
            if (success) {
                tvWashDetails.text = "¡Gracias por tu reseña! ${"⭐".repeat(score)}"
                btnReview.visibility = View.GONE
            } else {
                tvWashDetails.text = "Error al guardar la reseña. Intentá de nuevo."
            }
        }
    }
}