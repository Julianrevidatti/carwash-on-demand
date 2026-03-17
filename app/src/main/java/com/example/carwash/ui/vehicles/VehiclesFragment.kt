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
import com.example.carwash.data.repository.VehicleRepository
import com.google.android.material.bottomsheet.BottomSheetDialog

class VehiclesFragment : Fragment(R.layout.fragment_vehicles) {

    private lateinit var btnAdd: Button
    private lateinit var tvCount: TextView
    private lateinit var emptyState: View
    private lateinit var recyclerView: RecyclerView
    private lateinit var adapter: VehiclesAdapter

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        btnAdd = view.findViewById(R.id.btnAddVehicle)
        tvCount = view.findViewById(R.id.tvVehicleCount)
        emptyState = view.findViewById(R.id.emptyStateVehicles)
        recyclerView = view.findViewById(R.id.rvVehicles)

        // Usamos VehicleRepository como fuente de verdad
        adapter = VehiclesAdapter(
            VehicleRepository.getVehicles().toMutableList(),
            onEditClick = { vehicle, position -> showEditVehicleDialog(vehicle, position) },
            onDeleteClick = { position ->
                VehicleRepository.removeVehicle(position)
                adapter.removeVehicle(position)
                updateUI()
            }
        )

        recyclerView.layoutManager = LinearLayoutManager(context)
        recyclerView.adapter = adapter

        btnAdd.setOnClickListener {
            if (VehicleRepository.getVehicles().size < 3) {
                showAddVehicleDialog()
            } else {
                Toast.makeText(requireContext(), "Límite de 3 vehículos alcanzado", Toast.LENGTH_SHORT).show()
            }
        }

        updateUI()
    }

    private fun updateUI() {
        val count = VehicleRepository.getVehicles().size
        tvCount.text = "$count/3 vehículos guardados"

        if (count == 0) {
            emptyState.visibility = View.VISIBLE
            recyclerView.visibility = View.GONE
        } else {
            emptyState.visibility = View.GONE
            recyclerView.visibility = View.VISIBLE
        }

        if (count >= 3) {
            btnAdd.isEnabled = false
            btnAdd.alpha = 0.5f
            btnAdd.text = "Límite alcanzado"
        } else {
            btnAdd.isEnabled = true
            btnAdd.alpha = 1.0f
            btnAdd.text = "Agregar Vehículo"
        }
    }

    private fun showAddVehicleDialog() {
        val dialog = BottomSheetDialog(requireContext())
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
                val newVehicle = Vehicle(name = model, brand = brand, plate = plate, type = type)
                VehicleRepository.addVehicle(newVehicle)
                adapter.addVehicle(newVehicle)
                updateUI()
                dialog.dismiss()
                Toast.makeText(requireContext(), "Vehículo guardado", Toast.LENGTH_SHORT).show()
            } else {
                Toast.makeText(requireContext(), "Por favor, completa todos los campos", Toast.LENGTH_SHORT).show()
            }
        }

        dialog.setContentView(view)
        dialog.show()
    }

    private fun showEditVehicleDialog(vehicle: Vehicle, position: Int) {
        val dialog = BottomSheetDialog(requireContext())
        val view = layoutInflater.inflate(R.layout.layout_add_vehicle_bottom_sheet, null)

        val etBrand = view.findViewById<EditText>(R.id.etBrand)
        val etModel = view.findViewById<EditText>(R.id.etModel)
        val etPlate = view.findViewById<EditText>(R.id.etPlate)
        val etType = view.findViewById<EditText>(R.id.etType)
        val btnConfirm = view.findViewById<Button>(R.id.btnConfirm)

        // Pre-llenar con datos existentes
        etBrand.setText(vehicle.brand)
        etModel.setText(vehicle.name)
        etPlate.setText(vehicle.plate)
        etType.setText(vehicle.type)
        btnConfirm.text = "Guardar cambios"

        btnConfirm.setOnClickListener {
            val brand = etBrand.text.toString().trim()
            val model = etModel.text.toString().trim()
            val plate = etPlate.text.toString().trim()
            val type = etType.text.toString().trim()

            if (brand.isNotEmpty() && model.isNotEmpty() && plate.isNotEmpty() && type.isNotEmpty()) {
                val updated = Vehicle(name = model, brand = brand, plate = plate, type = type)
                VehicleRepository.updateVehicle(position, updated)
                adapter.updateVehicle(position, updated)
                dialog.dismiss()
                Toast.makeText(requireContext(), "Vehículo actualizado", Toast.LENGTH_SHORT).show()
            } else {
                Toast.makeText(requireContext(), "Por favor, completa todos los campos", Toast.LENGTH_SHORT).show()
            }
        }

        dialog.setContentView(view)
        dialog.show()
    }
}