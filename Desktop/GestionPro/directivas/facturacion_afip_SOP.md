# Directiva: Integración de Facturación AFIP / ARCA (Vía Microservicio Node.js)

## Arquitectura y Flujo Técnico (Opción 2)
Dado que Supabase Edge Functions (Deno) no soporta de forma nativa la librería oficial de AFIP por limitaciones criptográficas (SOAP/WSDL), se ha optado por construir un **Microservicio REST independiente en Node.js**.

Este servicio actúa como un "traductor" o "cajero automático" entre GestionNow y AFIP.

**El Flujo será el siguiente**:
1. **Frontend (GestionNow)**: El usuario cobra una venta en `POS.tsx` y elige "Facturar". 
2. **Frontend -> Microservicio**: React envía un JSON simple (Monto total, IVA, CUIT del cliente si lo hay) a la URL de nuestro nuevo microservicio Node.js.
3. **Microservicio Node.js (`afip-service`)**:
   - Recibe el JSON.
   - Utiliza la librería oficial `afip.js`.
   - Lee localmente los certificados `.crt` y `.key` del servidor.
   - Se comunica con el WebService de AFIP (`wsfev1`), procesa la criptografía compleja de SOAP y pide el CAE.
4. **Respuesta**: El microservicio devuelve a React el número de `CAE`, la fecha de vencimiento y el enlace al código QR.
5. **Impresión Final**: La repuesta hace disparar el `webPrintService.ts` en GestionNow, que dibujará tanto el texto como el QR oficial de AFIP obligatorio.

## Beneficios Inmediatos de este enfoque
- **Gratuito y Abierto**: Usar Node.js y `afip.js` no tiene cargos por factura extra. Se puede alojar gratis en servicios como *Render* o *Railway*.
- **Aislamiento de Errores**: Si AFIP se cae o cambia su protocolo (lo cual hacen seguido), GestionNow en React no se rompe. Solo se actualiza el microservicio.
- **Seguridad**: Los certificados de AFIP de tus clientes (`.crt`, `.key`) no viajan por internet ni al frontend, se configuran seguros en las carpetas de este microservicio.

## Lógica y Pasos Concretos (Roadmap de Ejecución)

### Fase 1 (Semanas 1) - Setup del Microservicio:
- Se creará una nueva carpeta raíz llamada (por ejemplo) `afip-service`.
- Se inicializará un proyecto Express.js con las dependencias `afip.js` y `cors`.
- Se configurará 1 ruta API (`POST /facturar`).

### Fase 2 - UI / UX en GestionNow:
- Agregar un toggle en `Settings` para activar/desactivar envío de datos a AFIP.
- Configurar el input para el CUIT emisor y el número de Punto de Venta.

### Fase 3 - Conexión POS -> AFIP:
- Al apretar "Cobrar" (si AFIP está activo), se envía la petición `fetch` al endpoint Node.js en lugar de solo guardarlo localmente.

### Fase 4 - Modificación del Ticket:
- Adaptar `webPrintService.ts` para inyectar bloque visual AFIP.

## Restricciones y Casos Borde (Known Traps)
- **Homologación vs Producción**: Durante la Fase 1 a 3, el Node.js debe arrancar pasando la variable obligatoria `production: false` a la instancia de `Afip.js` para usar servidores de prueba.
- **AFIP Down**: AFIP suele tener caídas a la madrugada. El Front-end de GestionNow debe atrapar el status `500` del microservicio y mostrar una alerta tipo: "AFIP no responde temporalmente. La venta se guardará pero no fue facturada."
- **Dependencia de Certificados Físicos**: La librería requiere lectura local por disco (`fs.readFileSync()`). Se deben mapear correctamente las rutas absolutas dentro del microservicio.
