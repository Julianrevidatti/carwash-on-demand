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

![Acceso a Configuración](file:///C:/Users/54112/.gemini/antigravity/brain/59e18c6c-79af-46b9-ab99-36bd732c037e/media__1771782112655.png)

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

![Datos del Negocio](file:///C:/Users/54112/.gemini/antigravity/brain/59e18c6c-79af-46b9-ab99-36bd732c037e/media__1771782112655.png)

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

![Métodos de Pago](file:///C:/Users/54112/.gemini/antigravity/brain/59e18c6c-79af-46b9-ab99-36bd732c037e/media__1771781916243.png)

---

### 3.1 Configuración de Recargos

GestionPro te permite aplicar **recargos automáticos** sobre el total de la venta según el método que elija el cliente. Esto es ideal para cubrir comisiones de tarjetas o plataformas digitales.

#### Cómo configurar los recargos:

1.  En la misma pestaña **"Medios de Pago"**, verás la tabla de **"Configurar Recargos"**.
2.  Busca el método que quieres ajustar (ej: "Crédito").
3.  En la columna **"Recargo al Cliente (%)"**, ingresa el porcentaje deseado (ej: `10` para un 10%).
4.  El sistema guardará este valor automáticamente.

![Configuración de Recargos](file:///C:/Users/54112/.gemini/antigravity/brain/59e18c6c-79af-46b9-ab99-36bd732c037e/media__1771781916243.png)

> 💡 **Dato Inteligente**: Cuando realices una venta en el POS y selecciones un método con recargo, el sistema **calculará y sumará** el monto extra al total automáticamente. ¡No más cálculos manuales!

---

### 4. Configurar Integración con Mercado Pago (Opcional)

Si quieres cobrar con **QR dinámico de Mercado Pago**:

1. En la pestaña **"Integraciones"**
2. Busca la sección **"Mercado Pago"**
3. Activa el switch
4. Pega tu **Access Token** de producción

![Integración Mercado Pago](file:///C:/Users/54112/.gemini/antigravity/brain/59e18c6c-79af-46b9-ab99-36bd732c037e/media__1771781916243.png)

> ⚠️ **Importante**: Para obtener el Access Token:
> - Ve a [developers.mercadopago.com](https://developers.mercadopago.com)
> - Credenciales > Producción
> - Copia el "Access Token"

---

### 5. Mi Suscripción y Planes

En esta sección podrás administrar tu licencia de GestionPro, ver cuánto tiempo te queda de prueba gratuita y cambiar de plan según el crecimiento de tu negocio.

#### Estados de la cuenta:
- **Prueba Gatuita**: Cuentas con **7 días de prueba** con todas las funciones desbloqueadas para que pruebes el sistema.
- **Días Restantes**: Verás una barra de progreso que indica cuánto tiempo falta para que expire tu licencia actual.

#### Gestión de Planes:
1.  **Básico, PRO o Ultimate**: Cada plan tiene diferentes límites (productos, promociones, usuarios). Elige el que mejor se adapte a tus necesidades.
2.  **Cambiar de Plan**: Haz clic en el botón azul para ser redirigido a Mercado Pago y realizar el pago de forma segura.
3.  **Cancelar Suscripción**: Si decides no continuar, puedes cancelar en cualquier momento. Mantendrás el acceso a tus funciones hasta que se cumpla la fecha de vencimiento.

![Mi Suscripción](file:///C:/Users/54112/.gemini/antigravity/brain/59e18c6c-79af-46b9-ab99-36bd732c037e/media__1771781916243.png)

---

### 9. Mi Negocio y Catálogo Digital QR

El Catálogo Digital es una de las funciones más potentes de GestionPro. Permite que tus clientes escaneen un código QR en tu local o hagan clic en un link para ver todos tus productos actualizados y enviarte pedidos por WhatsApp.

#### Cómo configurar tu catálogo:

1.  Ve a la pestaña **"Mi Negocio"**.
2.  Completa los **Datos del Comercio**:
    -   **Nombre del Negocio**: Es el título que verán tus clientes en el catálogo.
    -   **Número de WhatsApp**: El número donde recibirás los pedidos (asegúrate de incluir el código de país sin el +).
3.  **Control de Visibilidad**: Verás un interruptor llamado **"Habilitar Catálogo Público"**.
    -   **Activado**: El QR y el Link funcionarán y tus clientes verán el catálogo.
    -   **Desactivado**: El catálogo quedará oculto y no se podrá acceder mediante el link.
4.  **Compartir**:
    -   Usa el botón **"Copiar Link"** para enviarlo por redes sociales.
    -   Usa el **QR** para imprimirlo y pegarlo en tu mostrador o mesas.

![Catálogo Digital](file:///C:/Users/54112/.gemini/antigravity/brain/59e18c6c-79af-46b9-ab99-36bd732c037e/media__1771782112655.png)

> 🌟 **Ventaja**: El catálogo se sincroniza automáticamente con tu inventario. Si cambias un precio o el stock de un producto en el sistema, tus clientes lo verán reflejado al instante sin que tengas que hacer nada más.

---
> ⚠️ **Importante**: Si tu suscripción expira y no realizas el pago, el sistema limitará el acceso a ciertas funciones hasta que regularices tu situación. Tus datos (productos, ventas, clientes) **no se borran**, permanecen seguros en la base de datos.

---

### 6. Gestión de Usuarios y Permisos

Para negocios con empleados, GestionPro permite crear cuentas con accesos restringidos. Esto asegura que cada miembro del equipo vea solo lo que necesita para trabajar.

#### Pasos para registrar un usuario:

1.  Ve a la pestaña **"Usuarios del Sistema"**.
2.  En el formulario **"Registrar Usuario"**, completa los datos:
    -   **Nombre Completo**: Nombre real del empleado.
    -   **Nombre de Usuario**: Identificador único para el login (ej: `carlos.ventas`).
    -   **PIN de Acceso**: Clave numérica de 4 dígitos para ingresar al sistema rápidamente.
    -   **Rol Base**: Elige entre Admin (total) o Empleado (restringido).

#### Control de Accesos:

Al crear o editar un usuario, puedes hacer clic en **"Ver Detalle"** de Permisos para ver exactamente qué secciones podrá acceder. Por defecto:
-   **Empleados**: Solo pueden vender (POS), abrir/cerrar caja y ver el catálogo.
-   **Admin**: Tienen acceso total a inventario, configuraciones y reportes mensuales.

![Gestión de Usuarios](file:///C:/Users/54112/.gemini/antigravity/brain/59e18c6c-79af-46b9-ab99-36bd732c037e/media__1771781932844.png)

---

### 7. Personalizar Dashboard

GestionPro te permite elegir qué información quieres ver apenas entras al sistema. Puedes mostrar los gráficos que más usas y ocultar aquellos que no necesites para mantener tu pantalla limpia y enfocada.

#### Cómo personalizar tu panel:

1.  Ve a la pestaña **"Dashboard"** en Configuración.
2.  Verás una lista de **interruptores (switches)** para cada tarjeta y widget disponible:
    -   **Ventas del Día/Mes**: Resúmenes rápidos de ingresos.
    -   **Ganancia Neta**: Cálculo estimado de utilidad.
    -   **Gráfico de Ventas**: Evolución visual de tus cobros.
    -   **Alertas de Stock Bajo**: Aviso de productos por agotarse.
    -   **Recomendador de Promos**: Sugerencias inteligentes basadas en IA.
3.  **Activa o Desactiva** cada opción según tu preferencia.
4.  Los cambios se aplican al instante. Cuando vuelvas al **Panel Principal**, solo verás lo que dejaste activo.

![Personalizar Dashboard](file:///C:/Users/54112/.gemini/antigravity/brain/59e18c6c-79af-46b9-ab99-36bd732c037e/media__1771781997377.png)

> 💡 **Tip**: Si sientes que el dashboard carga lento o tiene demasiada información, ocultar las tarjetas que no usas (como "Capital del Negocio") hará que tu experiencia sea mucho más fluida.

---

> 🔒 **Seguridad**: Recomendamos que cada empleado tenga su propio PIN único para que los movimientos de caja y ventas queden registrados a su nombre.

---

## ✅ Verificación

Tu configuración inicial está completa cuando:

- [x] Nombre del negocio guardado
- [x] Al menos 2 métodos de pago activos
- [x] (Opcional) Mercado Pago integrado
- [x] Plan de suscripción seleccionado

---

## 🎯 Próximos Pasos

Ahora que configuraste tu negocio, continúa con:

1. **[Agregar tu Primer Producto](./02_agregar_producto.md)**
2. **[Abrir la Caja](./03_abrir_caja.md)**

---

## ❓ Preguntas Frecuentes

**P: ¿Puedo cambiar estos datos después?**  
R: Sí, puedes volver a Configuración cuando quieras y actualizar todo.

**P: ¿El Access Token de Mercado Pago es obligatorio?**  
R: No, solo si quieres usar cobros con QR. Puedes usar efectivo y tarjeta sin problemas.

**P: ¿Qué pasa si no tengo CUIT?**  
R: El campo es opcional. Déjalo en blanco si no aplica.

---

## Siguientes Pasos
¡Felicidades! Ya configuraste tu negocio básico. Ahora puedes empezar a operar:

👉 [Guía rápida de Punto de Venta (Ventas y Cobros)](file:///c:/Users/54112/Desktop/GestionPro/public/tutorials/guides/02_punto_de_venta.md)
👉 [Cómo ver el detalle de mis ventas (Data & BI)](file:///c:/Users/54112/Desktop/GestionPro/public/tutorials/guides/11_registro_ventas.md)
