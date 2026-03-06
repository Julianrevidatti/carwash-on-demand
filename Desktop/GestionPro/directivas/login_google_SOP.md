# Directiva: Login con Google (SaaS SSO)

## Objetivo
Permitir a los usuarios y administradores iniciar sesión o registrarse en Gestión Now usando sus cuentas de Google. Este proceso se gestionará a través de Supabase Authentication.

## Componentes Involucrados
1.  **Frontend (React):**
    *   `components/SupabaseAuthLogin.tsx`: Interfaz del login. Agregar un botón de "Iniciar sesión con Google" e implementar la función de login con Supabase.
2.  **Backend (Supabase):**
    *   Autenticación de Supabase (OAuth).
    *   La base de datos se encargará del registro de usuarios mediante el ciclo regular del onAuthStateChange en `App.tsx` que crea un "Tenant" base automáticamente.

## Lógica de Ejecución (Pasos)
1.  **Modificar UI (`SupabaseAuthLogin.tsx`):**
    *   Agregar un botón secundario que diga "Continuar con Google".
    *   Asegurar que el botón sea visualmente claro.
2.  **Llamada a Supabase:**
    *   Crear la función `handleGoogleLogin`.
    *   Llamar a `await supabase.auth.signInWithOAuth({ provider: "google" })`.
    *   Manejar posibles errores de conexión capturando excepciones.

## Restricciones / Casos Borde
*   **Gestión del Proveedor de Google:** El usuario dueño del Supabase Dashboard debe asegurarse de que el proveedor "Google" esté habilitado en `Authentication > Providers` de Supabase, de lo contrario la acción fallará con un error del tipo `provider is not supported`.
*   **Dominio de Redirección:** En producción, la URL del dominio de producción debe estar registrada en la consola de Supabase y de Google Cloud Platform (Google OAuth Client). Para desarrollo, `localhost:5173` funcionará siempre que esté configurado.
*   **Merge con Cuentas Existentes:** Supabase asocia cuentas con el mismo correo electrónico si los ajustes de cuenta lo permiten. Si el usuario ya se registró con email y contraseña, al entrar con Google, y viceversa.
