# Shadcn Svelte 1.3 & Bits UI v2 - Reglas y Convenciones para IA

Este documento sirve como contexto clave para futuras sesiones de agentes o desarrollos dentro de este repositorio (`scrapp-webapp-cinema`). Contiene reglas críticas sobre el uso de Svelte 5, Shadcn Svelte (v1.3) y Bits UI (v2) que deben ser seguidas estrictamente para evitar errores (como el `500 Server Error` o fallos de compilación).

## 1. Svelte 5: Uso Estricto de "Keys" en Bloques `{#each}`
En Svelte 5, es **mandatorio** proveer un "key" único en las iteraciones. No hacerlo provocará un error crítico en tiempo de renderizado (SSR).
- **INCORRECTO:** `{#each array as item}`
- **CORRECTO:** `{#each array as item (item.id)}`

## 2. Bits UI v2 (Componentes Shadcn)
La nueva versión de Bits UI (el motor detrás de Shadcn Svelte) cambió la sintaxis y comportamiento de muchos componentes interactivos, en especial el `Select` y los modales.

### A. Componente `Select`
- **Atributo `type`:** Ahora es obligatorio declarar si la selección es única o múltiple pasando explícitamente `type="single"` o `type="multiple"` en el componente raíz `<Select>`.
- **Eliminación de `<SelectValue>`:** El componente `<SelectValue>` **ya no existe**. El texto u opción seleccionada debe inyectarse directamente dentro del `<SelectTrigger>`.

**Ejemplo de implementación moderna:**
```svelte
<script lang="ts">
  import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
</script>

<Select type="single" value="opcion_1">
  <SelectTrigger>
    Texto a mostrar o interpolación
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="opcion_1">Opción 1</SelectItem>
    <SelectItem value="opcion_2">Opción 2</SelectItem>
  </SelectContent>
</Select>
```

### B. Accesibilidad (A11y)
El compilador es extremadamente estricto con los botones e iconos vacíos:
- Todo botón, ícono clickeable (ej: cierre de Modales, botones de iconos de Lucide) **debe** tener un `aria-label` descriptivo o texto interno.
- **Ejemplo:** `<button aria-label="Cerrar"><XIcon/></button>`

## 3. Tailwind v4
Este proyecto usa la última versión de Tailwind CSS, la cual elimina el `tailwind.config.ts` y mueve toda la configuración a CSS puro:
- Las variables del tema y de Shadcn (ej: `--background`, `--primary`) se definen bajo `@theme` en el archivo principal (`src/routes/layout.css`).
- El soporte para Dark Mode se inyecta utilizando `@custom-variant dark (&:is(.dark *));`.
- Se requiere importar `@plugin 'tailwindcss-animate';` en el CSS principal para las transiciones y modales. **No** se usan configuraciones en JS.

## 4. Estilo y Arquitectura UI
- **Apple-Style Minimalism:** Usamos colores neutros oscuros (`zinc-950` a `zinc-800`), sin "blurs" excesivos (salvo en el navbar), ni "neones". Tipografías limpias y componentes geométricos discretos.
- **Iconografía:** Usa estrictamente `@lucide/svelte`.
- **Importaciones modulares:** Los componentes de Shadcn deben importarse desde la carpeta aliada (`$lib/components/ui/`...):
  - Ejemplo: `import { Button } from '$lib/components/ui/button';`
