# Tutorial: Gestión de Productos a Granel y Pesables

## Objetivo
Aprender a configurar y gestionar productos que se venden por peso (kg) o bultos cerrados (ej: hormas de queso, fiambres, bolsas de harina).

---

## ¿Qué son Productos a Granel?
Son aquellos que:
- Se compran por bulto/caja pero tienen costo por kilo
- Se venden fraccionados (por peso)
- Requieren control de stock tanto por bultos como por kilos

---

## Pasos Detallados

### 1. Acceder a la Sección Granel

- Ve al módulo **Inventario**
- Haz clic en la pestaña superior **"Granel / Pesables"**

<!-- SCREENSHOT: media__1771387440404.png -->

---

### 2. Crear Nuevo Producto a Granel

1. Haz clic en el botón azul **"+ Nuevo Granel"**
2. Completa el formulario:

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| **Nombre** | Identificación del producto | "Jamón 214" |
| **Costo del Bulto** | Lo que pagas por la pieza entera | $25.000 |
| **Peso del Bulto (Kg)** | Cuánto pesa la pieza aprox. | 3,5 Kg |
| **Precio Venta x Kg** | A cuánto vendes el kilo | $14.500 |

> 💡 **Cálculo Automático**: El sistema calculará tu costo por Kg automáticamente ($7.142,86 en este ejemplo).

<!-- SCREENSHOT: media__1771387938461.png -->

---

### 3. Guardar y Verificar

- Haz clic en **"Guardar"**
- El producto aparecerá en la lista con todos sus indicadores de rentabilidad
- Verás el **Stock (Kg)** en 0.000 Kg inicialmente

<!-- SCREENSHOT: media__1771387440404.png -->

---

### 4. Ingresar Stock (Reponer)

Cuando compras mercadería nueva:

1. Busca el producto en la lista
2. Haz clic en el ícono verde de **"Sumar Stock"** (+)
3. Se abrirá el modal "Ingresar Stock (Bultos)"
4. Ingresa la **Cantidad de Bultos/Cajas** que compraste (ej: 1 pieza)
5. **Confirmar Ingreso**

> ✅ El sistema convertirá automáticamente los bultos a Kilos disponibles para la venta.

<!-- SCREENSHOT: media__1771387938461.png -->

---

## ✅ Verificación

- [x] El producto figura en la lista Granel
- [x] El costo por Kg es correcto según el peso del bulto
- [x] Al ingresar bultos, aumenta el stock en Kilos

---

## ❓ Preguntas Frecuentes

**P: ¿Cómo vendo esto en el POS?**
R: En el POS, al seleccionar el producto, te pedirá ingresar el peso exacto (ej: 0,250 kg) y calculará el precio final.

**P: ¿Qué pasa si la horma pesa distinto a lo configurado?**
R: El peso configurado es un promedio para el costo. Si hay mucha variación, puedes ajustar el "Peso del Bulto" en la edición del producto.
