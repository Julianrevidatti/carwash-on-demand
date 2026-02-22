# Tutorial: Realizar una Venta en el POS

## Objetivo
Aprender a realizar ventas completas: desde agregar productos hasta cobrar y entregar el ticket.

---

## Pre-requisitos

Antes de vender, asegúrate de:
- ✅ Tener productos en el inventario
- ✅ Haber abierto una sesión de caja
- ✅ Tener métodos de pago configurados

---

## Pasos Detallados

### 1. Acceder al Punto de Venta (POS)

- En el menú lateral, haz clic en el ícono de carrito (🛒)
- Selecciona **"Punto de Venta"** o **"POS"**

<!-- SCREENSHOT: media__1771385735177.png -->

**Lo que verás:**
- Izquierda: Grilla de productos
- Derecha: Carrito de compras (vacío)
- Arriba: Barra de búsqueda

---

### 2. Buscar y Agregar Productos

Tienes **3 formas** de agregar productos:

#### Opción A: Hacer Clic en el Producto
1. Navega por la grilla de productos
2. Haz clic en el producto deseado
3. Se agrega automáticamente al carrito

<!-- SCREENSHOT: media__1771385735177.png -->

#### Opción B: Buscar por Nombre
1. Escribe en la barra de búsqueda: "coca"
2. Aparecerán productos que coincidan
3. Haz clic para agregar

#### Opción C: Escanear Código de Barras
1. Conecta un lector láser USB
2. Escanea el producto
3. Se agrega automáticamente

> 💡 **Tip**: Puedes usar el buscador aunque tengas lector. Es más rápido para productos sin código de barras.

---

### 3. Ajustar Cantidades

Cuando un producto está en el carrito:

- **Aumentar cantidad**: Haz clic en el botón **+**
- **Reducir cantidad**: Haz clic en el botón **-**
- **Cambiar cantidad manual**: Haz clic en el número y escribe

<!-- SCREENSHOT: media__1771385757336.png -->

**Validaciones automáticas:**
- ⚠️ Si no hay stock suficiente, aparece error
- 🟡 Si el stock es crítico, aparece advertencia

---

### 4. Aplicar Descuentos (Opcional)

#### Descuento Global a la Venta
1. En el carrito, busca el campo **"Descuento %"**
2. Escribe el porcentaje (ej: 10)
3. El total se actualiza automáticamente

#### Descuento a un Producto Específico
1. Haz clic en el ícono de descuento (💰) junto al producto
2. Ingresa el % de descuento
3. Solo ese producto tendrá el descuento

<!-- SCREENSHOT: aplicar_descuento.png -->

---

### 5. Seleccionar Cliente (Opcional)

Si la venta es para un cliente registrado:

1. Haz clic en **"Seleccionar Cliente"**
2. Busca por nombre o DNI
3. Selecciona de la lista

**Beneficios:**
- Historial de compras del cliente
- Aplicación de promociones personalizadas
- Venta a cuenta corriente

<!-- SCREENSHOT: seleccionar_cliente.png -->

---

### 6. Elegir Método de Pago

Antes de finalizar, elige cómo cobra el cliente:

| Método | Cuándo Usar |
|--------|-------------|
| 💵 **Efectivo** | Pago en billetes/monedas |
| 💳 **Tarjeta Débito** | POS físico |
| 💳 **Tarjeta Crédito** | POS físico |
| 📱 **Mercado Pago QR** | Genera QR dinámico |
| 📖 **Cuenta Corriente** | Cliente registrado (fiado) |

**Proceso:**
1. Haz clic en el método de pago
2. Si es **Efectivo**, ingresa el monto que te da el cliente
3. El sistema calcula el vuelto automáticamente

<!-- SCREENSHOT: metodos_pago_pos.png -->

---

### 7. Finalizar la Venta

Una vez seleccionado el método de pago:

1. Haz clic en **"Finalizar Venta"** (botón grande azul/verde)
2. Espera la confirmación: ✅ "Venta registrada exitosamente"
3. Se abre automáticamente el ticket de venta

<!-- SCREENSHOT: confirmacion_venta.png -->

---

### 8. Imprimir o Enviar Ticket

Después de finalizar:

**Opciones disponibles:**
- 🖨️ **Imprimir**: Envía a impresora térmica o A4
- 📱 **Enviar por WhatsApp**: Al cliente (si tiene número registrado)
- 📧 **Enviar por Email**: Al cliente
- 💾 **Descargar PDF**: Guardar en tu PC

<!-- SCREENSHOT: media__1771385772117.png -->

> 💡 **Tip**: Configura tu impresora térmica en Configuración > Impresoras para imprimir automáticamente

---

### 9. Volver a Vender

Después del ticket:
- El carrito se vacía automáticamente
- Puedes **comenzar una nueva venta** de inmediato
- El stock ya se descontó en tiempo real

---

## ✅ Verificación

La venta fue exitosa cuando:

- [x] El cliente recibió el ticket
- [x] El stock se descontó del inventario
- [x] El dinero se registró en la caja
- [x] (Si aplica) La deuda del cliente aumentó

---

## 🔥 Funciones Avanzadas

### Cancelar una Venta en Proceso
- Haz clic en **"Limpiar Carrito"** (🗑️)
- Confirma la acción
- Todo se borra sin registrarse

### Venta Rápida (Producto Único)
1. Escanea el código de barras
2. Selecciona método de pago
3. Finalizar
4. **Listo en 3 segundos**

### Venta con Promociones Automáticas
- Si tienes promociones activas (2x1, 3x2, etc.)
- El sistema las detecta y aplica automáticamente
- Aparece un badge: 🎁 "Promoción aplicada"

---

## 🎯 Próximos Pasos

Ahora que sabes vender:

1. **[Aplicar Promociones](./05_promociones.md)**
2. **[Cerrar la Caja al Final del Día](./10_cerrar_caja.md)**
3. **[Ver Reportes de Ventas](./08_reportes.md)**

---

## ❓ Preguntas Frecuentes

**P: ¿Puedo cancelar una venta ya finalizada?**  
R: Sí, ve a Data & BI > Ventas > Busca la venta > Anular. El stock se repone automáticamente.

**P: ¿Qué hago si corté la luz en medio de una venta?**  
R: Si ya finalizaste, está guardada. Si no, se pierde. Usa un UPS para proteger tu equipo.

**P: ¿Puedo vender sin internet?**  
R: Sí, el sistema funciona offline. Se sincroniza cuando vuelva la conexión.

**P: ¿Cómo genero el QR de Mercado Pago?**  
R: Selecciona "Mercado Pago QR" como método, se genera automáticamente y aparece en pantalla.
