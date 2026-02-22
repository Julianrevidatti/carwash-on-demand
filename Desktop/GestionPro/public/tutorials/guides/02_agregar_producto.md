# Tutorial: Agregar tu Primer Producto

## Objetivo
Aprender a cargar productos al inventario para que estén disponibles para vender en el POS.

---

## Pasos Detallados

### 1. Ir al Módulo de Inventario

- En el menú lateral, haz clic en el ícono de caja (📦)
- Selecciona **"Inventario"**
- Te aparecerá la lista de productos (vacía si es tu primera vez)

<!-- SCREENSHOT: media__1771385460649.png -->

---

### 2. Hacer Clic en "Agregar Producto"

- Busca el botón **"+ Agregar Producto"** (generalmente arriba a la derecha)
- Haz clic para abrir el formulario

<!-- SCREENSHOT: media__1771385494228.png -->

---

### 3. Completar Información Básica

Se abrirá un formulario. Completa estos campos **obligatorios**:

#### 📝 Campos Obligatorios

| Campo | Qué poner | Ejemplo |
|-------|-----------|---------|
| **Nombre** | Nombre del producto | "Coca Cola 500ml" |
| **Código de Barras** | EAN del producto | "7790895646836" |
| **Precio de Venta** | Lo que cobras al cliente | $450 |
| **Costo** | Lo que te costó comprarlo | $300 |

<!-- SCREENSHOT: media__1771385544000.png -->

> 💡 **Tip**: Si no tienes lector de barras, escribe el código manualmente o usa uno genérico (ej: "001", "002")

---

### 4. Datos Adicionales (Opcionales)

#### Categoría
- Selecciona de la lista: Bebidas, Almacén, Lácteos, etc.
- Si no existe, puedes crearla escribiendo el nombre

#### Proveedor  
- Relaciona el producto con un proveedor existente
- Útil para el **Planner de Pedidos** (Plan PRO)

#### Stock Mínimo
- Define cuándo alertarte de stock bajo
- Ejemplo: Si vendes 10 por día, pon stock mínimo = 20

<!-- SCREENSHOT: formulario_producto_completo.png -->

---

### 5. Agregar Stock Inicial

Tienes 2 opciones:

#### Opción A: Stock Simple
1. En el campo **"Stock Inicial"**, escribe la cantidad
2. Ejemplo: 50 unidades

#### Opción B: Stock por Lotes (RECOMENDADO)
1. Deja "Stock Inicial" en 0
2. Después de guardar el producto, agrega lotes manualmente
3. Ventaja: Control de vencimientos y costos variables

<!-- SCREENSHOT: stock_inicial.png -->

---

### 6. Guardar el Producto

- Revisa que todos los datos estén correctos
- Haz clic en **"Guardar"** o **"Crear Producto"**
- Espera el mensaje de confirmación: ✅ "Producto creado exitosamente"

<!-- SCREENSHOT: confirmacion_producto.png -->

---

### 7. Verificar que Aparezca en la Lista

El producto debería aparecer ahora en la tabla de inventario:

- Verás: Nombre, Código, Precio, Stock, Categoría
- Puedes **editarlo** haciendo clic en el ícono de lápiz ✏️
- Puedes **eliminarlo** con el ícono de basura 🗑️

<!-- SCREENSHOT: producto_en_lista.png -->

---

## 🎨 Agregar Imagen al Producto (Opcional)

1. En la lista de inventario, haz clic en **Editar** (✏️)
2. Busca el campo **"Imagen"** o ícono de cámara
3. Haz clic en **"Subir Imagen"**
4. Selecciona una foto del producto desde tu PC
5. Guarda los cambios

> 💡 Las imágenes mejoran la experiencia en el POS y en el catálogo público

<!-- SCREENSHOT: agregar_imagen_producto.png -->

---

## ✅ Verificación

Tu primer producto está listo cuando:

- [x] Aparece en la lista de inventario
- [x] Tiene nombre, código y precio
- [x] El stock es mayor a 0
- [x] Puedes verlo al buscar en el POS

---

## 🎯 Próximos Pasos

¡Felicitaciones! Ya tienes tu primer producto. Ahora:

1. **Agrega más productos** repitiendo el proceso
2. **[Abre la Caja](./03_abrir_caja.md)** para empezar a vender
3. **[Realiza tu Primera Venta](./04_realizar_venta.md)**

---

## ❓ Preguntas Frecuentes

**P: ¿Puedo cargar productos masivamente desde Excel?**  
R: Sí, en la sección Inventario busca la opción **"Importar desde CSV"** (Plan BASIC o superior).

**P: ¿Qué pasa si me equivoco en el precio?**  
R: Puedes editarlo en cualquier momento. Haz clic en el producto > Editar > Cambia el precio > Guardar.

**P: ¿Cómo agrego productos a granel (por peso)?**  
R: Usa la opción **"Producto a Granel"** al crear. Podrás vender por kg en lugar de unidades.

**P: ¿El código de barras debe ser único?**  
R: Sí, no puede haber 2 productos con el mismo código. Si ocurre, el sistema te alertará.
