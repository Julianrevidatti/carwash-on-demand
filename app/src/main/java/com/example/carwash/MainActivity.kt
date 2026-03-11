package com.example.carwash

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.navigation.fragment.NavHostFragment
import androidx.navigation.ui.setupWithNavController
import com.example.carwash.databinding.ActivityMainBinding
import com.example.carwash.ui.auth.LoginActivity

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // RESTAURADO EL LOGIN
        /*val fromLogin = intent.getBooleanExtra("FROM_LOGIN", false)
        if (!fromLogin) {
            startActivity(Intent(this, LoginActivity::class.java))
            finish()
            return
        }*/

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val navHostFragment =
            supportFragmentManager.findFragmentById(
                R.id.nav_host_fragment_activity_main
            ) as NavHostFragment

        val navController = navHostFragment.navController
        binding.navView.setupWithNavController(navController)
    }
}
