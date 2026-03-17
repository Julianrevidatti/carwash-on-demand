package com.example.carwash.ui.home

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.*
import com.example.carwash.R
import com.example.carwash.data.repository.BookingRepository
import com.example.carwash.data.repository.VehicleRepository
import com.google.android.material.bottomsheet.BottomSheetDialogFragment

class OrderConfirmationBottomSheet(
    private val serviceName: String,
    private val onOrderConfirmed: () -> Unit
) : BottomSheetDialogFragment() {

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
        val btnCancel = view.findViewById<com.google.android.material.button.MaterialButton>(R.id.btnCancelOrder)
        val btnConfirm = view.findViewById<com.google.android.material.button.MaterialButton>(R.id.btnConfirmOrder)

        tvTitle.text = "Confirmar $serviceName"

        val vehicles = VehicleRepository.getVehicles()
        val vehicleLabels = vehicles.map { "${it.name} - ${it.plate}" }
        val adapter = ArrayAdapter(
            requireContext(),
            android.R.layout.simple_spinner_item,
            vehicleLabels
        )
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        spinnerVehicles.adapter = adapter

        btnCancel.setOnClickListener { dismiss() }

        btnConfirm.setOnClickListener {
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
                paymentMethod = paymentMethod
            )

            dismiss()
            onOrderConfirmed()
        }
    }
}