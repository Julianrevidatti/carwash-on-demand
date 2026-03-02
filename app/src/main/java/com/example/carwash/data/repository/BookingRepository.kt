package com.example.carwash.data.repository

import com.example.carwash.data.model.Booking
import com.example.carwash.data.model.BookingStatus

object BookingRepository {

    private val bookings = mutableListOf(
        Booking(
            id = 1,
            address = "Av. Libertador 123",
            date = "Mar 10",
            time = "10:00",
            service = "Exterior Wash",
            status = BookingStatus.PENDING
        ),
        Booking(
            id = 2,
            address = "San Martin 456",
            date = "Mar 12",
            time = "15:30",
            service = "Full Detail",
            status = BookingStatus.PENDING
        )
    )

    fun getBookings(): List<Booking> {
        return bookings
    }

    fun cancelBooking(id: Int) {
        bookings.find { it.id == id }?.status = BookingStatus.CANCELED
    }

    fun completeBooking(id: Int) {
        bookings.find { it.id == id }?.status = BookingStatus.COMPLETED
    }
}