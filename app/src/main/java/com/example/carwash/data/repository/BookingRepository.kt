package com.example.carwash.data.repository

import com.example.carwash.data.model.Booking
import com.example.carwash.data.model.BookingStatus
import com.example.carwash.utils.Timer.WashDuration

object BookingRepository {

    private val bookings = mutableListOf<Booking>()

    fun getBookings(): List<Booking> {
        updateCompletedBookings()
        return bookings
    }

    fun addBooking(service: String) {
        val newId = if (bookings.isEmpty()) 1 else bookings.maxOf { it.id } + 1

        val durationMinutes = WashDuration.getDurationMinutes(service)
        val startTimestamp = System.currentTimeMillis()
        val endTimestamp = startTimestamp + durationMinutes * 60 * 1000L

        bookings.add(
            Booking(
                id = newId,
                address = "Ubicación actual",
                date = "Hoy",
                time = "Ahora",
                service = service,
                status = BookingStatus.PENDING,
                durationMinutes = durationMinutes,
                startTimestamp = startTimestamp,
                endTimestamp = endTimestamp
            )
        )
    }

    fun cancelBooking(id: Int) {
        bookings.removeAll { it.id == id }
    }

    fun completeBooking(id: Int) {
        bookings.find { it.id == id }?.status = BookingStatus.COMPLETED
    }

    private fun updateCompletedBookings() {
        val currentTime = System.currentTimeMillis()

        bookings.forEach { booking ->
            if (
                booking.status == BookingStatus.PENDING &&
                booking.endTimestamp > 0 &&
                currentTime >= booking.endTimestamp
            ) {
                booking.status = BookingStatus.COMPLETED
            }
        }
    }
}