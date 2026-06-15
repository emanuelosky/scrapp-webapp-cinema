# Análisis del Flujo de Cierre de Venta (Legacy POS)

El proceso de cierre de venta en el POS legacy involucra una serie de pasos secuenciales y sincronizados que transforman una sesión de carrito en una factura física/fiscal, interactuando con las APIs del backend y con el hardware local (impresoras) mediante QZ Tray.

## 1. Validaciones y Preparación
La función principal que desencadena el flujo es `cerrarVenta()` (en `manejarVenta.js`).
1. Primero verifica la regionalización (ej. `"ven"` para Venezuela).
2. Si es Venezuela, verifica el estado de conexión de la impresora fiscal interactuando con una API de backend: `/fiscalVen/verificarImpresoraFiscalVen?ip=...`.
3. Valida la disponibilidad de butacas (`validarBoleteria()` -> `validarVenta()`).
4. Invoca el modal de métodos de pago.
5. El cajero selecciona las formas de pago. Tras presionar "Imprimir/Facturar", se recolectan los pagos en la función `guardarMetodoPago()`.

## 2. Petición a `/cerrarVenta` (Empaquetado y Persistencia Inicial)
La función `generarRequest()` estructura el JSON que será enviado a `/cerrarVenta`.
- El objeto incluye detalles como `numero_comanda`, descuentos, cliente, ubicacion, modulo, `datos_venta_candy` y `datos_pagos`.
- Se realiza una llamada a `Api.guardarDatos(datosVenta, 'cerrarVenta', callback)`.
- El backend procesa esto y devuelve identificadores fundamentales como `idVenta`, `idVentaCandy`, y en algunos casos identificadores de facturación (si es factura electrónica directa).

## 3. Petición a `/facturas/generar` (Orquestación Fiscal)
Justo después de que `/cerrarVenta` es exitoso, la función callback `generarVenta()` se encarga de ejecutar `/facturas/generar`.
- Envía un payload masivo con:
  - `detalles`: Items a facturar.
  - `empresaId`, `tipo_contribuyente`, `nro_punto_venta`.
  - `regionalizacion` y `datosCliente`.
  - `impresora`: Dirección IP de la impresora (crucial para Venezuela).
  - Identificadores de venta: `idVentaTemporal`, `idVenta`, `idVentaCandy`.
  - `pago`: El objeto de pagos procesados.
- El servidor backend recibe esto y construye las **tramas de impresión** en crudo (strings formateados para QZ Tray o comandos fiscales específicos) o interactúa remotamente con un spooler fiscal, dependiendo del modelo de la impresora.
- Retorna las tramas codificadas en Base64 (`trama_boleteria`, `tramas_candy`, `trama_puntos`, `trama_factura`).

## 4. Impresión Hardware Local (QZ Tray)
El resultado del endpoint `/facturas/generar` (o la función `imprimirVentaCall` en `manejarImpresion.js`) toma estas tramas en Base64 y:
1. Las decodifica con `atob(decodeURIComponent(escape(trama)))`.
2. Las organiza en arrays (`arrayTramas`, `arrayImpresoras`).
3. Para la dulcería (Candy), puede enviarlas mediante WebSockets locales (`WSManager.sendPrintMessage`).
4. Llama a `deployQZ()` (iniciando el puente de QZ Tray en Java/WebSockets).
5. Envía las tramas crudas directamente al spooler del sistema operativo usando `impresora.imprimir(arrayTramas, arrayImpresoras)`, lo que despacha los comandos ESC/POS, ZPL, o EPL hacia la impresora física.
6. Corre un intervalo de verificación sobre la cola de impresión (`COLA_IMPRESION.isDone()`) antes de recargar la página para una nueva venta.

---
## Conclusión
El backend no habla "directamente" a nivel de red (TCP/USB) con la impresora térmica para imprimir los tickets de dulcería o boletos ordinarios; el backend **devuelve** los strings de impresión crudos a la capa Frontend del Legacy POS, y es el navegador local (apoyado en QZ Tray) quien entrega el documento a la impresora.

Sin embargo, para las **Impresoras Fiscales de Venezuela**, el backend suele tener una pieza puente (`fiscalVen/verificarImpresoraFiscalVen`) que indica que parte del tráfico fiscal podría estar siendo ruteado localmente, o que se necesita la orquestación cliente-servidor para generar el correlativo fiscal *antes* de imprimir.
