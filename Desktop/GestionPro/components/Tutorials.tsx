import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BookOpen, ShoppingCart, Package, PieChart, Wallet, Settings, Users, Truck, Award, Play, ChevronRight, Search, FileText, Receipt, Image as ImageIcon } from 'lucide-react';

interface Tutorial {
    id: string;
    title: string;
    description: string;
    category: string;
    icon: React.ReactNode;
    content: string;
}

// CONTENIDO MARKDOWN INCRUSTADO
// Esto evita problemas de lectura de archivos locales en el navegador
const MD_CONFIGURACION = `
# Tutorial: Configuración Inicial del Sistema

## Objetivo
Configurar los datos básicos de tu negocio para empezar a usar GestionPro correctamente.

---

## Pasos Detallados

### 1. Acceder a Configuración

- Inicia sesión en GestionPro
- En el **menú lateral izquierdo**, busca el ícono de engranaje (⚙️)
- Haz clic en **"Configuración"**

> 💡 **Tip**: Si el menú está oculto en móvil, presiona el botón de hamburguesa (☰) arriba a la izquierda

![Configuración](/tutorials/screenshots/media__1771385100533.png)

---

### 2. Completar Datos del Negocio

Una vez en Configuración, verás varias pestañas. Comienza con **"Mi Negocio"**:

#### Campos a completar:

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| **Nombre del Negocio** | Razón social o nombre comercial | "Almacén Don José" |
| **Dirección** | Ubicación física del local | "Av. San Martín 1234" |
| **Teléfono** | Número de contacto | "+54 9 11 2345-6789" |
| **Email** | Correo del negocio | "contacto@donjos.com" |
| **CUIT/CUIL** | Número fiscal (opcional) | "20-12345678-9" |

![Formulario Negocio](/tutorials/screenshots/media__1771385334364.png)

#### Acciones:
1. Rellena todos los campos con tus datos reales
2. Haz clic en **"Guardar Cambios"** al final del formulario
3. Espera la confirmación verde: ✅ "Datos actualizados correctamente"

---

### 3. Configurar Métodos de Pago

Ahora ve a la pestaña **"Medios de Pago"**:

GestionPro viene con métodos predeterminados:
- 💵 Efectivo
- 💳 Tarjeta Débito
- 💳 Tarjeta Crédito
- 📱 Mercado Pago QR
- 📖 Cuenta Corriente

#### ¿Qué hacer?

**Opción A - Usar los predeterminados:**
- Si estos métodos te sirven, no hace falta cambiar nada
- Solo asegúrate de que estén **ACTIVOS** (switch en verde)

**Opción B - Personalizar:**
1. Haz clic en **"Agregar Método de Pago"**
2. Escribe el nombre (ej: "Transferencia Bancaria")
3. Guarda

![Medios de Pago](/tutorials/screenshots/media__1771385392289.png)
`;

const MD_AGREGAR_PRODUCTO = `
# Tutorial: Agregar tu Primer Producto

## Objetivo
Aprender a cargar productos al inventario para que estén disponibles para vender en el POS.

---

## Pasos Detallados

### 1. Ir al Módulo de Inventario e ingresar a Catálogo

- En el menú lateral, haz clic en el ícono de caja (📦)
- Selecciona **"Inventario"** y asegúrate de estar en la pestaña **"Catálogo"**.
- Te aparecerá la lista de productos (vacía si es tu primera vez)

![Lista de Productos](/tutorials/screenshots/media__1771385460649.png)

---

### 2. Hacer Clic en "Agregar Producto"

- Busca el botón **"+ Agregar Producto"** (generalmente arriba a la derecha).
- Haz clic para abrir el formulario.

![Botón Agregar](/tutorials/screenshots/media__1771385494228.png)

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

![Formulario Producto](/tutorials/screenshots/media__1771385334364.png)
`;

