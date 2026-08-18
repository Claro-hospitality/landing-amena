import { createClient } from 'npm:@supabase/supabase-js@2'

const SINERGYPAY_BASE_URL = 'https://sandbox.sinergypay.mx/v2'
const SINERGYPAY_PRIVATE_KEY = Deno.env.get('SINERGYPAY_PRIVATE_KEY') ?? ''

// El sandbox de SinergyPay solo procesa transacciones con este email fijo;
// no tiene relación con el correo de contacto real de la reservación.
const SINERGYPAY_SANDBOX_EMAIL = 'review@correo.com'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

function synergyAuthHeaders() {
  return {
    Authorization: 'Basic ' + btoa(`${SINERGYPAY_PRIVATE_KEY}:`),
    'User-Agent': 'AmenaLanding/1.0',
    'Content-Type': 'application/json',
  }
}

async function leerRespuesta(resp: Response) {
  const texto = await resp.text()
  try {
    return texto ? JSON.parse(texto) : {}
  } catch {
    return { rc: -1, msg: texto.slice(0, 500) }
  }
}

const soloDigitos = (s: unknown) => String(s ?? '').replace(/\D/g, '')
const mes2Digitos = (s: unknown) => soloDigitos(s).padStart(2, '0').slice(0, 2)
const anio2Digitos = (s: unknown) => {
  const d = soloDigitos(s)
  return d.length >= 4 ? d.slice(-2) : d.padStart(2, '0').slice(-2)
}

type Tarjeta = {
  cardholder: string
  cardNumber: string
  expiryMonth: string
  expiryYear: string
  cvv: string
}

type Domicilio = {
  street: string
  outerNumber: string
  neighborhood: string
  city: string
  zipCode: string
  state: string
  country: string
}

async function llamarSinergyPay(
  endpoint: 'auth' | 'confirm',
  opts: { sessionId: string; amount: number; description: string; reference: string; tarjeta: Tarjeta; domicilio: Domicilio }
) {
  const body = {
    session_id: opts.sessionId,
    email: SINERGYPAY_SANDBOX_EMAIL,
    street: opts.domicilio.street,
    outer_number: opts.domicilio.outerNumber,
    neighborhood: opts.domicilio.neighborhood,
    city: opts.domicilio.city,
    zip_code: opts.domicilio.zipCode,
    state: opts.domicilio.state,
    country: opts.domicilio.country.trim().toUpperCase(),
    cardholder: opts.tarjeta.cardholder.trim().toUpperCase(),
    card_number: soloDigitos(opts.tarjeta.cardNumber),
    expiry_month: mes2Digitos(opts.tarjeta.expiryMonth),
    expiry_year: anio2Digitos(opts.tarjeta.expiryYear),
    cvv: soloDigitos(opts.tarjeta.cvv),
    amount: opts.amount,
    description: opts.description,
    reference: opts.reference,
    currency: 'MXN',
  }

  const resp = await fetch(`${SINERGYPAY_BASE_URL}/cards/3ds/${endpoint}`, {
    method: 'POST',
    headers: synergyAuthHeaders(),
    body: JSON.stringify(body),
  })
  return leerRespuesta(resp)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const { action, eventoId, folio, nombre, email, telefono, personas, sessionId, tarjeta, domicilio } = await req.json()

    if (action !== 'auth' && action !== 'confirm') {
      return json({ error: 'ACCION_INVALIDA' })
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { data: evento, error: eventoError } = await supabase
      .from('eventos')
      .select('precio, titulo')
      .eq('id', eventoId)
      .single()

    if (eventoError || !evento) {
      return json({ error: 'EVENTO_NO_ENCONTRADO' })
    }

    const amount = Number(evento.precio) * Number(personas)

    const cobro = await llamarSinergyPay(action, {
      sessionId,
      amount,
      description: `Reservación ${evento.titulo}`,
      reference: folio,
      tarjeta,
      domicilio,
    })

    if (action === 'auth' && cobro.rc === 100) {
      const data = cobro.data ?? {}
      return json({
        status: 'otp_required',
        otpData: {
          sessionId: data.session_id,
          nextActionUrl: data.next_action_url,
          accessToken: data.access_token,
          stepUpUrl: data.step_up_url,
          stepUpJwt: data.step_up_jwt,
        },
      })
    }

    if (cobro.rc !== 0) {
      return json({ error: 'TARJETA_RECHAZADA', mensaje: cobro.msg ?? cobro.message ?? 'El pago fue rechazado' })
    }

    const ticketId = cobro.data?.ticket_id ?? cobro.data?.id
    const ultimosDigitos = soloDigitos(tarjeta.cardNumber).slice(-4)

    const { data: reservacion, error: reservaError } = await supabase.rpc('crear_reservacion', {
      p_evento_id: eventoId,
      p_folio: folio,
      p_nombre: nombre,
      p_email: email,
      p_telefono: telefono ?? null,
      p_personas: personas,
      p_monto: amount,
      p_synergy_pay_id: ticketId ?? null,
      p_metodo_pago: `Tarjeta ···· ${ultimosDigitos}`,
    })

    if (reservaError) {
      if (ticketId) {
        await fetch(`${SINERGYPAY_BASE_URL}/payments/${ticketId}/refund/full`, {
          method: 'POST',
          headers: synergyAuthHeaders(),
        }).catch(() => {})
      }

      if (reservaError.message?.includes('CUPO_INSUFICIENTE')) {
        return json({ error: 'CUPO_INSUFICIENTE' })
      }
      return json({ error: 'ERROR_RESERVACION', mensaje: reservaError.message })
    }

    return json({ status: 'success', folio: reservacion.folio })
  } catch (err) {
    return json({ error: 'ERROR_INESPERADO', mensaje: String(err) })
  }
})
