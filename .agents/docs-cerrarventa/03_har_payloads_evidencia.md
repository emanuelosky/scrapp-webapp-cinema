# Evidencia HAR: Payloads Reales de Venta

Durante la auditoría de los archivos `.har` encontrados en `descarga-pagina` (específicamente `192.168.60.30_05_30_2026_21_42_01.har`), hemos extraído los payloads exactos que el Legacy POS dispara al backend. 

## 1. Request a `/apicomplejo/cerrarVenta`

```json
{
  "tramas_separadas": false,
  "datos_pagos": [
    {
      "metodo": 23,
      "monto": 28.99,
      "impuestoIGFT": 478.5,
      "metodoVuelto": "23",
      "tasaConversion": 550
    }
  ],
  "datos_venta_candy": {
    "venta": {
      "numero_comanda": 1,
      "fecha": "2026-05-30 21:37:29",
      "descuento": 0,
      "total": 18.99,
      "cliente_id": "",
      "ubicacion": null
    },
    "detalle": [
      {
        "id": "3",
        "producto_nombre": "COMBO 3 - ROMANTICO",
        "codigo_barra": "",
        "producto_id": "3",
        "precio": 18.99,
        "activo": 1,
        "cantidad": 1,
        "porcentaje_iva": 0.16,
        "es_combo": "1",
        "rubro_id": "",
        "nombre_rubro": "COMBOS",
        "imprimir_preferencias": "1",
        "preferencias": [
          { "producto_id": 532, "preferencia_id": "null", "nombre": "CC TEQUENOS", "cantidad": 1, "incremento": 0, "item": 0 },
          { "producto_id": 537, "preferencia_id": "null", "nombre": "COTUFA GRANDE", "cantidad": 1, "incremento": 0, "item": 1 },
          { "producto_id": 523, "preferencia_id": 1, "nombre": "COCA COLA", "cantidad": 1, "incremento": 0, "item": 2 },
          { "producto_id": 523, "preferencia_id": 1, "nombre": "COCA COLA", "cantidad": 1, "incremento": 0, "item": 3 }
        ],
        "incremento": 0,
        "descuento": 0,
        "cupones": []
      }
    ]
  },
  "nro_comprobante": "",
  "nro_comprobante_dian": "",
  "nro_comprobante_apicomplejo": "",
  "nro_punto_venta": "41",
  "nro_autorizacion": "",
  "fecha_vencimiento": "",
  "base64_invoice": "",
  "codQR": "",
  "fecha_emision": "",
  "firma": "",
  "regionalizacion": "ven"
}
```

## 2. Request a `/apicomplejo/facturas/generar`

Este request ocurre milisegundos después del anterior, llevando los `idVenta` e `idVentaTemporal` devueltos.

```json
{
  "detalles": [
    {
      "descripcion": "COMBO 3 - ROMANTICO",
      "codigo_barra": "COMBO 3 - ROMANTICO",
      "iva": 16,
      "cantidad": 1,
      "precio": 18.99,
      "incremento": 0,
      "tipo": "candy"
    },
    {
      "descripcion": "ALERTA EXTINCION (ESP)",
      "iva": "16.00000",
      "cantidad": 1,
      "precio": 5,
      "tipo": "boleteria"
    },
    {
      "descripcion": "ALERTA EXTINCION (ESP)",
      "iva": "16.00000",
      "cantidad": 1,
      "precio": 5,
      "tipo": "boleteria"
    }
  ],
  "empresaId": "1",
  "tipo_contribuyente": "responsable_inscripto",
  "nro_punto_venta": "41",
  "desde": "pos-cinexo",
  "regionalizacion": "ven",
  "datosCliente": null,
  "impresora": "192.168.10.246",
  "idVentaTemporal": "414821",
  "idVenta": 681610,
  "idVentaCandy": 64222,
  "pago": [
    {
      "metodo": 23,
      "monto": 28.99,
      "impuestoIGFT": 478.5,
      "metodoVuelto": "23",
      "tasaConversion": 550
    }
  ]
}
```

## Conclusiones sobre la Evidencia
1. El sistema trata Boletería y Candy de forma separada en `/cerrarVenta` pero los une en un solo array de `detalles` para `/facturas/generar`.
2. Contiene metadatos específicos como `impresora` (192.168.10.246) que revelan que el backend usa esa IP para interactuar (o al menos loguear) a dónde va la impresión fiscal en Venezuela.
3. El `impuestoIGFT` (Impuesto a Grandes Transacciones Financieras) se calcula y se pasa directamente en crudo.
