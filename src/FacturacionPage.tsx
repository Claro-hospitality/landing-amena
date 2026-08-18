import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  Check,
  FileText,
  Search,
} from 'lucide-react'
import { cn } from './lib/utils'
import { LogotipoAmena } from './components/logotipo-amena'
import {
  buscarCodigoConsumo,
  emitirFactura as emitirFacturaFn,
  listarCatalogoFacturama,
  DATOS_COMPROBANTE,
  EMISOR,
  type CatalogoItem,
  type CodigoConsumo,
  type FacturaEmitida,
} from './data/facturacion'

type Paso = 'codigo' | 'datos' | 'exito'
type ErrorCodigo = null | 'ya-facturado' | 'no-encontrado'

type DatosFiscales = {
  rfc: string
  cp: string
  razonSocial: string
  regimenFiscal: string
  usoCfdi: string
  correo: string
}

const DATOS_INICIALES: DatosFiscales = {
  rfc: '',
  cp: '',
  razonSocial: '',
  regimenFiscal: '',
  usoCfdi: '',
  correo: '',
}

const EJEMPLO_TICKET = {
  codigo: 'AMN-XXXX-XXXX',
  items: [
    { descripcion: '2 × Comida corrida', monto: 380 },
    { descripcion: '1 × Agua de jamaica', monto: 55 },
    { descripcion: '1 × Postre del día', monto: 95 },
  ],
  total: 614.8,
}

export function FacturacionPage() {
  const navigate = useNavigate()
  const [paso, setPaso] = useState<Paso>('codigo')
  const [codigoInput, setCodigoInput] = useState('')
  const [error, setError] = useState<ErrorCodigo>(null)
  const [buscando, setBuscando] = useState(false)
  const [emitiendo, setEmitiendo] = useState(false)
  const [consumo, setConsumo] = useState<CodigoConsumo | null>(null)
  const [datos, setDatos] = useState<DatosFiscales>(DATOS_INICIALES)
  const [facturaEmitida, setFacturaEmitida] = useState<FacturaEmitida | null>(null)
  const [regimenes, setRegimenes] = useState<CatalogoItem[]>([])
  const [usosCfdi, setUsosCfdi] = useState<CatalogoItem[]>([])
  const [errorEmision, setErrorEmision] = useState<string | null>(null)

  useEffect(() => {
    listarCatalogoFacturama('FiscalRegimens').then((items) => {
      setRegimenes(items)
      setDatos((d) => (d.regimenFiscal ? d : { ...d, regimenFiscal: items[0]?.codigo ?? '' }))
    })
    listarCatalogoFacturama('CfdiUses').then((items) => {
      setUsosCfdi(items)
      setDatos((d) => (d.usoCfdi ? d : { ...d, usoCfdi: items[0]?.codigo ?? '' }))
    })
  }, [])

  async function buscarConsumo(e: FormEvent) {
    e.preventDefault()
    setBuscando(true)
    const resultado = await buscarCodigoConsumo(codigoInput)
    setBuscando(false)

    if (!resultado) {
      setError('no-encontrado')
      return
    }
    if (resultado.facturaExistente) {
      setConsumo(resultado.codigoConsumo)
      setFacturaEmitida(resultado.facturaExistente)
      setError('ya-facturado')
      return
    }
    setError(null)
    setConsumo(resultado.codigoConsumo)
    setPaso('datos')
  }

  async function emitirFactura(e: FormEvent) {
    e.preventDefault()
    if (!consumo) return
    setEmitiendo(true)
    setErrorEmision(null)
    try {
      const factura = await emitirFacturaFn({
        codigo: consumo.codigo,
        rfc: datos.rfc,
        cp: datos.cp,
        razonSocial: datos.razonSocial,
        regimenFiscal: datos.regimenFiscal,
        usoCfdi: datos.usoCfdi,
        correo: datos.correo,
      })
      setFacturaEmitida(factura)
      setPaso('exito')
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : ''
      if (mensaje.startsWith('YA_FACTURADO')) {
        const resultado = await buscarCodigoConsumo(consumo.codigo)
        if (resultado?.facturaExistente) {
          setFacturaEmitida(resultado.facturaExistente)
        }
        setError('ya-facturado')
        setPaso('codigo')
      } else {
        setErrorEmision(mensaje || 'No pudimos timbrar tu factura. Intenta de nuevo.')
      }
    } finally {
      setEmitiendo(false)
    }
  }

  function descargarPdf(factura: FacturaEmitida) {
    if (!consumo) return
    navigate(`/factura/${factura.folioFiscal}`, { state: buildFacturaState(factura, consumo) })
  }

  function facturarOtro() {
    setCodigoInput('')
    setDatos(DATOS_INICIALES)
    setError(null)
    setConsumo(null)
    setFacturaEmitida(null)
    setPaso('codigo')
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Header />
      <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
        <Stepper paso={paso} />

        {paso === 'codigo' && (
          <CodigoStep
            codigo={codigoInput}
            onCodigo={setCodigoInput}
            onSubmit={buscarConsumo}
            buscando={buscando}
            error={error}
            codigoBuscado={codigoInput.trim().toUpperCase()}
            facturaEmitida={facturaEmitida}
            onDescargarPdf={descargarPdf}
          />
        )}
        {paso === 'datos' && consumo && (
          <DatosFiscalesStep
            consumo={consumo}
            datos={datos}
            onChange={setDatos}
            onSubmit={emitirFactura}
            emitiendo={emitiendo}
            regimenes={regimenes}
            usosCfdi={usosCfdi}
            errorEmision={errorEmision}
          />
        )}
        {paso === 'exito' && facturaEmitida && consumo && (
          <ExitoStep factura={facturaEmitida} consumo={consumo} onFacturarOtro={facturarOtro} />
        )}
      </main>
    </div>
  )
}

