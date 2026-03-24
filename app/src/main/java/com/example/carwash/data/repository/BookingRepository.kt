package com.example.carwash.data.repository

import com.example.carwash.data.model.Booking
import com.example.carwash.data.model.BookingStatus
import com.example.carwash.utils.Timer.WashDuration
import java.util.*

object BookingRepository {

    private val bookings = mutableListOf<Booking>()

    fun getBookings(): List<Booking> {
        updateCompletedBookings()
        return bookings
    }

    fun addBooking(
        service: String,
        vehicle: String = "No especificado",
        paymentMethod: String = "Efectivo",
        date: String = "Hoy",
        time: String = "Ahora"
    ) {
        val newId = UUID.randomUUID().toString() // Generar un ID de String único
        val durationMinutes = WashDuration.getDurationMinutes(service)
        val startTimestamp = System.currentTimeMillis()
        val endTimestamp = startTimestamp + durationMinutes * 60 * 1000L

        bookings.add(
            Booking(
                id = newId,
                address = "Ubicación actual",
                date = date,
                time = time,
                service = service,
                status = BookingStatus.PENDING,
                vehicle = vehicle,
                paymentMethod = paymentMethod,
                durationMinutes = durationMinutes,
                startTimestamp = startTimestamp,
                endTimestamp = endTimestamp
            )
        )
    }

    fun cancelBooking(id: String) { // Cambiado a String
        bookings.removeAll { it.id == id }
    }

    fun completeBooking(id: String) { // Cambiado a String
        bookings.find { it.id == id }?.status = BookingStatus.COMPLETED
    }

    private fun updateCompletedBookings() {
        val currentTime = System.currentTimeMillis()
        bookings.forEach { booking ->
            if (booking.status == BookingStatus.PENDING &&
                booking.endTimestamp > 0 &&
                currentTime >= booking.endTimestamp) {
                booking.status = BookingStatus.COMPLETED
            }
        }
    }
}
