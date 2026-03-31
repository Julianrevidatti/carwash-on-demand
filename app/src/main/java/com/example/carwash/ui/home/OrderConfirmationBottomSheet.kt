package com.example.carwash.ui.home

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
import com.example.carwash.data.repository.BookingRepositoryDB
import com.example.carwash.data.repository.VehicleRepository
import com.example.carwash.utils.PriceCalculator
import com.google.android.material.bottomsheet.BottomSheetDialogFragment
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.Timestamp
import com.google.firebase.firestore.FirebaseFirestore
import java.text.SimpleDateFormat
import java.util.*

class OrderConfirmationBottomSheet(
    private val serviceName: String,
    private val initialLocation: String = "",
    private val onOrderConfirmed: () -> Unit
) : BottomSheetDialogFragment() {

    private var selectedDate = ""
    private var selectedTime = ""
    private var selectedYear = -1
    private var selectedMonth = -1
    private var selectedDay = -1
    private var currentPrice = 0.0

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
        val btnDate = view.findViewById<com.google.android.material.button.MaterialButton>(R.id.btnSelectDate)
        val btnTime = view.findViewById<com.google.android.material.button.MaterialButton>(R.id.btnSelectTime)
        val btnCancel = view.findViewById<com.google.android.material.button.MaterialButton>(R.id.btnCancelOrder)
        val btnConfirm = view.findViewById<com.google.android.material.button.MaterialButton>(R.id.btnConfirmOrder)

        tvTitle.text = "Confirmar $serviceName"

        // Vehículos
        val vehicles = VehicleRepository.getVehicles()
        val vehicleLabels = vehicles.map { "${it.name} - ${it.plate}" }
        val spinnerAdapter = ArrayAdapter(
            requireContext(),
            android.R.layout.simple_spinner_item,
            vehicleLabels
        )
        spinnerAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        spinnerVehicles.adapter = spinnerAdapter

        // Actualizar precio cuando cambia el vehículo seleccionado
        spinnerVehicles.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>, v: View?, position: Int, id: Long) {
                val selectedVehicle = vehicles[position]
                currentPrice = PriceCalculator.calculate(serviceName, selectedVehicle.type)
                tvPrice.text = PriceCalculator.format(currentPrice)
                tvPrice.setTextColor(resources.getColor(android.R.color.black, null))
            }
            override fun onNothingSelected(parent: AdapterView<*>) {
                tvPrice.text = "Seleccioná un vehículo para ver el precio"
            }
        }

        // Fecha
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

        // Hora
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

                when {
                    hour < 8 || hour > 20 || (hour == 20 && minute > 0) ->
                        Toast.makeText(requireContext(), "Horario de 08:00 a 20:00 hs", Toast.LENGTH_LONG).show()
                    isToday && hour < cal.get(Calendar.HOUR_OF_DAY) + 1 ->
                        Toast.makeText(requireContext(), "Mínimo 1 hora de anticipación", Toast.LENGTH_LONG).show()
                    else -> {
                        selectedTime = String.format(Locale.getDefault(), "%02d:%02d", hour, minute)
                        btnTime.text = selectedTime
                    }
                }
            }, cal.get(Calendar.HOUR_OF_DAY), cal.get(Calendar.MINUTE), true).show()
        }

        btnCancel.setOnClickListener { dismiss() }

        btnConfirm.setOnClickListener {
            if (selectedDate.isEmpty() || selectedTime.isEmpty()) {
                Toast.makeText(requireContext(), "Seleccioná fecha y hora", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            val currentUser = FirebaseAuth.getInstance().currentUser
            if (currentUser == null) {
                Toast.makeText(requireContext(), "Iniciá sesión primero", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            btnConfirm.isEnabled = false
            btnConfirm.text = "Procesando..."

            val db = FirebaseFirestore.getInstance()
            db.collection("users").document(currentUser.uid).get()
                .addOnSuccessListener { document ->
                    if (!isAdded) return@addOnSuccessListener

                    if (document != null && document.exists()) {
                        val selectedVehicle = vehicles[spinnerVehicles.selectedItemPosition]
                        val vehicleLabel = "${selectedVehicle.name} (${selectedVehicle.plate})"
                        val paymentMethod = if (rgPayment.checkedRadioButtonId == R.id.rbDigital)
                            "Mercado Pago" else "Efectivo"

                        // Precio final calculado
                        val finalPrice = PriceCalculator.calculate(serviceName, selectedVehicle.type)

                        val newBooking = FirebaseBooking(
                            userId = currentUser.uid,
                            vehicleId = selectedVehicle.plate,
                            userSnapshot = UserSnapshot(
                                name = document.getString("name") ?: "",
                                lastName = document.getString("lastName") ?: "",
                                phone = document.getString("phone") ?: ""
                            ),
                            vehicleSnapshot = VehicleSnapshot(
                                brand = selectedVehicle.brand,
                                model = selectedVehicle.name,
                                licensePlate = selectedVehicle.plate,
                                type = selectedVehicle.type
                            ),
                            serviceSnapshot = ServiceSnapshot(
                                name = serviceName,
                                basePrice = finalPrice  // precio real guardado en Firebase
                            ),
                            scheduledDate = try {
                                val sdf = SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault())
                                Timestamp(sdf.parse("$selectedDate $selectedTime")!!)
                            } catch (e: Exception) {
                                Timestamp.now()
                            },
                            timeSlot = selectedTime,
                            meetingAddress = initialLocation.ifEmpty { "Ubicación actual" },
                            finalAmount = finalPrice,  // campo específico para el monto final
                            status = "PENDING"
                        )

                        val newAppointment = FirebaseAppointment(
                            date = newBooking.scheduledDate,
                            time = selectedTime,
                            appointmentStatus = "CONFIRMED"
                        )

                        BookingRepositoryDB().createBooking(newBooking, newAppointment) { success, _ ->
                            if (!isAdded) return@createBooking

                            if (success) {
                                BookingRepository.addBooking(
                                    serviceName, vehicleLabel, paymentMethod,
                                    selectedDate, selectedTime
                                )
                                onOrderConfirmed()
                                dismiss()
                                Toast.makeText(context, "¡Reserva enviada con éxito!", Toast.LENGTH_SHORT).show()
                            } else {
                                Toast.makeText(context, "Error al guardar la reserva", Toast.LENGTH_SHORT).show()
                                btnConfirm.isEnabled = true
                                btnConfirm.text = "Confirmar"
                            }
                        }
                    } else {
                        Toast.makeText(context, "No se encontró el perfil del usuario", Toast.LENGTH_SHORT).show()
                        btnConfirm.isEnabled = true
                        btnConfirm.text = "Confirmar"
                    }
                }
                .addOnFailureListener {
                    if (!isAdded) return@addOnFailureListener
                    Toast.makeText(context, "Error al obtener datos del usuario", Toast.LENGTH_SHORT).show()
                    btnConfirm.isEnabled = true
                    btnConfirm.text = "Confirmar"
                }
        }
    }
}