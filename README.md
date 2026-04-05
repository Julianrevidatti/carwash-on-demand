# Car Wash on Demand 🚗🚿

**Car Wash on Demand** es una aplicación Android moderna diseñada para facilitar la solicitud de servicios de lavado de vehículos a domicilio. La plataforma conecta a los usuarios con proveedores de servicios, permitiendo una gestión eficiente de ubicaciones, pagos y seguimiento en tiempo real.

## ✨ Características Principales

- **Selección de Ubicación**: Integración con Google Maps para seleccionar el punto exacto del servicio.
- **Pagos Flexibles**: Soporte para múltiples métodos de pago (Efectivo / Mercado Pago).
- **Notificaciones en Tiempo Real**: Sistema de alertas para el seguimiento del estado del servicio.
- **Gestión de Sesión**: Sistema de autenticación seguro para usuarios y lavadores.
- **Interfaz Intuitiva**: Diseño moderno basado en Material Design con navegación fluida.

## 🛠️ Tecnologías Utilizadas

- **Lenguaje**: Kotlin
- **Arquitectura**: MVVM (Model-View-ViewModel)
- **UI**: View Binding / Material Design Components
- **Mapas**: Google Maps Platform SDK
- **Backend/Base de Datos**: Firebase (Firestore & Auth)
- **Inyección de Dependencias/Build**: Gradle (Kotlin DSL)

## 🚀 Configuración del Proyecto

Para ejecutar este proyecto localmente, asegúrate de seguir estos pasos de seguridad:

### 1. Claves de API (Seguridad)
El proyecto utiliza un archivo `.env` para gestionar secretos. Crea un archivo `.env` en la raíz del proyecto con la siguiente variable:

```env
GOOGLE_MAPS_KEY=TU_API_KEY_AQUI
```

*Nota: Esta clave nunca debe ser subida al repositorio público.*

### 2. Firebase
Asegúrate de incluir tu propio archivo `app/google-services.json` descargado desde la consola de Firebase.

### 3. Compilación
Abre el proyecto en **Android Studio** (Koala o superior) y sincroniza los archivos de Gradle.

---
Desarrollado con ❤️ por Julian Revidatti.
