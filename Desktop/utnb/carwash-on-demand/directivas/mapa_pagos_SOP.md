# SOP: Implementación de Mapa, Pagos y Notificaciones

Este documento guía la implementación de las nuevas funcionalidades críticas: Mapa interactivo, flujo de Pago Dual (Efectivo/Mercado Pago) e Integración Total de Notificaciones.

## Mapa Interactivo (Lavado Express)
1. **Dependencias:** Añadir `com.google.android.gms:play-services-maps:18.2.0` al `build.gradle.kts`.
2. **Permisos:** Declarar `INTERNET`, `ACCESS_FINE_LOCATION` y `ACCESS_COARSE_LOCATION` en `AndroidManifest.xml`.
3. **UI:** Reemplazar el `search_bar` actual por un contenedor que incluya un `SupportMapFragment` en la pantalla principal.
4. **Lógica:** Implementar un `Marker` centrado que el usuario use para definir el punto de lavado.

## Flujo de Pago (Mercado Pago + Efectivo)
1. **Interfaz de Selección:** Crear `PaymentSelectionBottomSheet` para elegir entre:
    - **Efectivo:** Pago al finalizar.
    - **Mercado Pago:** Simulación de flujo digital.

## Notificaciones al 100%
1. **Ciclo de Vida:** Reserva Creada -> Lavador en Camino -> Lavado Iniciado -> Lavado Finalizado.
2. **Helper:** Asegurar que `NotificationHelper` use un canal de alta importancia.

## Estado de Implementación
- [x] Mapa en HomeFragment con selección de punto.
- [x] Flujo de Pago profesional (Cash/MP).
- [x] Notificaciones de ciclo de vida completo.

---
*Nota: Al añadir lógica nueva en Fragmentos o BottomSheets, asegurar la importación de `com.example.carwash.R` y las utilidades correspondientes (ej. `NotificationHelper`) para evitar errores de referencia no resuelta.*
*Nota: Se utilizó el placeholder `YOUR_MAPS_API_KEY_HERE` en el `AndroidManifest.xml`. El usuario debe reemplazarlo para la funcionalidad real del mapa.*