const MD_ABRIR_CAJA = `
# Tutorial: Abrir la Caja

## Objetivo
Antes de vender, debes abrir la caja para poder tener acceso al punto de venta (POS). La apertura se realiza desde el módulo de "Cierre de Caja".

---

## Pasos Detallados

### 1. Ir al Módulo Cierre de Caja

- En el menú lateral, busca el ícono de billetera (💼).
- Haz clic en **"Cierre de Caja"**.

### 2. Ingresar Fondo Inicial

Verás la pantalla de apertura. Debes ingresar el dinero en efectivo con el que inicias el turno (para dar vuelto).

1. **Fondo Inicial 0**: Si no inicias con efectivo, puedes dejarlo en 0.
   
![Fondo Inicial Cero](/tutorials/screenshots/media__1771387296311.png)

2. **Fondo Inicial con Monto**: Ejemplo ingresando $5.000 de fondo inicial.

![Fondo Inicial con Monto](/tutorials/screenshots/media__1771387319565.png)

3. Haz clic en el botón azul **"ABRIR CAJA"**.

---

### 3. Caja Abierta Correctamente

Una vez abierta, verás el panel de control del turno. Si no has realizado ventas aún, se verá así:

![Caja Abierta sin Ventas](/tutorials/screenshots/media__1771387343584.png)

---

### 4. Acceso al Punto de Venta (POS)

Estar con la caja abierta nos habilita el **Punto de Venta (POS)**, donde finalmente podremos realizar las ventas.

![POS Habilitado](/tutorials/screenshots/media__1771387396825.png)

---

## ✅ Verificación

- [x] El botón "Punto de Venta" ya no muestra el candado.
- [x] El fondo inicial figura correctamente en el resumen del turno.
`;

const MD_REALIZAR_VENTA = `
# Tutorial: Realizar una Venta en el POS

## Objetivo
Aprender a realizar ventas completas: desde agregar productos hasta cobrar y entregar el ticket.

---

## Pasos Detallados

### 1. Acceder al Punto de Venta

- En el menú lateral, haz clic en **"Punto de Venta"**
- Verás la grilla de productos disponibles

![Grilla POS](/tutorials/screenshots/media__1771385735177.png)

---

### 2. Agregar Productos al Carrito

Tienes varias formas de agregar productos:
1. **Clic directo**: Toca la tarjeta del producto (ej: Coca Cola).
2. **Buscador**: Escribe "Papas" en la barra superior.
3. **Escáner**: Usa tu lector de códigos de barras.

> 🎁 **Promociones Automáticas**: Si el cliente lleva productos que forman parte de una promo (ej: Fernet + Coca), el sistema **detecta la combinación y aplica el descuento automáticamente**. Verás "Promociones Aplicadas" en el ticket.

![Carrito](/tutorials/screenshots/media__1771385757336.png)

---

### 3. Cobrar la Venta

1. Verifica el **Total** en la parte inferior derecha.
2. Haz clic en el botón verde grande **"COBRAR"**.
3. Selecciona el método de pago (Efectivo, Transferencia, etc.).
4. Si es Efectivo, ingresa con cuánto paga el cliente para calcular el vuelto.

---

### 4. Finalizar

1. Haz clic en **"Finalizar Venta"**.
2. Se abrirá automáticamente el **Ticket de Venta** con el detalle.
3. Puedes imprimirlo o cerrarlo.

![Ticket Detalle](/tutorials/screenshots/media__1771385772117.png)
`;

const MD_CERRAR_CAJA = `
# Tutorial: Cerrar la Caja al Final del Día

## Objetivo
Realizar el cierre de caja, realizar el arqueo de efectivo y generar el reporte final del turno.

---

## Pasos Detallados

### 1. Iniciar Cierre de Caja

- Ingresa al módulo **"Cierre de Caja"**.
- Verás el resumen del turno actual con el monto esperado en caja.

![Panel Cierre](/tutorials/screenshots/media__1771387730841.png)

---

### 2. Arqueo de Efectivo

Haz clic en el botón rojo **"INICIAR ARQUEO Y CIERRE"**. Se abrirá el asistente para contar el dinero:

1. **Sin billetes contados**: El sistema muestra la diferencia total comparada con el teórico.

![Arqueo sin Billetes](/tutorials/screenshots/media__1771387953330.png)

2. **Conteo de Billetes**: Ingresa la cantidad de billetes que tienes de cada valor. El sistema sumará el total automáticamente.

![Arqueo con Billetes](/tutorials/screenshots/media__1771387981471.png)

3. Haz clic en **"Confirmar Cierre"**.

---

### 3. Historial y Reportes (Data & BI)

Cuando cerramos la caja, se crea un reporte completo con todas las ventas que tuvimos en el periodo. Este reporte se encuentra en:
- **Data & BI** > **Cajas Cerradas**.

Aquí verás una lista de todas las cajas cerradas con su día, horario y total de ventas. Al hacer clic en una, verás el detalle completo:
- **Resumen Financiero**: Ventas por método de pago (Efectivo, Tarjeta, MP).
- **Control de Arqueo**: Diferencias de caja y fondo de retiro.
- **Detalle de Ventas**: Lista de todos los tickets emitidos en ese turno.

![Historial de Cajas](/tutorials/screenshots/media__1771388042552.png)

---

## ✅ Verificación

- [x] La caja figura como "Cerrada".
- [x] El reporte Z aparece correctamente en la sección de Cajas Cerradas.
- [x] El stock se actualizó con todas las ventas del día.
`;

