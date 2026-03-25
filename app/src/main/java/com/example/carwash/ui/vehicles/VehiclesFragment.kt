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
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore

class VehiclesFragment : Fragment(R.layout.fragment_vehicles) {

    private lateinit var btnAdd: Button
    private lateinit var tvCount: TextView
    private lateinit var emptyState: View
    private lateinit var recyclerView: RecyclerView
    private lateinit var adapter: VehiclesAdapter
    
    private val db = FirebaseFirestore.getInstance()
    private val auth = FirebaseAuth.getInstance()

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        btnAdd = view.findViewById(R.id.btnAddVehicle)
        tvCount = view.findViewById(R.id.tvVehicleCount)
        emptyState = view.findViewById(R.id.emptyStateVehicles)
        recyclerView = view.findViewById(R.id.rvVehicles)

        adapter = VehiclesAdapter(
            mutableListOf(), // Empezamos vacío hasta que cargue Firebase
            onEditClick = { vehicle, position -> showEditVehicleDialog(vehicle, position) },
            onDeleteClick = { position -> deleteVehicleFromFirebase(position) }
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

        // Cargar vehículos desde Firebase al entrar
        loadVehiclesFromFirebase()
    }

    private fun loadVehiclesFromFirebase() {
        val uid = auth.currentUser?.uid ?: return
        
        db.collection("users").document(uid).collection("vehicles")
            .get()
            .addOnSuccessListener { snapshot ->
                val vehicleList = mutableListOf<Vehicle>()
                for (doc in snapshot.documents) {
                    val v = Vehicle(
                        name = doc.getString("name") ?: "",
                        brand = doc.getString("brand") ?: "",
                        plate = doc.id, // Usamos el ID del documento como patente
                        type = doc.getString("type") ?: ""
                    )
                    vehicleList.add(v)
                }
                VehicleRepository.setVehicles(vehicleList)
                adapter.updateList(vehicleList)
                updateUI()
            }
            .addOnFailureListener {
                Toast.makeText(requireContext(), "Error al cargar vehículos", Toast.LENGTH_SHORT).show()
            }
    }

    private fun deleteVehicleFromFirebase(position: Int) {
        val uid = auth.currentUser?.uid ?: return
        val vehicle = VehicleRepository.getVehicles()[position]

        db.collection("users").document(uid).collection("vehicles")
            .document(vehicle.plate)
            .delete()
            .addOnSuccessListener {
                VehicleRepository.removeVehicle(position)
                adapter.removeVehicle(position)
                updateUI()
                Toast.makeText(requireContext(), "Vehículo eliminado", Toast.LENGTH_SHORT).show()
            }
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

        btnAdd.isEnabled = count < 3
        btnAdd.alpha = if (count < 3) 1.0f else 0.5f
        btnAdd.text = if (count < 3) "Agregar Vehículo" else "Límite alcanzado"
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
                val uid = auth.currentUser?.uid ?: return@setOnClickListener
                val newVehicle = Vehicle(name = model, brand = brand, plate = plate, type = type)

                db.collection("users").document(uid).collection("vehicles")
                    .document(plate)
                    .set(newVehicle)
                    .addOnSuccessListener {
                        VehicleRepository.addVehicle(newVehicle)
                        adapter.addVehicle(newVehicle)
                        updateUI()
                        dialog.dismiss()
                        Toast.makeText(requireContext(), "Vehículo guardado en la nube", Toast.LENGTH_SHORT).show()
                    }
            } else {
                Toast.makeText(requireContext(), "Completa todos los campos", Toast.LENGTH_SHORT).show()
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

        etBrand.setText(vehicle.brand)
        etModel.setText(vehicle.name)
        etPlate.setText(vehicle.plate)
        etPlate.isEnabled = false // La patente no se debería editar ya que es el ID
        etType.setText(vehicle.type)
        btnConfirm.text = "Actualizar"

        btnConfirm.setOnClickListener {
            val brand = etBrand.text.toString().trim()
            val model = etModel.text.toString().trim()
            val type = etType.text.toString().trim()

            if (brand.isNotEmpty() && model.isNotEmpty() && type.isNotEmpty()) {
                val uid = auth.currentUser?.uid ?: return@setOnClickListener
                val updated = Vehicle(name = model, brand = brand, plate = vehicle.plate, type = type)

                db.collection("users").document(uid).collection("vehicles")
                    .document(vehicle.plate)
                    .set(updated)
                    .addOnSuccessListener {
                        VehicleRepository.updateVehicle(position, updated)
                        adapter.updateVehicle(position, updated)
                        dialog.dismiss()
                        Toast.makeText(requireContext(), "Actualizado en Firebase", Toast.LENGTH_SHORT).show()
                    }
            }
        }
        dialog.setContentView(view)
        dialog.show()
    }
}
