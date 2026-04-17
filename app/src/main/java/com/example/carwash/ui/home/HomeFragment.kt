package com.example.carwash.ui.home

import android.app.Activity
import android.content.pm.PackageManager
import android.location.Geocoder
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import android.widget.Button
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
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
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.android.libraries.places.api.Places
import com.google.android.libraries.places.api.model.Place
import com.google.android.libraries.places.widget.Autocomplete
import com.google.android.libraries.places.widget.model.AutocompleteActivityMode
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import java.util.Locale

class HomeFragment : Fragment(), OnMapReadyCallback {

    private var _binding: FragmentHomeBinding? = null
    private val binding get() = _binding!!
    private lateinit var notificationHelper: NotificationHelper
    private val handler = Handler(Looper.getMainLooper())
    private var googleMap: GoogleMap? = null
    private lateinit var geocoder: Geocoder
    private lateinit var fusedLocationClient: FusedLocationProviderClient

    private val requestPermissionLauncher = registerForActivityResult<Array<String>, Map<String, Boolean>>(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val fineLocationGranted = permissions[android.Manifest.permission.ACCESS_FINE_LOCATION] ?: false
        val notificationsGranted = permissions[android.Manifest.permission.POST_NOTIFICATIONS] ?: false
        
        if (fineLocationGranted) {
            getCurrentLocation()
        }
        
        if (!fineLocationGranted && !notificationsGranted) {
            Toast.makeText(requireContext(), "Sin permisos, algunas funciones no estarán disponibles", Toast.LENGTH_LONG).show()
        }
    }

