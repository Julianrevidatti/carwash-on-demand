package com.example.carwash.data.model

import com.google.firebase.Timestamp
import com.google.firebase.firestore.GeoPoint

data class User(
    val name: String = "",
    val lastName: String = "",
    val dni: String = "",
    val email: String = "",
    val phone: String = "",
    val baseAddress: String = "",
    val createdAt: Timestamp = Timestamp.now()
)

data class Vehicle(
    val brand: String = "",
    val model: String = "",
    val type: String = "",
    val licensePlate: String = "",
    val createdAt: Timestamp = Timestamp.now()
)

data class Washer(
    val name: String = "",
    val lastName: String = "",
    val phone: String = "",
    val coverageZone: String = "",
    val location: GeoPoint = GeoPoint(0.0, 0.0),
    val availabilityStatus: String = "AVAILABLE",
    val averageRating: Double = 5.0,
    val totalReviews: Long = 0,
    val totalScore: Double = 0.0,
    val createdAt: Timestamp = Timestamp.now()
)

data class Service(
    val name: String = "",
    val description: String = "",
    val basePrice: Double = 0.0,
    val estimatedDuration: Int = 0,
    val vehicleType: String = "all",
    val status: String = "active"
)

data class UserSnapshot(
    val name: String = "",
    val lastName: String = "",
    val phone: String = ""
)

data class VehicleSnapshot(
    val brand: String = "",
    val model: String = "",
    val licensePlate: String = "",
    val type: String = ""
)

data class ServiceSnapshot(
    val serviceId: String = "",
    val name: String = "",
    val basePrice: Double = 0.0
)

data class WasherSnapshot(
    val name: String = "",
    val lastName: String = "",
    val phone: String = ""
)

data class FirebaseBooking(
    val userId: String = "",
    val washerId: String = "",
    val vehicleId: String = "",
    val userSnapshot: UserSnapshot = UserSnapshot(),
    val vehicleSnapshot: VehicleSnapshot = VehicleSnapshot(),
    val serviceSnapshot: ServiceSnapshot = ServiceSnapshot(),
    val washerSnapshot: WasherSnapshot = WasherSnapshot(),
    val scheduledDate: Timestamp = Timestamp.now(),
    val timeSlot: String = "",
    val location: GeoPoint = GeoPoint(0.0, 0.0),
    val meetingAddress: String = "",
    val finalAmount: Double = 0.0,
    val status: String = "PENDING",
    val createdAt: Timestamp = Timestamp.now()
)

data class Payment(
    val paymentMethod: String = "",     // DIGITAL | CASH
    val paymentStatus: String = "PENDING", // PENDING | APPROVED | REJECTED
    val receiptUrl: String = "",
    val createdAt: Timestamp = Timestamp.now()
)

data class Review(
    val userId: String = "",
    val washerId: String = "",
    val score: Int = 0,                 // 1 to 5
    val comment: String = "",
    val createdAt: Timestamp = Timestamp.now()
)

data class FirebaseAppointment(
    val bookingId: String = "",
    val washerId: String = "",
    val date: Timestamp = Timestamp.now(),
    val time: String = "",
    val location: GeoPoint = GeoPoint(0.0, 0.0),
    val appointmentStatus: String = "CONFIRMED"
)