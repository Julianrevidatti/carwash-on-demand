package com.example.carwash.ui.bookings

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.example.carwash.data.model.Booking
import com.example.carwash.data.model.BookingStatus
import com.example.carwash.data.repository.BookingRepository
import com.google.firebase.auth.FirebaseAuth
import java.text.SimpleDateFormat
import java.util.*

class BookingViewModel : ViewModel() {

    private val _bookings = MutableLiveData<List<Booking>>()
    val bookings: LiveData<List<Booking>> = _bookings

    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading

    private val auth = FirebaseAuth.getInstance()

    fun fetchBookings() {
        val uid = auth.currentUser?.uid ?: return
        _isLoading.value = true
        val currentTime = System.currentTimeMillis()

        BookingRepository.getUserBookings(uid) { firebaseBookings ->
            val bookingList = firebaseBookings.filter { fb ->
                val isCancelled = fb.status == "CANCELLED"
                val scheduledTime = fb.scheduledDate.toDate().time
                val isOldCancelled = isCancelled && (currentTime - scheduledTime > 24 * 60 * 60 * 1000)
                !isOldCancelled
            }.map { fb ->
                val vehicleLabel = "${fb.vehicleSnapshot.brand} ${fb.vehicleSnapshot.model} (${fb.vehicleSnapshot.licensePlate})"
                
                val startTime = fb.scheduledDate.toDate().time
                val estimatedDurationMs = fb.estimatedDurationMinutes * 60 * 1000L
                val endTime = startTime + estimatedDurationMs

                val dynamicStatus = when {
                    fb.status == "CANCELLED" -> BookingStatus.CANCELED
                    fb.status == "COMPLETED" -> BookingStatus.COMPLETED
                    currentTime < startTime -> BookingStatus.PENDING
                    currentTime >= startTime && currentTime < endTime -> BookingStatus.IN_PROGRESS
                    else -> BookingStatus.COMPLETED
                }

                Booking(
                    id = fb.id,
                    address = fb.meetingAddress,
                    date = SimpleDateFormat("dd/MM/yyyy", Locale.getDefault()).format(fb.scheduledDate.toDate()),
                    time = fb.timeSlot,
                    service = fb.serviceSnapshot.name,
                    status = dynamicStatus,
                    vehicle = vehicleLabel,
                    washerName = if (fb.washerSnapshot.name.isNotEmpty()) "${fb.washerSnapshot.name} ${fb.washerSnapshot.lastName}" else null,
                    washerRating = if (fb.washerSnapshot.name.isNotEmpty()) fb.washerSnapshot.rating else null
                )
            }.sortedWith(compareByDescending<Booking> { it.status == BookingStatus.PENDING || it.status == BookingStatus.IN_PROGRESS }.thenBy { it.date })

            _bookings.value = bookingList
            _isLoading.value = false
        }
    }

    fun cancelBooking(bookingId: String) {
        BookingRepository.updateStatus(bookingId, "CANCELLED") { success ->
            if (success) {
                fetchBookings()
            }
        }
    }
}
