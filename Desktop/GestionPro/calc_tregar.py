import json

data = [
  {
    "Hora Venta": "2026-02-26 00:07:15.753256+00",
    "ID Venta": "170244fc-c0b9-4909-a474-a124a3a4600c",
    "Producto (Tregar)": "queso rallado tregar x 40 grs",
    "Cant. Vendida": "1",
    "Costo Unit. (Catálogo Actual)": "929",
    "Costo Unit. (Guardado en Caja)": "929",
    "Costo Total Cobrado": "929",
    "Precio Cobrado": "1500"
  },
  {
    "Hora Venta": "2026-02-26 00:29:39.995835+00",
    "ID Venta": "271e5bc7-87ef-42e5-9ab1-6d822e196686",
    "Producto (Tregar)": "crema tregar doble x 350cc",
    "Cant. Vendida": "1",
    "Costo Unit. (Catálogo Actual)": "2440",
    "Costo Unit. (Guardado en Caja)": "2440",
    "Costo Total Cobrado": "2440",
    "Precio Cobrado": "3400"
  },
  {
    "Hora Venta": "2026-02-26 12:06:38.01426+00",
    "ID Venta": "3a556793-3314-422c-b80c-90bb41ef03ae",
    "Producto (Tregar)": "yogur bebible de durazno 900 ml tregar",
    "Cant. Vendida": "1",
    "Costo Unit. (Catálogo Actual)": "1323",
    "Costo Unit. (Guardado en Caja)": "1323",
    "Costo Total Cobrado": "1323",
    "Precio Cobrado": "2200"
  },
  {
    "Hora Venta": "2026-02-26 12:06:38.01426+00",
    "ID Venta": "3a556793-3314-422c-b80c-90bb41ef03ae",
    "Producto (Tregar)": "manteca punta de agua x 200",
    "Cant. Vendida": "1",
    "Costo Unit. (Catálogo Actual)": "2223",
    "Costo Unit. (Guardado en Caja)": "2223",
    "Costo Total Cobrado": "2223",
    "Precio Cobrado": "3400"
  },
  {
    "Hora Venta": "2026-02-26 13:46:38.021511+00",
    "ID Venta": "4d6c0eb0-c732-4fcb-9bef-c7be622d3ee5",
    "Producto (Tregar)": "yogur bebible x 900 tregar vainilla",
    "Cant. Vendida": "1",
    "Costo Unit. (Catálogo Actual)": "1323",
    "Costo Unit. (Guardado en Caja)": "1323",
    "Costo Total Cobrado": "1323",
    "Precio Cobrado": "2200"
  },
  {
    "Hora Venta": "2026-02-26 13:46:38.021511+00",
    "ID Venta": "4d6c0eb0-c732-4fcb-9bef-c7be622d3ee5",
    "Producto (Tregar)": "yogur bebible de durazno 900 ml tregar",
    "Cant. Vendida": "1",
    "Costo Unit. (Catálogo Actual)": "1323",
    "Costo Unit. (Guardado en Caja)": "1323",
    "Costo Total Cobrado": "1323",
    "Precio Cobrado": "2200"
  },
  {
    "Hora Venta": "2026-02-26 13:46:38.021511+00",
    "ID Venta": "4d6c0eb0-c732-4fcb-9bef-c7be622d3ee5",
    "Producto (Tregar)": "manteca punta de agua x 200",
    "Cant. Vendida": "1",
    "Costo Unit. (Catálogo Actual)": "2223",
    "Costo Unit. (Guardado en Caja)": "2223",
    "Costo Total Cobrado": "2223",
    "Precio Cobrado": "3400"
  },
  {
    "Hora Venta": "2026-02-26 13:47:23.433787+00",
    "ID Venta": "45ae6aa0-9bea-4cdc-a114-fc663ead4b64",
    "Producto (Tregar)": "queso blanco entero tregar 290",
    "Cant. Vendida": "1",
    "Costo Unit. (Catálogo Actual)": "1858",
    "Costo Unit. (Guardado en Caja)": "1858",
    "Costo Total Cobrado": "1858",
    "Precio Cobrado": "2800"
  },
  {
    "Hora Venta": "2026-02-26 13:48:19.230954+00",
    "ID Venta": "80d862f6-9f0a-4a7a-8f23-77df77296fd1",
    "Producto (Tregar)": "yogur bebible x 900 tregar arandanos",
    "Cant. Vendida": "1",
    "Costo Unit. (Catálogo Actual)": "1323",
    "Costo Unit. (Guardado en Caja)": "1323",
    "Costo Total Cobrado": "1323",
    "Precio Cobrado": "2200"
  },
  {
    "Hora Venta": "2026-02-26 13:48:19.230954+00",
    "ID Venta": "80d862f6-9f0a-4a7a-8f23-77df77296fd1",
    "Producto (Tregar)": "yogur bebible x 900 tregar frutilla",
    "Cant. Vendida": "1",
    "Costo Unit. (Catálogo Actual)": "1337",
    "Costo Unit. (Guardado en Caja)": "1337",
    "Costo Total Cobrado": "1337",
    "Precio Cobrado": "2200"
  },
  {
    "Hora Venta": "2026-02-26 15:15:39.343859+00",
    "ID Venta": "8c969782-0453-44a2-9ed3-c2c4fa7bdc56",
    "Producto (Tregar)": "yogur frutado de arandanos tregar",
    "Cant. Vendida": "4",
    "Costo Unit. (Catálogo Actual)": "827",
    "Costo Unit. (Guardado en Caja)": "827",
    "Costo Total Cobrado": "3308",
    "Precio Cobrado": "1500"
  },
  {
    "Hora Venta": "2026-02-26 15:15:39.343859+00",
    "ID Venta": "8c969782-0453-44a2-9ed3-c2c4fa7bdc56",
    "Producto (Tregar)": "yogur frutado tregar frutilla",
    "Cant. Vendida": "5",
    "Costo Unit. (Catálogo Actual)": "827",
    "Costo Unit. (Guardado en Caja)": "827",
    "Costo Total Cobrado": "4135",
    "Precio Cobrado": "1500"
  },
  {
    "Hora Venta": "2026-02-26 15:15:39.343859+00",
    "ID Venta": "8c969782-0453-44a2-9ed3-c2c4fa7bdc56",
    "Producto (Tregar)": "yogur tops granola tregar",
    "Cant. Vendida": "2",
    "Costo Unit. (Catálogo Actual)": "866",
    "Costo Unit. (Guardado en Caja)": "866",
    "Costo Total Cobrado": "1732",
    "Precio Cobrado": "1500"
  },
  {
    "Hora Venta": "2026-02-26 15:15:39.343859+00",
    "ID Venta": "8c969782-0453-44a2-9ed3-c2c4fa7bdc56",
    "Producto (Tregar)": "yogur tregar cereal",
    "Cant. Vendida": "4",
    "Costo Unit. (Catálogo Actual)": "867",
    "Costo Unit. (Guardado en Caja)": "867",
    "Costo Total Cobrado": "3468",
    "Precio Cobrado": "1500"
  },
  {
    "Hora Venta": "2026-02-26 15:15:39.343859+00",
    "ID Venta": "8c969782-0453-44a2-9ed3-c2c4fa7bdc56",
    "Producto (Tregar)": "yogur tregar cremoso frutilla x125",
    "Cant. Vendida": "3",
    "Costo Unit. (Catálogo Actual)": "414",
    "Costo Unit. (Guardado en Caja)": "414",
    "Costo Total Cobrado": "1242",
    "Precio Cobrado": "700"
  },
  {
    "Hora Venta": "2026-02-26 15:15:39.343859+00",
    "ID Venta": "8c969782-0453-44a2-9ed3-c2c4fa7bdc56",
    "Producto (Tregar)": "yogur tregar cremoso vainilla x125",
    "Cant. Vendida": "1",
    "Costo Unit. (Catálogo Actual)": "414",
    "Costo Unit. (Guardado en Caja)": "414",
    "Costo Total Cobrado": "414",
    "Precio Cobrado": "700"
  },
  {
    "Hora Venta": "2026-02-26 15:17:16.142832+00",
    "ID Venta": "84980f61-5ef4-4d97-b27b-566f6d760843",
    "Producto (Tregar)": "crema tregar doble x 350cc",
    "Cant. Vendida": "1",
    "Costo Unit. (Catálogo Actual)": "2440",
    "Costo Unit. (Guardado en Caja)": "2440",
    "Costo Total Cobrado": "2440",
    "Precio Cobrado": "3400"
  },
  {
    "Hora Venta": "2026-02-26 15:41:24.642193+00",
    "ID Venta": "6f0c2108-e8a1-487c-ba80-b7c459979c44",
    "Producto (Tregar)": "yogur tregar cremoso frutilla x125",
    "Cant. Vendida": "2",
    "Costo Unit. (Catálogo Actual)": "414",
    "Costo Unit. (Guardado en Caja)": "414",
    "Costo Total Cobrado": "828",
    "Precio Cobrado": "700"
  },
  {
    "Hora Venta": "2026-02-26 15:41:24.642193+00",
    "ID Venta": "6f0c2108-e8a1-487c-ba80-b7c459979c44",
    "Producto (Tregar)": "yogur tregar cremoso vainilla x125",
    "Cant. Vendida": "2",
    "Costo Unit. (Catálogo Actual)": "414",
    "Costo Unit. (Guardado en Caja)": "414",
    "Costo Total Cobrado": "828",
    "Precio Cobrado": "700"
  },
  {
    "Hora Venta": "2026-02-26 15:41:24.642193+00",
    "ID Venta": "6f0c2108-e8a1-487c-ba80-b7c459979c44",
    "Producto (Tregar)": "queso untable tregar ciboulette",
    "Cant. Vendida": "1",
    "Costo Unit. (Catálogo Actual)": "1241",
    "Costo Unit. (Guardado en Caja)": "1241",
    "Costo Total Cobrado": "1241",
    "Precio Cobrado": "2000"
  },
  {
    "Hora Venta": "2026-02-26 15:41:24.642193+00",
    "ID Venta": "6f0c2108-e8a1-487c-ba80-b7c459979c44",
    "Producto (Tregar)": "queso untable tregar jamon",
    "Cant. Vendida": "1",
    "Costo Unit. (Catálogo Actual)": "1337",
    "Costo Unit. (Guardado en Caja)": "1337",
    "Costo Total Cobrado": "1337",
    "Precio Cobrado": "2200"
  },
  {
    "Hora Venta": "2026-02-26 15:43:33.42032+00",
    "ID Venta": "fc3ed96e-85b6-4558-b669-6597eb8d6727",
    "Producto (Tregar)": "yogur bebible x 900 tregar frutilla",
    "Cant. Vendida": "1",
    "Costo Unit. (Catálogo Actual)": "1337",
    "Costo Unit. (Guardado en Caja)": "1337",
    "Costo Total Cobrado": "1337",
    "Precio Cobrado": "2200"
  },
  {
    "Hora Venta": "2026-02-26 15:43:33.42032+00",
    "ID Venta": "fc3ed96e-85b6-4558-b669-6597eb8d6727",
    "Producto (Tregar)": "yogur bebible x 900 tregar arandanos",
    "Cant. Vendida": "1",
    "Costo Unit. (Catálogo Actual)": "1323",
    "Costo Unit. (Guardado en Caja)": "1323",
    "Costo Total Cobrado": "1323",
    "Precio Cobrado": "2200"
  },
  {
    "Hora Venta": "2026-02-26 23:02:28.193145+00",
    "ID Venta": "7ec480b5-9088-4110-b33e-43deff9fbbf8",
    "Producto (Tregar)": "yogur bebible x 900 tregar vainilla",
    "Cant. Vendida": "1",
    "Costo Unit. (Catálogo Actual)": "1323",
    "Costo Unit. (Guardado en Caja)": "1323",
    "Costo Total Cobrado": "1323",
    "Precio Cobrado": "2200"
  },
  {
    "Hora Venta": "2026-02-26 23:02:28.193145+00",
    "ID Venta": "7ec480b5-9088-4110-b33e-43deff9fbbf8",
    "Producto (Tregar)": "yogur bebible x 900 tregar frutilla",
    "Cant. Vendida": "1",
    "Costo Unit. (Catálogo Actual)": "1337",
    "Costo Unit. (Guardado en Caja)": "1337",
    "Costo Total Cobrado": "1337",
    "Precio Cobrado": "2200"
  },
  {
    "Hora Venta": "2026-02-26 23:41:07.925954+00",
    "ID Venta": "c9bae103-8f09-4cb6-843f-5b1fd0d4d996",
    "Producto (Tregar)": "yogur bebible x 900 tregar arandanos",
    "Cant. Vendida": "1",
    "Costo Unit. (Catálogo Actual)": "1323",
    "Costo Unit. (Guardado en Caja)": "1323",
    "Costo Total Cobrado": "1323",
    "Precio Cobrado": "2200"
  },
  {
    "Hora Venta": "2026-02-26 23:41:07.925954+00",
    "ID Venta": "c9bae103-8f09-4cb6-843f-5b1fd0d4d996",
    "Producto (Tregar)": "yogur bebible de durazno 900 ml tregar",
    "Cant. Vendida": "1",
    "Costo Unit. (Catálogo Actual)": "1323",
    "Costo Unit. (Guardado en Caja)": "1323",
    "Costo Total Cobrado": "1323",
    "Precio Cobrado": "2200"
  }
]

total_cost = 0
total_articulos = 0
total_precio_bruto = 0

for item in data:
    cantidad = float(item["Cant. Vendida"])
    costo_total_cobrado = float(item["Costo Total Cobrado"])
    precio_cobrado = float(item["Precio Cobrado"])
    
    total_cost += costo_total_cobrado
    total_articulos += cantidad
    total_precio_bruto += (precio_cobrado * cantidad)

print('--- CALCULO TREGAR ---')
print(f'Total Articulos: {total_articulos}')
print(f'Suma Costos: ${total_cost}')
print(f'Suma Precios Cobrados (Brutos): ${total_precio_bruto}')
