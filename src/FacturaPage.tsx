import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import {
  descargarArchivoFactura,
  EMISOR,
  DATOS_COMPROBANTE,
  type CodigoConsumo,
  type FacturaEmitida,
} from './data/facturacion'

type FacturaState = {
  factura: FacturaEmitida
  consumo: CodigoConsumo
  emisor: typeof EMISOR
  comprobante: typeof DATOS_COMPROBANTE
}

export function FacturaPage() {
  const { folioFiscal } = useParams()
  const location = useLocation()
  const state = location.state as FacturaState | null

  if (!state || state.factura.folioFiscal !== folioFiscal) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-5 text-center text-foreground">
        <h1 className="text-xl font-semibold">Esta factura no está disponible desde aquí</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Descárgala desde la pantalla de confirmación justo después de emitirla.
        </p>
        <Link
          to="/facturar"
          className="mt-2 inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-naranja-600"
        >
          Facturar un consumo
        </Link>
      </div>
    )
  }

  const { factura, consumo, emisor, comprobante } = state
  const [descargando, setDescargando] = useState<'pdf' | 'xml' | null>(null)

  async function descargar(format: 'pdf' | 'xml') {
    setDescargando(format)
    try {
      const { contentType, base64 } = await descargarArchivoFactura(factura.facturamaId, format)
      const binario = atob(base64)
      const bytes = new Uint8Array(binario.length)
      for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i)
      const tipo = contentType || (format === 'pdf' ? 'application/pdf' : 'application/xml')
      const url = URL.createObjectURL(new Blob([bytes], { type: tipo }))
      const enlace = document.createElement('a')
      enlace.href = url
      enlace.download = `factura-${factura.folioFiscal}.${format}`
      document.body.appendChild(enlace)
      enlace.click()
      enlace.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('No se pudo descargar la factura', err)
    } finally {
      setDescargando(null)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center gap-6 bg-muted py-10 print:bg-white print:py-0">
      <div className="flex gap-3 print:hidden">
        <button
          type="button"
          onClick={() => descargar('pdf')}
          disabled={descargando !== null}
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-naranja-600 disabled:opacity-60"
        >
          {descargando === 'pdf' ? 'Descargando…' : 'Descargar PDF'}
        </button>
        <button
          type="button"
          onClick={() => descargar('xml')}
          disabled={descargando !== null}
          className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold hover:bg-secondary/60 disabled:opacity-60"
        >
          {descargando === 'xml' ? 'Descargando…' : 'Descargar XML'}
        </button>
      </div>

      <div className="flex w-full max-w-[816px] flex-col gap-6 rounded-2xl border border-border bg-card p-10 print:rounded-none print:border-0 print:p-12">
        <div className="flex items-center justify-between border-b border-border pb-6">
          <div>
            <p className="text-lg font-bold text-primary">amena</p>
            <p className="text-xs text-muted-foreground">{emisor.razonSocial}</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              CFDI 4.0 · Ingreso
            </p>
            <p className="text-sm font-semibold">Serie A · Folio 1042</p>
            <span className="mt-1 inline-block rounded-full bg-salvia-100 px-2.5 py-0.5 text-xs font-semibold text-salvia-700">
              VIGENTE
            </span>
          </div>
        </div>

        <div className="rounded-lg bg-muted px-3 py-2">
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Folio fiscal (UUID)
          </p>
          <p className="break-all font-mono text-sm">{factura.folioFiscal}</p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <h2 className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Emisor
            </h2>
            <dl className="mt-2 flex flex-col gap-2 text-sm">
              <Dato etiqueta="Razón social" valor={emisor.razonSocial} />
              <Dato etiqueta="RFC" valor={emisor.rfc} />
              <Dato etiqueta="Régimen fiscal" valor={emisor.regimen} />
            </dl>
          </div>
          <div>
            <h2 className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Receptor
            </h2>
            <dl className="mt-2 flex flex-col gap-2 text-sm">
              <Dato etiqueta="Razón social" valor={factura.razonSocial} />
              <Dato etiqueta="RFC" valor={factura.rfc} />
              <Dato etiqueta="Uso del CFDI" valor={factura.usoCfdi} />
              <Dato etiqueta="Régimen fiscal" valor={factura.regimenFiscal} />
            </dl>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-dashed border-border pt-6 text-sm sm:grid-cols-4">
          <Dato etiqueta="Fecha de timbrado" valor={factura.fechaTimbrado} />
          <Dato etiqueta="Método / forma" valor={`${comprobante.metodoPago} · ${comprobante.formaPago}`} />
          <Dato etiqueta="Clave prod/serv" valor={comprobante.claveProdServ} />
          <Dato etiqueta="Concepto" valor={comprobante.concepto} />
        </div>

        <div className="border-t border-dashed border-border pt-6">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Consumo — {consumo.folioTicket}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{consumo.descripcion}</p>
          <div className="mt-3 flex flex-col gap-1.5 text-sm">
            {consumo.items.map((item) => (
              <div key={item.descripcion} className="flex items-center justify-between">
                <span className="text-muted-foreground">{item.descripcion}</span>
                <span>${item.monto.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-col gap-1.5 border-t border-border pt-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${consumo.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">IVA trasladado (16%)</span>
              <span>${consumo.iva.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between font-semibold">
              <span>Total</span>
              <span>${consumo.total.toFixed(2)} MXN</span>
            </div>
          </div>
        </div>

        <div className="border-t border-dashed border-border pt-6 text-xs text-muted-foreground">
          <p>
            Este documento es una representación impresa de un CFDI. Verifica su autenticidad en el
            portal del SAT con el folio fiscal (UUID) indicado arriba.
          </p>
          <div className="mt-3 flex items-center justify-between">
            <span>amena.mx · hola@amena.mx · 33 1284 9077</span>
            <span>Sabores reales, momentos reales.</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {etiqueta}
      </dt>
      <dd className="text-foreground">{valor}</dd>
    </div>
  )
}
