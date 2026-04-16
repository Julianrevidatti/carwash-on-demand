package com.example.carwash.ui.bookings

import android.os.Bundle
import android.view.View
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.carwash.R

class BookingFragment : Fragment(R.layout.fragment_bookings) {
    
    private val viewModel: BookingViewModel by viewModels()
    private lateinit var adapter: BookingAdapter

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val recyclerView = view.findViewById<RecyclerView>(R.id.bookingsRecyclerView)
        val emptyState = view.findViewById<View>(R.id.emptyStateBookings)

        recyclerView.layoutManager = LinearLayoutManager(requireContext())
        adapter = BookingAdapter(
            onCancelClick = { booking -> viewModel.cancelBooking(booking.id) },
            onReviewSubmit = { bookingId, washerId, score, comment ->
                viewModel.submitReview(bookingId, washerId, score, comment)
            }
        )
        recyclerView.adapter = adapter

        // Observamos los cambios en la lista de reservas
        viewModel.bookings.observe(viewLifecycleOwner) { lista ->
            adapter.updateList(lista)
            if (lista.isEmpty()) {
                emptyState.visibility = View.VISIBLE
                recyclerView.visibility = View.GONE
            } else {
                emptyState.visibility = View.GONE
                recyclerView.visibility = View.VISIBLE
            }
        }

        // Cargamos los datos
        viewModel.fetchBookings()
    }
}
