# Tutorial: Abrir la Caja

## Objetivo
Iniciar una sesión de caja al comienzo del día para poder realizar ventas.

---

## ¿Por qué debo abrir la caja?

El sistema **requiere que haya una sesión de caja abierta** para:
- ✅ Realizar ventas en el POS
- ✅ Registrar ingresos y egresos de efectivo
- ✅ Llevar control del dinero del día

> ⚠️ **Importante**: Sin sesión abierta, el POS estará bloqueado

<!-- SCREENSHOT: media__1771385585569.png -->

---

## Pasos Detallados

### 1. Ir al Módulo de Cierre de Caja

- En el menú lateral, busca el ícono de billetera (💼)
- Haz clic en **"Cierre de Caja"** o **"Cash Control"**

<!-- SCREENSHOT: menu_caja.png -->

---

### 2. Verificar Estado de la Caja

Al entrar, verás el estado actual:

**Si NO hay sesión abierta:**
- Aparece un mensaje: "No hay sesión activa"
- Botón grande: **"Abrir Sesión"**

**Si YA hay una sesión abierta:**
- Verás: Fecha/hora de apertura, dinero inicial, ventas del día
- En este caso, no necesitas abrirla nuevamente

<!-- SCREENSHOT: estado_caja.png -->

---

### 3. Hacer Clic en "Abrir Sesión"

Se abrirá un modal/formulario con estos campos:

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| **Monto Inicial** | Efectivo que colocas en la caja al inicio | $5.000 |
| **Responsable** | Tu nombre (se completa automáticamente) | "Juan Pérez" |
| **Fecha/Hora** | Se genera automáticamente | "17/02/2026 09:00" |

<!-- SCREENSHOT: media__1771385605132.png -->

---

### 4. Ingresar el Monto Inicial

**¿Qué es el monto inicial?**
- Es el dinero en efectivo que pones en la caja para dar cambio
- Típicamente: billetes pequeños y monedas

**Ejemplos comunes:**
- Kiosco: $3.000 - $5.000
- Almacén: $5.000 - $10.000
- Supermercado: $15.000 - $30.000

> 💡 **Tip**: Cuenta el dinero físico ANTES de ingresar el monto. Debe coincidir exactamente.

---

### 5. Confirmar Apertura

1. Revisa que el monto sea correcto
2. Haz clic en **"Abrir Sesión"** o **"Confirmar"**
3. Espera el mensaje: ✅ "Sesión de caja abierta exitosamente"

<!-- SCREENSHOT: confirmacion_apertura.png -->

---

### 6. Verificar que la Caja está Abierta

Después de abrir:

**En el Dashboard de Caja verás:**
- 🟢 **Estado**: ABIERTA
- 💵 **Monto Inicial**: $5.000 (ejemplo)
- 📊 **Ventas del Día**: $0 (recién comienza)
- ⏰ **Hora de Apertura**: 09:00

<!-- SCREENSHOT: media__1771385704337.png -->

**En el POS:**
- El botón "Punto de Venta" ahora está habilitado
- Puedes comenzar a vender

---

## ✅ Verificación

La caja está correctamente abierta cuando:

- [x] El estado muestra "ABIERTA" 🟢
- [x] El monto inicial coincide con el efectivo físico
- [x] El POS ya no está bloqueado
- [x] Puedes realizar ventas

---

## 🎯 Próximos Pasos

Con la caja abierta:

1. **[Realizar Ventas en el POS](./04_realizar_venta.md)**
2. **[Cerrar la Caja al Final del Día](./10_cerrar_caja.md)**

---

## ❓ Preguntas Frecuentes

**P: ¿Qué pasa si me olvidé de abrir la caja?**  
R: El POS te bloqueará y te pedirá que abras sesión antes de vender.

**P: ¿Puedo abrir caja con $0 inicial?**  
R: Sí, pero no tendrás dinero para dar vuelto. Solo recomendado si cobras 100% digital.

**P: ¿Puedo cerrar y abrir nuevamente en el mismo día?**  
R: Sí, pero no es recomendable. Lo ideal es una sesión por día laboral.

**P: ¿Qué hago si me equivoqué en el monto inicial?**  
R: Puedes cerrar la sesión y abrirla nuevamente, o ajustarlo al momento del cierre.
