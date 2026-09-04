# Flujo y Orquestación de Venta (Estrategia Single Cart)

Para escalar el bloqueo de butacas sin requerir múltiples usuarios cajeros, aplicaremos una técnica de "Multiplexación Transaccional" usando una sola `ventaTemporal`.

## Ciclo de Vida de una Reserva B2C

1. **Pre-Selección (Frontend B2C):**
   - El cliente selecciona las butacas en el mapa.
   - El frontend llama al backend B2C para "bloquear" esas butacas.

2. **Bloqueo Híbrido (BFF y POS):**
   - El backend B2C guarda las butacas en su base de datos/Redis con estado `PENDING` y expiran en 5 minutos.
   - Inmediatamente, el backend hace una llamada al `LegacyPosClient` para agregar estas butacas a la `ventaTemporal` maestra del usuario dedicado, sumándolas a las que ya estaban allí de otros clientes pendientes.
   - En este punto, todas las butacas de todos los clientes en `PENDING` están bloqueadas en el POS.

3. **Confirmación y Pago (El cuello de botella orquestado):**
   Cuando el "Cliente A" procesa su pago con éxito, debemos facturarlo en el POS. Como el `cerrarVenta` factura TODO lo que hay en el carrito, debemos "aislar" las butacas del "Cliente A".

   **Operación Atómica Mutex (Crítica):**
   ```
   START MUTEX LOCK (Para que ningún otro pago/bloqueo interrumpa)
   
   a. Recuperar de Redis todas las butacas PENDING de TODOS los demás clientes (Cliente B, C, etc.).
   
   b. DELETE /ventasTemporales -> Limpia completamente el carrito maestro.
   
   c. POST /ventasTemporales/detalles -> Agregar SÓLO las butacas del "Cliente A".
   
   d. POST /cerrarVenta -> Se factura el "Cliente A".
   
   e. DELETE /ventasTemporales -> Limpia el carrito de nuevo (que ahora debería estar vacío tras la venta).
   
   f. POST /ventasTemporales/detalles -> Re-agregar todas las butacas PENDING del Cliente B, C, etc.
   
   END MUTEX LOCK
   ```

## Reglas de Limpieza (Garbage Collection)
Si la reserva de un cliente expira (pasan los 5 minutos sin pago), el sistema debe:
1. Eliminar la reserva de Redis.
2. Hacer una actualización (re-sync) de la `ventaTemporal` maestra: Borrarla (`DELETE`) y recrearla sólo con las butacas que aún están vigentes en Redis.
