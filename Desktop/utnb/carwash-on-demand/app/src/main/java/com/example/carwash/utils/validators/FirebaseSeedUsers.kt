package com.example.carwash.utils

import com.example.carwash.data.model.FirebaseAppointment
import com.example.carwash.data.model.FirebaseBooking
import com.example.carwash.data.model.Payment
import com.example.carwash.data.model.ServiceSnapshot
import com.example.carwash.data.model.User
import com.example.carwash.data.model.UserSnapshot
import com.example.carwash.data.model.Vehicle
import com.example.carwash.data.model.VehicleSnapshot
import com.example.carwash.data.model.WasherSnapshot
import com.google.firebase.Timestamp
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.GeoPoint
import java.util.Date

object FirebaseSeedUsers {

    private val db = FirebaseFirestore.getInstance()

    fun loadAll() {
        loadUsers()
    }

    private fun loadUsers() {

        val users = listOf(
            Triple(
                "usr_001",
                User(name = "Martina",   lastName = "García",    dni = "38123456", email = "martina.garcia@gmail.com",   phone = "1167890123", baseAddress = "Av. Santa Fe 2500, Palermo, CABA"),
                listOf(Vehicle(brand = "Volkswagen", model = "Polo",      type = "sedan",  licensePlate = "AB123CD"),
                       Vehicle(brand = "Ford",       model = "EcoSport",  type = "suv",    licensePlate = "GH789IJ"))
            ),
            Triple(
                "usr_002",
                User(name = "Luciano",   lastName = "Pérez",     dni = "35678901", email = "luciano.perez@hotmail.com",  phone = "1145678901", baseAddress = "Cabildo 1200, Belgrano, CABA"),
                listOf(Vehicle(brand = "Toyota",     model = "Corolla",   type = "sedan",  licensePlate = "CD456EF"),
                       Vehicle(brand = "Renault",    model = "Duster",    type = "suv",    licensePlate = "KL012MN"))
            ),
            Triple(
                "usr_003",
                User(name = "Valentina", lastName = "Romero",    dni = "40234567", email = "valen.romero@gmail.com",     phone = "1156789012", baseAddress = "Av. Triunvirato 3400, Villa Urquiza, CABA"),
                listOf(Vehicle(brand = "Chevrolet",  model = "Onix",      type = "sedan",  licensePlate = "EF789GH"),
                       Vehicle(brand = "Jeep",       model = "Renegade",  type = "suv",    licensePlate = "OP345QR"))
            ),
            Triple(
                "usr_004",
                User(name = "Mateo",     lastName = "López",     dni = "37890123", email = "mateo.lopez@outlook.com",    phone = "1178901234", baseAddress = "Corrientes 4500, Almagro, CABA"),
                listOf(Vehicle(brand = "Honda",      model = "Civic",     type = "sedan",  licensePlate = "IJ012KL"),
                       Vehicle(brand = "Nissan",     model = "Kicks",     type = "suv",    licensePlate = "ST678UV"))
            ),
            Triple(
                "usr_005",
                User(name = "Camila",    lastName = "Fernández", dni = "41345678", email = "camila.fernandez@gmail.com", phone = "1189012345", baseAddress = "Rivadavia 6700, Flores, CABA"),
                listOf(Vehicle(brand = "Peugeot",    model = "208",       type = "sedan",  licensePlate = "MN345OP"),
                       Vehicle(brand = "Fiat",       model = "Pulse",     type = "suv",    licensePlate = "WX901YZ"))
            ),
            Triple(
                "usr_006",
                User(name = "Santiago",  lastName = "Martínez",  dni = "36456789", email = "santi.martinez@gmail.com",  phone = "1190123456", baseAddress = "Av. San Juan 2100, San Telmo, CABA"),
                listOf(Vehicle(brand = "Volkswagen", model = "Golf",      type = "sedan",  licensePlate = "QR678ST"),
                       Vehicle(brand = "Toyota",     model = "Hilux",     type = "pickup", licensePlate = "AB234CD"))
            ),
            Triple(
                "usr_007",
                User(name = "Florencia", lastName = "González",  dni = "39567890", email = "flor.gonzalez@hotmail.com", phone = "1101234567", baseAddress = "Libertador 5200, Núñez, CABA"),
                listOf(Vehicle(brand = "Renault",    model = "Sandero",   type = "sedan",  licensePlate = "UV901WX"),
                       Vehicle(brand = "Ford",       model = "Territory", type = "suv",    licensePlate = "EF567GH"))
            ),
            Triple(
                "usr_008",
                User(name = "Tomás",     lastName = "Díaz",      dni = "42678901", email = "tomas.diaz@gmail.com",      phone = "1112345678", baseAddress = "Nazca 1800, Villa del Parque, CABA"),
                listOf(Vehicle(brand = "Citroën",    model = "C3",        type = "sedan",  licensePlate = "YZ234AB"),
                       Vehicle(brand = "Chevrolet",  model = "Tracker",   type = "suv",    licensePlate = "IJ890KL"))
            )
        )

        users.forEach { (uid, user, vehicles) ->
            val userRef = db.collection("users").document(uid)
            userRef.set(user)
                .addOnSuccessListener {
                    android.util.Log.d("SEED", "User $uid (${user.name}) loaded")
                    vehicles.forEachIndexed { index, vehicle ->
                        val vehicleId = "veh_${uid}_${index + 1}"
                        userRef.collection("vehicles").document(vehicleId)
                            .set(vehicle)
                            .addOnSuccessListener {
                                android.util.Log.d("SEED", "  Vehicle ${vehicle.licensePlate} loaded")
                                if (index == 0) createSampleBooking(uid, vehicleId, user, vehicle)
                            }
                    }
                }
                .addOnFailureListener { e ->
                    android.util.Log.e("SEED", "Error user $uid: $e")
                }
        }
    }

