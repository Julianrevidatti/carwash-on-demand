package com.example.carwash.ui.vehicles

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.example.carwash.databinding.ItemVehicleBinding

class VehiclesAdapter(private val vehicles: MutableList<Vehicle>) :
    RecyclerView.Adapter<VehiclesAdapter.VehicleViewHolder>() {

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
            tvVehicleType.text = "Tipo de vehiculo: ${vehicle.type}"
            
            btnDelete.setOnClickListener {
                vehicles.removeAt(holder.adapterPosition)
                notifyItemRemoved(holder.adapterPosition)
            }
        }
    }

    override fun getItemCount() = vehicles.size

    fun addVehicle(vehicle: Vehicle) {
        vehicles.add(vehicle)
        notifyItemInserted(vehicles.size - 1)
    }
}
