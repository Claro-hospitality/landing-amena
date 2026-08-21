import { lazy, Suspense, useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { cn } from './lib/utils'
import { recuperarBoleto, type BoletoRecuperado } from './data/reservaciones'
import { generarQrDataUrl } from './lib/qr'
import { obtenerLinkGoogleWallet } from './data/googleWallet'

const BoletoDescargaPdf = lazy(() =>
  import('./pdf/BoletoDescargaPdf').then((m) => ({ default: m.BoletoDescargaPdf }))
)

/**
 * Un boleto llega a esta pantalla por dos caminos:
 *
 *  1. Recién pagado — la confirmación de `/eventos/:slug/reservar` navega acá con el boleto
 *     completo en el state del router. Es el camino de siempre.
 *  2. En frío — alguien abre `/boleto/:folio` en otra pestaña, desde su correo o desde el
 *     historial, y no hay state. Entonces se pide el correo de la reservación y el boleto se
 *     recupera con la RPC `boleto_por_folio`. El folio solo NO alcanza: va impreso en el
 *     boleto y dentro del QR, así que quien lo vea no debe poder leer los datos de su dueño.
 */
export function BoletoPage() {
  const { folio = '' } = useParams()
  const location = useLocation()
  const delRouter = location.state as BoletoRecuperado | null
  const [recuperado, setRecuperado] = useState<BoletoRecuperado | null>(null)

  const boleto = delRouter?.folio === folio ? delRouter : recuperado

  if (!boleto) {
    return <RecuperarBoleto folio={folio} onRecuperado={setRecuperado} />
  }
  return <Boleto boleto={boleto} />
}

function RecuperarBoleto({
  folio,
  onRecuperado,
}: {
  folio: string
  onRecuperado: (boleto: BoletoRecuperado) => void
}) {
  const [email, setEmail] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function alEnviar(e: FormEvent) {
    e.preventDefault()
    setBuscando(true)
    setError(null)
    try {
      const boleto = await recuperarBoleto(folio, email)
      if (!boleto) {
        // Un solo mensaje para folio inexistente y correo que no cuadra: la RPC no distingue
        // los dos casos a propósito, y decirlo acá delataría qué folios existen.
        setError('No encontramos un boleto con ese folio y ese correo. Revisa los dos.')
        setBuscando(false)
        return
      }
      onRecuperado(boleto)
    } catch {
      setError('No pudimos consultar tu boleto. Intenta de nuevo en un momento.')
      setBuscando(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-5 py-12 text-foreground">
      <div className="w-full max-w-sm">
        <p className="text-lg font-bold text-primary">amena</p>
        <h1 className="mt-4 text-xl font-semibold">Consulta tu boleto</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Escribe el correo con el que reservaste para ver el boleto del folio{' '}
          <span className="font-mono font-semibold text-foreground">{folio}</span>.
        </p>

        <form onSubmit={alEnviar} className="mt-6 flex flex-col gap-3">
          <label htmlFor="correo-boleto" className="text-sm font-medium">
            Correo de la reservación
          </label>
          <input
            id="correo-boleto"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={buscando}
            className="mt-1 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-naranja-600 disabled:opacity-60"
          >
            {buscando ? 'Buscando…' : 'Ver mi boleto'}
          </button>
        </form>

        {error && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-naranja-200 bg-naranja-50 p-4">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-naranja-700" />
            <p className="text-sm text-naranja-700/90">{error}</p>
          </div>
        )}

        <Link to="/eventos" className="mt-6 inline-block text-sm font-semibold text-primary hover:underline">
          Ver eventos
        </Link>
      </div>
    </div>
  )
}

function Boleto({ boleto }: { boleto: BoletoRecuperado }) {
  const { evento, datos, folio, total, ultimosDigitos, fechaCompra, estadoPago, metodoPago } = boleto
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [agregandoWallet, setAgregandoWallet] = useState(false)
  const [errorWallet, setErrorWallet] = useState<string | null>(null)

  useEffect(() => {
    generarQrDataUrl(folio).then(setQrDataUrl)
  }, [folio])

  async function agregarAGoogleWallet() {
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
              folio={folio}
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
            {/* El estado sale de la reservación, no fijo: un boleto recuperado puede venir
                cancelado y el boleto no debe decir PAGADA cuando no lo está. */}
            <span
              className={cn(
                'mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase',
                estadoPago === 'pagada'
                  ? 'bg-salvia-100 text-salvia-700'
                  : 'bg-naranja-100 text-naranja-700'
              )}
            >
              {estadoPago}
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
              <Dato etiqueta="Folio" valor={folio} />
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
          <Dato
            etiqueta="Método de pago"
            valor={metodoPago ?? `Tarjeta ···· ${ultimosDigitos} · Synergy Pay`}
          />
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
