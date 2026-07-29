# Amena — Landing "Conoce Amena"

Sitio público standalone que presenta **Amena** (Social Kitchen): qué es, para qué
sirve, cómo funciona y cómo se administra. Extraído de la ruta `/conoce-amena`
del backoffice (`amena-frontend`) a un repositorio independiente.

Es una **single page** de marketing, solo lectura, sin backend ni sesión.

## Stack

- **React 19** + **Vite 6** + **TypeScript**
- **Tailwind CSS v4** (`@tailwindcss/vite`) con los tokens de marca de Amena
- Tipografía **Geist** (vía `@fontsource-variable`)

Sin dependencia del monorepo `amena-frontend`: las piezas compartidas que usaba
(`cn`, `LogotipoAmena` y los tokens de `theme.css`) se inlinearon en este repo.

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:5175
```

## Build

```bash
npm run build    # genera dist/
npm run preview  # sirve el build local
```

## Estructura

```
public/
  imagenes/            fotos del comedor y platillos (h-espacio-*, v-alimento-*)
  favicon.svg          icono de marca Amena
src/
  main.tsx             punto de entrada (monta PresentacionPage)
  theme.css            tokens de diseño de Amena (escalas de marca + semánticos)
  PresentacionPage.tsx la página completa (hero, secciones, banners, pie)
  components/
    logotipo-amena.tsx wordmark SVG inline (usa currentColor)
  lib/
    utils.ts           helper cn() (clsx + tailwind-merge)
```

## Notas

- El contenido y el diseño son un espejo fiel de la versión original en el backoffice.
- Respeta `prefers-reduced-motion` (carruseles y scroll suave se desactivan).
- Se removió el botón "Iniciar sesión" del navbar (aquí no hay ruta de login).
