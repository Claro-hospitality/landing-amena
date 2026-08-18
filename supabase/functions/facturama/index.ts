import { createClient } from 'npm:@supabase/supabase-js@2'

const FACTURAMA_BASE_URL = Deno.env.get('FACTURAMA_DEV_BASE_URL') ?? 'https://apisandbox.facturama.mx'
const FACTURAMA_USERNAME = Deno.env.get('FACTURAMA_DEV_USERNAME') ?? ''
const FACTURAMA_PASSWORD = Deno.env.get('FACTURAMA_DEV_PASSWORD') ?? ''

const CATALOGOS_PERMITIDOS = ['FiscalRegimens', 'CfdiUses', 'PaymentForms']

// Código postal del domicilio fiscal de Amena, registrado como "Lugar de expedición"
// en el Perfil fiscal de la cuenta de Facturama. Debe coincidir exactamente con lo
// dado de alta ahí (Perfil fiscal → Lugares de expedición y series) o el timbrado falla.
const EXPEDITION_PLACE = '44600'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

function facturamaFetch(path: string, init: RequestInit = {}) {
  return fetch(`${FACTURAMA_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: 'Basic ' + btoa(`${FACTURAMA_USERNAME}:${FACTURAMA_PASSWORD}`),
    },
  })
}

async function leerRespuesta(resp: Response) {
  const texto = await resp.text()
  try {
    return texto ? JSON.parse(texto) : {}
  } catch {
    return { RawResponse: texto.slice(0, 500) }
  }
}

function supabaseAdmin() {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
}

async function accionCatalogos(catalogo: string) {
  if (!CATALOGOS_PERMITIDOS.includes(catalogo)) {
    return json({ error: 'CATALOGO_INVALIDO' })
  }
  const resp = await facturamaFetch(`/catalogs/${catalogo}`)
  const data = await leerRespuesta(resp)
  if (!resp.ok) return json({ error: 'FACTURAMA_ERROR', mensaje: JSON.stringify(data) })
  return json({ catalogo: data })
}

async function accionEmitir(body: Record<string, unknown>) {
  const { codigo, rfc, cp, razonSocial, regimenFiscal, usoCfdi, correo } = body as Record<string, string>
  const supabase = supabaseAdmin()

  const { data: consumo, error: consumoError } = await supabase
    .from('codigos_consumo')
    .select('*')
    .eq('codigo', codigo.toUpperCase())
    .maybeSingle()

  if (consumoError || !consumo) {
    return json({ error: 'CODIGO_NO_ENCONTRADO' })
  }

  const { data: facturaExistente } = await supabase
    .from('facturas')
    .select('id')
    .eq('codigo_consumo_id', consumo.id)
    .maybeSingle()

  if (facturaExistente) {
    return json({ error: 'YA_FACTURADO' })
  }

  const subtotal = Number(consumo.subtotal)
  const iva = Number(consumo.iva)
  const total = Number(consumo.total)

  const cfdiResp = await facturamaFetch('/3/cfdis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      CfdiType: 'I',
      ExpeditionPlace: EXPEDITION_PLACE,
      PaymentForm: '99',
      PaymentMethod: 'PPD',
      Currency: 'MXN',
      Exportation: '01',
      Receiver: {
        Rfc: rfc,
        Name: razonSocial,
        CfdiUse: usoCfdi,
        FiscalRegime: regimenFiscal,
        TaxZipCode: cp,
      },
      Items: [
        {
          ProductCode: '90101501',
          Description: consumo.descripcion,
          Unit: 'Servicio',
          UnitCode: 'ACT',
          UnitPrice: subtotal,
          Quantity: 1,
          Subtotal: subtotal,
          TaxObject: '02',
          Taxes: [{ Total: iva, Name: 'IVA', Base: subtotal, Rate: 0.16, IsRetention: false, IsQuota: false }],
          Total: total,
        },
      ],
    }),
  })
  const cfdi = await leerRespuesta(cfdiResp)

  if (!cfdiResp.ok) {
    const detalle = cfdi?.ModelState ? JSON.stringify(cfdi.ModelState) : undefined
    const mensaje = [cfdi?.Message, detalle].filter(Boolean).join(' — ') || JSON.stringify(cfdi)
    return json({ error: 'FACTURAMA_ERROR', mensaje })
  }

  const folioFiscal = cfdi.Complement?.TaxStamp?.Uuid
  const facturamaId = cfdi.Id

  const { data: factura, error: facturaError } = await supabase.rpc('emitir_factura', {
    p_codigo: codigo,
    p_folio_fiscal: folioFiscal,
    p_facturama_id: facturamaId,
    p_rfc: rfc,
    p_cp: cp,
    p_razon_social: razonSocial,
    p_regimen_fiscal: regimenFiscal,
    p_uso_cfdi: usoCfdi,
    p_correo: correo,
  })

  if (facturaError) {
    return json({
      error: facturaError.message?.includes('YA_FACTURADO') ? 'YA_FACTURADO' : 'ERROR_INTERNO',
      mensaje: facturaError.message,
    })
  }

  return json({ factura })
}

async function accionDescargar(body: Record<string, unknown>) {
  const { facturamaId, format } = body as Record<string, string>
  if (!['pdf', 'xml'].includes(format)) {
    return json({ error: 'FORMATO_INVALIDO' })
  }
  const resp = await facturamaFetch(`/cfdi/${format}/issued/${facturamaId}`)
  const data = await leerRespuesta(resp)
  if (!resp.ok) {
    return json({ error: 'FACTURAMA_ERROR', mensaje: JSON.stringify(data) })
  }
  return json({ contentType: data.ContentType, base64: data.Content })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const body = await req.json()
    switch (body.action) {
      case 'catalogs':
        return await accionCatalogos(body.catalogo)
      case 'emitir':
        return await accionEmitir(body)
      case 'descargar':
        return await accionDescargar(body)
      default:
        return json({ error: 'ACCION_INVALIDA' })
    }
  } catch (err) {
    return json({ error: 'ERROR_INESPERADO', mensaje: String(err) })
  }
})
