package com.example.carwash.ui.bookings

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.carwash.R
import com.example.carwash.data.model.Booking
import com.example.carwash.data.model.BookingStatus
import com.example.carwash.data.repository.BookingRepository
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import java.text.SimpleDateFormat
import java.util.*

class BookingFragment : Fragment(R.layout.fragment_bookings) {
    private lateinit var recyclerView: RecyclerView
    private lateinit var adapter: BookingAdapter
    
    private val db = FirebaseFirestore.getInstance()
    private val auth = FirebaseAuth.getInstance()

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        recyclerView = view.findViewById(R.id.bookingsRecyclerView)
        recyclerView.layoutManager = LinearLayoutManager(requireContext())

        adapter = BookingAdapter { booking ->
            cancelBookingInFirebase(booking)
        }

        recyclerView.adapter = adapter
        
        loadBookingsFromFirebase()
    }

    private fun loadBookingsFromFirebase() {
        val uid = auth.currentUser?.uid ?: return
        
        db.collection("bookings")
            .whereEqualTo("userId", uid)
            .get()
            .addOnSuccessListener { snapshot ->
                val bookingList = mutableListOf<Booking>()
                for (doc in snapshot.documents) {
                    val vehicleSnap = doc.get("vehicleSnapshot") as? Map<*, *>
                    val vehicleLabel = if (vehicleSnap != null) {
                        "${vehicleSnap["brand"]} ${vehicleSnap["model"]} (${vehicleSnap["licensePlate"]})"
                    } else "No especificado"

                    val serviceSnap = doc.get("serviceSnapshot") as? Map<*, *>
                    val serviceName = serviceSnap?.get("name")?.toString() ?: "Lavado"

                    val b = Booking(
                        id = doc.id,
                        address = doc.getString("meetingAddress") ?: "Ubicación actual",
                        date = SimpleDateFormat("dd/MM/yyyy", Locale.getDefault()).format(doc.getTimestamp("scheduledDate")?.toDate() ?: Date()),
                        time = doc.getString("timeSlot") ?: "",
                        service = serviceName,
                        status = when(doc.getString("status")) {
                            "PENDING" -> BookingStatus.PENDING
                            "COMPLETED" -> BookingStatus.COMPLETED
                            "CANCELLED" -> BookingStatus.CANCELED
                            else -> BookingStatus.PENDING
                        },
                        vehicle = vehicleLabel,
                        paymentMethod = "Efectivo"
                    )
                    bookingList.add(b)
                }
                
                adapter.updateList(bookingList)
                updateUI(bookingList.isEmpty())
            }
            .addOnFailureListener {
                Toast.makeText(requireContext(), "Error al cargar reservas", Toast.LENGTH_SHORT).show()
            }
    }

    private fun cancelBookingInFirebase(booking: Booking) {
        db.collection("bookings").document(booking.id)
            .update("status", "CANCELLED")
            .addOnSuccessListener {
                Toast.makeText(requireContext(), "Reserva cancelada", Toast.LENGTH_SHORT).show()
                loadBookingsFromFirebase()
            }
            .addOnFailureListener {
                Toast.makeText(requireContext(), "No se pudo cancelar la reserva", Toast.LENGTH_SHORT).show()
            }
    }

    private fun updateUI(isEmpty: Boolean) {
        val emptyState = view?.findViewById<View>(R.id.emptyStateBookings)
        if (isEmpty) {
            emptyState?.visibility = View.VISIBLE
            recyclerView.visibility = View.GONE
        } else {
            emptyState?.visibility = View.GONE
            recyclerView.visibility = View.VISIBLE
        }
    }
}