const MD_LEER_DASHBOARD = `
# Tutorial: Leer e Interpretar el Dashboard

## Objetivo
Aprender a entender las métricas clave y las herramientas de análisis del Dashboard para tomar mejores decisiones en tu negocio.

---

## 📊 Panel de Control (Resumen Operativo)

En la pantalla principal verás un resumen rápido de la salud de tu negocio:
- **Resumen Financiero**: Ventas netas, ganancias y capital invertido.
- **Stock Crítico**: Alertas de productos que necesitan reposición inmediata.
- **Alertas de Turno**: Estado actual de la caja.

![Panel de Control](/tutorials/screenshots/media__1771387730841.png)

---

## 📉 Gráficos de Evolución de Ventas

Visualiza el rendimiento de tu negocio a lo largo del tiempo:
- **Evolución de Ventas (Este Mes)**: Muestra el crecimiento de tus ventas diarias acumuladas.
- **Top Productos**: Identifica qué artículos son los preferidos de tus clientes.

![Evolución de Ventas](/tutorials/screenshots/media__1771387758544.png)

---

## 📅 Comparativa y Planificador de Compras

Esta sección es fundamental para proyectar tus necesidades:
- **Comparativa Mes vs Mes Pasado**: Analiza si tu rendimiento actual supera al del período anterior.
- **Planificador de Compras Inteligente**: El sistema estima qué productos deberías comprar y en qué cantidad basándose en tu historial de ventas y stock actual, ayudándote a optimizar tus compras.

![Comparativa y Planificador](/tutorials/screenshots/media__1771387778020.png)

---

## 📊 Análisis de Productos y Horarios

Optimiza tu operación conociendo tus puntos fuertes:
- **Top Productos**: Un gráfico de anillos que te muestra visualmente cuáles son tus artículos más vendidos, permitiéndote priorizar su stock.
- **Horarios Pico**: Identifica en qué momentos del día tienes mayor flujo de ventas para organizar mejor a tu personal o prepararte para la demanda.
- **Stock Inmovilizado**: El sistema te muestra aquellos productos que no han tenido rotación en el último tiempo. Esto es clave para detectar capital "parado" y decidir liquidaciones o cambios en el inventario.

![Análisis de Negocio](/tutorials/screenshots/media__1771387804432.png)

---

## ✅ Verificación

- [x] Puedo ver el capital total invertido en mercadería.
- [x] Los gráficos se actualizan en tiempo real con cada venta cerrada.
- [x] El planificador me sugiere productos para mi próximo pedido.
`;

