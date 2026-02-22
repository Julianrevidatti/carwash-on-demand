# ⚠️⚠️⚠️ CREDENCIALES DE PRODUCCIÓN - DINERO REAL ⚠️⚠️⚠️

## Cambios Realizados

Se han actualizado las credenciales de Mercado Pago a **PRODUCCIÓN** en el archivo `.env`.

## ⚠️ PASOS CRÍTICOS ANTES DE PROBAR

### 1. Actualizar Secret en Supabase

**IMPORTANTE:** Debes actualizar el secret `MP_ACCESS_TOKEN` en Supabase con las credenciales de PRODUCCIÓN:

1. Ve a: https://supabase.com/dashboard/project/qeltuiqarfhymbhkdyan/settings/functions
2. Busca el secret `MP_ACCESS_TOKEN`
3. **EDITA** (no agregues uno nuevo) y cambia el valor a:
   ```
   APP_USR-8245479636224885-112818-229697f5fb061b292ad1996f403276d1-430387272
   ```
4. Guarda

### 2. Reiniciar el Servidor

```bash
# Detener el servidor (Ctrl+C en la terminal)
# Reiniciar
npm run dev
```

## ⚠️ ADVERTENCIAS IMPORTANTES

- ✅ Estás usando **credenciales de PRODUCCIÓN**
- ✅ Los pagos que hagas serán **REALES**
- ✅ Se **cobrará dinero real** de tu tarjeta
- ✅ Las suscripciones generarán **cargos mensuales automáticos**

## Montos de los Planes

- **Plan BASIC**: $9.999 ARS/mes
- **Plan PRO**: $13.999 ARS/mes
- **Plan ULTIMATE**: $29.999 ARS/mes

## Recomendación

Para la primera prueba, te sugiero:
1. Crear una suscripción al **Plan BASIC** ($9.999)
2. Verificar que funciona correctamente
3. **Cancelar la suscripción inmediatamente** desde Mercado Pago si solo es una prueba

## Cómo Cancelar una Suscripción

Si solo quieres probar y no mantener la suscripción activa:

1. Ve a: https://www.mercadopago.com.ar/subscriptions
2. Busca la suscripción creada
3. Click en "Cancelar suscripción"

O desde el panel de desarrolladores: https://www.mercadopago.com.ar/developers/panel/subscriptions
