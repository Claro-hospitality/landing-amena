import { supabase } from '../lib/supabase'
import { mapEventoRow, type Evento } from './eventos'
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

/**
 * Fila de `eventos.reservaciones` como la devuelve la RPC `boleto_por_folio`. Duplica a mano
 * el contrato del schema `eventos` de `amena-backend` (allá los tipos se generan): al agregar
 * o cambiar una columna, hay que tocarla en los dos lados.
 */
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
}

/**
 * Lo que `/boleto/:folio` necesita para pintar un boleto, venga del state del router (recién
 * pagado) o de la RPC de recuperación. `fechaCompra` va en ISO, no formateada: la pantalla la
 * formatea y también se la pasa al PDF.
 */
export type BoletoRecuperado = {
  evento: Evento
  datos: { nombre: string; asistentes: number }
  folio: string
  total: number
  ultimosDigitos: string
  fechaCompra: string
  estadoPago: EstadoPago
  estadoBoleto: EstadoBoleto
  metodoPago?: string
}

/** El row de evento tal como lo devuelve la RPC; `mapEventoRow` es el dueño de su forma. */
type EventoRowCrudo = Parameters<typeof mapEventoRow>[0]

/** "Tarjeta ···· 4242 · SIN COBRO (local)" → "4242". La reservación guarda la etiqueta, no la
 *  tarjeta, así que los últimos dígitos se leen de ahí. */
function ultimosDigitosDe(metodoPago: string | null): string {
  const grupos = (metodoPago ?? '').match(/\d{4}/g)
  return grupos?.[grupos.length - 1] ?? '••••'
}

function mapBoletoRecuperado(row: ReservacionRow, evento: EventoRowCrudo): BoletoRecuperado {
  return {
    evento: mapEventoRow(evento),
    datos: { nombre: row.nombre, asistentes: row.personas },
    folio: row.folio,
    total: Number(row.monto),
    ultimosDigitos: ultimosDigitosDe(row.metodo_pago),
    fechaCompra: row.reservada_el,
    estadoPago: row.estado_pago,
    estadoBoleto: row.estado_boleto,
    metodoPago: row.metodo_pago ?? undefined,
  }
}

/**
 * Recupera un boleto ya pagado para poder pintarlo en `/boleto/:folio` cuando no se llegó
 * ahí desde la confirmación del pago (otra pestaña, un correo, el historial del navegador).
 *
 * Pide folio Y correo porque la RPC los exige: el folio va impreso en el boleto y dentro del
 * QR, así que por sí solo no autoriza nada — el correo de la reservación es el segundo factor.
 * `eventos.reservaciones` NO está otorgada a `anon` a propósito; esta RPC (security definer,
 * en `amena-backend`) es la única puerta pública a esa tabla.
 *
 * Devuelve `undefined` tanto si el folio no existe como si el correo no cuadra: la RPC no
 * distingue los dos casos y esta capa tampoco debe inventar la diferencia.
 */
export async function recuperarBoleto(folio: string, email: string): Promise<BoletoRecuperado | undefined> {
  const { data, error } = await supabase.rpc('boleto_por_folio', {
    p_folio: folio.trim(),
    p_email: email.trim(),
  })
  if (error) throw error
  const row = data?.[0] as { reservacion: ReservacionRow; evento: EventoRowCrudo } | undefined
  if (!row) return undefined
  return mapBoletoRecuperado(row.reservacion, row.evento)
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
