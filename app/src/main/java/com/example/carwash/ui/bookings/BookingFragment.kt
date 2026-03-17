package com.example.carwash.ui.bookings

import android.os.Bundle
import android.view.View
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.carwash.R
import com.example.carwash.data.model.BookingStatus
import com.example.carwash.data.repository.BookingRepository

class BookingFragment : Fragment(R.layout.fragment_bookings) {
    private lateinit var recyclerView: RecyclerView
    private lateinit var adapter: BookingAdapter

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        recyclerView = view.findViewById(R.id.bookingsRecyclerView)
        recyclerView.layoutManager = LinearLayoutManager(requireContext())

        adapter = BookingAdapter { booking ->
            BookingRepository.cancelBooking(booking.id)
            updateList()
        }

        recyclerView.adapter = adapter
        updateList()
    }

    private fun updateList() {
        val emptyState = view?.findViewById<View>(R.id.emptyStateBookings)
        val pending = BookingRepository.getBookings().filter { it.status == BookingStatus.PENDING }
        adapter.updateList(pending)

        if (pending.isEmpty()) {
            emptyState?.visibility = View.VISIBLE
            recyclerView.visibility = View.GONE
        } else {
            emptyState?.visibility = View.GONE
            recyclerView.visibility = View.VISIBLE
        }
    }

}
