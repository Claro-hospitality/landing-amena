import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error('Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY en el entorno (.env.local)')
}

/**
 * Apunta al Supabase de Amena (el mismo de backoffice y portal), al schema `eventos`.
 *
 * Los eventos, reservaciones, códigos de consumo y facturas de este sitio NO viven en
 * `public`: ese schema es el de los planes de alimentación corporativos y ya tiene su propia
 * tabla `facturas`, distinta de la de acá. `db.schema` aplica tanto a `from()` como a
 * `rpc()`, así que con esto toda la capa `src/data/*` queda apuntada sin tocarla una por una.
 *
 * Las migraciones, las policies y las Edge Functions de este producto viven en el repo
 * `amena-backend` (schema `eventos`), NO aquí: si una query devuelve vacío o falla en
 * silencio, sospecha de RLS de ese repo antes que del código de esta app.
 */
export const supabase = createClient(url, anonKey, {
  db: { schema: 'eventos' },
})
