package com.example.carwash.data.repository

import com.example.carwash.data.model.Booking
import com.example.carwash.data.model.BookingStatus

object BookingRepository {

    private val bookings = mutableListOf<Booking>()

    fun getBookings(): List<Booking> {
        return bookings
    }

    fun addBooking(service: String) {
        val newId = if (bookings.isEmpty()) 1 else bookings.maxOf { it.id } + 1
        bookings.add(
            Booking(
                id = newId,
                address = "Ubicación actual",
                date = "Hoy",
                time = "Ahora",
                service = service,
                status = BookingStatus.PENDING
            )
        )
    }

    fun cancelBooking(id: Int) {
        // En lugar de cambiar el estado, lo removemos de la lista para limpiar la vista
        bookings.removeAll { it.id == id }
    }

    fun completeBooking(id: Int) {
        bookings.find { it.id == id }?.status = BookingStatus.COMPLETED
    }
}
