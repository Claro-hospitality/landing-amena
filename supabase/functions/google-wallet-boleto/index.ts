import { createClient } from 'npm:@supabase/supabase-js@2'

const ISSUER_ID = Deno.env.get('GOOGLE_WALLET_ISSUER_ID') ?? ''
const CLIENT_EMAIL = Deno.env.get('GOOGLE_WALLET_CLIENT_EMAIL') ?? ''
// El secret puede llegar con "\n" literal (dos caracteres) en vez de salto de línea real,
// según cómo se haya pegado en el dashboard — se normaliza aquí para que funcione en ambos casos.
const PRIVATE_KEY_PEM = (Deno.env.get('GOOGLE_WALLET_PRIVATE_KEY') ?? '').replace(/\\n/g, '\n')

// Dominios desde los que se puede abrir el link "Guardar en Google Wallet".
const ORIGINS = [
  'https://amena-principal.web.app',
  'http://localhost:5175',
  'https://main.d2itdsf4s3p2hb.amplifyapp.com',
]

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

function idSeguro(s: string) {
  return s.replace(/[^A-Za-z0-9_-]/g, '-')
}

function base64Url(bytes: Uint8Array): string {
  let binario = ''
  for (const b of bytes) binario += String.fromCharCode(b)
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlTexto(texto: string): string {
  return base64Url(new TextEncoder().encode(texto))
}

function pemAArrayBuffer(pem: string): ArrayBuffer {
  const limpio = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '')
  const binario = atob(limpio)
  const bytes = new Uint8Array(binario.length)
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i)
  return bytes.buffer
}

async function firmarJwtGoogleWallet(payload: Record<string, unknown>): Promise<string> {
  const encabezado = { alg: 'RS256', typ: 'JWT' }
  const claims = {
    iss: CLIENT_EMAIL,
    aud: 'google',
    typ: 'savetowallet',
    iat: Math.floor(Date.now() / 1000),
    origins: ORIGINS,
    payload,
  }
  const entrada = `${base64UrlTexto(JSON.stringify(encabezado))}.${base64UrlTexto(JSON.stringify(claims))}`

  const clave = await crypto.subtle.importKey(
    'pkcs8',
    pemAArrayBuffer(PRIVATE_KEY_PEM),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const firma = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', clave, new TextEncoder().encode(entrada))
  return `${entrada}.${base64Url(new Uint8Array(firma))}`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const { folio } = await req.json()
    if (!folio) return json({ error: 'FOLIO_REQUERIDO' })

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { data: reservacion, error } = await supabase
      .from('reservaciones')
      .select('folio, nombre, personas, estado_pago, eventos(slug, titulo, fecha, hora_inicio, lugar)')
      .ilike('folio', String(folio).trim())
      .maybeSingle()

    if (error || !reservacion) {
      return json({ error: 'RESERVACION_NO_ENCONTRADA' })
    }
    if (reservacion.estado_pago !== 'pagada') {
      return json({ error: 'RESERVACION_NO_PAGADA' })
    }

    const evento = reservacion.eventos as unknown as {
      slug: string
      titulo: string
      fecha: string
      hora_inicio: string
      lugar: string
    } | null
    if (!evento) {
      return json({ error: 'EVENTO_NO_ENCONTRADO' })
    }

    const classId = `${ISSUER_ID}.evento-${idSeguro(evento.slug)}`
    const objectId = `${ISSUER_ID}.boleto-${idSeguro(reservacion.folio)}`

    const eventTicketClass = {
      id: classId,
      issuerName: 'Amena',
      reviewStatus: 'UNDER_REVIEW',
      eventName: { defaultValue: { language: 'es-MX', value: evento.titulo } },
      hexBackgroundColor: '#f68d2e',
    }

    const eventTicketObject = {
      id: objectId,
      classId,
      state: 'ACTIVE',
      ticketHolderName: reservacion.nombre,
      ticketNumber: reservacion.folio,
      barcode: { type: 'QR_CODE', value: reservacion.folio },
      textModulesData: [
        { id: 'lugar', header: 'Lugar', body: evento.lugar },
        { id: 'fecha', header: 'Fecha', body: `${evento.fecha} ${evento.hora_inicio}` },
        { id: 'personas', header: 'Personas', body: String(reservacion.personas) },
      ],
    }

    const jwt = await firmarJwtGoogleWallet({
      eventTicketClasses: [eventTicketClass],
      eventTicketObjects: [eventTicketObject],
    })

    return json({ saveUrl: `https://pay.google.com/gp/v/save/${jwt}` })
  } catch (err) {
    return json({ error: 'ERROR_INESPERADO', mensaje: String(err) })
  }
})
