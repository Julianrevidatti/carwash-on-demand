package com.example.carwash.ui.bookings

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.example.carwash.R
import com.example.carwash.data.model.Booking
import com.example.carwash.data.model.BookingStatus

class BookingAdapter(
    private val onCancelClick: (Booking) -> Unit
) : RecyclerView.Adapter<BookingAdapter.BookingViewHolder>() {

    private var bookings: List<Booking> = emptyList()

    inner class BookingViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val serviceImage: ImageView = view.findViewById(R.id.serviceImage)
        val serviceName: TextView = view.findViewById(R.id.serviceName)
        val date: TextView = view.findViewById(R.id.date)
        val hour: TextView = view.findViewById(R.id.hour)
        val address: TextView = view.findViewById(R.id.address)
        val payment: TextView = view.findViewById(R.id.payment)
        val status: TextView = view.findViewById(R.id.status)
        val cancelBtn: Button = view.findViewById(R.id.cancelBtn)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): BookingViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.booking_item, parent, false)
        return BookingViewHolder(view)
    }

    override fun getItemCount() = bookings.size

    override fun onBindViewHolder(holder: BookingViewHolder, position: Int) {
        val booking = bookings[position]

        val displayName = booking.service.uppercase()
            .replace("LAVADO ", "").replace("SERVICIO ", "")
        holder.serviceName.text = "LAVADO $displayName"

        holder.date.text = "Fecha: ${booking.date}"
        holder.hour.text = "Hora: ${booking.time}"
        holder.address.text = "Vehículo: ${booking.vehicle}"   // usamos este campo para el vehículo
        holder.payment.text = "Pago: ${booking.paymentMethod}"

        val imageRes = when {
            booking.service.contains("Base", ignoreCase = true) -> R.drawable.lavadobase
            booking.service.contains("Premium", ignoreCase = true) -> R.drawable.lavadopremium
            booking.service.contains("Express", ignoreCase = true) -> R.drawable.lavadoexpress
            booking.service.contains("Detailing", ignoreCase = true) -> R.drawable.lavadodetailing
            else -> R.drawable.lavadobase
        }
        holder.serviceImage.setImageResource(imageRes)

        when (booking.status) {
            BookingStatus.PENDING -> {
                holder.status.text = "Estado: Programado"
                holder.status.setTextColor(android.graphics.Color.parseColor("#2D5BFF"))
                holder.cancelBtn.visibility = View.VISIBLE
            }
            BookingStatus.COMPLETED -> {
                holder.status.text = "Estado: Finalizado"
                holder.status.setTextColor(android.graphics.Color.parseColor("#34C759"))
                holder.cancelBtn.visibility = View.GONE
            }
            BookingStatus.CANCELED -> {
                holder.status.text = "Estado: Cancelado"
                holder.status.setTextColor(android.graphics.Color.parseColor("#FF3B30"))
                holder.cancelBtn.visibility = View.GONE
            }
        }

        holder.cancelBtn.setOnClickListener { onCancelClick(booking) }
    }

    fun updateList(newList: List<Booking>) {
        bookings = newList
        notifyDataSetChanged()
    }
}