const MD_PROMOCIONES = `
# Tutorial: Crear Promociones y Combos

## Objetivo
Aprender a configurar ofertas atractivas para aumentar tus ventas, como combos fijos, descuentos por cantidad o Mix & Match.

---

## Tipos de Promociones

1. **Combo Fijo**: "Fernet + Coca por $5000" (Productos específicos a precio cerrado)
2. **Mix & Match**: "Lleva 2 papas y paga $3500" ó "3x2 en Galletas" (Combiná sabores o variedades)
3. **Combos Pesables**: Ofertas para productos a granel (ej: "Picada para 4 personas")

---

## Pasos Detallados

### 1. Acceder al Módulo

- En el menú lateral, haz clic en **"% Promociones"**
- Verás la lista de promos activas (o vacía si es la primera vez)

![Lista Promos](/tutorials/screenshots/media__1771386067416.png)

---

### 2. Crear Nueva Promoción

1. Haz clic en el botón rosa **"+ Crear Promo"**
2. Se abrirá el modal de configuración
3. Selecciona el tipo de promo que deseas crear:

![Nueva Promo](/tutorials/screenshots/media__1771386082682.png)

---

### 3. Opción A: Combo Fijo (Pack Cerrado)

Ideal para kits de productos complementarios (ej: Fernet + Coca).

1. Selecciona la pestaña **"Combo Fijo"**
2. **Nombre**: Ej "Fernet Branca + Coca"
3. **Componentes**: Busca y agrega cada producto con el botón **"+"**
4. **Precio Final**: Ingresa el valor total del pack (ej: $5000)

![Combo Fijo](/tutorials/screenshots/media__1771386133707.png)

---

### 4. Opción B: Mix & Match (Descuento por Cantidad)

Ideal para "Lleva X cantidad por $Y" o "2x1". Permite al cliente mezclar sabores de una misma categoría.

1. Selecciona la pestaña **"Mix & Match"**.
2. **Formulario Vacío**: Define el nombre y los productos que integran la oferta.

![Formulario Mix Match Vacío](/tutorials/screenshots/media__1771386472542.png)

3. **Ejemplo Cargado**: Configura la cantidad necesaria (ej: 2) y el precio final de la oferta (ej: $3500).

![Formulario Mix Match Cargado](/tutorials/screenshots/media__1771386587381.png)

---

### 5. Opción C: Combos Pesables (Granel)

Ideal para ofertas de fiambrería o productos por peso (ej: "Picada para 2").

1. Selecciona la pestaña **"Combos Pesables"**.
2. **Formulario Vacío**: Agrega los componentes pesables que forman el combo.

![Formulario Combos Pesables Vacío](/tutorials/screenshots/media__1771386800468.png)

3. **Formulario Completo**: Define los pesos exactos de cada producto (en Kg) y el precio total.

![Formulario Combos Pesables Completo](/tutorials/screenshots/media__1771387079335.png)

---

### 6. Guardar y Activar

- Haz clic en **"Guardar Promo"**.
- La promoción aparecerá en la lista principal, donde podrás activarla o desactivarla con el switch. Así es como se ven tus ofertas una vez cargadas:

![Promociones Cargadas](/tutorials/screenshots/media__1771387240634.png)

---

### 7. Verificación en el POS

Cuando agregues los productos al carrito, verás el descuento reflejado automáticamente así:

![Verificación POS](/tutorials/screenshots/media__1771387467139.png)

> 💡 **¡Importante!**: Las promociones se aplican solas cuando el sistema detecta que se están llevando los productos que están dentro de la promo. ¡No hace falta que te acuerdes de todas, el sistema lo hace por vos!

---

## ✅ Verificación

- [x] La promo aparece en la lista
- [x] En Mix & Match, puedo combinar diferentes sabores
- [x] En Combos Pesables, el sistema descuenta el stock exacto en kilos
`;

const MD_STOCK_LOTES = `
# Tutorial: Gestionar Stock por Lotes

## Objetivo
Aprender a ingresar y egresar mercadería utilizando lotes para controlar vencimientos y trazabilidad.

---

## Pasos Detallados

### 1. Acceder a Logística

- Ve al módulo **Inventario**.
- Haz clic en la pestaña superior **"Logística"**.

![Acceder Logística](/tutorials/screenshots/media__1771385392289.png)

---

### 2. Ingresar Mercadería (Compra)

En el panel izquierdo, asegúrate de estar en la pestaña **"Ingreso"**:

- **Seleccionar Producto**: Escanea o busca en el desplegable el producto a reponer.
- **Cantidad**: Ingresa cuántas unidades entran.
- **Datos del Lote**: Completa Nro. de Lote y fecha de Vencimiento.
- Haz clic en el botón azul **"Confirmar Ingreso"**.

![Ingresar Mercadería](/tutorials/screenshots/media__1771385460649.png)

---

### 3. Verificar Lotes Activos

En el panel derecho **"Stock Actual por Lotes"**:

- Verás el desglose de cada lote activo con su cantidad actual, lo que te permite un control total sobre tus existencias.

![Verificar Lotes](/tutorials/screenshots/media__1771385494228.png)

---

## ✅ Verificación

- [x] El stock total del producto se actualizó correctamente.
- [x] El nuevo lote aparece en el listado de Stock Actual por Lotes.
- [x] El ingreso quedó registrado en el Historial.
`;

