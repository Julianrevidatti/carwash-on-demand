package com.example.carwash.ui.home

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import com.example.carwash.data.repository.BookingRepository
import com.example.carwash.databinding.FragmentHomeBinding

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

        setupButtons()
    }

    private fun setupButtons() {
        binding.btnOrderBase.setOnClickListener {
            orderService("Lavado Base")
        }
        binding.btnOrderPremium.setOnClickListener {
            orderService("Lavado Premium")
        }
        binding.btnOrderExpress.setOnClickListener {
            orderService("Lavado Express")
        }
        binding.btnOrderDetailing.setOnClickListener {
            orderService("Servicio Detailing")
        }
    }

    private fun orderService(serviceName: String) {
        BookingRepository.addBooking(serviceName)
        Toast.makeText(requireContext(), "¡$serviceName pedido con éxito!", Toast.LENGTH_SHORT).show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
