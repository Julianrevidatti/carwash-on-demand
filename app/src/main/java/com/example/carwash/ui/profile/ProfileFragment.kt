package com.example.carwash.ui.profile

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import androidx.fragment.app.Fragment
import com.example.carwash.R
import com.example.carwash.ui.auth.LoginActivity
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore

class ProfileFragment : Fragment() {

    private lateinit var auth: FirebaseAuth
    private lateinit var db: FirebaseFirestore

    private lateinit var tvUserName: TextView
    private lateinit var tvUserEmail: TextView
    private lateinit var tvUserPhone: TextView
    private lateinit var tvUserAddress: TextView
    private lateinit var btnLogout: Button

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val root = inflater.inflate(R.layout.fragment_profile, container, false)
        
        auth = FirebaseAuth.getInstance()
        db = FirebaseFirestore.getInstance()

        tvUserName = root.findViewById(R.id.tvUserName)
        tvUserEmail = root.findViewById(R.id.tvUserEmail)
        tvUserPhone = root.findViewById(R.id.tvUserPhone)
        tvUserAddress = root.findViewById(R.id.tvUserAddress)
        btnLogout = root.findViewById(R.id.btnLogout)

        loadUserProfile()

        btnLogout.setOnClickListener {
            auth.signOut()
            startActivity(Intent(requireContext(), LoginActivity::class.java))
            requireActivity().finish()
        }

        return root
    }

    private fun loadUserProfile() {
        val user = auth.currentUser
        if (user != null) {
            tvUserEmail.text = user.email ?: "Sin Correo"
            
            db.collection("users").document(user.uid).get()
                .addOnSuccessListener { document ->
                    if (document.exists()) {
                        val name = document.getString("name") ?: "Usuario"
                        val phone = document.getString("phone") ?: "Sin Teléfono"
                        val address = document.getString("address") ?: "Sin Dirección"
                        
                        tvUserName.text = name
                        tvUserPhone.text = phone
                        tvUserAddress.text = address
                    }
                }
                .addOnFailureListener {
                    tvUserName.text = "Error cargando perfil"
                }
        }
    }
}
