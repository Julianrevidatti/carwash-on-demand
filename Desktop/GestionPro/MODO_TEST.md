# 🔄 Cambio a Modo TEST - Guía Rápida

## ✅ Archivos Actualizados

### 1. `.env` - Credenciales TEST
Ya actualizado con:
```
VITE_PLATFORM_MP_ACCESS_TOKEN=TEST-8245479636224885...
VITE_PLATFORM_MP_PUBLIC_KEY=TEST-d4ca53bd-da15-4761...
```

---

## ⚠️ IMPORTANTE: Actualizar Secret en Supabase

**Debes cambiar el secret `MP_ACCESS_TOKEN` en Supabase:**

1. Ve a: https://supabase.com/dashboard/project/qeltuiqarfhymbhkdyan/settings/vault/secrets

2. Busca el secret: **`MP_ACCESS_TOKEN`**

3. Edita y cambia el valor a:
   ```
   TEST-8245479636224885-112818-64399e0ef4f9ce97df87e76e30882ff8-430387272
   ```

4. Guarda los cambios

---

## 📋 Crear Planes TEST en Mercado Pago

**IMPORTANTE:** Los planes deben crearse en el **panel TEST** de Mercado Pago, no en producción.

### Pasos:

1. Ve a: https://www.mercadopago.com.ar/developers/panel/app/430387272/test-credentials

2. Cambia al modo **TEST** (toggle superior derecho)

3. Ve a **Productos → Planes de suscripción**

4. Crea 3 planes:

| Plan | Código Referencia | Precio | Frecuencia |
|------|------------------|--------|-----------|
| Plan Básico | `BASIC` | $9.999 | Mensual |
| Plan PRO | `PRO` | $13.999 | Mensual |
| Plan Ultimate | `ULTIMATE` | $29.999 | Mensual |

5. **URL de retorno** en cada plan:
   ```
   https://gestionnow.site/payment-success
   ```

---

## 🧪 Tarjetas de Prueba

Para probar el flujo de pago:

### ✅ Aprobada Inmediatamente
- **Número:** `5031 7557 3453 0604`
- **CVV:** `123`
- **Vencimiento:** `11/25`

### ❌ Rechazada
- **Número:** `5031 4332 1540 6351`
- **CVV:** `123`
- **Vencimiento:** `11/25`

### ⏳ Pendiente
- **Número:** `5031 7557 3453 0604`
- **CVV:** `123`
- **Vencimiento:** `11/25`
- Durante el pago elegir "Pendiente"

---

## 📝 Checklist de Testing

- [ ] Secret `MP_ACCESS_TOKEN` actualizado en Supabase (TEST)
- [ ] Planes creados en MP modo TEST (BASIC, PRO, ULTIMATE)
- [ ] Frontend reiniciado (`npm run dev`)
- [ ] Probar plan BASIC con tarjeta aprobada
- [ ] Verificar redirección a `/payment-success`
- [ ] Confirmar que plan se activa en Supabase
- [ ] Verificar que no hay cargos reales

---

## 🔄 Para Volver a Producción

Cuando estés listo para producción:

1. Edita `.env` con credenciales PROD:
   ```
   VITE_PLATFORM_MP_ACCESS_TOKEN=APP_USR-8245479636224885...
   ```

2. Actualiza el secret en Supabase a PROD

3. Crea los mismos planes pero en modo PRODUCCIÓN

---

## 🚨 Diferencias Modo TEST vs PRODUCCIÓN

| Aspecto | TEST | PRODUCCIÓN |
|---------|------|------------|
| **Cargos** | ❌ No hay cargos reales | ✅ Cargos reales |
| **Tarjetas** | Solo tarjetas de prueba | Tarjetas reales |
| **Planes** | Panel TEST de MP | Panel PROD de MP |
| **Token** | `TEST-xxx` | `APP_USR-xxx` |
| **Logs** | Visibles en dashboard | Visibles en dashboard |

---

**¿Todo listo?** Actualiza el secret en Supabase y luego crea los planes TEST en Mercado Pago.
