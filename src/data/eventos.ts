import { supabase } from '../lib/supabase'
import { formatFechaBadge, formatFechaLarga, formatHorario, formatPrecioLabel } from '../lib/fechas'

export type Categoria = 'Cata' | 'Taller' | 'Cena'
export type EstadoEvento = 'Publicado' | 'Borrador'

export type Evento = {
  id: string
  slug: string
  categoria: Categoria
  titulo: string
  descripcionCorta: string
  descripcionLarga?: string[]
  incluye?: string[]
  anio: number
  mes: number
  dia: number
  fechaBadge: string
  fechaLarga: string
  horario: string
  lugar: string
  precio: number
  precioLabel: string
  cupoDisponible: number
  cupoTotal: number
  estado: EstadoEvento
  imagenUrl: string
}

type EventoRow = {
  id: string
  slug: string
  categoria: Categoria
  titulo: string
  descripcion_corta: string
  descripcion_larga: string[] | null
  incluye: string[] | null
  fecha: string
  hora_inicio: string
  hora_fin: string | null
  lugar: string
  precio: number | string
  cupo_total: number
  cupo_disponible: number
  estado: EstadoEvento
  imagen_url: string
}

export function mapEventoRow(row: EventoRow): Evento {
  const [anio, mes, dia] = row.fecha.split('-').map(Number)
  const precio = Number(row.precio)
  return {
    id: row.id,
    slug: row.slug,
    categoria: row.categoria,
    titulo: row.titulo,
    descripcionCorta: row.descripcion_corta,
    descripcionLarga: row.descripcion_larga ?? undefined,
    incluye: row.incluye ?? undefined,
    anio,
    mes: mes - 1,
    dia,
    fechaBadge: formatFechaBadge(row.fecha, row.hora_inicio),
    fechaLarga: formatFechaLarga(row.fecha),
    horario: formatHorario(row.hora_inicio, row.hora_fin),
    lugar: row.lugar,
    precio,
    precioLabel: formatPrecioLabel(precio),
    cupoDisponible: row.cupo_disponible,
    cupoTotal: row.cupo_total,
    estado: row.estado,
    imagenUrl: row.imagen_url,
  }
}

export async function listEventosPublicados(): Promise<Evento[]> {
  const { data, error } = await supabase
    .from('eventos')
    .select('*')
    .eq('estado', 'Publicado')
    .order('fecha', { ascending: true })
  if (error) throw error
  return (data as EventoRow[]).map(mapEventoRow)
}

export async function getEventoBySlug(slug: string): Promise<Evento | undefined> {
  const { data, error } = await supabase.from('eventos').select('*').eq('slug', slug).maybeSingle()
  if (error) throw error
  return data ? mapEventoRow(data as EventoRow) : undefined
}