    private fun createSampleBooking(
        userId: String,
        vehicleId: String,
        user: User,
        vehicle: Vehicle
    ) {
        val washers   = listOf("wsh_001", "wsh_002", "wsh_003")
        val services  = listOf(
            ServiceSnapshot("svc_001", "Basic exterior wash",      3500.0),
            ServiceSnapshot("svc_002", "Exterior + interior wash", 6000.0),
            ServiceSnapshot("svc_003", "Premium SUV wash",         9500.0)
        )
        val timeSlots = listOf("08:00-10:00", "10:00-12:00", "14:00-16:00", "16:00-18:00")
        val statuses  = listOf("PENDING", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "COMPLETED")

        val idx      = userId.takeLast(1).toIntOrNull() ?: 1
        val washerId = washers[(idx - 1) % washers.size]
        val service  = services[(idx - 1) % services.size]
        val timeSlot = timeSlots[(idx - 1) % timeSlots.size]
        val status   = statuses[(idx - 1) % statuses.size]

        val washerSnapshots = mapOf(
            "wsh_001" to WasherSnapshot("Carlos", "Méndez", "1134567890"),
            "wsh_002" to WasherSnapshot("Sofía",  "Romero", "1145678901"),
            "wsh_003" to WasherSnapshot("Diego",  "Torres", "1156789012")
        )

        val bookingRef     = db.collection("bookings").document()
        val appointmentRef = db.collection("appointments").document()

        val booking = FirebaseBooking(
            userId          = userId,
            washerId        = washerId,
            vehicleId       = vehicleId,
            userSnapshot    = UserSnapshot(user.name, user.lastName, user.phone),
            vehicleSnapshot = VehicleSnapshot(vehicle.brand, vehicle.model, vehicle.licensePlate, vehicle.type),
            serviceSnapshot = service,
            washerSnapshot  = washerSnapshots[washerId] ?: WasherSnapshot(),
            scheduledDate   = Timestamp(Date()),
            timeSlot        = timeSlot,
            location        = GeoPoint(-34.5889, -58.4270),
            meetingAddress  = user.baseAddress,
            finalAmount     = service.basePrice,
            status          = status
        )

        val appointment = FirebaseAppointment(
            bookingId         = bookingRef.id,
            washerId          = washerId,
            date              = Timestamp(Date()),
            time              = timeSlot.split("-")[0],
            location          = GeoPoint(-34.5889, -58.4270),
            appointmentStatus = if (status == "COMPLETED") "COMPLETED" else "CONFIRMED"
        )

        val batch = db.batch()
        batch.set(bookingRef, booking)
        batch.set(appointmentRef, appointment)
        batch.set(
            bookingRef.collection("payments").document(),
            Payment(
                paymentMethod = if (idx % 2 == 0) "CASH" else "DIGITAL",
                paymentStatus = if (status == "COMPLETED") "APPROVED" else "PENDING"
            )
        )
        batch.commit()
            .addOnSuccessListener {
                android.util.Log.d("SEED", "  Booking created for $userId — status: $status")
            }
            .addOnFailureListener { e ->
                android.util.Log.e("SEED", "  Error booking for $userId: $e")
            }
    }
}
