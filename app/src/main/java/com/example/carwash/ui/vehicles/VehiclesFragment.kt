package com.example.carwash.ui.vehicles

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.carwash.R
import com.example.carwash.databinding.FragmentVehiclesBinding
import com.google.android.material.bottomsheet.BottomSheetDialog
import com.google.android.material.button.MaterialButton

class VehiclesFragment : Fragment() {

    private var _binding: FragmentVehiclesBinding? = null
    private val binding get() = _binding!!
    private lateinit var adapter: VehiclesAdapter
    private val vehicleList = mutableListOf<Vehicle>()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentVehiclesBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        setupRecyclerView()

        binding.btnBack.setOnClickListener {
            requireActivity().onBackPressedDispatcher.onBackPressed()
        }

        binding.fabAddVehicle.setOnClickListener {
            showAddVehicleDialog()
        }
    }

    private fun setupRecyclerView() {
        if (vehicleList.isEmpty()) {
            vehicleList.add(Vehicle("Gol Power", "Volkswagen", "ABC123", "Sedan"))
        }

        adapter = VehiclesAdapter(vehicleList) { vehicle, position ->
            showEditVehicleDialog(vehicle, position)
        }
        binding.rvVehicles.apply {
            layoutManager = LinearLayoutManager(context)
            this.adapter = this@VehiclesFragment.adapter
        }
    }

    private fun showAddVehicleDialog() {
        val dialog = BottomSheetDialog(requireContext())
        val view = layoutInflater.inflate(R.layout.layout_add_vehicle_bottom_sheet, null)
        
        val tvTitle = view.findViewById<TextView>(R.id.tvSheetTitle)
        val etBrand = view.findViewById<EditText>(R.id.etBrand)
        val etModel = view.findViewById<EditText>(R.id.etModel)
        val etPlate = view.findViewById<EditText>(R.id.etPlate)
        val etType = view.findViewById<EditText>(R.id.etType)
        val btnConfirm = view.findViewById<MaterialButton>(R.id.btnConfirm)
        val btnCancel = view.findViewById<MaterialButton>(R.id.btnCancel)

        tvTitle.text = "Agregar Vehículo"

        btnConfirm.setOnClickListener {
            val brand = etBrand.text.toString()
            val model = etModel.text.toString()
            val plate = etPlate.text.toString()
            val type = etType.text.toString()

            if (brand.isNotEmpty() && model.isNotEmpty() && plate.isNotEmpty() && type.isNotEmpty()) {
                val newVehicle = Vehicle(model, brand, plate, type)
                adapter.addVehicle(newVehicle)
                dialog.dismiss()
            }
        }

        btnCancel.setOnClickListener {
            dialog.dismiss()
        }

        dialog.setContentView(view)
        dialog.show()
    }

    private fun showEditVehicleDialog(vehicle: Vehicle, position: Int) {
        val dialog = BottomSheetDialog(requireContext())
        val view = layoutInflater.inflate(R.layout.layout_add_vehicle_bottom_sheet, null)

        val tvTitle = view.findViewById<TextView>(R.id.tvSheetTitle)
        val etBrand = view.findViewById<EditText>(R.id.etBrand)
        val etModel = view.findViewById<EditText>(R.id.etModel)
        val etPlate = view.findViewById<EditText>(R.id.etPlate)
        val etType = view.findViewById<EditText>(R.id.etType)
        val btnConfirm = view.findViewById<MaterialButton>(R.id.btnConfirm)
        val btnCancel = view.findViewById<MaterialButton>(R.id.btnCancel)

        // CAMBIAR TÍTULO PARA EDICIÓN
        tvTitle.text = "Editar Vehículo"
        
        // CARGAR DATOS EXISTENTES
        etBrand.setText(vehicle.brand)
        etModel.setText(vehicle.name)
        etPlate.setText(vehicle.plate)
        etType.setText(vehicle.type)

        btnConfirm.setOnClickListener {
            val brand = etBrand.text.toString()
            val model = etModel.text.toString()
            val plate = etPlate.text.toString()
            val type = etType.text.toString()

            if (brand.isNotEmpty() && model.isNotEmpty() && plate.isNotEmpty() && type.isNotEmpty()) {
                val updatedVehicle = Vehicle(model, brand, plate, type)
                adapter.updateVehicle(position, updatedVehicle)
                dialog.dismiss()
            }
        }

        btnCancel.setOnClickListener {
            dialog.dismiss()
        }

        dialog.setContentView(view)
        dialog.show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