    private val autocompleteLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            val place = Autocomplete.getPlaceFromIntent(result.data!!)
            val latLng = place.latLng
            if (latLng != null) {
                isCameraMovedBySearch = true
                googleMap?.animateCamera(CameraUpdateFactory.newLatLngZoom(latLng, 15f))
                binding.searchBar.setText(place.address ?: place.name)
            }
        }
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentHomeBinding.inflate(inflater, container, false)
        notificationHelper = NotificationHelper(requireContext())
        geocoder = Geocoder(requireContext(), Locale.getDefault())
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(requireActivity())
        
        // Initialize Places
        try {
            val ai = requireContext().packageManager.getApplicationInfo(requireContext().packageName, PackageManager.GET_META_DATA)
            val apiKey = ai.metaData.getString("com.google.android.geo.API_KEY") ?: ""
            if (!Places.isInitialized()) {
                Places.initialize(requireContext(), apiKey)
            }
        } catch (e: Exception) { }

        val mapFragment = childFragmentManager.findFragmentById(R.id.map_fragment) as SupportMapFragment
        mapFragment.getMapAsync(this)
        
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        checkPermissions()

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
        binding.btnOrderBase.setOnClickListener { startLocationChoiceFlow("Base") }
        binding.btnOrderPremium.setOnClickListener { startLocationChoiceFlow("Premium") }
        binding.btnOrderExpress.setOnClickListener { startLocationChoiceFlow("Express") }
        binding.btnOrderDetailing.setOnClickListener { startLocationChoiceFlow("Detailing") }

        binding.btnConfirmLocation.setOnClickListener {
            val loc = binding.searchBar.text.toString()
            if(loc.isNotEmpty()) {
               confirmedLocation = loc
               Toast.makeText(requireContext(), "Ubicación confirmada", Toast.LENGTH_SHORT).show()
            } else {
               Toast.makeText(requireContext(), "Ingresa una ubicación válida", Toast.LENGTH_SHORT).show()
            }
        }
        
        binding.btnSearchLocation.setOnClickListener {
            val locationName = binding.searchBar.text.toString()
            if (locationName.isNotEmpty()) {
                Thread {
                    try {
                        val addresses = geocoder.getFromLocationName(locationName, 1)
                        if (!addresses.isNullOrEmpty()) {
                            val location = addresses[0]
                            val latLng = LatLng(location.latitude, location.longitude)
                            activity?.runOnUiThread {
                                isCameraMovedBySearch = true
                                googleMap?.animateCamera(CameraUpdateFactory.newLatLngZoom(latLng, 15f))
                            }
                        } else {
                            activity?.runOnUiThread {
                                Toast.makeText(requireContext(), "Dirección no encontrada", Toast.LENGTH_SHORT).show()
                            }
                        }
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }.start()
            }
        }
    }

    private var isCameraMovedBySearch = false
    private var confirmedLocation: String = ""

    override fun onMapReady(map: GoogleMap) {
        googleMap = map
        val initialLatLng = LatLng(-34.6037, -58.3816) // Buenos Aires
        map.moveCamera(CameraUpdateFactory.newLatLngZoom(initialLatLng, 15f))
        
        map.setOnCameraMoveStartedListener { reason ->
            if (reason == GoogleMap.OnCameraMoveStartedListener.REASON_GESTURE) {
                isCameraMovedBySearch = false
            }
        }

        map.setOnCameraIdleListener {
            if (isCameraMovedBySearch) {
                isCameraMovedBySearch = false
            } else {
                val center = map.cameraPosition.target
                updateAddressFromLocation(center)
            }
        }
    }

    private fun updateAddressFromLocation(latLng: LatLng) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            geocoder.getFromLocation(latLng.latitude, latLng.longitude, 1, object : Geocoder.GeocodeListener {
                override fun onGeocode(addresses: List<android.location.Address>) {
                    activity?.runOnUiThread {
                        if (addresses.isNotEmpty()) {
                            binding.searchBar.setText(addresses[0].getAddressLine(0))
                        } else {
                            binding.searchBar.setText("${"%.5f".format(latLng.latitude)}, ${"%.5f".format(latLng.longitude)}")
                        }
                    }
                }
                override fun onError(errorMessage: String?) {
                    activity?.runOnUiThread {
                        binding.searchBar.setText("${"%.5f".format(latLng.latitude)}, ${"%.5f".format(latLng.longitude)}")
                    }
                }
            })
        } else {
            Thread {
                try {
                    val addresses = geocoder.getFromLocation(latLng.latitude, latLng.longitude, 1)
                    activity?.runOnUiThread {
                        if (!addresses.isNullOrEmpty()) {
                            binding.searchBar.setText(addresses[0].getAddressLine(0))
                        } else {
                            binding.searchBar.setText("${"%.5f".format(latLng.latitude)}, ${"%.5f".format(latLng.longitude)}")
                        }
                    }
                } catch (e: Exception) {
                    activity?.runOnUiThread {
                        binding.searchBar.setText("${"%.5f".format(latLng.latitude)}, ${"%.5f".format(latLng.longitude)}")
                    }
                }
            }.start()
        }
    }

    private fun checkPermissions() {
        val permissions = mutableListOf<String>()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(requireContext(), android.Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                permissions.add(android.Manifest.permission.POST_NOTIFICATIONS)
            }
        }
        if (ContextCompat.checkSelfPermission(requireContext(), android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            permissions.add(android.Manifest.permission.ACCESS_FINE_LOCATION)
        }

        if (permissions.isNotEmpty()) {
            requestPermissionLauncher.launch(permissions.toTypedArray())
        } else {
            getCurrentLocation()
        }
    }

    private fun getCurrentLocation() {
        try {
            if (ContextCompat.checkSelfPermission(requireContext(), android.Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
                fusedLocationClient.lastLocation.addOnSuccessListener { location ->
                    if (location != null) {
                        val currentLatLng = LatLng(location.latitude, location.longitude)
                        googleMap?.animateCamera(CameraUpdateFactory.newLatLngZoom(currentLatLng, 15f))
                        updateAddressFromLocation(currentLatLng)
                    }
                }
            }
        } catch (e: SecurityException) { }
    }

    private fun showServiceTypeSelector() {
        val options = arrayOf("Lavado Instantáneo (Express ahora)", "Lavado Programado (Agendar)")
        MaterialAlertDialogBuilder(requireContext())
            .setTitle("Tipo de Pedido")
            .setItems(options) { _, which ->
                if (which == 0) {
                    startLocationChoiceFlow("Express", useMapOnly = true)
                } else {
                    startLocationChoiceFlow("Base", useMapOnly = false)
                }
            }
            .show()
    }

    private fun startLocationChoiceFlow(serviceName: String, useMapOnly: Boolean = false) {
        if (confirmedLocation.isEmpty()) {
            Toast.makeText(requireContext(), "Primero confirmá la ubicación tocando el botón 'Confirmar Ubicación' en el mapa.", Toast.LENGTH_LONG).show()
            return
        }
        startBookingFlow(serviceName, confirmedLocation)
    }

    private fun startBookingFlow(serviceName: String, location: String) {
        if (location.isEmpty()) {
            Toast.makeText(requireContext(), "Por favor, elegí una ubicación en el mapa", Toast.LENGTH_SHORT).show()
            return
        }

        val paymentSheet = PaymentSelectionBottomSheet { method ->
            showOrderConfirmation(serviceName, location, method)
        }
        paymentSheet.show(parentFragmentManager, "PaymentSelection")
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

        notificationHelper.sendBookingConfirmationNotification(serviceName, "ahora mismo")

        handler.postDelayed({
            notificationHelper.sendWasherOnWayNotification("Juan Pérez")
        }, 2000)

        handler.postDelayed({
            notificationHelper.sendStatusNotification("Lavado iniciado", "Tu lavado $serviceName ya comenzó.", 1)
        }, 5000)

        handler.postDelayed({
            notificationHelper.sendStatusNotification("Lavado en proceso", "Tu lavado $serviceName está a la mitad.", 2)
        }, durationMillis / 2 + 5000)

        handler.postDelayed({
            notificationHelper.sendStatusNotification("Lavado finalizado", "¡Tu auto quedó impecable!", 4)
            Toast.makeText(requireContext(), "¡Lavado finalizado!", Toast.LENGTH_LONG).show()
        }, durationMillis + 5000)
    }

    override fun onDestroyView() {
        super.onDestroyView()
        handler.removeCallbacksAndMessages(null)
        _binding = null
    }
}