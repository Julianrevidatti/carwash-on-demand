package com.example.carwash.ui

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel

data class BookingItem(val serviceName: String, val price: String, val date: String)

class BookingViewModel : ViewModel() {
    private val _bookings = MutableLiveData<MutableList<BookingItem>>(mutableListOf())
    val bookings: LiveData<MutableList<BookingItem>> = _bookings

    fun addBooking(serviceName: String, price: String) {
        val currentList = _bookings.value ?: mutableListOf()
        // Agregamos una fecha ficticia por ahora
        currentList.add(BookingItem(serviceName, price, "Programado para hoy"))
        _bookings.value = currentList
    }
}