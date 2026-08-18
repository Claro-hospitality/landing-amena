import { supabase } from '../lib/supabase'
import { formatEventoFecha, formatFechaHora } from '../lib/fechas'
import type { ResultadoPago } from '../lib/sinergypay'

export type DatosTarjeta = {
  cardholder: string
  cardNumber: string
  expiryMonth: string
  expiryYear: string
  cvv: string
}

export type DomicilioFacturacion = {
  street: string
  outerNumber: string
  neighborhood: string
  city: string
  zipCode: string
  state: string
  country: string
}

export type EstadoPago = 'pagada' | 'pendiente' | 'cancelada'
export type EstadoBoleto = 'validado' | 'sin usar' | 'cancelado'

export type Reservacion = {
  folio: string
  nombre: string
  email: string
  telefono?: string
  iniciales: string
  eventoSlug: string
  eventoNombre: string
  eventoFecha: string
  personas: number
  monto: number
  estadoPago: EstadoPago
  estadoBoleto: EstadoBoleto
  reservadaEl: string
  synergyPayId?: string
  metodoPago?: string
  validadaEl?: string
}

type ReservacionRow = {
  folio: string
  nombre: string
  email: string
  telefono: string | null
  personas: number
  monto: number | string
  estado_pago: EstadoPago
  estado_boleto: EstadoBoleto
  synergy_pay_id: string | null
  metodo_pago: string | null
  reservada_el: string
  validada_el: string | null
  eventos: { slug: string; titulo: string; fecha: string; hora_inicio: string } | null
}

const SELECT_CON_EVENTO = '*, eventos(slug, titulo, fecha, hora_inicio)'

function iniciales(nombre: string) {
  return nombre
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

function mapReservacionRow(row: ReservacionRow): Reservacion {
  const evento = row.eventos
  return {
    folio: row.folio,
    nombre: row.nombre,
    email: row.email,
    telefono: row.telefono ?? undefined,
    iniciales: iniciales(row.nombre),
    eventoSlug: evento?.slug ?? '',
    eventoNombre: evento?.titulo ?? '',
    eventoFecha: evento ? formatEventoFecha(evento.fecha, evento.hora_inicio) : '',
    personas: row.personas,
    monto: Number(row.monto),
    estadoPago: row.estado_pago,
    estadoBoleto: row.estado_boleto,
    reservadaEl: formatFechaHora(row.reservada_el),
    synergyPayId: row.synergy_pay_id ?? undefined,
    metodoPago: row.metodo_pago ?? undefined,
    validadaEl: row.validada_el ? formatFechaHora(row.validada_el) : undefined,
  }
}

export async function listReservaciones(): Promise<Reservacion[]> {
  const { data, error } = await supabase
    .from('reservaciones')
    .select(SELECT_CON_EVENTO)
    .order('reservada_el', { ascending: false })
  if (error) throw error
  return (data as unknown as ReservacionRow[]).map(mapReservacionRow)
}

export async function getReservacionByFolio(folio: string): Promise<Reservacion | undefined> {
  const { data, error } = await supabase
    .from('reservaciones')
    .select(SELECT_CON_EVENTO)
    .ilike('folio', folio.trim())
    .maybeSingle()
  if (error) throw error
  return data ? mapReservacionRow(data as unknown as ReservacionRow) : undefined
}

type DatosPago = {
  folio: string
  eventoId: string
  nombre: string
  email: string
  telefono?: string
  personas: number
  sessionId: string
  tarjeta: DatosTarjeta
  domicilio: DomicilioFacturacion
}

async function invocarReservarPago(action: 'auth' | 'confirm', input: DatosPago): Promise<ResultadoPago> {
  const { data, error } = await supabase.functions.invoke('reservar-pago', {
    body: {
      action,
      eventoId: input.eventoId,
      folio: input.folio,
      nombre: input.nombre,
      email: input.email,
      telefono: input.telefono ?? null,
      personas: input.personas,
      sessionId: input.sessionId,
      tarjeta: input.tarjeta,
      domicilio: input.domicilio,
    },
  })
  if (error) throw new Error(error.message)
  if (data?.error) throw new Error(data.error)
  return data as ResultadoPago
}

export function autorizarPago(input: DatosPago): Promise<ResultadoPago> {
  return invocarReservarPago('auth', input)
}

export function confirmarPago(input: DatosPago): Promise<ResultadoPago> {
  return invocarReservarPago('confirm', input)
}

export async function validarBoleto(folio: string): Promise<
  | { tipo: 'validado'; reservacion: Reservacion }
  | { tipo: 'ya-usado'; reservacion: Reservacion }
  | { tipo: 'no-encontrado' }
> {
  const actual = await getReservacionByFolio(folio)
  if (!actual) return { tipo: 'no-encontrado' }
  if (actual.estadoBoleto === 'validado') return { tipo: 'ya-usado', reservacion: actual }

  const { data, error } = await supabase
    .from('reservaciones')
    .update({ estado_boleto: 'validado', validada_el: new Date().toISOString() })
    .eq('folio', actual.folio)
    .neq('estado_boleto', 'validado')
    .select(SELECT_CON_EVENTO)
    .maybeSingle()
  if (error) throw error

  if (!data) {
    const revalidado = await getReservacionByFolio(folio)
    return { tipo: 'ya-usado', reservacion: revalidado ?? actual }
  }
  return { tipo: 'validado', reservacion: mapReservacionRow(data as unknown as ReservacionRow) }
}
