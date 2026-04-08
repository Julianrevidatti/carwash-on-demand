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
import java.util.*

class NotificationsFragment : Fragment() {

    private val viewModel: NotificationsViewModel by viewModels()
    
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
        val status = booking.status
        val service = booking.serviceSnapshot.name
        val date = SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault())
            .format(booking.scheduledDate.toDate())

        tvWashStatus.text = "Estado: $status"
        tvWashDetails.text = "$service programado para $date"

        if (status.uppercase() == "COMPLETED") {
            tvWashStatus.setTextColor(requireContext().getColor(android.R.color.holo_green_dark))
            tvWashStatus.setOnClickListener {
            }
        } else {
            tvWashStatus.setTextColor(requireContext().getColor(android.R.color.holo_orange_dark))
            tvWashStatus.setOnClickListener(null)
        }
    }

    private fun showEmptyState() {
        tvWashStatus.text = "No tienes lavados en curso."
        tvWashDetails.text = "Podés agendar un lavado desde Inicio."
        tvWashStatus.setTextColor(requireContext().getColor(android.R.color.black))
    }

    private fun showRatingDialog(bookingId: String) {
        val dialogView = layoutInflater.inflate(R.layout.dialog_rating, null)
        val ratingBar = dialogView.findViewById<android.widget.RatingBar>(R.id.ratingBar)

        androidx.appcompat.app.AlertDialog.Builder(requireContext())
            .setTitle("Calificar servicio")
            .setView(dialogView)
            .setPositiveButton("Enviar") { _, _ ->
                viewModel.saveRating(bookingId, ratingBar.rating) { success ->
                    if (success) {
                        tvWashDetails.text = "Gracias por calificar ⭐ ${ratingBar.rating}"
                    } else {
                        Toast.makeText(requireContext(), "Error al calificar", Toast.LENGTH_SHORT).show()
                    }
                }
            }
            .setNegativeButton("Cancelar", null)
            .show()
    }
}
