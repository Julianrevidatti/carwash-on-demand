package com.example.carwash.ui.home

import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import com.example.carwash.R
import com.example.carwash.data.repository.VehicleRepository
import com.example.carwash.databinding.FragmentHomeBinding
import com.example.carwash.utils.Timer.WashDuration
import com.example.carwash.utils.notifications.NotificationHelper
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.auth.FirebaseAuth
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.GoogleMap
import com.google.android.gms.maps.OnMapReadyCallback
import com.google.android.gms.maps.SupportMapFragment
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.MarkerOptions

class HomeFragment : Fragment(), OnMapReadyCallback {

    private var _binding: FragmentHomeBinding? = null
    private val binding get() = _binding!!
    private lateinit var notificationHelper: NotificationHelper
    private val handler = Handler(Looper.getMainLooper())
    private var googleMap: GoogleMap? = null

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentHomeBinding.inflate(inflater, container, false)
        notificationHelper = NotificationHelper(requireContext())
        
        val mapFragment = childFragmentManager.findFragmentById(R.id.map_fragment) as SupportMapFragment
        mapFragment.getMapAsync(this)
        
        return binding.root
    }

    override fun onMapReady(map: GoogleMap) {
        googleMap = map
        val initialLatLng = LatLng(-34.6037, -58.3816) // Buenos Aires
        map.addMarker(MarkerOptions().position(initialLatLng).title("Ubicación del Lavado"))
        map.moveCamera(CameraUpdateFactory.newLatLngZoom(initialLatLng, 15f))
        
        map.setOnMapClickListener { latLng ->
            map.clear()
            map.addMarker(MarkerOptions().position(latLng).title("Ubicación seleccionada"))
            // Aquí se podría usar Geocoder para actualizar el search_bar
            binding.searchBar.setText("${latLng.latitude}, ${latLng.longitude}")
        }
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

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
                    
                    val baseAddress = doc.getString("baseAddress") ?: ""
                    if (baseAddress.isNotEmpty()) {
                        binding.searchBar.setText(baseAddress)
                    }
                }
        }

        setupButtons()
    }

    private fun setupButtons() {
        binding.btnOrderBase.setOnClickListener { startBookingFlow("Base") }
        binding.btnOrderPremium.setOnClickListener { startBookingFlow("Premium") }
        binding.btnOrderExpress.setOnClickListener { startBookingFlow("Express") }
        binding.btnOrderDetailing.setOnClickListener { startBookingFlow("Detailing") }
    }

    private fun startBookingFlow(serviceName: String) {
        val location = binding.searchBar.text.toString()
        if (location.isEmpty()) {
            Toast.makeText(requireContext(), "Por favor, elegí una ubicación en el mapa", Toast.LENGTH_SHORT).show()
            return
        }

        // 1. Seleccionar Medio de Pago
        val paymentSheet = PaymentSelectionBottomSheet { method ->
            if (method == "Mercado Pago") {
                simulateMercadoPagoPayment {
                    showOrderConfirmation(serviceName, location, method)
                }
            } else {
                showOrderConfirmation(serviceName, location, method)
            }
        }
        paymentSheet.show(parentFragmentManager, "PaymentSelection")
    }

    private fun simulateMercadoPagoPayment(onSuccess: () -> Unit) {
        Toast.makeText(requireContext(), "Redirigiendo a Mercado Pago...", Toast.LENGTH_SHORT).show()
        handler.postDelayed({
            Toast.makeText(requireContext(), "¡Pago aprobado!", Toast.LENGTH_SHORT).show()
            onSuccess()
        }, 2000)
    }

    private fun showOrderConfirmation(serviceName: String, location: String, method: String) {
        if (VehicleRepository.getVehicles().isEmpty()) {
            Toast.makeText(requireContext(), "Necesitás agregar un vehículo primero", Toast.LENGTH_LONG).show()
            return
        }

        val sheet = OrderConfirmationBottomSheet(serviceName, location, method) {
            startWashTracking(serviceName)
        }
        sheet.show(parentFragmentManager, "OrderConfirmation")
    }

    private fun startWashTracking(serviceName: String) {
        val durationMinutes = WashDuration.getDurationMinutes(serviceName)
        val durationMillis = durationMinutes * 60 * 1000L

        // 1. Notificación inmediata: Empezó
        notificationHelper.sendStatusNotification(
            "Lavado iniciado", 
            "Tu lavado $serviceName ya comenzó.", 
            1
        )

        // 2. Notificación al 50%: En proceso
        handler.postDelayed({
            notificationHelper.sendStatusNotification(
                "Lavado en proceso", 
                "Tu lavado $serviceName está a la mitad.", 
                2
            )
        }, durationMillis / 2)

        // 3. Notificación al 90%: Ya casi termina
        handler.postDelayed({
            notificationHelper.sendStatusNotification(
                "Casi listo", 
                "Tu lavado $serviceName ya casi termina.", 
                3
            )
        }, (durationMillis * 0.9).toLong())

        // 4. Notificación final: Terminó
        handler.postDelayed({
            notificationHelper.sendStatusNotification(
                "Lavado finalizado", 
                "¡Tu auto quedó impecable!", 
                4
            )
            Toast.makeText(requireContext(), "¡Lavado finalizado!", Toast.LENGTH_LONG).show()
        }, durationMillis)
    }

    override fun onDestroyView() {
        super.onDestroyView()
        handler.removeCallbacksAndMessages(null)
        _binding = null
    }
}