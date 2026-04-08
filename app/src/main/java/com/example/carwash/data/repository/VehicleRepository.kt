package com.example.carwash.data.repository

import com.example.carwash.ui.vehicles.Vehicle

object VehicleRepository {
    private val vehicles = mutableListOf<Vehicle>()

    fun getVehicles(): List<Vehicle> = vehicles

    fun setVehicles(newVehicles: List<Vehicle>) {
        vehicles.clear()
        vehicles.addAll(newVehicles)
    }

    fun addVehicle(vehicle: Vehicle) {
        // Evitar duplicados por patente
        if (vehicles.none { it.plate == vehicle.plate }) {
            vehicles.add(vehicle)
        }
    }

    fun removeVehicle(index: Int) {
        if (index in vehicles.indices) {
            vehicles.removeAt(index)
        }
    }
    
    fun updateVehicle(index: Int, vehicle: Vehicle) {
        if (index in vehicles.indices) {
            vehicles[index] = vehicle
        }
    }

    fun clear() {
        vehicles.clear()
    }
}
