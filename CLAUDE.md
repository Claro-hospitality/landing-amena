# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Public site for **Amena** (a restaurant with a companion B2B service called Social Kitchen). Two halves:

- **Marketing** (`/`, `/menu`) — read-only, no data.
- **Eventos y facturación** (`/eventos`, `/eventos/:slug`, `/eventos/:slug/reservar`, `/boleto/:folio`, `/facturar`, `/factura/:folioFiscal`) — sí habla con Supabase: catálogo de eventos, reserva con cobro 3DS, boleto con QR y pase de Google Wallet, y autofacturación de consumos del restaurante.

It was extracted from the `/conoce-amena` route of a larger private monorepo (`amena-frontend`); shared pieces it depended on (`cn`, `LogotipoAmena`, the `theme.css` tokens) were inlined here so this repo has zero dependency on that monorepo for its UI.

All UI copy is in Spanish (Mexico) — keep new copy consistent with that tone and language.

## Commands

```bash
npm install
npm run dev       # vite dev server on http://localhost:5175 (fixed port, strictPort)
                  # requiere .env.local (copia .env.example): sin él, PANTALLA EN BLANCO
npm run build     # tsc -b (typecheck) + vite build -> dist/
npm run preview   # serve the production build locally
```

There is no lint script and no test suite configured in this repo — `tsc -b` (part of `npm run build`) is the only automated check. TypeScript is in `strict` mode with `noUnusedLocals`/`noUnusedParameters` enabled, so unused code will fail the build.

## Architecture

- **Routing**: `src/main.tsx` monta `react-router-dom` (`BrowserRouter`) con una ruta por página (`/`, `/menu`, `/eventos`, `/eventos/:slug`, `/eventos/:slug/reservar`, `/boleto/:folio`, `/facturar`, `/factura/:folioFiscal`). Firebase Hosting reescribe todos los paths a `index.html` (ver `firebase.json`). Al agregar una página, declara su `<Route>` ahí.
- **El administrador vive en el backoffice de Amena, y el backend también.** El panel `/admin/*` que estaba acá se movió a `amena-frontend/apps/backoffice` (`features/eventos`, `features/reservaciones`, `features/escaner-boletos`, rutas `/eventos/*`, rol `eventos`). El repo intermedio `amena-admin` ya no existe: no lo busques.
  - **Las migraciones, las policies y las Edge Functions de este producto viven en `amena-backend`**, en el schema `eventos`. Este repo ya NO tiene carpeta `supabase/` — tenerla sería una segunda fuente de verdad y un `db push` desde el lugar equivocado. Un cambio de esquema se hace allá y se despliega solo al mergear a `main` de ese repo.
  - **Lo que sigue duplicado a mano son los tipos.** Este repo declara sus `*Row` en `src/data/` y el monorepo genera los suyos con `pnpm gen:types`. Describen el mismo contrato en dos lados: al agregar o cambiar una columna, tócala en los dos.
  - **Si una query devuelve vacío o falla en silencio, sospecha de RLS de `amena-backend` antes que del código de acá.** Este sitio usa la anon key, y `anon` solo puede leer eventos con `estado = 'Publicado'`; todo lo demás pasa por RPC o por Edge Function.
- **Pages are single large files**: `src/PresentacionPage.tsx` and `src/MenuPage.tsx` each contain the full page as a tree of small, locally-defined section/presentational components (not split into separate files). Follow this existing convention — new sections on a page should be added as another local component in the same file, not extracted, unless a component becomes genuinely reusable across pages.
- **Content-as-data**: `MenuPage.tsx` defines the entire menu as a typed data structure (`MENU: Bloque[]`) at the top of the file, then renders it generically. When updating menu items/prices, edit that data array — don't hand-edit JSX per dish.
- **Design tokens** live in `src/theme.css` (Tailwind v4 `@theme`, imported once from `main.tsx`). Brand colors are defined once as raw hex scales (`naranja-*` primary/accent, `salvia-*` secondary/Social Kitchen accent, `crema-*` backgrounds, `tinta-*` text) and semantic tokens (`--background`, `--primary`, etc.) reference those via `var(--color-…)`. Never hardcode a brand hex in a component — use the Tailwind utility classes (`bg-naranja-500`, `text-salvia-700`, `bg-primary`, …) so the token stays the single source of truth.
- **`cn()` helper** (`src/lib/utils.ts`, `clsx` + `tailwind-merge`) is the standard way to compose conditional/merged class names — used throughout both pages.
- **`LogotipoAmena`** (`src/components/logotipo-amena.tsx`) is an inline SVG wordmark using `fill="currentColor"`; size it via `className` height utilities (`h-5`, `h-16`, …) and color it via text-color utilities — never pass a hardcoded fill.
- **Motion**: a `usePrefiereMenosMovimiento` hook (defined locally in `PresentacionPage.tsx`) watches `prefers-reduced-motion`. Respect it for any new animation/autoplay/carousel/smooth-scroll — the existing hero video, image carousels, and anchor-scrolling all fall back to a static/instant behavior when it's set.
- **Section nav pattern**: both pages implement a sticky header whose active tab is driven by an `IntersectionObserver` over the page's `id`-anchored `<section>`s, with a pill/indicator that animates to the active tab, and a manual-scroll flag to avoid the observer fighting a click-triggered `scrollIntoView`. If you add a new top-level section to either page, add its `id` to the corresponding tab list (`TABS` in `PresentacionPage.tsx`, `MENU` order in `MenuPage.tsx`) so it's picked up automatically.
- **Images/video** live in `public/imagenes/<category>/` and `public/videos/`, referenced by absolute path (e.g. `/imagenes/espacios/h-espacio-3.jpg`). Filenames are prefixed by orientation (`h-` horizontal, `v-` vertical). Use `loading="lazy"` on below-the-fold images (already the convention throughout).

## Deployment

Firebase Hosting, site `amena-principal` (`firebase.json`, `.firebaserc` project `amena-20df0`). GitHub Actions (`.github/workflows/`) auto-deploy: pushes to `main` deploy to the live channel; pull requests get a 7-day preview channel deploy. There's no manual deploy step to remember — merging to `main` ships to production.

El paso de build pasa `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` y `VITE_SINERGYPAY_PUBLIC_KEY` desde los secrets del repo. **No son opcionales**: sin ellas `src/lib/supabase.ts` lanza al importarse y, como `main.tsx` importa todas las páginas de forma estática, el sitio se despliega en blanco — también la portada. Si alguna vez ves amena.social vacío, revisa primero esos secrets.
