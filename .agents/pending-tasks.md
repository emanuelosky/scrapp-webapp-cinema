# Backlog y Tareas Pendientes: WebApp CINEPIC

Este documento registra mejoras arquitectónicas, refactorizaciones y deuda técnica identificada que se dejan pendientes para no frenar el desarrollo comercial activo.

---

## 📌 1. Centralización de Enlaces de Navegación y Rutas (Fuente de Verdad Única)
* **Fecha de registro:** 2026-09-12
* **Prioridad:** Media / Baja
* **Contexto:**
  Actualmente, la lista de secciones, enlaces y etiquetas (`label`, `href`, palabras clave de búsqueda) está declarada de forma estática e independiente en 3 componentes:
  1. `src/lib/components/navigation/BrutalistMegaMenu.svelte` (`MENU_DATA`)
  2. `src/lib/components/navigation/SiteHeader.svelte` (menú móvil / drawer de navegación)
  3. `src/lib/components/navigation/CommandPalette.svelte` (búsqueda rápida `Command.Item`)
* **Impacto actual:**
  Cuando se renombra una sección o cambia una ruta (por ejemplo, el cambio de *"Arma tu combo"* a *"Crea tu combo"*), es necesario actualizar múltiples archivos manualmente.
* **Propuesta de solución:**
  Crear `src/lib/config/navigation.ts` con una estructura tipada como:
  ```ts
  export interface NavItem {
    id: string;
    label: string;
    href: string;
    description?: string;
    keywords?: string[];
  }

  export const NAV_LINKS = {
    dulceria: [
      { id: 'crea-tu-combo', label: 'CREA TU COMBO', href: '/dulceria/crea-tu-combo', keywords: ['crear', 'armar', 'combo', 'cotufas'] },
      { id: 'menu', label: 'NUESTRO MENÚ', href: '/dulceria/menu', keywords: ['menu', 'carta', 'dulceria'] },
      { id: 'promociones', label: 'PROMOCIONES', href: '/promociones', keywords: ['promociones', 'coleccionables', 'descuentos'] }
    ],
    corporativo: [
      { id: 'anunciate', label: 'ANÚNCIATE EN CINEPIC', href: '/corporativo/anunciate' },
      { id: 'empleo', label: 'TRABAJA CON NOSOTROS', href: '/corporativo/empleo' },
      { id: 'contacto', label: 'CONTACTO', href: '/contacto' }
    ]
  };
  ```
  Y consumir `NAV_LINKS` en `BrutalistMegaMenu`, `SiteHeader` (móvil) y `CommandPalette`.

---
