package com.example.carwash.ui.home

import android.app.AlertDialog
import android.app.DatePickerDialog
import android.app.TimePickerDialog
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.*
import com.example.carwash.R
import com.example.carwash.data.model.*
import com.example.carwash.data.repository.BookingRepository
import com.example.carwash.data.repository.VehicleRepository
import com.example.carwash.data.repository.WasherRepository
import com.example.carwash.utils.PriceCalculator
import com.example.carwash.utils.WashTimeCalculator
import com.example.carwash.utils.notifications.NotificationHelper
import com.google.android.material.bottomsheet.BottomSheetDialogFragment
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.Timestamp
import com.google.firebase.firestore.FirebaseFirestore
import java.text.SimpleDateFormat
import java.util.*

class OrderConfirmationBottomSheet(
    private val serviceName: String,
    private val initialLocation: String = "",
    private val paymentMethod: String = "Efectivo",
    private val onOrderConfirmed: () -> Unit
) : BottomSheetDialogFragment() {

    private var selectedDate = ""
    private var selectedTime = ""
    private var selectedYear = -1
    private var selectedMonth = -1
    private var selectedDay = -1
    private var currentPrice = 0.0
    private val washerRepository = WasherRepository()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        return inflater.inflate(R.layout.layout_order_confirmation_bottom_sheet, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val tvTitle = view.findViewById<TextView>(R.id.tvConfirmTitle)
        val spinnerVehicles = view.findViewById<Spinner>(R.id.spinnerVehicles)
        val tvPrice = view.findViewById<TextView>(R.id.tvPrice)
        val rgPayment = view.findViewById<RadioGroup>(R.id.rgPayment)
        rgPayment.visibility = View.GONE // Ocultamos porque ya se seleccionó antes

        val btnDate = view.findViewById<com.google.android.material.button.MaterialButton>(R.id.btnSelectDate)
        val btnTime = view.findViewById<com.google.android.material.button.MaterialButton>(R.id.btnSelectTime)
        val btnCancel = view.findViewById<com.google.android.material.button.MaterialButton>(R.id.btnCancelOrder)
        val btnConfirm = view.findViewById<com.google.android.material.button.MaterialButton>(R.id.btnConfirmOrder)

        tvTitle.text = "Confirmar $serviceName"

        val vehicles = VehicleRepository.getVehicles()
        val vehicleLabels = vehicles.map { "${it.name} - ${it.plate}" }
        val spinnerAdapter = ArrayAdapter(requireContext(), android.R.layout.simple_spinner_item, vehicleLabels)
        spinnerAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        spinnerVehicles.adapter = spinnerAdapter

        spinnerVehicles.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>, v: View?, position: Int, id: Long) {
                val selectedVehicle = vehicles[position]
                currentPrice = PriceCalculator.calculate(serviceName, selectedVehicle.type)
                tvPrice.text = PriceCalculator.format(currentPrice)
                tvPrice.setTextColor(resources.getColor(android.R.color.black, null))
            }
            override fun onNothingSelected(parent: AdapterView<*>) {}
        }

        btnDate.setOnClickListener {
            val cal = Calendar.getInstance()
            DatePickerDialog(requireContext(), { _, year, month, day ->
                selectedYear = year
                selectedMonth = month
                selectedDay = day
                selectedDate = "$day/${month + 1}/$year"
                btnDate.text = selectedDate
                selectedTime = ""
                btnTime.text = "Seleccionar Hora"
            }, cal.get(Calendar.YEAR), cal.get(Calendar.MONTH), cal.get(Calendar.DAY_OF_MONTH))
                .apply { datePicker.minDate = cal.timeInMillis }
                .show()
        }

        btnTime.setOnClickListener {
            if (selectedDate.isEmpty()) {
                Toast.makeText(requireContext(), "Primero seleccioná una fecha", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            val cal = Calendar.getInstance()
            TimePickerDialog(requireContext(), { _, hour, minute ->
                val isToday = selectedYear == cal.get(Calendar.YEAR) &&
                        selectedMonth == cal.get(Calendar.MONTH) &&
                        selectedDay == cal.get(Calendar.DAY_OF_MONTH)

                val currentHour = cal.get(Calendar.HOUR_OF_DAY)
                val currentMinute = cal.get(Calendar.MINUTE)

                if (false && (hour < 8 || hour > 20 || (hour == 20 && minute > 0))) {
                    Toast.makeText(requireContext(), "Horario de 08:00 a 20:00 hs", Toast.LENGTH_LONG).show()
                } else if (isToday && (hour < currentHour || (hour == currentHour && minute <= currentMinute))) {
                    Toast.makeText(requireContext(), "Seleccioná una hora futura", Toast.LENGTH_SHORT).show()
                } else {
                    selectedTime = String.format(Locale.getDefault(), "%02d:%02d", hour, minute)
                    btnTime.text = selectedTime
                }
            }, cal.get(Calendar.HOUR_OF_DAY), cal.get(Calendar.MINUTE), true).show()
        }

        btnCancel.setOnClickListener { dismiss() }

        btnConfirm.setOnClickListener {
            if (selectedDate.isEmpty() || selectedTime.isEmpty()) {
                Toast.makeText(requireContext(), "Seleccioná fecha y hora", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            val currentUser = FirebaseAuth.getInstance().currentUser ?: return@setOnClickListener

            btnConfirm.isEnabled = false
            btnConfirm.text = "Buscando lavador..."

            // Search for a random washer
            washerRepository.getRandomWasherForService(serviceName) { washer ->
                if (!isAdded) return@getRandomWasherForService

                if (washer != null) {
                    showWasherFoundDialog(washer, currentUser.uid, vehicles[spinnerVehicles.selectedItemPosition], rgPayment.checkedRadioButtonId)
                } else {
                    Toast.makeText(context, "No hay lavadores disponibles", Toast.LENGTH_LONG).show()
                    btnConfirm.isEnabled = true
                    btnConfirm.text = "Confirmar"
                }
            }
        }
    }

    private fun showWasherFoundDialog(washer: Washer, userId: String, vehicle: com.example.carwash.ui.vehicles.Vehicle, paymentId: Int) {
        val estimatedMinutes = WashTimeCalculator.getEstimatedMinutes(serviceName, washer.speedFactor)

        AlertDialog.Builder(requireContext())
            .setTitle("¡Lavador Encontrado!")
            .setMessage("${washer.name} ${washer.lastName} aceptó tu pedido.\n" +
                       "Rating: ⭐ ${washer.averageRating}\n" +
                       "Tiempo estimado de lavado: $estimatedMinutes minutos\n\n" +
                       "¿Deseas confirmar la reserva?")
            .setPositiveButton("Confirmar") { _, _ ->
                proceedWithBooking(washer, userId, vehicle, paymentId, estimatedMinutes)
            }
            .setNegativeButton("Cancelar") { _, _ ->
                val btnConfirm = view?.findViewById<Button>(R.id.btnConfirmOrder)
                btnConfirm?.isEnabled = true
                btnConfirm?.text = "Confirmar"
            }
            .setCancelable(false)
            .show()
    }

    private fun proceedWithBooking(washer: Washer, userId: String, vehicle: com.example.carwash.ui.vehicles.Vehicle, paymentId: Int, duration: Int) {
        val db = FirebaseFirestore.getInstance()
        db.collection("users").document(userId).get()
            .addOnSuccessListener { document ->
                if (!isAdded) return@addOnSuccessListener
                
                val finalPrice = PriceCalculator.calculate(serviceName, vehicle.type)
                
                // Trigger confirmation notification
                val notificationHelper = NotificationHelper(requireContext())
                notificationHelper.sendBookingConfirmationNotification(serviceName, selectedTime)

                val newBooking = FirebaseBooking(
                    userId = userId,
                    washerId = washer.id,
                    vehicleId = vehicle.plate,
                    userSnapshot = UserSnapshot(
                        name = document.getString("name") ?: "",
                        lastName = document.getString("lastName") ?: "",
                        phone = document.getString("phone") ?: ""
                    ),
                    vehicleSnapshot = VehicleSnapshot(
                        brand = vehicle.brand,
                        model = vehicle.name,
                        licensePlate = vehicle.plate,
                        type = vehicle.type
                    ),
                    serviceSnapshot = ServiceSnapshot(name = serviceName, basePrice = finalPrice),
                    washerSnapshot = WasherSnapshot(
                        washerId = washer.id,
                        name = washer.name,
                        lastName = washer.lastName,
                        phone = washer.phone,
                        rating = washer.averageRating,
                        speedFactor = washer.speedFactor
                    ),
                    scheduledDate = try {
                        val sdf = SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault())
                        Timestamp(sdf.parse("$selectedDate $selectedTime")!!)
                    } catch (e: Exception) { Timestamp.now() },
                    estimatedDurationMinutes = duration,
                    timeSlot = selectedTime,
                    meetingAddress = initialLocation.ifEmpty { "Ubicación actual" },
                    finalAmount = finalPrice,
                    status = "PENDING"
                )

                val newAppointment = FirebaseAppointment(
                    bookingId = "", 
                    washerId = washer.id,
                    date = newBooking.scheduledDate,
                    time = selectedTime,
                    appointmentStatus = "CONFIRMED"
                )

                BookingRepository.createBooking(newBooking, newAppointment) { success, _ ->
                    if (!isAdded) return@createBooking
                    if (success) {
                        onOrderConfirmed()
                        dismiss()
                        Toast.makeText(context, "¡Reserva confirmada con ${washer.name}!", Toast.LENGTH_SHORT).show()
                    } else {
                        Toast.makeText(context, "Error al procesar la reserva", Toast.LENGTH_SHORT).show()
                    }
                }
            }
    }
}
