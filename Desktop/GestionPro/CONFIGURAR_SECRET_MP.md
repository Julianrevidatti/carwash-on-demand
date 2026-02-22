# Guía Rápida: Configurar Secret MP_ACCESS_TOKEN en Supabase

## Problema
Error: "Token no configurado en Deno.env"

## Solución

### Paso 1: Ir a la configuración de Edge Functions
Abre este link: https://supabase.com/dashboard/project/qeltuiqarfhymbhkdyan/settings/functions

### Paso 2: Agregar el Secret
1. Busca la sección **"Secrets"** o **"Edge Function Secrets"**
2. Click en **"Add Secret"** o **"New Secret"**
3. Ingresa:
   - **Name/Key**: `MP_ACCESS_TOKEN`
   - **Value**: `APP_USR-7836901662321194-112818-94c8abbef482daff5734ac2bb68dcd4c-3023878944`
4. Click en **"Save"** o **"Add Secret"**

### Paso 3: Verificar
El secret debería aparecer en la lista como:
```
MP_ACCESS_TOKEN = APP_USR-7836901662321194-... (hidden)
```

### Paso 4: Reintentar
Una vez guardado el secret, vuelve a la aplicación y prueba crear la suscripción nuevamente.

**IMPORTANTE:** Los secrets se aplican inmediatamente, no necesitas redesplegar las funciones.
