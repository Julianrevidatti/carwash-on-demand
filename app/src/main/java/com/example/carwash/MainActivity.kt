package com.example.carwash

import android.os.Bundle
import android.util.Log
import androidx.appcompat.app.AppCompatActivity
import androidx.navigation.fragment.NavHostFragment
import androidx.navigation.ui.setupWithNavController
import com.example.carwash.databinding.ActivityMainBinding
import com.example.carwash.utils.FirebaseSeed
import com.google.firebase.firestore.FirebaseFirestore
import com.example.carwash.utils.FirebaseSeedUsuarios

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val navHostFragment =
            supportFragmentManager.findFragmentById(
                R.id.nav_host_fragment_activity_main
            ) as NavHostFragment

        val navController = navHostFragment.navController
        binding.navView.setupWithNavController(navController)

        // Test Firebase — al final, después del setContentView
        FirebaseFirestore.getInstance()
            .collection("test").document("ping")
            .set(mapOf("ok" to true))
            .addOnSuccessListener { Log.d("TEST", "Conexion OK") }
            .addOnFailureListener { e -> Log.e("TEST", "Fallo: $e") }

        // Cargar datos de prueba — solo primera vez, después comentar
        //FirebaseSeed.cargarTodo()
        //FirebaseSeedUsuarios.cargarTodo()
    }
}