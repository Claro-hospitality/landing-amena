import { supabase } from '../lib/supabase'
import { formatFechaHoraLarga } from '../lib/fechas'

export const EMISOR = {
  razonSocial: 'Amena Cocina de Autor S.A. de C.V.',
  rfc: 'ACA210318QK3',
  regimen: '601 — General de Ley Personas Morales',
}

export const DATOS_COMPROBANTE = {
  claveProdServ: '90101501',
  claveUnidad: 'ACT',
  metodoPago: 'PPD',
  formaPago: '99 — Por definir',
  concepto: 'Servicio de comedor Amena',
}

export type CatalogoItem = { codigo: string; nombre: string }

export type ItemConsumo = { descripcion: string; monto: number }

export type CodigoConsumo = {
  codigo: string
  folioTicket: string
  fecha: string
  mesa?: string
  descripcion: string
  items: ItemConsumo[]
  subtotal: number
  iva: number
  total: number
}

export type FacturaEmitida = {
  folioFiscal: string
  facturamaId: string
  rfc: string
  cp: string
  razonSocial: string
  regimenFiscal: string
  usoCfdi: string
  correo: string
  fechaTimbrado: string
}

type CodigoConsumoRow = {
  codigo: string
  folio_ticket: string
  fecha: string
  mesa: string | null
  descripcion: string
  items: ItemConsumo[]
  subtotal: number | string
  iva: number | string
  total: number | string
}

type FacturaRow = {
  folio_fiscal: string
  facturama_id: string
  rfc: string
  cp: string
  razon_social: string
  regimen_fiscal: string
  uso_cfdi: string
  correo: string
  fecha_timbrado: string
}

function mapCodigoConsumoRow(row: CodigoConsumoRow): CodigoConsumo {
  return {
    codigo: row.codigo,
    folioTicket: row.folio_ticket,
    fecha: formatFechaHoraLarga(row.fecha),
    mesa: row.mesa ?? undefined,
    descripcion: row.descripcion,
    items: row.items,
    subtotal: Number(row.subtotal),
    iva: Number(row.iva),
    total: Number(row.total),
  }
}

function mapFacturaRow(row: FacturaRow): FacturaEmitida {
  return {
    folioFiscal: row.folio_fiscal,
    facturamaId: row.facturama_id,
    rfc: row.rfc,
    cp: row.cp,
    razonSocial: row.razon_social,
    regimenFiscal: row.regimen_fiscal,
    usoCfdi: row.uso_cfdi,
    correo: row.correo,
    fechaTimbrado: new Date(row.fecha_timbrado).toLocaleString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
  }
}

export async function buscarCodigoConsumo(codigo: string): Promise<
  | { codigoConsumo: CodigoConsumo; facturaExistente?: FacturaEmitida }
  | undefined
> {
  const { data, error } = await supabase.rpc('buscar_codigo_consumo', { p_codigo: codigo.trim() })
  if (error) throw error
  const row = data?.[0] as { codigo_consumo: CodigoConsumoRow; factura_existente: FacturaRow | null } | undefined
  if (!row) return undefined
  return {
    codigoConsumo: mapCodigoConsumoRow(row.codigo_consumo),
    facturaExistente: row.factura_existente ? mapFacturaRow(row.factura_existente) : undefined,
  }
}

export async function emitirFactura(input: {
  codigo: string
  rfc: string
  cp: string
  razonSocial: string
  regimenFiscal: string
  usoCfdi: string
  correo: string
}): Promise<FacturaEmitida> {
  const { data, error } = await supabase.functions.invoke('facturama', {
    body: { action: 'emitir', ...input },
  })
  if (error) throw new Error(error.message)
  if (data?.error) throw new Error(data.mensaje ? `${data.error}: ${data.mensaje}` : data.error)
  return mapFacturaRow(data.factura as FacturaRow)
}

export async function listarCatalogoFacturama(
  catalogo: 'FiscalRegimens' | 'CfdiUses'
): Promise<CatalogoItem[]> {
  const { data, error } = await supabase.functions.invoke('facturama', {
    body: { action: 'catalogs', catalogo },
  })
  if (error) throw new Error(error.message)
  if (data?.error) throw new Error(data.error)
  const items = data.catalogo as { Value: string; Name: string }[]
  return items.map((item) => ({ codigo: item.Value, nombre: item.Name }))
}

export async function descargarArchivoFactura(
  facturamaId: string,
  format: 'pdf' | 'xml'
): Promise<{ contentType: string; base64: string }> {
  const { data, error } = await supabase.functions.invoke('facturama', {
    body: { action: 'descargar', facturamaId, format },
  })
  if (error) throw new Error(error.message)
  if (data?.error) throw new Error(data.error)
  return { contentType: data.contentType as string, base64: data.base64 as string }
}
