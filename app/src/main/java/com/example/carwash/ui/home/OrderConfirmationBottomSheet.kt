package com.example.carwash.ui.home

import android.app.DatePickerDialog
import android.app.TimePickerDialog
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.*
import com.example.carwash.R
import com.example.carwash.data.repository.BookingRepository
import com.example.carwash.data.repository.VehicleRepository
import com.google.android.material.bottomsheet.BottomSheetDialogFragment
import java.util.*

class OrderConfirmationBottomSheet(
    private val serviceName: String,
    private val onOrderConfirmed: () -> Unit
) : BottomSheetDialogFragment() {

    private var selectedDate = ""
    private var selectedTime = ""
    private var selectedYear = -1
    private var selectedMonth = -1
    private var selectedDay = -1

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
        val rgPayment = view.findViewById<RadioGroup>(R.id.rgPayment)
        val btnDate = view.findViewById<Button>(R.id.btnSelectDate)
        val btnTime = view.findViewById<Button>(R.id.btnSelectTime)
        val btnCancel = view.findViewById<com.google.android.material.button.MaterialButton>(R.id.btnCancelOrder)
        val btnConfirm = view.findViewById<com.google.android.material.button.MaterialButton>(R.id.btnConfirmOrder)

        tvTitle.text = "Confirmar $serviceName"

        // Configuración de Vehículos
        val vehicles = VehicleRepository.getVehicles()
        val vehicleLabels = vehicles.map { "${it.name} - ${it.plate}" }
        val adapter = ArrayAdapter(
            requireContext(),
            android.R.layout.simple_spinner_item,
            vehicleLabels
        )
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        spinnerVehicles.adapter = adapter

        // Configuración de Fecha (mínimo hoy)
        btnDate.setOnClickListener {
            val cal = Calendar.getInstance()
            val dpd = DatePickerDialog(requireContext(), { _, year, month, day ->
                selectedYear = year
                selectedMonth = month
                selectedDay = day
                selectedDate = "$day/${month + 1}/$year"
                btnDate.text = selectedDate
                
                // Resetear hora si cambia la fecha para forzar nueva validación
                selectedTime = ""
                btnTime.text = "Seleccionar Hora"
            }, cal.get(Calendar.YEAR), cal.get(Calendar.MONTH), cal.get(Calendar.DAY_OF_MONTH))
            
            dpd.datePicker.minDate = cal.timeInMillis
            dpd.show()
        }

        // Configuración de Hora con límite (08:00 a 20:00) y validación de antelación
        btnTime.setOnClickListener {
            if (selectedDate.isEmpty()) {
                Toast.makeText(requireContext(), "Primero selecciona una fecha", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            val cal = Calendar.getInstance()
            val currentYear = cal.get(Calendar.YEAR)
            val currentMonth = cal.get(Calendar.MONTH)
            val currentDay = cal.get(Calendar.DAY_OF_MONTH)
            val currentHour = cal.get(Calendar.HOUR_OF_DAY)
            val currentMinute = cal.get(Calendar.MINUTE)

            TimePickerDialog(requireContext(), { _, hour, minute ->
                val isToday = selectedYear == currentYear && selectedMonth == currentMonth && selectedDay == currentDay
                
                // 1. Validar rango de atención (8am - 8pm)
                if (hour < 8 || hour > 20 || (hour == 20 && minute > 0)) {
                    Toast.makeText(requireContext(), "El horario de atención es de 08:00 a 20:00 hs", Toast.LENGTH_LONG).show()
                } 
                // 2. Validar que sea al menos 1 hora después de ahora (si es hoy)
                else if (isToday && (hour < currentHour + 1 || (hour == currentHour + 1 && minute < currentMinute))) {
                    Toast.makeText(requireContext(), "Las reservas deben ser con al menos 1 hora de anticipación", Toast.LENGTH_LONG).show()
                }
                else {
                    selectedTime = String.format(Locale.getDefault(), "%02d:%02d", hour, minute)
                    btnTime.text = selectedTime
                }
            }, cal.get(Calendar.HOUR_OF_DAY), cal.get(Calendar.MINUTE), true).show()
        }

        btnCancel.setOnClickListener { dismiss() }

        btnConfirm.setOnClickListener {
            if (selectedDate.isEmpty() || selectedTime.isEmpty()) {
                Toast.makeText(requireContext(), "Por favor selecciona fecha y hora", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            val selectedIndex = spinnerVehicles.selectedItemPosition
            val selectedVehicle = vehicles[selectedIndex]
            val vehicleLabel = "${selectedVehicle.name} (${selectedVehicle.plate})"

            val paymentMethod = when (rgPayment.checkedRadioButtonId) {
                R.id.rbDigital -> "Mercado Pago"
                else -> "Efectivo"
            }

            BookingRepository.addBooking(
                service = serviceName,
                vehicle = vehicleLabel,
                paymentMethod = paymentMethod,
                date = selectedDate,
                time = selectedTime
            )

            dismiss()
            onOrderConfirmed()
        }
    }
}
