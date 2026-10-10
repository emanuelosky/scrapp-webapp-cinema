# scrapp-webapp-cinema (Cinepic)

Estado: verificado el 10-oct-2026.

Webapp pública de venta de boletos y dulcería de las sedes de Cinepic. Es un SvelteKit en modo SPA que se compila a archivos estáticos. Los datos vienen de un backend configurado en `VITE_ADMIN_API_URL`. Hoy la compra (bloqueo de butacas y pago) es demo: no bloquea butacas reales ni cobra. Ver [arquitectura](docs/arquitectura.md#flujo-de-venta-estado-real).

Stack: SvelteKit 2, Svelte 5, Vite 8, Tailwind 4, shadcn-svelte/bits-ui, Node 22.

## Correr

```sh
npm install
# crear .env con VITE_ADMIN_API_URL (ver docs/operacion.md)
npm run dev        # http://localhost:5174
```

## Probar

No hay pruebas automatizadas. Antes de dar un cambio por bueno:

```sh
npm run check        # svelte-check
npm run lint         # prettier --check + eslint
npm run check:sedes  # semilla de sedes contra la base (requiere PUBLIC_SUPABASE_*)
```

## Desplegar

```sh
npm run build        # prebuild exige VITE_ADMIN_API_URL; salida en build/
```

`build/` es un sitio estático con fallback `index.html`. El destino de hosting no está confirmado: ver [operación](docs/operacion.md#build-y-despliegue).

## Documentación

- [docs/arquitectura.md](docs/arquitectura.md): rutas, estado global, flujo de venta real, chat EPIK, decisiones.
- [docs/operacion.md](docs/operacion.md): variables de entorno, scripts, guardas, sedes, despliegue.
- [docs/referencia/catalogo-y-medios.md](docs/referencia/catalogo-y-medios.md): sedes, cartelera, tráilers, pósters, promociones.
- [docs/referencia/ui.md](docs/referencia/ui.md): convenciones de estilo y código.
- [docs/backlog.md](docs/backlog.md): pendientes del frontend y hallazgos técnicos consolidados.
- [src/lib/api/CONTRATO-BACKEND.md](src/lib/api/CONTRATO-BACKEND.md): qué necesita la webapp de su backend (endpoints, imágenes, confitería).
