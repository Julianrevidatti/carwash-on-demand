package com.example.carwash.ui.bookings

import android.os.Bundle
import android.view.View
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.carwash.R
import com.example.carwash.data.model.Booking
import com.example.carwash.data.model.BookingStatus
import com.example.carwash.data.repository.BookingRepository
import com.google.android.material.tabs.TabLayout

class BookingFragment : Fragment(R.layout.fragment_bookings) {
    private lateinit var recyclerView: RecyclerView
    private lateinit var adapter: BookingAdapter
    private var currentFilter = BookingStatus.PENDING

    private var allBookings: List<Booking> = emptyList()

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        recyclerView = view.findViewById(R.id.bookingsRecyclerView)
        recyclerView.layoutManager = LinearLayoutManager(requireContext())

        adapter = BookingAdapter { booking ->
            BookingRepository.cancelBooking(booking.id)
            updateList()
        }

        recyclerView.adapter = adapter

        val tabLayout = view.findViewById<TabLayout>(R.id.tabLayout)

        tabLayout.addOnTabSelectedListener(object : TabLayout.OnTabSelectedListener {
            override fun onTabSelected(tab: TabLayout.Tab?) {
                when(tab?.position){
                    0 -> filterBookings(BookingStatus.PENDING)
                    1 -> filterBookings(BookingStatus.COMPLETED)
                    2 -> filterBookings(BookingStatus.CANCELED)
                }
            }
            override fun onTabUnselected(tab: TabLayout.Tab?) {}
            override fun onTabReselected(tab: TabLayout.Tab?) {}
        })

        updateList()
    }

    fun filterBookings(status: BookingStatus){

        currentFilter = status

        val filtered = allBookings.filter {
            it.status == status
        }

        adapter.updateList(filtered)
    }

    private fun updateList() {

        allBookings = BookingRepository.getBookings()

        val filtered = allBookings.filter {
            it.status == currentFilter
        }

        adapter.updateList(filtered)
    }
}