const MD_GRANEL = `
# Tutorial: Productos a Granel / Pesables

## Objetivo
Aprender a gestionar productos que se compran por bulto pero se venden fraccionados por peso (ej: fiambres, quesos, productos sueltos).

---

## Pasos Detallados

### 1. Acceder a la Sección Granel

- Ve al módulo **Inventario**.
- Haz clic en la pestaña superior **"Granel / Pesables"**.

![Acceder Granel](/tutorials/screenshots/media__1771385585569.png)

---

### 2. Crear Nuevo Producto a Granel

1. Haz clic en el botón azul **"+ Nuevo Granel"**.
2. Completa el formulario con los datos iniciales:

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| **Nombre** | Identificación del producto | "Jamón 214" |
| **Costo del Bulto** | Lo que pagas por la pieza entera | $25.000 |
| **Peso del Bulto (Kg)** | Cuánto pesa la pieza aprox. | 3,5 Kg |
| **Precio Venta x Kg** | A cuánto vendes el kilo | $14.500 |

> 💡 **Cálculo Automático**: El sistema calculará tu costo por Kg automáticamente ($7.142,86 en este ejemplo).

![Formulario Nuevo Granel](/tutorials/screenshots/media__1771385704337.png)

---

### 3. Guardar y Verificar

- Haz clic en **"Guardar"**.
- El producto aparecerá en la lista con todos sus indicadores de rentabilidad.
- Verás el **Stock (Kg)** en 0.000 Kg inicialmente.

![Verificación Inicial](/tutorials/screenshots/media__1771385735177.png)

---

### 4. Ingresar Stock (Reponer)

Cuando compras mercadería nueva:

1. Busca el producto en la lista.
2. Haz clic en el ícono verde de **"Sumar Stock"** (+).
3. Se abrirá el modal **"Ingresar Stock (Bultos)"**.
4. Ingresa la **Cantidad de Bultos/Cajas** que compraste (ej: 1 pieza).
5. Haz clic en **"Confirmar Ingreso"**.

![Ingresar Stock](/tutorials/screenshots/media__1771385772117.png)

---

### 5. Resultado Final

Ahora verás el producto con el stock actualizado en la lista, permitiéndote venderlo fraccionado en el POS.

![Stock Actualizado](/tutorials/screenshots/media__1771385798954.png)

---

### 6. Editar Producto

Si necesitas modificar precios o datos, utiliza el botón de editar correspondiente.

![Editar Granel](/tutorials/screenshots/media__1771385827887.png)

---

## ✅ Verificación

- [x] El producto figura en la lista Granel.
- [x] Al ingresar bultos, aumenta automáticamente el stock en Kilos.
- [x] El costo por Kg se calcula correctamente en base al bulto.
`;

const MD_CUENTAS_CORRIENTES = `
# Tutorial: Clientes y Cuentas Corrientes

## Objetivo
Aprender a registrar clientes, gestionar sus deudas ("fiado") y registrar los pagos parciales o totales.

---

## Pasos Detallados

### 1. Acceder al Módulo Clientes

- En el menú lateral, haz clic en el ícono de **Personas (Usuarios)**.
- Selecciona **"Clientes"**.
- Verás el padrón de clientes registrados y su saldo actual.

![Lista Clientes Vacía](/tutorials/screenshots/media__1771388115717.png)

---

### 2. Crear Nuevo Cliente

Para poder venderle a "Cuenta Corriente", primero debes darlo de alta:

1. Haz clic en el botón azul **"+ Nuevo Cliente"**.
2. Completa los datos en el formulario:
   - **Nombre Completo**: Ej: Leo Messi.
   - **DNI / Teléfono**: Importante para contactarlo por WhatsApp.
   - **Dirección**: Opcional.

![Nuevo Cliente Blanco](/tutorials/screenshots/media__1771388139613.png)

![Nuevo Cliente Lleno](/tutorials/screenshots/media__1771388302162.png)

3. Haz clic en **"Guardar"**.

---

### 3. Cliente Creado y Consulta de Saldo

Una vez creado, así es como verás al cliente en tu lista, con su saldo inicial en $0.

![Cliente Creado](/tutorials/screenshots/media__1771388328866.png)

---

### 4. Ver Transacciones y Registrar Pagos

Si quieres ver las transacciones como compras, pagos, saldos, o agregar deuda o registrar un pago de un cliente que ya tienes creado, debes hacer **clic sobre el lapiz (editar)**.

![Historial y Edición](/tutorials/screenshots/media__1771388412942.png)

---

## ✅ Verificación

- [x] El cliente aparece en la lista.
- [x] El saldo se actualiza después de una venta en Cta.Cte.
- [x] El pago reduce la deuda correctamente.
`;

