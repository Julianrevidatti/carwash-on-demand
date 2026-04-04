package com.example.carwash

import android.os.Bundle
import android.util.Log
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.navigation.fragment.NavHostFragment
import androidx.navigation.ui.setupWithNavController
import com.example.carwash.databinding.ActivityMainBinding
import com.example.carwash.utils.validators.FirebaseSeed // Asegúrate de la ruta correcta
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore

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

        // --- SEED PARA LAVADORES ---
         FirebaseSeed.loadAll()

        val db = FirebaseFirestore.getInstance()
    }
}