# Reporte de Datos Mockeados / Estáticos (Integración POS)

A continuación se detalla toda la información que actualmente está siendo "inyectada" o hardcodeada por el backend B2C para cumplir con las exigencias del Legacy POS durante el ciclo de vida de la venta.

## 1. Proceso de `cerrarVenta`

El payload enviado a `/apicomplejo/cerrarVenta` requiere muchos campos que un e-commerce B2C naturalmente no genera o no necesita. Los siguientes campos se están mockeando:

- **`tramas_separadas`**: Hardcodeado a `false`.
- **`nro_comprobante`**: Cadena vacía `""`. El POS lo asigna internamente o lo ignora en este paso.
- **`nro_comprobante_dian`**: Cadena vacía `""` (Aplica para Colombia, no para VEN).
- **`nro_comprobante_apicomplejo`**: Cadena vacía `""`.
- **`nro_punto_venta`**: Se extrae de `app_settings` (`config.pos_id_punto_venta`), por defecto cae a `"41"`.
- **`nro_autorizacion`**: Cadena vacía `""`.
- **`fecha_vencimiento`**: Cadena vacía `""`.
- **`base64_invoice`**: Cadena vacía `""`.
- **`codQR`**: Cadena vacía `""`.
- **`fecha_emision`**: Cadena vacía `""`.
- **`firma`**: Cadena vacía `""`.
- **`regionalizacion`**: Hardcodeado a `"ven"`.
- **`datos_pagos`**: Se pasa el objeto `pago` inyectado, pero la `tasaConversion` actualmente es responsabilidad del frontend o del proceso intermedio (y podría estar estática en pruebas).

## 2. Proceso de `facturas/generar`

El payload que se dispara a la impresora fiscal también requiere datos rígidos para estructurar la factura:

- **`tipo_contribuyente`**: Hardcodeado a `"responsable_inscripto"`. (Quizás deba ajustarse a "consumidor_final" dependiendo de los requisitos contables B2C).
- **`empresaId`**: Extraído de la configuración `config.pos_empresa`, por defecto `"1"`.
- **`desde`**: Hardcodeado a `"pos-cinexo"`. El POS nativo se identifica así, nosotros lo emulamos para evitar bloqueos por origen.
- **`regionalizacion`**: Hardcodeado a `"ven"`.
- **`datosCliente`**: Hardcodeado a `null`. (Por ahora los boletos B2C salen a nombre de consumidor genérico o sin cédula fiscal. Si se requiere factura personalizada con RIF/Cédula, esto deberá mapearse desde la Web App).
- **`impresora`**: Extraído de `config.pos_impresora` (Actualmente `"192.168.10.246"`).
- **Detalle de Impuestos (`iva`)**: En cada ticket (boleto), el atributo `iva` se inyecta como `"16.00000"`.
- **`descripcion`**: Si el POS no devuelve el nombre de la película, el sistema cae por defecto a `"ENTRADA"`.

## 3. Proceso en `ventas_master` (Nuestra Base de Datos)

Para acoplarnos a los dashboards de reportes y al sistema de KDS (Cocina), inyectamos datos estándar:

- **`device_alias`**: Hardcodeado a `"B2C_WEB_APP"`.
- **`candy`**: Hardcodeado a `[]` (Arreglo vacío). Garantiza que si no hay dulces, la tabla no reviente con `null`.
- **`empresa_id`**: Forzado a `config.pos_empresa` o `"1"`.

---

> [!TIP]
> **Recomendación a futuro:**
> Cuando desees que los clientes B2C pidan factura legal a su nombre (con RIF), deberemos actualizar el frontend para pedir esos datos y sustituir el `datosCliente: null` por el objeto completo que espera el Legacy POS.
