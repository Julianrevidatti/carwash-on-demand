package com.example.carwash.ui.vehicles

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.example.carwash.databinding.ItemVehicleBinding

class VehiclesAdapter(
    private val vehicles: MutableList<Vehicle>,
    private val onEditClick: (Vehicle, Int) -> Unit,
    private val onDeleteClick: (Int) -> Unit
) : RecyclerView.Adapter<VehiclesAdapter.VehicleViewHolder>() {

    class VehicleViewHolder(val binding: ItemVehicleBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VehicleViewHolder {
        val binding = ItemVehicleBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return VehicleViewHolder(binding)
    }

    override fun onBindViewHolder(holder: VehicleViewHolder, position: Int) {
        val vehicle = vehicles[position]
        holder.binding.apply {
            tvVehicleName.text = vehicle.name
            tvVehicleBrand.text = vehicle.brand
            tvVehiclePlate.text = "Patente: ${vehicle.plate}"
            tvVehicleType.text = "Tipo de vehículo: ${vehicle.type}"

            btnDelete.setOnClickListener {
                val pos = holder.adapterPosition
                if (pos != RecyclerView.NO_ID.toInt()) {
                    onDeleteClick(pos)
                }
            }

            btnEdit.setOnClickListener {
                val pos = holder.adapterPosition
                if (pos != RecyclerView.NO_ID.toInt()) {
                    onEditClick(vehicle, pos)
                }
            }
        }
    }

    override fun getItemCount() = vehicles.size

    fun addVehicle(vehicle: Vehicle) {
        vehicles.add(vehicle)
        notifyItemInserted(vehicles.size - 1)
    }

    fun updateVehicle(position: Int, vehicle: Vehicle) {
        vehicles[position] = vehicle
        notifyItemChanged(position)
    }

    fun removeVehicle(position: Int) {
        vehicles.removeAt(position)
        notifyItemRemoved(position)
    }
}