const MD_GASTOS = `
# Tutorial: Control de Gastos Operativos

## Objetivo
Registrar y controlar los egresos de dinero(fijos y variables) para conocer la ganancia real del negocio.Diferenciar entre lo ya pagado y las deudas pendientes.

---

## Panel Principal(Dashboard de Gastos)

Al ingresar a ** "Gastos Operativos" **, verás tres tarjetas clave:

1. ** Total Gastado(Pagado) **: Dinero que * ya salió * de la caja este mes.
    *   * Ejemplo: Alquiler($450.000) *
    2. ** Pendiente de Pago **: Deudas o facturas recibidas pero aún no abonadas.
    *   * Ejemplo: Luz($220.000) *
    3. ** Total del Mes **: La suma de ambos(Proyección total de gastos).

![Dashboard Gastos](/tutorials/screenshots/media__1771388497082.png)

    ---

## Paso a Paso: Registrar un Gasto

1.  Haz clic en el botón rojo ** "+ Nuevo Gasto" **.
2.  Completa el formulario:
    *   ** Descripción **: * Ej: Alquiler Local, Luz, Internet.*
    *   ** Monto **: El valor total de la factura.
    *   ** Categoría **: * Ej: Rent(Alquiler), Utilities(Servicios), Sueldos.*
    *   ** Fecha **: Fecha de vencimiento o pago.
    *   ** Estado de Pago **:
        *   ✅ ** Pagado **: Si ya entregaste el dinero.Descuenta de caja inmediatamente.
        *   ⚠️ ** Pendiente **: Si tienes la factura pero pagarás luego.No descuenta de caja aún.

![Nuevo Gasto](/tutorials/screenshots/media__1771388621297.png)

    ---

## Listado y Estados

En la lista inferior verás el detalle de cada movimiento:

| Descripción | Estado | Impacto |
| :--- | :--- | :--- |
| ** Alquiler Local ** | ✅ ** Pagado ** | Se resta de la Ganancia Neta y Caja. |
| ** Luz ** | ⚠️ ** Pendiente ** | Se suma a "Pendiente de Pago". ** NO ** resta de caja todavía. |

> 💡 ** Tip:** Cuando pagues una factura pendiente, puedes editar el gasto y cambiar el estado a "Pagado" para que impacte en la caja ese día.

![Detalle Gastos](/tutorials/screenshots/media__1771388637632.png)

    ---

## ✅ Verificación

    - [x] El "Total Gastado" refleja solo lo que ya pagué.
- [x] Las deudas futuras aparecen en "Pendiente de Pago".
- [x] La Ganancia Neta del Dashboard principal descuenta mis gastos pagados.
`;


