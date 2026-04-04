package com.example.carwash.ui.auth

import android.content.Intent
import android.os.Bundle
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import com.example.carwash.MainActivity
import com.example.carwash.R
import com.example.carwash.data.repository.VehicleRepository
import com.example.carwash.ui.vehicles.Vehicle
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore

class LoginActivity : AppCompatActivity() {

    private lateinit var auth: FirebaseAuth

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)

        auth = FirebaseAuth.getInstance()

        val etEmail = findViewById<EditText>(R.id.etEmailLogin)
        val etPassword = findViewById<EditText>(R.id.etPasswordLogin)
        val btnLogin = findViewById<Button>(R.id.btnLogin)
        val tvGoRegister = findViewById<TextView>(R.id.tvGoRegister)

        btnLogin.setOnClickListener {
            val email = etEmail.text.toString().trim()
            val password = etPassword.text.toString().trim()

            if (email.isEmpty() || password.isEmpty()) {
                Toast.makeText(this, "Completá email y contraseña", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            auth.signInWithEmailAndPassword(email, password)
                .addOnSuccessListener {
                    val uid = auth.currentUser?.uid ?: return@addOnSuccessListener
                    // Cargamos los vehículos del usuario antes de navegar
                    FirebaseFirestore.getInstance()
                        .collection("users").document(uid)
                        .collection("vehicles")
                        .get()
                        .addOnSuccessListener { snapshot ->
                            val vehicleList = snapshot.documents.mapNotNull { doc ->
                                Vehicle(
                                    name = doc.getString("name") ?: "",
                                    brand = doc.getString("brand") ?: "",
                                    plate = doc.id,
                                    type = doc.getString("type") ?: ""
                                )
                            }
                            VehicleRepository.setVehicles(vehicleList)
                            startActivity(Intent(this, MainActivity::class.java).apply {
                                putExtra("FROM_LOGIN", true)
                            })
                            finish()
                        }
                        .addOnFailureListener {
                            // Si falla la carga de vehículos, igual dejamos pasar
                            startActivity(Intent(this, MainActivity::class.java).apply {
                                putExtra("FROM_LOGIN", true)
                            })
                            finish()
                        }
                }
                .addOnFailureListener {
                    Toast.makeText(this, "Credenciales incorrectas", Toast.LENGTH_LONG).show()
                }
        }

        tvGoRegister.setOnClickListener {
            startActivity(Intent(this, RegisterActivity::class.java))
        }
    }
}