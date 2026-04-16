package com.example.carwash.ui.bookings

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.example.carwash.data.model.Booking
import com.example.carwash.data.model.BookingStatus
import com.example.carwash.data.model.Review
import com.example.carwash.data.repository.BookingRepository
import com.google.firebase.Timestamp
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
                val scheduledTime = fb.scheduledDate.toDate().time
                val endTime = scheduledTime + (fb.estimatedDurationMinutes * 60 * 1000L)
                val twoDaysMs = 2 * 24 * 60 * 60 * 1000L

                val isCancelled = fb.status == "CANCELLED"
                val isOldCancelled = isCancelled && (currentTime - scheduledTime > 24 * 60 * 60 * 1000)
                val isOldCompleted = (currentTime - endTime) > twoDaysMs

                !isOldCancelled && !isOldCompleted
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
                    washerId = fb.washerId,
                    address = fb.meetingAddress,
                    date = SimpleDateFormat("dd/MM/yyyy", Locale.getDefault()).format(fb.scheduledDate.toDate()),
                    time = fb.timeSlot,
                    service = fb.serviceSnapshot.name,
                    status = dynamicStatus,
                    vehicle = vehicleLabel,
                    hasReview = fb.hasReview,
                    startTimestamp = fb.scheduledDate.toDate().time,
                    washerName = if (fb.washerSnapshot.name.isNotEmpty()) "${fb.washerSnapshot.name} ${fb.washerSnapshot.lastName}" else null,
                    washerRating = if (fb.washerSnapshot.name.isNotEmpty()) fb.washerSnapshot.rating else null
                )
            }.sortedWith(
                compareByDescending<Booking> {
                    it.status == BookingStatus.PENDING || it.status == BookingStatus.IN_PROGRESS
                }.thenByDescending {
                    it.startTimestamp
                }
            )
            _bookings.value = bookingList
            _isLoading.value = false
        }
    }

    fun submitReview(bookingId: String, washerId: String, score: Int, comment: String) {
        val uid = auth.currentUser?.uid ?: return

        val review = Review(
            userId = uid,
            washerId = washerId,
            score = score,
            comment = comment,
            createdAt = Timestamp.now()
        )

        // Usar BookingRepository.addReview que ya marca hasReview = true
        BookingRepository.addReview(
            bookingId = bookingId,
            washerId = washerId,
            review = review
        ) { success ->
            if (success) fetchBookings()
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