const tutorialData: Tutorial[] = [
    // PRIMEROS PASOS
    {
        id: '1',
        title: 'Configuración Inicial',
        description: 'Aprende a configurar tu negocio por primera vez: nombre, datos de contacto y preferencias básicas.',
        category: 'Primeros Pasos',
        icon: <Settings className="w-6 h-6" />,
        content: MD_CONFIGURACION
    },
    {
        id: '2',
        title: 'Agregar tu Primer Producto',
        description: 'Carga productos al inventario para empezar a vender. Incluye nombre, precio, costo y stock inicial.',
        category: 'Primeros Pasos',
        icon: <Package className="w-6 h-6" />,
        content: MD_AGREGAR_PRODUCTO
    },
    {
        id: '3',
        title: 'Abrir la Caja',
        description: 'Antes de vender, necesitas abrir una sesión de caja. Te guiamos paso a paso.',
        category: 'Primeros Pasos',
        icon: <Wallet className="w-6 h-6" />,
        content: MD_ABRIR_CAJA
    },

    // PUNTO DE VENTA
    {
        id: '4',
        title: 'Realizar una Venta',
        description: 'Proceso completo de venta: seleccionar productos, aplicar descuentos y cobrar.',
        category: 'Punto de Venta',
        icon: <ShoppingCart className="w-6 h-6" />,
        content: MD_REALIZAR_VENTA
    },
    {
        id: '5',
        title: 'Aplicar Promociones',
        description: 'Cómo activar y aplicar promociones a tus ventas para aumentar el ticket promedio.',
        category: 'Punto de Venta',
        icon: <Award className="w-6 h-6" />,
        content: MD_PROMOCIONES
    },

    // GASTOS
    {
        id: '12',
        title: 'Registro de Gastos',
        description: 'Controla tus egresos (alquiler, luz, proveedores) para saber tu ganancia real.',
        category: 'Gastos',
        icon: <Receipt className="w-6 h-6" />,
        content: MD_GASTOS
    },

    // CAJA Y DINERO
    {
        id: '10',
        title: 'Cerrar la Caja',
        description: 'Cierre de sesión, arqueo de efectivo y cuadre de caja al final del día.',
        category: 'Caja',
        icon: <Wallet className="w-6 h-6" />,
        content: MD_CERRAR_CAJA
    },

    // REPORTES Y BI
    {
        id: '8',
        title: 'Leer el Dashboard',
        description: 'Interpreta las métricas clave: ventas del día, ganancia neta, productos top.',
        category: 'Reportes',
        icon: <PieChart className="w-6 h-6" />,
        content: MD_LEER_DASHBOARD
    },

    // CLIENTES
    {
        id: '9',
        title: 'Cuentas Corrientes y Fiados',
        description: 'Gestiona deudas de clientes, registra pagos y lleva el historial de saldo (Fiado).',
        category: 'Clientes',
        icon: <Users className="w-6 h-6" />,
        content: MD_CUENTAS_CORRIENTES
    },

    // INVENTARIO AVANZADO
    {
        id: '6',
        title: 'Gestionar Stock por Lotes',
        description: 'Controla vencimientos y costos usando el sistema de lotes (FIFO automático).',
        category: 'Inventario',
        icon: <Package className="w-6 h-6" />,
        content: MD_STOCK_LOTES
    },
    {
        id: '7',
        title: 'Productos a Granel / Pesables',
        description: 'Gestiona fiambres, quesos o productos por peso. Convierte bultos a kilos automáticamente.',
        category: 'Inventario',
        icon: <Package className="w-6 h-6" />,
        content: MD_GRANEL
    },

    // OTROS (Simplificados por ahora)
    {
        id: '13',
        title: 'Integrar Mercado Pago',
        description: 'Conecta tu cuenta de Mercado Pago para cobrar con QR dinámico.',
        category: 'Configuración',
        icon: <Settings className="w-6 h-6" />,
        content: '# Tutorial en Construcción\n\nPronto disponible.'
    }
];

const categories = ['Primeros Pasos', 'Punto de Venta', 'Inventario', 'Reportes', 'Caja', 'Clientes', 'Gastos', 'Configuración'];

