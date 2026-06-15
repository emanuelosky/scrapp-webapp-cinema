# Arquitectura de Impresión Fiscal y Cierre de Venta (Web App)

La pregunta fundamental de cara al futuro de la **Web App B2C** (o Kiosko) es:
> *¿Debe la aplicación web orquestar una sesión mediante un navegador físico en el cine para manejar la impresora fiscal y el cierre de venta?*

## El Problema del Hardware Local en la Nube
El sistema legacy fue diseñado bajo un esquema cliente-servidor donde la "caja" (la computadora del POS) era al mismo tiempo el terminal de venta y el hub de hardware. El navegador conectaba con `QZ Tray` (un servicio en `localhost:8182`) para inyectar comandos brutos a la impresora fiscal local o tiquetera USB.

Si lanzamos una **Web App B2C** (donde el cliente compra desde el navegador de su teléfono celular en su casa), ese navegador:
1. No tiene conexión local a QZ Tray.
2. No tiene visibilidad a la red LAN del cine.
3. No posee la impresora fiscal enchufada por serial/USB.

Para resolver la facturación física/fiscal y la impresión de boletos, tenemos tres grandes opciones arquitectónicas.

## Opción 1: Orquestación RPA (Robotic Process Automation) con Navegador Físico (La más rápida y hacky)
Tal como lo sugieres, esto implica tener una PC física (o Raspberry Pi) dentro del cine que siempre esté corriendo un "Worker" (ej: Puppeteer o Playwright).
- **Flujo:** Cuando un usuario cierra la venta en su celular (`/cerrarVenta`), el backend encola un "Trabajo de Impresión Fiscal".
- La PC física dentro del cine, que está suscrita a esta cola y corre el entorno en Chromium, despierta.
- Esa PC tiene QZ Tray instalado localmente y la impresora conectada.
- El Worker automatizado realiza las llamadas a `/facturas/generar`, toma el `arrayTramas` devuelto por el servidor, e invoca a QZ Tray para imprimir el papel en la impresora física de la taquilla.
- **Ventaja:** Cero ingeniería inversa. Se reutiliza toda la lógica de `impresion.js` y las llaves de QZ Tray. No hay que programar drivers fiscales.
- **Desventaja:** Requiere una PC física dedicada corriendo Chromium Headless constantemente, lo cual es propenso a cierres inesperados, caídas del navegador o consumo de RAM.

## Opción 2: Nodo Local Worker nativo en Node.js (Recomendada a mediano plazo)
En lugar de levantar un navegador pesado, se instala un microservicio en Node.js o Python (similar a `signage-local-worker`) en una computadora administrativa del cine.
- **Flujo:** La Web App envía el requerimiento al backend (`/cerrarVenta`). El backend genera y almacena la factura digital.
- El Nodo Local escucha (vía WebSockets o polling) las órdenes de impresión.
- Al recibir una orden, el Nodo Local usa su propio código para enviar las tramas directamente al puerto USB/COM de la impresora, o incluso se comunica con `QZ Tray` localmente mediante su librería de Node.js (sin necesidad de abrir un navegador).
- **Ventaja:** Sumamente estable, no consume RAM excesiva. Es invisible.
- **Desventaja:** Hay que escribir el puente en Node.js para consumir QZ Tray o enviar al spooler, aunque QZ Tray ofrece soporte nativo para conexiones desde Node.js/Backend.

## Opción 3: API Fiscal 100% Cloud (Facturación Electrónica Pura)
Si las leyes de regionalización (ej: Venezuela SENIAT, DIAN, SUNAT) lo permiten, se elimina por completo la impresora de papel fiscal para la venta B2C.
- **Flujo:** La venta cierra por API. El Backend se conecta a un Proveedor Autorizado de Certificación (PAC) o máquina fiscal cloud.
- Genera un PDF/XML de factura electrónica y se lo envía al correo del usuario junto con el código QR para entrar a la sala.
- **Ventaja:** La más limpia, escalable y moderna. El hardware físico del cine (impresoras, QZ Tray, etc.) queda descartado del flujo B2C por completo.
- **Desventaja:** Depende estrictamente de la regulación del país. Algunas regulaciones exigen estrictamente la "Impresora Fiscal de hardware físico" ubicada en el lugar de la operación. En ese caso, la **Opción 2** es obligatoria.

---
## 💡 Respuesta y Recomendación

Dado el contexto de que **"entramos en terreno de manejar la impresora fiscal mediante su endpoint de facturas/generar"**, la opción más inteligente y rápida para un MVP (Minimum Viable Product) en producción **sí es la Opción 1 o utilizar el `signage-local-worker` como puente (Opción 2)**. 

Si ya tienes un `signage-local-worker` corriendo en el local físico, podemos expandir ese Worker para que atrape eventos de "Nueva Venta B2C" y mande la instrucción a imprimir a la impresora fiscal localmente usando QZ Tray (sin necesitar un navegador como tal, ya que QZ Tray tiene paquetes npm para workers de servidor). 

Si prefieres la seguridad absoluta de no lidiar con librerías de hardware nuevas, la **RPA con un navegador escondido (Puppeteer) orquestando la sesión** es una vía pragmática para saltarse el dolor de cabeza de re-programar la conexión fiscal.
