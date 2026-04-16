package com.example.carwash.ui.notifications

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import com.example.carwash.R
import com.example.carwash.data.model.FirebaseBooking
import java.text.SimpleDateFormat
import com.google.android.material.bottomsheet.BottomSheetDialog
import java.util.*

class NotificationsFragment : Fragment() {

    private val viewModel: NotificationsViewModel by viewModels()
    private var ratingDialogShown = false
    
    private lateinit var tvWashStatus: TextView
    private lateinit var tvWashDetails: TextView

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val root = inflater.inflate(R.layout.fragment_notifications, container, false)

        tvWashStatus = root.findViewById(R.id.tvWashStatus)
        tvWashDetails = root.findViewById(R.id.tvWashDetails)

        setupObservers()
        viewModel.startListening()

        return root
    }

    private fun setupObservers() {
        viewModel.latestBooking.observe(viewLifecycleOwner) { booking ->
            if (booking != null) {
                updateUI(booking)
            } else {
                showEmptyState()
            }
        }

        viewModel.error.observe(viewLifecycleOwner) { errorMessage ->
            errorMessage?.let {
                Toast.makeText(requireContext(), "Error: $it", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun updateUI(booking: FirebaseBooking) {
        val currentTime = System.currentTimeMillis()
        val startTime = booking.scheduledDate.toDate().time
        val endTime = startTime + (booking.estimatedDurationMinutes * 60 * 1000L)

        val realStatus = when {
            booking.status == "CANCELLED" -> "CANCELLED"
            booking.status == "COMPLETED" -> "COMPLETED"
            currentTime < startTime -> "PENDING"
            currentTime in startTime until endTime -> "IN_PROGRESS"
            else -> "COMPLETED"
        }

        tvWashStatus.text = when (realStatus) {
            "PENDING" -> "⏳ Programado"
            "IN_PROGRESS" -> "🚿 En progreso"
            "COMPLETED" -> "✅ Finalizado"
            else -> realStatus
        }

        tvWashDetails.text = "${booking.serviceSnapshot.name} programado para " +
                SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault())
                    .format(booking.scheduledDate.toDate())

        // Mostrar dialog de reseña solo si completado y sin reseña previa
        if (realStatus == "COMPLETED" && !booking.hasReview && !ratingDialogShown) {
            ratingDialogShown = true
            showRatingDialog(booking.id, booking.washerId)
        }
    }

    private fun showEmptyState() {
        tvWashStatus.text = "No tienes lavados en curso."
        tvWashDetails.text = "Podés agendar un lavado desde Inicio."
        tvWashStatus.setTextColor(requireContext().getColor(android.R.color.black))
    }

    private fun showRatingDialog(bookingId: String, washerId: String) {
        val dialog = BottomSheetDialog(requireContext())
        val dialogView = layoutInflater.inflate(R.layout.dialog_rating, null)

        val ratingBar = dialogView.findViewById<android.widget.RatingBar>(R.id.ratingBar)
        val etComment = dialogView.findViewById<android.widget.EditText>(R.id.etComment)
        val btnSubmit = dialogView.findViewById<com.google.android.material.button.MaterialButton>(R.id.btnSubmitRating)

        btnSubmit.setOnClickListener {
            val stars = ratingBar.rating.toInt()
            if (stars == 0) {
                Toast.makeText(requireContext(), "Seleccioná una calificación", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            btnSubmit.isEnabled = false
            btnSubmit.text = "Enviando..."

            viewModel.saveRating(bookingId, washerId, stars, etComment.text.toString().trim()) { success ->
                if (success) {
                    tvWashDetails.text = "¡Gracias por tu reseña de $stars estrellas! ⭐"
                } else {
                    Toast.makeText(requireContext(), "Error al guardar la reseña", Toast.LENGTH_SHORT).show()
                }
                dialog.dismiss()
            }
        }

        dialog.setContentView(dialogView)
        dialog.show()
    }
}
