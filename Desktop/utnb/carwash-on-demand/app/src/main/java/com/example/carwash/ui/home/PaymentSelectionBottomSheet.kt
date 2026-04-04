package com.example.carwash.ui.home

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import com.example.carwash.databinding.LayoutPaymentSelectionBottomSheetBinding
import com.google.android.material.bottomsheet.BottomSheetDialogFragment

class PaymentSelectionBottomSheet(
    private val onPaymentSelected: (String) -> Unit
) : BottomSheetDialogFragment() {

    private var _binding: LayoutPaymentSelectionBottomSheetBinding? = null
    private val binding get() = _binding!!
    private var paymentMethod: String = ""

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = LayoutPaymentSelectionBottomSheetBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.cardMercadoPago.setOnClickListener {
            selectMercadoPago()
        }

        binding.cardEfectivo.setOnClickListener {
            selectEfectivo()
        }

        binding.btnConfirmPayment.setOnClickListener {
            if (paymentMethod.isEmpty()) {
                Toast.makeText(requireContext(), "Por favor, elegí un medio de pago", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            onPaymentSelected(paymentMethod)
            dismiss()
        }
    }

    private fun selectMercadoPago() {
        paymentMethod = "Mercado Pago"
        binding.rbMercadoPago.isChecked = true
        binding.rbEfectivo.isChecked = false
        binding.cardMercadoPago.strokeColor = resources.getColor(com.example.carwash.R.color.azulcarwash, null)
        binding.cardEfectivo.strokeColor = resources.getColor(android.R.color.darker_gray, null)
    }

    private fun selectEfectivo() {
        paymentMethod = "Efectivo"
        binding.rbEfectivo.isChecked = true
        binding.rbMercadoPago.isChecked = false
        binding.cardEfectivo.strokeColor = resources.getColor(com.example.carwash.R.color.azulcarwash, null)
        binding.cardMercadoPago.strokeColor = resources.getColor(android.R.color.darker_gray, null)
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
