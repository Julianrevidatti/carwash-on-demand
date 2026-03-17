package com.example.carwash.ui.home

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import com.example.carwash.data.repository.VehicleRepository
import com.example.carwash.databinding.FragmentHomeBinding
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.auth.FirebaseAuth

class HomeFragment : Fragment() {

    private var _binding: FragmentHomeBinding? = null
    private val binding get() = _binding!!

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentHomeBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Saludo dinámico leyendo el nombre desde Firestore
        val uid = FirebaseAuth.getInstance().currentUser?.uid
        if (uid != null) {
            FirebaseFirestore.getInstance()
                .collection("users")
                .document(uid)
                .get()
                .addOnSuccessListener { doc ->
                    val fullName = doc.getString("name") ?: "Usuario"
                    val firstName = fullName.split(" ").firstOrNull() ?: fullName
                    binding.greetingText.text = "¡Hola, $firstName!"
                }
                .addOnFailureListener {
                    binding.greetingText.text = "¡Hola!"
                }
        } else {
            binding.greetingText.text = "¡Hola!"
        }

        setupButtons()
    }

    private fun setupButtons() {
        binding.btnOrderBase.setOnClickListener { showOrderSheet("Lavado Base") }
        binding.btnOrderPremium.setOnClickListener { showOrderSheet("Lavado Premium") }
        binding.btnOrderExpress.setOnClickListener { showOrderSheet("Lavado Express") }
        binding.btnOrderDetailing.setOnClickListener { showOrderSheet("Servicio Detailing") }
    }

    private fun showOrderSheet(serviceName: String) {
        if (VehicleRepository.getVehicles().isEmpty()) {
            Toast.makeText(
                requireContext(),
                "Necesitás agregar un vehículo antes de pedir un lavado",
                Toast.LENGTH_LONG
            ).show()
            return
        }

        val sheet = OrderConfirmationBottomSheet(serviceName) {
            Toast.makeText(requireContext(), "¡$serviceName pedido con éxito!", Toast.LENGTH_SHORT).show()
        }
        sheet.show(parentFragmentManager, "OrderConfirmation")
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}