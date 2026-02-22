# Tutorial: Leer e Interpretar el Dashboard

## Objetivo
Aprender a entender las métricas clave del Dashboard para tomar decisiones de negocio.

---

## Acceder al Dashboard

- Al iniciar sesión, llegas automáticamente al Dashboard
- También: Menú lateral → **"Dashboard"** (📊)

<!-- SCREENSHOT: media__1771387730841.png -->

---

## 📊 Métricas Principales (Cards Superiores)

En la parte superior verás **4 tarjetas clave**:

### 1. Ventas del Día 💰

**Qué muestra:** Total facturado hoy

**Ejemplo:** $45.250

**Interpretación:**
- ✅ Verde: Supera el promedio diario
- 🟡 Amarillo: Cerca del promedio
- 🔴 Rojo: Por debajo del objetivo

> 💡 **Tip**: Compáralo con el mismo día de la semana anterior

<!-- SCREENSHOT: card_ventas_dia.png -->

---

### 2. Ganancia Neta 💵

**Qué muestra:** Ventas - Costos - Gastos

**Ejemplo:** $12.400

**Cálculo:**
```
Ventas:          $45.250
- Costo productos: $28.000
- Gastos operativos: $4.850
= Ganancia Neta:  $12.400
```

**Interpretación:**
- **Mayor es mejor**
- Margen saludable: 25-40% de las ventas
- Si es negativo: Estás perdiendo dinero

<!-- SCREENSHOT: card_ganancia.png -->

---

### 3. Stock Crítico ⚠️

**Qué muestra:** Cuántos productos están por agotarse

**Ejemplo:** 5 productos

**Significado:**
- Productos que bajaron del **stock mínimo**
- Necesitas reponerlos pronto

**Acción:**
- Haz clic en el número
- Te lleva a la lista de productos críticos
- Usa el **Planner de Pedidos** para reordenar (Plan PRO)

<!-- SCREENSHOT: card_stock_critico.png -->

---

### 4. Ventas del Mes 📈

**Qué muestra:** Total acumulado del mes actual

**Ejemplo:** $385.000

**Interpretación:**
- Compáralo con el **objetivo mensual**
- Proyecta si llegarás a la meta

**Cálculo mental rápido:**
```
Días transcurridos: 17
Días del mes: 30
Promedio diario: $385.000 / 17 = $22.647
Proyección: $22.647 x 30 = $679.410
```

<!-- SCREENSHOT: card_ventas_mes.png -->

---

## 📊 Gráficos de Evolución

### Gráfico de Ventas (Línea de Tiempo)

**Qué muestra:** Evolución de ventas de los últimos 7/15/30 días

**Cómo leerlo:**
- **Línea ascendente** 📈: Negocio creciendo
- **Línea plana** ➡️: Ventas estables
- **Línea descendente** 📉: Alerta, investigar causa

**Picos y valles:**
- Picos: Días de alta demanda (ej: fines de semana, cobro de sueldos)
- Valles: Días normalmente bajos (ej: lunes, martes)

<!-- SCREENSHOT: grafico_evolucion_ventas.png -->

> 💡 **Tip**: Cambia el período (7/15/30 días) con los botones arriba del gráfico

---

### Gráfico Top Productos (Pastel/Torta)

**Qué muestra:** Los 5 productos más vendidos (por monto)

**Ejemplo:**
- 🥤 Coca Cola 2L: 25%
- 🍞 Pan Lactal: 18%- 🥛 Leche 1L: 15%
- 🍪 Galletitas: 12%
- 🍺 Cerveza: 10%

**Interpretación:**
- **Productos estrella**: Los que más facturan
- **Dependencia**: Si un producto representa >50%, es riesgoso
- **Oportunidad**: Prioriza stock de estos productos

<!-- SCREENSHOT: grafico_top_productos.png -->

---

## 📊 Tablas de Datos

### Últimas Ventas

Muestra las **10 ventas más recientes**:

| Hora | Cliente | Total | Método Pago | Estado |
|------|---------|-------|-------------|--------|
| 15:23 | Juan Pérez | $1.850 | Efectivo | ✅ Pagado |
| 15:18 | Cliente Genérico | $720 | Mercado Pago | ✅ Pagado |

**Acciones rápidas:**
- 👁️ Ver detalle completo
- 🖨️ Reimprimir ticket
- ❌ Anular venta

<!-- SCREENSHOT: tabla_ultimas_ventas.png -->

---

### Productos con Stock Bajo

Lista de productos que necesitan reposición:

| Producto | Stock Actual | Stock Mínimo | Acción |
|----------|--------------|--------------|--------|
| Coca Cola 500ml | 8 un. | 20 un. | ⚠️ Reponer |
| Pan Lactal | 3 un. | 15 un. | 🔴 Urgente |

**Acciones:**
- Haz clic en el producto → Agregar lote
- Usa el **Planner de Pedidos** (automático en Plan PRO)

<!-- SCREENSHOT: tabla_stock_bajo.png -->

---

## 🎯 Indicadores de Rendimiento

### Ticket Promedio 🧾

**Fórmula:** Ventas Totales / Cantidad de Ventas

**Ejemplo:**
```
$45.250 / 38 ventas = $1.191 por venta
```

**Cómo mejorarlo:**
- Ofrecer productos complementarios
- Activar promociones (2x1, 3x2)
- Capacitar al personal en ventas sugeridas

---

### Productos Vendidos por Día 📦

**Ejemplo:** 127 unidades vendidas hoy

**Interpretación:**
- Compara con días anteriores
- Identifica tendencias estacionales

---

## ✅ Checklist Diario

Revisa el Dashboard cada mañana:

- [ ] ¿Las ventas de ayer cumplieron la meta?
- [ ] ¿Hay productos en stock crítico?
- [ ] ¿La ganancia neta es positiva?
- [ ] ¿Hay ventas pendientes de cobro (cuenta corriente)?
- [ ] ¿Algún gráfico muestra tendencia preocupante?

---

## 🎯 Próximos Pasos

Para análisis más profundo:

1. **[Exportar Reportes Detallados](./09_exportar_reportes.md)**
2. **[Usar Data & BI](./08_data_bi.md)** para análisis avanzado
3. **[Configurar Alertas](./07_alertas_stock.md)** de stock

---

## ❓ Preguntas Frecuentes

**P: ¿Por qué las ventas del Dashboard no coinciden con mi caja?**  
R: El Dashboard muestra TODAS las ventas (efectivo + tarjeta + digital). La caja solo muestra efectivo.

**P: ¿Puedo cambiar el período de los gráficos?**  
R: Sí, usa los botones "7 días", "15 días", "30 días", "Este mes".

**P: ¿La ganancia neta incluye impuestos?**  
R: No, es ganancia bruta. Debes calcular impuestos aparte según tu régimen fiscal.

**P: ¿Cómo agrego un objetivo de ventas para comparar?**  
R: Ve a Configuración > Objetivos > Ingresa meta mensual.