function Stepper({ paso }: { paso: Paso }) {
  const pasos: { id: Paso; label: string }[] = [
    { id: 'codigo', label: 'Código' },
    { id: 'datos', label: 'Datos fiscales' },
    { id: 'exito', label: 'Confirmación' },
  ]
  const idx = pasos.findIndex((p) => p.id === paso)
  return (
    <div className="flex items-center gap-3">
      {pasos.map((p, i) => (
        <div key={p.id} className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'flex size-6 items-center justify-center rounded-full font-mono text-xs font-bold',
                i <= idx ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
              )}
            >
              {i < idx ? <Check className="size-3.5" /> : i + 1}
            </span>
            <span className={cn('text-sm font-medium', i <= idx ? 'text-foreground' : 'text-muted-foreground')}>
              {p.label}
            </span>
          </div>
          {i < pasos.length - 1 && <span className="h-px w-8 bg-border" aria-hidden />}
        </div>
      ))}
    </div>
  )
}

function CodigoStep({
  codigo,
  onCodigo,
  onSubmit,
  buscando,
  error,
  codigoBuscado,
  facturaEmitida,
  onDescargarPdf,
}: {
  codigo: string
  onCodigo: (v: string) => void
  onSubmit: (e: FormEvent) => void
  buscando: boolean
  error: ErrorCodigo
  codigoBuscado: string
  facturaEmitida: FacturaEmitida | null
  onDescargarPdf: (factura: FacturaEmitida) => void
}) {
  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
      <div>
        <div>
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-naranja-700">
            Auto-facturación · CFDI 4.0
          </span>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Factura tu consumo en un minuto</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ingresa el código impreso en tu ticket, confirma tus datos fiscales y descarga tu PDF y
            XML al instante.
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold">Código de consumo</h2>

          {error === 'ya-facturado' && facturaEmitida && (
            <div className="flex flex-col gap-2 rounded-xl border border-naranja-200 bg-naranja-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-naranja-700" />
                <div>
                  <p className="text-sm font-semibold text-naranja-700">
                    El código {codigoBuscado} ya fue facturado
                  </p>
                  <p className="text-sm text-naranja-700/90">
                    Se emitió el CFDI Serie A · Folio 1042 el {facturaEmitida.fechaTimbrado} a nombre
                    de {facturaEmitida.razonSocial}. Cada código de consumo se puede facturar una
                    sola vez.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onDescargarPdf(facturaEmitida)}
                className="w-fit rounded-full border border-naranja-300 bg-card px-4 py-2 text-sm font-semibold text-naranja-700 hover:bg-naranja-100"
              >
                Descargar el PDF emitido
              </button>
            </div>
          )}

          {error === 'no-encontrado' && (
            <div className="flex items-start gap-3 rounded-xl border border-naranja-200 bg-naranja-50 p-4">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-naranja-700" />
              <div>
                <p className="text-sm font-semibold text-naranja-700">No encontramos ese consumo</p>
                <p className="text-sm text-naranja-700/90">
                  Revisa que hayas escrito el código completo, tal como aparece en tu ticket.
                </p>
              </div>
            </div>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-muted-foreground">Código de consumo</span>
            <input
              required
              value={codigo}
              onChange={(e) => onCodigo(e.target.value)}
              placeholder="AMN-4F72-9C10"
              className="h-11 rounded-lg border border-border bg-card px-3.5 font-mono text-sm text-foreground outline-none"
            />
            <span className="text-xs text-muted-foreground">
              Formato: AMN-XXXX-XXXX · 12 caracteres
            </span>
          </label>

          <button
            type="submit"
            disabled={buscando}
            className="inline-flex w-fit items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-naranja-600 disabled:opacity-60"
          >
            <Search className="size-4" />
            {buscando ? 'Buscando…' : error === 'ya-facturado' ? 'Probar con otro código' : 'Buscar mi consumo'}
          </button>

          <hr className="border-border" />
          <p className="text-xs text-muted-foreground">
            Puedes facturar dentro del mismo mes del consumo. Cada código se factura una sola vez.
          </p>
        </form>

        {error === 'no-encontrado' && (
          <div className="mt-6 rounded-2xl border border-border bg-card p-5">
            <h2 className="font-semibold">¿Crees que es un error?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Estos son los motivos más comunes por los que un código no funciona:
            </p>
            <ol className="mt-3 flex flex-col gap-3">
              <MotivoError n={1} titulo="El código ya se usó para facturar" desc="Descarga el CFDI existente desde el aviso de la izquierda." />
              <MotivoError n={2} titulo="El consumo es de un mes anterior" desc="Solo puedes facturar dentro del mismo mes natural del consumo." />
              <MotivoError n={3} titulo="Hay un carácter mal escrito" desc="Ojo con confundir 0 con O, y 1 con I." />
            </ol>
            <p className="mt-4 text-xs text-muted-foreground">
              ¿Sigues sin poder facturar? Escríbenos a facturacion@amena.mx con la foto de tu ticket.
            </p>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-semibold">¿Dónde está mi código?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Aparece impreso al final del ticket que te entregamos en caja, justo debajo del total.
        </p>
        <div className="mt-4 rounded-xl border border-dashed border-border bg-muted p-4">
          <p className="font-mono text-sm font-bold text-primary">amena</p>
          <p className="mt-1 text-xs text-muted-foreground">Mesa 12 · 2 ago 2026 · 14:32</p>
          <div className="mt-3 flex flex-col gap-1 border-t border-dashed border-border pt-3 text-xs">
            {EJEMPLO_TICKET.items.map((item) => (
              <div key={item.descripcion} className="flex items-center justify-between">
                <span className="text-muted-foreground">{item.descripcion}</span>
                <span>${item.monto.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-dashed border-border pt-3 text-sm font-semibold">
            <span>TOTAL</span>
            <span>${EJEMPLO_TICKET.total.toFixed(2)}</span>
          </div>
          <div className="mt-3 rounded-lg bg-naranja-100 px-3 py-2 text-center font-mono text-xs font-semibold text-naranja-700">
            CÓDIGO PARA FACTURAR · {EJEMPLO_TICKET.codigo}
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            ¡Gracias por comer con nosotros!
          </p>
        </div>
      </div>
    </div>
  )
}

function MotivoError({ n, titulo, desc }: { n: number; titulo: string; desc: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary font-mono text-xs font-bold">
        {n}
      </span>
      <div>
        <p className="text-sm font-medium">{titulo}</p>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
    </li>
  )
}

function DatosFiscalesStep({
  consumo,
  datos,
  onChange,
  onSubmit,
  emitiendo,
  regimenes,
  usosCfdi,
  errorEmision,
}: {
  consumo: CodigoConsumo
  datos: DatosFiscales
  onChange: (d: DatosFiscales) => void
  onSubmit: (e: FormEvent) => void
  emitiendo: boolean
  regimenes: CatalogoItem[]
  usosCfdi: CatalogoItem[]
  errorEmision: string | null
}) {
  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_320px]">
      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold">Consumo encontrado</h2>
          <p className="mt-1 font-mono text-sm text-muted-foreground">{consumo.codigo}</p>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <Dato etiqueta="Folio del ticket" valor={consumo.folioTicket} />
            <Dato etiqueta="Fecha del consumo" valor={consumo.fecha} />
            <Dato etiqueta="Descripción" valor={consumo.descripcion} />
            <Dato etiqueta="Mesa" valor={consumo.mesa ?? '—'} />
          </dl>
          <hr className="my-4 border-border" />
          <div className="flex flex-col gap-1.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${consumo.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">IVA (16%)</span>
              <span>${consumo.iva.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between font-semibold">
              <span>Total</span>
              <span>${consumo.total.toFixed(2)} MXN</span>
            </div>
          </div>
        </div>

        <div>
          <h1 className="text-xl font-bold">Datos fiscales del receptor</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Deben coincidir exactamente con tu Constancia de Situación Fiscal vigente.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="RFC *">
            <input
              required
              value={datos.rfc}
              onChange={(e) => onChange({ ...datos, rfc: e.target.value.toUpperCase() })}
              className="w-full bg-transparent font-mono text-sm text-foreground outline-none"
            />
          </Campo>
          <Campo label="Código postal fiscal *">
            <input
              required
              inputMode="numeric"
              value={datos.cp}
              onChange={(e) => onChange({ ...datos, cp: e.target.value })}
              className="w-full bg-transparent font-mono text-sm text-foreground outline-none"
            />
          </Campo>
        </div>
        <Campo label="Razón social *">
          <input
            required
            value={datos.razonSocial}
            onChange={(e) => onChange({ ...datos, razonSocial: e.target.value.toUpperCase() })}
            className="w-full bg-transparent text-sm text-foreground outline-none"
          />
        </Campo>
        <Campo label="Régimen fiscal *">
          <select
            value={datos.regimenFiscal}
            onChange={(e) => onChange({ ...datos, regimenFiscal: e.target.value })}
            className="w-full bg-transparent text-sm text-foreground outline-none"
          >
            {regimenes.map((r) => (
              <option key={r.codigo} value={r.codigo}>
                {r.codigo} — {r.nombre}
              </option>
            ))}
          </select>
        </Campo>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Uso del CFDI *">
            <select
              value={datos.usoCfdi}
              onChange={(e) => onChange({ ...datos, usoCfdi: e.target.value })}
              className="w-full bg-transparent text-sm text-foreground outline-none"
            >
              {usosCfdi.map((u) => (
                <option key={u.codigo} value={u.codigo}>
                  {u.codigo} — {u.nombre}
                </option>
              ))}
            </select>
          </Campo>
          <Campo label="Correo para envío *">
            <input
              required
              type="email"
              value={datos.correo}
              onChange={(e) => onChange({ ...datos, correo: e.target.value })}
              className="w-full bg-transparent text-sm text-foreground outline-none"
            />
          </Campo>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-border bg-muted p-4">
          <FileText className="mt-0.5 size-4 shrink-0 text-salvia-600" />
          <p className="text-sm text-muted-foreground">
            Verifica el RFC antes de emitir. Una vez timbrada ante el SAT, la factura solo puede
            corregirse con una nota de crédito.
          </p>
        </div>

        {errorEmision && (
          <div className="flex items-start gap-3 rounded-xl border border-naranja-200 bg-naranja-50 p-4">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-naranja-700" />
            <div>
              <p className="text-sm font-semibold text-naranja-700">No pudimos timbrar tu factura</p>
              <p className="text-sm text-naranja-700/90">{errorEmision}</p>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={emitiendo}
          className="inline-flex w-fit items-center gap-2 self-end rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-naranja-600 disabled:opacity-60"
        >
          {emitiendo ? 'Timbrando…' : 'Emitir factura'}
          <ArrowRight className="size-4" />
        </button>
      </form>

      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold">Emisor</h2>
          <dl className="mt-3 flex flex-col gap-2.5 text-sm">
            <Dato etiqueta="Razón social" valor={EMISOR.razonSocial} />
            <Dato etiqueta="RFC" valor={EMISOR.rfc} />
            <Dato etiqueta="Régimen fiscal" valor={EMISOR.regimen} />
          </dl>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold">Datos del comprobante</h2>
          <dl className="mt-3 flex flex-col gap-2.5 text-sm">
            <Dato etiqueta="Clave prod/serv" valor={DATOS_COMPROBANTE.claveProdServ} />
            <Dato etiqueta="Clave unidad" valor={DATOS_COMPROBANTE.claveUnidad} />
            <Dato etiqueta="Método de pago" valor={DATOS_COMPROBANTE.metodoPago} />
            <Dato etiqueta="Forma de pago" valor={DATOS_COMPROBANTE.formaPago} />
            <Dato etiqueta="Concepto" valor={DATOS_COMPROBANTE.concepto} />
          </dl>
        </div>
      </div>
    </div>
  )
}

function ExitoStep({
  factura,
  consumo,
  onFacturarOtro,
}: {
  factura: FacturaEmitida
  consumo: CodigoConsumo
  onFacturarOtro: () => void
}) {
  const navigate = useNavigate()

  return (
    <div className="mt-8 flex flex-col items-center gap-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-salvia-100 text-salvia-700">
          <Check className="size-7" />
        </span>
        <h1 className="text-2xl font-bold">Factura timbrada</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Tu CFDI 4.0 quedó registrado ante el SAT. Enviamos una copia del PDF y del XML a{' '}
          {factura.correo}.
        </p>
      </div>

      <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">CFDI 4.0 · Ingreso</p>
            <p className="text-sm text-muted-foreground">Serie A · Folio 1042</p>
          </div>
          <span className="rounded-full bg-salvia-100 px-3 py-1 text-xs font-semibold text-salvia-700">
            VIGENTE
          </span>
        </div>
        <div className="mt-4 rounded-lg bg-muted px-3 py-2">
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Folio fiscal (UUID)
          </p>
          <p className="break-all font-mono text-sm">{factura.folioFiscal}</p>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <Dato etiqueta="Receptor" valor={factura.razonSocial} />
          <Dato etiqueta="RFC receptor" valor={factura.rfc} />
          <Dato etiqueta="Fecha de timbrado" valor={factura.fechaTimbrado} />
          <Dato etiqueta="Uso del CFDI" valor={factura.usoCfdi} />
          <Dato etiqueta="Concepto" valor={DATOS_COMPROBANTE.concepto} />
          <Dato etiqueta="Método / forma" valor={`${DATOS_COMPROBANTE.metodoPago} · ${DATOS_COMPROBANTE.formaPago}`} />
        </dl>
        <hr className="my-4 border-border" />
        <div className="flex flex-col gap-1.5 text-sm">
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

      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => navigate(`/factura/${factura.folioFiscal}`, { state: buildFacturaState(factura, consumo) })}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-naranja-600"
        >
          Descargar PDF
        </button>
        <button
          type="button"
          onClick={() => navigate(`/factura/${factura.folioFiscal}`, { state: buildFacturaState(factura, consumo) })}
          className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-secondary/60"
        >
          Descargar XML
        </button>
        <button
          type="button"
          onClick={onFacturarOtro}
          className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-secondary/60"
        >
          Facturar otro consumo
        </button>
      </div>
    </div>
  )
}

function buildFacturaState(factura: FacturaEmitida, consumo: CodigoConsumo) {
  return { factura, consumo, emisor: EMISOR, comprobante: DATOS_COMPROBANTE }
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

function Campo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <div className="flex h-11 items-center rounded-lg border border-border bg-card px-3.5">
        {children}
      </div>
    </label>
  )
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-2xl">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link to="/" className="shrink-0" aria-label="Amena — inicio">
          <LogotipoAmena className="h-5 w-auto text-primary" />
        </Link>
        <nav className="flex items-center gap-1" aria-label="Secciones">
          <Link
            to="/"
            className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Inicio
          </Link>
          <Link
            to="/eventos"
            className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Eventos
          </Link>
          <span className="rounded-lg bg-secondary/80 px-2.5 py-1.5 text-sm font-medium text-foreground">
            Facturar
          </span>
        </nav>
      </div>
    </header>
  )
}
