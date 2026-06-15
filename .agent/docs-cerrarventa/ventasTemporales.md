# Documentación de Endpoints: `ventasTemporales`

Esta documentación fue generada a partir de la auditoría del archivo HAR `PruebaVentaTemporales.har`, para comprender el comportamiento exacto y la estructura de respuestas de la API del POS (`/apicomplejo/ventasTemporales`).

---

## 1. GET `/apicomplejo/ventasTemporales`
Obtiene el estado actual del carrito de compras (venta temporal) asociado al token de sesión.

**Método:** `GET`  
**Headers Requeridos:** `Authorization: Bearer <TOKEN>`

### Estructura de Respuesta (Status 200 OK)
A diferencia de otros endpoints del POS, la respuesta **NO** viene envuelta en un nodo `"objeto"`. Se devuelve directamente en la raíz del JSON.

```json
{
  "id": "414929",
  "fecha": "2026-06-12 17:52:34",
  "fecha_format": "12/06/2026 17:52",
  "total": "65",
  "descuento": "0",
  "codigo_cliente": null,
  "detalles": [
    {
      "id": "605295",
      "valorTarifa": "5",
      "cantidadEntradas": "1",
      "activa": "1",
      "idPromocion": null,
      "descuento": "0",
      "codigo_cliente": null,
      "idFuncion": "20345",
      "nombreButaca": "A-19-1",
      "idTarifa": "2",
      "vendeNumeradas": "1",
      "fecha": "2026-06-12 18:00",
      "fecha_format": "12/06/2026 18:00",
      "titulo": "AMOS DEL UNIVERSO (ESP)",
      "cantidadMinima": "1",
      "protocolo": "no-aplica",
      "relacion": null,
      "butaca": "A:14"
    }
  ],
  "cliente": null
}
```

**Notas Críticas:**
*   El campo `id` es el ID de la Venta Temporal.
*   El campo `total` representa la sumatoria total del carrito en la moneda base del POS.
*   `detalles` es un array con cada butaca de manera individualizada (desglosada, aunque se haya enviado un bloque de butacas en el POST).

---

## 2. POST `/apicomplejo/ventasTemporales/detalles`
Añade butacas (o artículos) al carrito de la venta temporal.

**Método:** `POST`  
**Headers Requeridos:** `Authorization: Bearer <TOKEN>`, `Content-Type: application/json`

### Payload de Petición
```json
{
  "id_funcion": "20345",
  "numero_funcion": "2",
  "numero_sala": "1",
  "id_tarifa": "2",
  "serie_tarifa": "G1",
  "precio_tarifa": "5",
  "cantidad_entradas": 2,
  "butacas_elegidas": ["A-19-1", "A-18-1"],
  "id_promocion": null,
  "descuento_entrada": 0,
  "descuento_venta": 0,
  "codigoCliente": ""
}
```

### Estructura de Respuesta (Status 200 OK)
La respuesta confirma los IDs internos generados para cada entrada, y devuelve el resumen de la venta temporal actualizada.

```json
{
  "ids_entradas": [
    605295,
    605296
  ],
  "venta": {
    "id": "414929",
    "fecha": "2026-06-12 17:52:34",
    "fecha_format": "12/06/2026 17:52",
    "total": "10",
    "descuento": "0",
    "codigo_cliente": null
  }
}
```

---

## 3. DELETE `/apicomplejo/ventasTemporales`
Elimina todo el contenido de la venta temporal (vacía el carrito y libera todas las butacas asociadas a la sesión).

**Método:** `DELETE`  
**Headers Requeridos:** `Authorization: Bearer <TOKEN>`, `Content-Type: application/x-www-form-urlencoded`
**Cuerpo de la Petición:** `{}` *(El POS PHP estricto requiere recibir este body literal para procesar la eliminación)*

### Estructura de Respuesta (Status 200 OK)
La respuesta devuelve el resumen de la venta temporal con el `total` en `"0"`.

```json
{
  "venta": {
    "id": "414928",
    "fecha": "2026-06-12 17:51:58",
    "fecha_format": "12/06/2026 17:51",
    "total": "0",
    "descuento": "0",
    "codigo_cliente": null
  }
}
```

---

## Conclusiones para la Orquestación
1.  **Diferencia de Estructuras:** Mientras que el `DELETE` y el `POST` devuelven un nodo `"venta": { ... }`, el `GET` devuelve directamente los atributos de la venta (`"id"`, `"total"`) en la raíz del JSON.
2.  **Manejo del Total:** El `total` obtenido a través del `GET` o en el nodo `venta` es la fuente de verdad del precio a cobrar y debe inyectarse o validarse contra el payload de `/cerrarVenta`.
3.  **Seguridad del DELETE:** Es seguro ejecutar el `DELETE /ventasTemporales` incluso si el carrito ya está vacío, el POS responderá con `200 OK` y el total en `0`.
