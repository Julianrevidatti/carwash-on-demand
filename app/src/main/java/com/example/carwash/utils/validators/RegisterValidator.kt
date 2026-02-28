package com.example.carwash.utils.validators

object RegisterValidator {

    fun validate(
        nombre: String,
        apellido: String,
        dni: String,
        email: String,
        password: String,
        telefono: String,
        direccion: String
    ): String? {

        if (
            nombre.isBlank() || apellido.isBlank() || dni.isBlank() ||
            email.isBlank() || password.isBlank() ||
            telefono.isBlank() || direccion.isBlank()
        ) {
            return "Todos los campos son obligatorios"
        }

        if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            return "Correo electrónico inválido"
        }

        if (password.length < 6) {
            return "La contraseña debe tener al menos 6 caracteres"
        }

        if (!dni.all { it.isDigit() } || dni.length !in 7..9) {
            return "DNI inválido"
        }

        return null
    }
}