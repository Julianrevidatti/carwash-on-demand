package com.example.carwash.ui.auth

import android.content.Intent
import android.os.Bundle
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import com.example.carwash.MainActivity
import com.example.carwash.R
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore

class RegisterActivity : AppCompatActivity() {

    private lateinit var auth: FirebaseAuth

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_register)

        auth = FirebaseAuth.getInstance()

        val etNombre = findViewById<EditText>(R.id.etNombre)
        val etApellido = findViewById<EditText>(R.id.etApellido)
        val etDireccion = findViewById<EditText>(R.id.etDireccion)
        val etTelefono = findViewById<EditText>(R.id.etTelefono)
        val etEmail = findViewById<EditText>(R.id.etEmail)
        val etPassword = findViewById<EditText>(R.id.etPassword)
        val btnRegister = findViewById<Button>(R.id.btnRegister)
        val tvBackLogin = findViewById<TextView>(R.id.tvBackLogin)

        btnRegister.setOnClickListener {

            val nombre = etNombre.text.toString().trim()
            val apellido = etApellido.text.toString().trim()
            val direccion = etDireccion.text.toString().trim()
            val telefono = etTelefono.text.toString().trim()
            val email = etEmail.text.toString().trim()
            val password = etPassword.text.toString().trim()

            if (nombre.isEmpty() || apellido.isEmpty() || direccion.isEmpty() ||
                telefono.isEmpty() || email.isEmpty() || password.isEmpty()
            ) {
                Toast.makeText(this, "Completá todos los campos", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            if (password.length < 6) {
                Toast.makeText(this, "La contraseña debe tener al menos 6 caracteres", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            auth.createUserWithEmailAndPassword(email, password)
                .addOnSuccessListener {

                    val db = FirebaseFirestore.getInstance()
                    val user = auth.currentUser
                    if (user != null) {
                        val userMap = hashMapOf(
                            "name" to "$nombre $apellido",
                            "address" to direccion,
                            "phone" to telefono,
                            "email" to email
                        )
                        db.collection("users").document(user.uid).set(userMap)
                            .addOnSuccessListener {
                                Toast.makeText(this@RegisterActivity, "Registro exitoso", Toast.LENGTH_SHORT).show()
                                startActivity(Intent(this@RegisterActivity, MainActivity::class.java))
                                finish()
                            }
                            .addOnFailureListener { e ->
                                Toast.makeText(this@RegisterActivity, "Error al guardar datos: ${e.message}", Toast.LENGTH_LONG).show()
                            }
                    } else {
                        Toast.makeText(this@RegisterActivity, "Registro exitoso", Toast.LENGTH_SHORT).show()
                        startActivity(Intent(this@RegisterActivity, MainActivity::class.java))
                        finish()
                    }
                }
                .addOnFailureListener {
                    Toast.makeText(
                        this,
                        "Error al registrar: ${it.message}",
                        Toast.LENGTH_LONG
                    ).show()
                }
        }

        tvBackLogin.setOnClickListener {
            finish()
        }
    }
}