package com.example.carwash.utils.Timer

import android.os.Handler
import android.os.Looper

object WashTimerManager {

    private val handler = Handler(Looper.getMainLooper())

    fun scheduleWashEnd(
        endTimestamp: Long,
        onFinish: () -> Unit
    ) {

        val delay = endTimestamp - System.currentTimeMillis()

        if (delay <= 0) {
            onFinish()
            return
        }

        handler.postDelayed({
            onFinish()
        }, delay)
    }
}