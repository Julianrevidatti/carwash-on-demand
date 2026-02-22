# Tutorial: Gestionar Stock por Lotes

## Objetivo
Aprender a ingresar mercadería utilizando lotes para controlar vencimientos y trazabilidad.

---

## ¿Qué son los Lotes?
Los lotes te permiten agrupar productos por fecha de vencimiento o partida de compra. El sistema usa **FIFO (First In, First Out)**: descuenta primero el stock que vence antes.

---

## Pasos Detallados

### 1. Acceder a Logística

- Ve al módulo **Inventario**
- Haz clic en la pestaña superior **"Logística"**

<!-- SCREENSHOT: media__1771387840139.png -->

---

### 2. Ingresar Mercadería

En el panel izquierdo "Ingreso de Mercadería":

1. **Seleccionar Producto**:
   - Escanea el código de barras, O
   - Busca en el desplegable "Producto Seleccionado"
   - *Ejemplo: Coca Cola 1.25L Vidrio*

2. **Cantidad**:
   - Ingresa cuántas unidades entran
   - *Ejemplo: 10*

3. **Datos del Lote**:
   - **Nro. de Lote**: Código del proveedor o interno (ej: L-001)
   - **Vencimiento**: Fecha de expiración (clave para perecederos)

<!-- SCREENSHOT: media__1771387840139.png -->

---

### 3. Confirmar Ingreso

- Revisa los datos
- Haz clic en el botón azul **"Confirmar Ingreso"**
- El stock se sumará automáticamente

---

### 4. Verificar Lotes Activos

En el panel derecho **"Stock Actual por Lotes"**:

- Verás el desglose de cada lote activo
- Muestra: Producto, Lote, Vencimiento y Cantidad

<!-- SCREENSHOT: media__1771387840139.png -->

---

### 5. Ver Historial

Para ver movimientos pasados:

1. Haz clic en la pestaña superior **"Historial Ingresos"**
2. Verás la lista de todos los movimientos con fecha, usuario y detalles.

<!-- SCREENSHOT: media__1771387890505.png -->

---

## ✅ Verificación

- [x] El stock total del producto aumentó
- [x] El nuevo lote aparece en la lista derecha
- [x] El movimiento figura en el historial

---

## ❓ Preguntas Frecuentes

**P: ¿Cómo descuenta el POS?**
R: Automáticamente descuenta del lote con vencimiento más próximo (FIFO).

**P: ¿Puedo editar un lote mal cargado?**
R: No, debes hacer un "Egreso" (ajuste negativo) y cargarlo de nuevo correctamente.
