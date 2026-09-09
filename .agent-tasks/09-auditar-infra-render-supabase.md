# 09 — Medir el BFF (`scrapp-administrative-v2`) como candidato a backend de producción

> **Corrección respecto a la primera versión de este ticket.** La versión
> anterior daba por sentado que la webapp se publicaría en Render y que usaría
> Supabase en producción. **Las dos premisas eran falsas**: Render y Supabase
> son infraestructura de *desarrollo* del equipo. La webapp se hospedará como
> archivos estáticos en otro proveedor, y el backend de producción todavía no
> está decidido (el cliente final está evaluando Vista u otro sistema, con
> conexión probable al sistema legacy). Lo que sigue está reescrito con esa
> realidad.

## Objetivo
Medir el rendimiento real del BFF `scrapp-administrative-v2` para saber si es
un candidato viable a backend de producción, y cuantificar cuánto de su latencia
actual es del propio servicio y cuánto de dónde está alojado hoy.

## Contexto
`scrapp-administrative-v2` es uno de los caminos posibles para producción: hoy
sirve a la webapp desde Render y consulta Supabase. Si el cliente final termina
eligiéndolo (en vez de conectar contra Vista o contra el legacy por otra vía),
habrá que moverlo a infraestructura de producción, y para presupuestar eso hace
falta saber qué parte de la lentitud actual es estructural.

Medición hecha desde esta máquina contra el BFF actual
(`GET /api/v1/promos`, dos llamadas seguidas):

| Intento | HTTP | Tiempo total | Tamaño |
|---|---|---|---|
| 1 | 200 | 0,67 s | 20 B |
| 2 | 200 | 0,54 s | 20 B |

Medio segundo para devolver 20 bytes no es tiempo de cómputo. Hay que separar
las tres causas posibles: plan que suspende el servicio, distancia entre el
servicio y la base de datos, y consultas lentas.

Esta medición se hizo desde Venezuela, así que parte del tiempo es la distancia
del cliente al servidor. Por eso el punto 2 pide medir también desde dentro.

## Alcance
1. **Plan y región del servicio en Render.** Reportar el plan exacto (`Free`,
   `Starter`, etc.) y la región. Si es Free, decirlo explícitamente: se
   suspende tras ~15 minutos sin tráfico, y ese arranque en frío contamina
   cualquier medición.
2. **Latencia interna, sin la distancia del cliente.** Medir el tiempo de
   respuesta de `/api/v1/promos` y `/api/v1/movies?location_id=<sede>` desde
   dentro de la propia infraestructura (shell del servicio en Render, o su
   panel de métricas). Eso separa "el servicio es lento" de "el cliente está
   lejos".
3. **Región del proyecto de Supabase** comparada con la del servicio. Si no
   coinciden, cada consulta paga ese salto dos veces.
4. **Las consultas mismas.** Para el endpoint de películas, reportar el tiempo
   de la consulta en Supabase y si hay índices sobre las columnas por las que
   filtra (`location_id`, fecha de función). Es el endpoint que más pesa en la
   experiencia: es el que decide cuándo el visitante ve la cartelera.
5. **Arranque en frío, medido.** Dejar el servicio sin tráfico ~20 minutos y
   cronometrar la primera petición. Reportar el número real.
6. **Egress de Supabase Storage.** Consumo actual del bucket de tráilers y
   margen restante. Los clips ambientales se reactivaron en la webapp
   (`HERO_TRAILERS_ENABLED = true`), así que este número va a subir. Es un
   costo recurrente que hay que poner en el presupuesto del cliente.

## Criterio de aceptación
- Un archivo `09-resultado.md` con: plan y región de Render, región de
  Supabase, latencia medida desde dentro, tiempo de las dos consultas
  principales, si existen los índices, el arranque en frío real y el egress
  actual del bucket.
- Cada dato respaldado por lo que devolvió la herramienta, no por lo que
  parezca razonable. Si algo no se pudo consultar, decirlo en vez de estimarlo.
- Una conclusión de dos líneas: cuánto de los ~0,6 s es distancia del cliente,
  cuánto es infraestructura y cuánto son las consultas.

## Fuera de alcance
- **No** auditar dónde se hospeda la webapp: son archivos estáticos y no van a
  Render. Esa decisión va por separado, en la propuesta al cliente final.
- No cambiar planes, regiones, índices ni variables de entorno. Este ticket es
  de diagnóstico; con los datos se decide después.
- No tocar código de `scrapp-webapp-cinema` ni de `scrapp-administrative-v2`.
- No ejecutar Lighthouse ni pruebas de navegador: esas se corren contra el
  build local (`npm run preview`) y no necesitan los MCP de Render ni Supabase.
