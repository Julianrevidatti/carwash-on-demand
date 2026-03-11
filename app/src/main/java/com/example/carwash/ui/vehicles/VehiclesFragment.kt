package com.example.carwash.ui.vehicles

import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import android.widget.EditText
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.carwash.R
import com.google.android.material.bottomsheet.BottomSheetDialog

// Modelo de datos para el vehículo
data class MyVehicle(val name: String)

class VehiclesFragment : Fragment(R.layout.fragment_vehicles) {

    private var vehicleList = mutableListOf<MyVehicle>()

    // Declaramos las vistas como variables de clase para que updateUI las encuentre
    private lateinit var btnAdd: Button
    private lateinit var tvCount: TextView
    private lateinit var emptyState: View
    private lateinit var recyclerView: RecyclerView

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Inicializamos las vistas del layout principal
        btnAdd = view.findViewById(R.id.btnAddVehicle)
        tvCount = view.findViewById(R.id.tvVehicleCount)
        emptyState = view.findViewById(R.id.emptyStateVehicles)
        recyclerView = view.findViewById(R.id.rvVehicles)

        recyclerView.layoutManager = LinearLayoutManager(context)

        // BOTÓN AGREGAR: Ahora llama al diálogo real
        btnAdd.setOnClickListener {
            if (vehicleList.size < 3) {
                showAddVehicleDialog() // <--- LLAMA A LA FUNCIÓN DEL FORMULARIO
            } else {
                Toast.makeText(requireContext(), "Límite de 3 alcanzado", Toast.LENGTH_SHORT).show()
            }
        }

        updateUI()
    }

    // Función para actualizar la pantalla principal
    private fun updateUI() {
        tvCount.text = "${vehicleList.size}/3 vehículos guardados"

        if (vehicleList.isEmpty()) {
            emptyState.visibility = View.VISIBLE
            recyclerView.visibility = View.GONE
        } else {
            emptyState.visibility = View.GONE
            recyclerView.visibility = View.VISIBLE
        }

        if (vehicleList.size >= 3) {
            btnAdd.isEnabled = false
            btnAdd.alpha = 0.5f
            btnAdd.text = "Límite alcanzado"
        } else {
            btnAdd.isEnabled = true
            btnAdd.alpha = 1.0f
            btnAdd.text = "Agregar Vehículo"
        }
    }

    // FUNCIÓN QUE ABRE EL FORMULARIO DESPLEGABLE
    private fun showAddVehicleDialog() {
        val dialog = BottomSheetDialog(requireContext())
        // Inflamos el XML del formulario que creamos antes
        val view = layoutInflater.inflate(R.layout.layout_add_vehicle_bottom_sheet, null)

        val etBrand = view.findViewById<EditText>(R.id.etBrand)
        val etModel = view.findViewById<EditText>(R.id.etModel)
        val etPlate = view.findViewById<EditText>(R.id.etPlate)
        val etType = view.findViewById<EditText>(R.id.etType)
        val btnConfirm = view.findViewById<Button>(R.id.btnConfirm)

        btnConfirm.setOnClickListener {
            val brand = etBrand.text.toString().trim()
            val model = etModel.text.toString().trim()
            val plate = etPlate.text.toString().trim()
            val type = etType.text.toString().trim()

            if (brand.isNotEmpty() && model.isNotEmpty() && plate.isNotEmpty() && type.isNotEmpty()) {
                // Creamos el vehículo y lo agregamos a la lista
                val newVehicle = MyVehicle("$brand $model ($plate) $type")
                vehicleList.add(newVehicle)

                updateUI() // Refrescamos la pantalla de atrás
                dialog.dismiss() // Cerramos el formulario
                Toast.makeText(requireContext(), "Vehículo guardado", Toast.LENGTH_SHORT).show()
            } else {
                Toast.makeText(requireContext(), "Por favor, completa todos los campos", Toast.LENGTH_SHORT).show()
            }
        }

        dialog.setContentView(view)
        dialog.show()
    }
}