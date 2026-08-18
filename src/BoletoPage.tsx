import { lazy, Suspense, useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import type { Evento } from './data/eventos'
import { generarQrDataUrl } from './lib/qr'
import { obtenerLinkGoogleWallet } from './data/googleWallet'

const BoletoDescargaPdf = lazy(() =>
  import('./pdf/BoletoDescargaPdf').then((m) => ({ default: m.BoletoDescargaPdf }))
)

type BoletoState = {
  evento: Evento
  datos: { nombre: string; asistentes: number }
  folio: string
  total: number
  ultimosDigitos: string
  fechaCompra: string
}

export function BoletoPage() {
  const { folio } = useParams()
  const location = useLocation()
  const state = location.state as BoletoState | null

  if (!state || state.folio !== folio) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-5 text-center text-foreground">
        <h1 className="text-xl font-semibold">Este boleto no está disponible desde aquí</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Descarga tu boleto desde la pantalla de confirmación justo después de reservar.
        </p>
        <Link
          to="/eventos"
          className="mt-2 inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-naranja-600"
        >
          Ver eventos
        </Link>
      </div>
    )
  }

  const { evento, datos, total, ultimosDigitos, fechaCompra } = state
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [agregandoWallet, setAgregandoWallet] = useState(false)
  const [errorWallet, setErrorWallet] = useState<string | null>(null)

  useEffect(() => {
    if (folio) generarQrDataUrl(folio).then(setQrDataUrl)
  }, [folio])

  async function agregarAGoogleWallet() {
    if (!folio) return
    setAgregandoWallet(true)
    setErrorWallet(null)
    try {
      const saveUrl = await obtenerLinkGoogleWallet(folio)
      window.location.href = saveUrl
    } catch {
      setErrorWallet('No pudimos agregar tu boleto a Google Wallet. Intenta de nuevo.')
      setAgregandoWallet(false)
    }
  }

  const fechaCompraFmt = new Date(fechaCompra).toLocaleString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="flex min-h-dvh flex-col items-center gap-6 bg-muted py-10 print:bg-white print:py-0">
      <div className="flex flex-wrap items-center justify-center gap-3 print:hidden">
        <Suspense
          fallback={
            <span className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground opacity-60">
              Preparando PDF…
            </span>
          }
        >
          {qrDataUrl && (
            <BoletoDescargaPdf
              evento={evento}
              datos={datos}
              folio={folio ?? ''}
              total={total}
              ultimosDigitos={ultimosDigitos}
              fechaCompraFmt={fechaCompraFmt}
              qrDataUrl={qrDataUrl}
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-naranja-600"
            />
          )}
        </Suspense>
        <button
          type="button"
          onClick={agregarAGoogleWallet}
          disabled={agregandoWallet}
          className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold hover:bg-secondary/60 disabled:opacity-60"
        >
          {agregandoWallet ? 'Agregando…' : 'Agregar a Google Wallet'}
        </button>
      </div>
      {errorWallet && (
        <p className="max-w-sm text-center text-sm text-naranja-700 print:hidden">{errorWallet}</p>
      )}

      <div className="flex w-full max-w-[816px] flex-col gap-6 rounded-2xl border border-border bg-card p-10 print:rounded-none print:border-0 print:p-12">
        <div className="flex items-center justify-between border-b border-border pb-6">
          <div>
            <p className="text-lg font-bold text-primary">amena</p>
            <p className="text-xs text-muted-foreground">Restaurante · Mutuo Vive, Guadalajara</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Boleto de evento
            </p>
            <p className="font-mono text-sm font-semibold">{folio}</p>
            <span className="mt-1 inline-block rounded-full bg-salvia-100 px-2.5 py-0.5 text-xs font-semibold text-salvia-700">
              PAGADA
            </span>
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-[1fr_180px]">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-naranja-700">
              {evento.categoria} · Evento abierto al público
            </p>
            <h1 className="mt-1 text-2xl font-bold">{evento.titulo}</h1>
            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <Dato etiqueta="Fecha" valor={evento.fechaLarga} />
              <Dato etiqueta="Hora" valor={evento.horario} />
              <Dato etiqueta="Asistente" valor={datos.nombre || '—'} />
              <Dato etiqueta="Asistentes" valor={`${datos.asistentes} personas`} />
              <Dato etiqueta="Lugar" valor={evento.lugar} />
              <Dato etiqueta="Folio" valor={folio ?? ''} />
            </dl>
          </div>
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl bg-tinta-900 p-4 text-center">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`Código QR del boleto ${folio}`}
                className="size-32 rounded-lg bg-crema-50 p-2"
              />
            ) : (
              <div className="flex size-32 items-center justify-center rounded-lg bg-crema-50 p-2 font-mono text-[10px] font-bold leading-tight text-tinta-900">
                {folio}
              </div>
            )}
            <p className="text-[11px] text-crema-100">Presenta este código en la entrada</p>
          </div>
        </div>

        {evento.incluye && (
          <div className="border-t border-dashed border-border pt-6">
            <h2 className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Tu boleto incluye
            </h2>
            <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
              {evento.incluye.map((item) => (
                <li key={item} className="text-sm text-foreground">
                  · {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 border-t border-dashed border-border pt-6 text-sm sm:grid-cols-4">
          <Dato etiqueta="Subtotal" valor={`$${total.toLocaleString('es-MX')} MXN`} />
          <Dato etiqueta="Método de pago" valor={`Tarjeta ···· ${ultimosDigitos} · Synergy Pay`} />
          <Dato etiqueta="Fecha de compra" valor={fechaCompraFmt} />
          <Dato etiqueta="Total pagado" valor={`$${total.toLocaleString('es-MX')} MXN`} />
        </div>

        <div className="border-t border-dashed border-border pt-6">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Cancelación sin costo hasta 48 h antes del evento. Después de ese plazo el cargo no es
            reembolsable, pero puedes transferir tu lugar a otra persona avisando a hola@amena.mx.
            Este boleto es válido para una sola entrada y admite el número de asistentes indicado
            arriba.
          </p>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
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