export const Tutorials: React.FC = () => {
    const [selectedCategory, setSelectedCategory] = useState('Primeros Pasos');
    const [activeTutorial, setActiveTutorial] = useState<Tutorial | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredTutorials = tutorialData.filter(t => {
        const matchesCategory = t.category === selectedCategory;
        const matchesSearch = searchQuery === '' ||
            t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    // Renderizar componente de imagen que maneja fallos de carga
    const ImageRenderer = ({ alt, src }: any) => {
        // Si la imagen es un placeholder de screenshot, mostrar un contenedor estilizado
        if (alt && alt.startsWith('SCREENSHOT:')) {
            return (
                <div className="my-6 border-2 border-dashed border-gray-300 rounded-xl p-8 bg-gray-50 flex flex-col items-center justify-center text-center group hover:border-purple-300 transition-colors">
                    <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-3">
                        <ImageIcon className="w-8 h-8 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Captura de Pantalla: {alt.replace('SCREENSHOT:', '')}</p>
                    <p className="text-xs text-gray-400">Guarda tu captura en /public/tutorials/screenshots/</p>
                </div>
            );
        }
        // Imagen normal
        return <img alt={alt} src={src} className="rounded-lg shadow-md my-4 max-w-full" />;
    };

    /** VISTA DE DETALLE DEL TUTORIAL **/
    if (activeTutorial) {
        return (
            <div className="animate-in slide-in-from-right fade-in duration-300 max-w-4xl mx-auto pb-20">
                <button
                    onClick={() => setActiveTutorial(null)}
                    className="mb-6 flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors font-medium"
                >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                    Volver a Tutoriales
                </button>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Header */}
                    <div className="bg-white border-b border-gray-100 p-8">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                                {activeTutorial.category}
                            </span>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{activeTutorial.title}</h1>
                        <p className="text-lg text-gray-500">{activeTutorial.description}</p>
                    </div>

                    {/* Markdown Content */}
                    <div className="p-8 prose prose-purple max-w-none">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                img: ImageRenderer,
                                table: ({ node, ...props }) => (
                                    <div className="overflow-x-auto my-6 rounded-lg border border-gray-200 shadow-sm">
                                        <table className="min-w-full divide-y divide-gray-200" {...props} />
                                    </div>
                                ),
                                thead: ({ node, ...props }) => <thead className="bg-gray-50" {...props} />,
                                th: ({ node, ...props }) => <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider" {...props} />,
                                td: ({ node, ...props }) => <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 border-t border-gray-100" {...props} />,
                                blockquote: ({ node, ...props }) => (
                                    <blockquote className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg italic text-blue-800 my-4 not-prose" {...props} />
                                ),
                                h2: ({ node, ...props }) => <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4 flex items-center gap-2" {...props} />,
                                h3: ({ node, ...props }) => <h3 className="text-xl font-bold text-gray-700 mt-6 mb-3" {...props} />
                            }}
                        >
                            {activeTutorial.content}
                        </ReactMarkdown>
                    </div>

                    {/* Footer Actions */}
                    <div className="bg-gray-50 p-6 border-t border-gray-200 flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                            ¿Te sirvió este tutorial?
                        </div>
                        <button
                            onClick={() => setActiveTutorial(null)}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                        >
                            Finalizar Tutorial
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    /** VISTA DE LISTA (GRID) **/
    return (
        <div className="space-y-10 animate-in fade-in duration-500 max-w-7xl mx-auto px-4 py-8">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl flex items-center justify-center shadow-lg">
                        <BookOpen className="w-7 h-7 text-white" />
                    </div>
                    Centro de Tutoriales
                </h2>
                <p className="text-gray-500 mt-2">Aprende a usar todas las funcionalidades de GestionPro paso a paso.</p>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Buscar tutoriales..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
            </div>

            {/* Category Tabs */}
            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar mb-8">
                {categories.map((category) => (
                    <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all border-2 ${selectedCategory === category
                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-200 border-blue-600 scale-105'
                            : 'bg-white text-gray-600 border-gray-100 hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50'
                            } `}
                    >
                        {category}
                    </button>
                ))}
            </div>

            {/* Tutorials Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTutorials.map((tutorial) => (
                    <div
                        key={tutorial.id}
                        onClick={() => setActiveTutorial(tutorial)}
                        className="bg-white rounded-xl border border-gray-200 hover:border-purple-300 transition-all hover:shadow-lg group cursor-pointer overflow-hidden flex flex-col h-full"
                    >
                        <div className="p-6 flex-1">
                            {/* Icon & Title */}
                            <div className="flex items-start gap-4 mb-3">
                                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors shrink-0">
                                    {tutorial.icon}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-800 group-hover:text-blue-700 transition-colors">
                                        {tutorial.title}
                                    </h3>
                                </div>
                            </div>

                            {/* Description */}
                            <p className="text-sm text-gray-500 mb-4 line-clamp-3">
                                {tutorial.description}
                            </p>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 group-hover:bg-blue-50/50 transition-colors">
                            <span className="text-sm font-bold text-blue-600 flex items-center gap-1">
                                Leer Guía <ChevronRight className="w-4 h-4" />
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {filteredTutorials.length === 0 && (
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-600 mb-1">No se encontraron tutoriales</h3>
                    <p className="text-sm text-gray-400">Intenta con otra búsqueda o categoría</p>
                </div>
            )}

            {/* Footer Help */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
                <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-purple-600" />
                    ¿Necesitas más ayuda?
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                    Si no encuentras lo que buscas o tienes dudas específicas, contáctanos.
                </p>
                <div className="flex gap-3">
                    <a
                        href="mailto:hola@gestionnow.site"
                        className="text-sm bg-white text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors border border-gray-200"
                    >
                        📧 Soporte Email
                    </a>
                    <a
                        href="https://wa.me/5491136763357"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm bg-green-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-600 transition-colors"
                    >
                        💬 WhatsApp
                    </a>
                </div>
            </div>
        </div>
    );
};
