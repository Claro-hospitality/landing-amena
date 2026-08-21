import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  // CreditCard, // reactivar junto con el bloque "Pago seguro" de abajo
  ShieldCheck,
} from 'lucide-react'
import { cn } from './lib/utils'
import { LogotipoAmena } from './components/logotipo-amena'
import { getEventoBySlug, type Evento } from './data/eventos'
import {
  autorizarPago,
  confirmarPago,
  type BoletoRecuperado,
  type DatosTarjeta,
  type DomicilioFacturacion,
} from './data/reservaciones'
import { generarQrDataUrl } from './lib/qr'
import { obtenerLinkGoogleWallet } from './data/googleWallet'
import { iniciarSesionSinergyPay3ds, montarVerificacionSinergyPay3ds, type SinergyPayOtpData } from './lib/sinergypay'

type Paso = 'datos' | 'pago' | 'exito'

type Datos = {
  nombre: string
  telefono: string
  email: string
  asistentes: number
}

const DATOS_INICIALES: Datos = { nombre: '', telefono: '', email: '', asistentes: 1 }

function generarFolio(anio: number) {
  const folio = Math.floor(10000 + Math.random() * 90000)
  return `AMN-EV-${anio}-${folio}`
}

export function ReservaPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'no-encontrado'>('cargando')
  const [evento, setEvento] = useState<Evento | undefined>(undefined)

  const [paso, setPaso] = useState<Paso>('datos')
  const [datos, setDatos] = useState<Datos>(DATOS_INICIALES)
  const [folio, setFolio] = useState<string | null>(null)
  const [ultimosDigitos, setUltimosDigitos] = useState('')

  useEffect(() => {
    if (!slug) {
      setEstado('no-encontrado')
      return
    }
    let cancelado = false
    getEventoBySlug(slug).then((e) => {
      if (cancelado) return
      setEvento(e)
      setEstado(e ? 'listo' : 'no-encontrado')
    })
    return () => {
      cancelado = true
    }
  }, [slug])

  const total = useMemo(() => (evento ? evento.precio * datos.asistentes : 0), [evento, datos.asistentes])

  if (estado === 'cargando') {
    return (
      <div className="min-h-dvh bg-background text-foreground">
        <Header />
        <main className="mx-auto flex w-full max-w-3xl justify-center px-5 py-24 text-sm text-muted-foreground sm:px-8">
          Cargando evento…
        </main>
      </div>
    )
  }

  if (!evento) {
    return (
      <div className="min-h-dvh bg-background text-foreground">
        <Header />
        <main className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-5 py-24 text-center sm:px-8">
          <h1 className="text-2xl font-semibold">No encontramos ese evento</h1>
          <Link
            to="/eventos"
            className="mt-2 inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-naranja-600"
          >
            Ver todos los eventos
          </Link>
        </main>
      </div>
    )
  }

  function confirmarDatos(e: FormEvent) {
    e.preventDefault()
    setPaso('pago')
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Header />
      <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
        <Stepper paso={paso} />

        {paso === 'exito' && folio ? (
          <ExitoStep evento={evento} datos={datos} ultimosDigitos={ultimosDigitos} folio={folio} />
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
            <div>
              {paso === 'datos' && (
                <DatosStep
                  evento={evento}
                  datos={datos}
                  onChange={setDatos}
                  onSubmit={confirmarDatos}
                  onVolver={() => navigate(`/eventos/${evento.slug}`)}
                />
              )}
              {paso === 'pago' && (
                <PagoStep
                  evento={evento}
                  datos={datos}
                  total={total}
                  onAtras={() => setPaso('datos')}
                  onExito={(folioCreado, digitos) => {
                    setUltimosDigitos(digitos)
                    setFolio(folioCreado)
                    setPaso('exito')
                  }}
                />
              )}
            </div>
            <ResumenCard evento={evento} asistentes={datos.asistentes} total={total} />
          </div>
        )}
      </main>
    </div>
  )
}

function Stepper({ paso }: { paso: Paso }) {
  const pasos: { id: Paso; label: string }[] = [
    { id: 'datos', label: 'Datos' },
    { id: 'pago', label: 'Pago' },
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

function DatosStep({
  evento,
  datos,
  onChange,
  onSubmit,
  onVolver,
}: {
  evento: Evento
  datos: Datos
  onChange: (d: Datos) => void
  onSubmit: (e: FormEvent) => void
  onVolver: () => void
}) {
  const agotado = evento.cupoDisponible <= 0

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">¿Quién asiste?</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          No necesitas crear una cuenta. Enviaremos tu boleto con código QR al correo que registres.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label="Nombre completo *">
          <input
            required
            value={datos.nombre}
            onChange={(e) => onChange({ ...datos, nombre: e.target.value })}
            className="w-full bg-transparent text-sm text-foreground outline-none"
          />
        </Campo>
        <Campo label="Teléfono *">
          <input
            required
            type="tel"
            value={datos.telefono}
            onChange={(e) => onChange({ ...datos, telefono: e.target.value })}
            className="w-full bg-transparent text-sm text-foreground outline-none"
          />
        </Campo>
        <Campo label="Correo electrónico *">
          <input
            required
            type="email"
            value={datos.email}
            onChange={(e) => onChange({ ...datos, email: e.target.value })}
            className="w-full bg-transparent text-sm text-foreground outline-none"
          />
        </Campo>
        <Campo label="Número de asistentes *">
          <input
            required
            type="number"
            min={1}
            max={evento.cupoDisponible}
            disabled={agotado}
            value={datos.asistentes}
            onChange={(e) =>
              onChange({
                ...datos,
                asistentes: Math.min(evento.cupoDisponible, Math.max(1, Number(e.target.value))),
              })
            }
            className="w-full bg-transparent text-sm text-foreground outline-none disabled:opacity-60"
          />
        </Campo>
      </div>

      {agotado ? (
        <div className="flex items-start gap-3 rounded-xl border border-naranja-200 bg-naranja-50 p-4">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-naranja-700" />
          <div>
            <p className="text-sm font-semibold text-naranja-700">Sin lugares disponibles</p>
            <p className="text-sm text-naranja-700/90">
              Este evento se agotó mientras completabas tus datos. No podemos continuar con la
              reservación — vuelve a la lista de eventos para ver otras opciones.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-xl border border-border bg-muted p-4">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-salvia-600" />
          <div>
            <p className="text-sm font-semibold">Cupo confirmado</p>
            <p className="text-sm text-muted-foreground">
              Quedan {evento.cupoDisponible} lugares para este evento. Tu reservación se aparta al
              completar el pago.
            </p>
          </div>
        </div>
      )}

      <label className="flex items-start gap-2.5 text-sm text-muted-foreground">
        <input required type="checkbox" className="mt-0.5 size-4 accent-primary" />
        Acepto la política de cancelación y el aviso de privacidad de Amena.
      </label>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onVolver}
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-secondary/60"
        >
          <ArrowLeft className="size-4" />
          Volver
        </button>
        <button
          type="submit"
          disabled={agotado}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-naranja-600 disabled:opacity-60"
        >
          Continuar al pago
          <ArrowRight className="size-4" />
        </button>
      </div>
    </form>
  )
}

// Tarjetas de prueba del sandbox de SinergyPay (flujo 3DS), vencimiento 12/2027, CVV 123:
//   4000000000002701 (Visa) / 5200000000002235 (Mastercard) → frictionless, sin OTP
//   4000000000002503 (Visa) / 5200000000002151 (Mastercard) → requiere OTP/3DS

const CLAVE_SINERGYPAY = import.meta.env.VITE_SINERGYPAY_PUBLIC_KEY

/**
 * Modo local sin pasarela. Sin llave pública no se puede abrir la sesión 3DS, y en desarrollo
 * eso NO es un error: es la contraparte en el navegador de SINERGYPAY_SALTAR_COBRO=1 en
 * `amena-backend`, donde `reservar-pago` ignora el sessionId y reserva sin cobrar.
 *
 * La guarda es `import.meta.env.DEV`, que Vite deja en `false` en cualquier build. En
 * producción, una llave faltante sigue siendo un error visible (el aviso de sdkError) en vez de
 * un formulario que reserva sin cobrar.
 */
const SIN_PASARELA_LOCAL = import.meta.env.DEV && !CLAVE_SINERGYPAY

const TARJETA_INICIAL: DatosTarjeta = { cardholder: '', cardNumber: '', expiryMonth: '', expiryYear: '', cvv: '' }

const DOMICILIO_INICIAL: DomicilioFacturacion = {
  street: 'Av. Vallarta',
  outerNumber: '1234',
  neighborhood: 'Col. Americana',
  city: 'Guadalajara',
  zipCode: '44160',
  state: 'Jalisco',
  country: 'MEX',
}

function PagoStep({
  evento,
  datos,
  total,
  onAtras,
  onExito,
}: {
  evento: Evento
  datos: Datos
  total: number
  onAtras: () => void
  onExito: (folio: string, ultimosDigitos: string) => void
}) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sdkError, setSdkError] = useState(false)
  const [tarjeta, setTarjeta] = useState<DatosTarjeta>({ ...TARJETA_INICIAL, cardholder: datos.nombre.toUpperCase() })
  const [domicilio, setDomicilio] = useState<DomicilioFacturacion>(DOMICILIO_INICIAL)
  const [procesando, setProcesando] = useState(false)
  const [rechazado, setRechazado] = useState(false)
  const [sinCupo, setSinCupo] = useState(false)
  const [pendienteOtp, setPendienteOtp] = useState<{ folio: string; otpData: SinergyPayOtpData } | null>(null)

  useEffect(() => {
    if (SIN_PASARELA_LOCAL) {
      // Ni se carga el SDK: el sessionId solo viaja hasta reservar-pago, que en modo local lo
      // ignora. Sirve de sessionId cualquier cosa que no sea vacío para desbloquear el submit.
      setSessionId('local-sin-cobro')
      return
    }
    let cancelado = false
    iniciarSesionSinergyPay3ds(CLAVE_SINERGYPAY)
      .then((id) => {
        if (!cancelado) setSessionId(id)
      })
      .catch(() => {
        if (!cancelado) setSdkError(true)
      })
    return () => {
      cancelado = true
    }
  }, [])

  async function alEnviar(e: FormEvent) {
    e.preventDefault()
    if (!sessionId) return
    setRechazado(false)
    setSinCupo(false)
    setProcesando(true)

    const folioNuevo = generarFolio(evento.anio)
    try {
      const resultado = await autorizarPago({
        folio: folioNuevo,
        eventoId: evento.id,
        nombre: datos.nombre,
        email: datos.email,
        telefono: datos.telefono || undefined,
        personas: datos.asistentes,
        sessionId,
        tarjeta,
        domicilio,
      })
      setProcesando(false)
      if (resultado.status === 'success') {
        onExito(resultado.folio, tarjeta.cardNumber.slice(-4))
      } else {
        setPendienteOtp({ folio: folioNuevo, otpData: resultado.otpData })
      }
    } catch (err) {
      setProcesando(false)
      if (err instanceof Error && err.message.includes('CUPO_INSUFICIENTE')) {
        setSinCupo(true)
      } else {
        setRechazado(true)
      }
    }
  }

  const alTerminarOtp = useCallback(async () => {
    if (!pendienteOtp) return
    setProcesando(true)
    try {
      const resultado = await confirmarPago({
        folio: pendienteOtp.folio,
        eventoId: evento.id,
        nombre: datos.nombre,
        email: datos.email,
        telefono: datos.telefono || undefined,
        personas: datos.asistentes,
        sessionId: pendienteOtp.otpData.sessionId,
        tarjeta,
        domicilio,
      })
      setProcesando(false)
      setPendienteOtp(null)
      if (resultado.status === 'success') {
        onExito(resultado.folio, tarjeta.cardNumber.slice(-4))
      } else {
        setRechazado(true)
      }
    } catch (err) {
      setProcesando(false)
      setPendienteOtp(null)
      if (err instanceof Error && err.message.includes('CUPO_INSUFICIENTE')) {
        setSinCupo(true)
      } else {
        setRechazado(true)
      }
    }
  }, [pendienteOtp, evento, datos, tarjeta, domicilio])

  return (
    <form onSubmit={alEnviar} className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Datos de pago</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Tu pago se procesa de forma segura con Synergy Pay usando verificación 3D Secure.
        </p>
      </div>

      {rechazado && (
        <div className="flex items-start gap-3 rounded-xl border border-naranja-200 bg-naranja-50 p-4">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-naranja-700" />
          <div>
            <p className="text-sm font-semibold text-naranja-700">El pago no pudo procesarse</p>
            <p className="text-sm text-naranja-700/90">
              Synergy Pay rechazó la tarjeta o hubo un error al procesar el pago. No se realizó
              ningún cargo y tu lugar sigue disponible por 10 minutos.
            </p>
          </div>
        </div>
      )}

      {sinCupo && (
        <div className="flex items-start gap-3 rounded-xl border border-naranja-200 bg-naranja-50 p-4">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-naranja-700" />
          <div>
            <p className="text-sm font-semibold text-naranja-700">Ya no hay lugares suficientes</p>
            <p className="text-sm text-naranja-700/90">
              Alguien más reservó mientras completabas tus datos. No se realizó ningún cargo a tu
              tarjeta — vuelve al paso anterior para ver el cupo actualizado.
            </p>
          </div>
        </div>
      )}

      {SIN_PASARELA_LOCAL && (
        <div className="flex items-start gap-3 rounded-xl border border-salvia-200 bg-salvia-50 p-4">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-salvia-700" />
          <div>
            <p className="text-sm font-semibold text-salvia-700">Modo local: no se va a cobrar</p>
            <p className="text-sm text-salvia-700/90">
              No hay llave de Synergy Pay en <span className="font-mono">.env.local</span>, así
              que la reservación se crea sin pasar por la pasarela. Los datos de tarjeta de abajo
              se guardan solo como los últimos 4 dígitos.
            </p>
          </div>
        </div>
      )}

      {sdkError && (
        <div className="flex items-start gap-3 rounded-xl border border-naranja-200 bg-naranja-50 p-4">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-naranja-700" />
          <p className="text-sm text-naranja-700/90">
            No pudimos iniciar la sesión de pago de Synergy Pay. Revisa tu conexión y recarga la
            página.
          </p>
        </div>
      )}

      <div className="flex gap-3 text-xs font-semibold text-muted-foreground">
        <span>VISA</span>
        <span>MASTERCARD</span>
        <span>AMEX</span>
      </div>

      {procesando ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-muted p-8 text-center">
          <p className="text-sm font-medium">Procesando tu pago…</p>
          <p className="text-xs text-muted-foreground">No cierres ni recargues esta página.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-4">
            <p className="text-sm font-semibold">Datos de la tarjeta</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo label="Nombre del titular *">
                <input
                  required
                  value={tarjeta.cardholder}
                  onChange={(e) => setTarjeta({ ...tarjeta, cardholder: e.target.value })}
                  className="w-full bg-transparent text-sm text-foreground outline-none"
                />
              </Campo>
              <Campo label="Número de tarjeta *">
                <input
                  required
                  inputMode="numeric"
                  maxLength={19}
                  value={tarjeta.cardNumber}
                  onChange={(e) => setTarjeta({ ...tarjeta, cardNumber: e.target.value.replace(/\D/g, '') })}
                  className="w-full bg-transparent font-mono text-sm text-foreground outline-none"
                />
              </Campo>
              <Campo label="Mes de expiración (MM) *">
                <input
                  required
                  inputMode="numeric"
                  maxLength={2}
                  value={tarjeta.expiryMonth}
                  onChange={(e) => setTarjeta({ ...tarjeta, expiryMonth: e.target.value.replace(/\D/g, '') })}
                  className="w-full bg-transparent font-mono text-sm text-foreground outline-none"
                />
              </Campo>
              <Campo label="Año de expiración (AAAA) *">
                <input
                  required
                  inputMode="numeric"
                  maxLength={4}
                  value={tarjeta.expiryYear}
                  onChange={(e) => setTarjeta({ ...tarjeta, expiryYear: e.target.value.replace(/\D/g, '') })}
                  className="w-full bg-transparent font-mono text-sm text-foreground outline-none"
                />
              </Campo>
              <Campo label="CVV *">
                <input
                  required
                  inputMode="numeric"
                  maxLength={4}
                  value={tarjeta.cvv}
                  onChange={(e) => setTarjeta({ ...tarjeta, cvv: e.target.value.replace(/\D/g, '') })}
                  className="w-full bg-transparent font-mono text-sm text-foreground outline-none"
                />
              </Campo>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <p className="text-sm font-semibold">Domicilio de facturación</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo label="Calle *">
                <input
                  required
                  value={domicilio.street}
                  onChange={(e) => setDomicilio({ ...domicilio, street: e.target.value })}
                  className="w-full bg-transparent text-sm text-foreground outline-none"
                />
              </Campo>
              <Campo label="Número exterior *">
                <input
                  required
                  value={domicilio.outerNumber}
                  onChange={(e) => setDomicilio({ ...domicilio, outerNumber: e.target.value })}
                  className="w-full bg-transparent text-sm text-foreground outline-none"
                />
              </Campo>
              <Campo label="Colonia *">
                <input
                  required
                  value={domicilio.neighborhood}
                  onChange={(e) => setDomicilio({ ...domicilio, neighborhood: e.target.value })}
                  className="w-full bg-transparent text-sm text-foreground outline-none"
                />
              </Campo>
              <Campo label="Ciudad *">
                <input
                  required
                  value={domicilio.city}
                  onChange={(e) => setDomicilio({ ...domicilio, city: e.target.value })}
                  className="w-full bg-transparent text-sm text-foreground outline-none"
                />
              </Campo>
              <Campo label="Código postal *">
                <input
                  required
                  inputMode="numeric"
                  maxLength={5}
                  value={domicilio.zipCode}
                  onChange={(e) => setDomicilio({ ...domicilio, zipCode: e.target.value.replace(/\D/g, '') })}
                  className="w-full bg-transparent font-mono text-sm text-foreground outline-none"
                />
              </Campo>
              <Campo label="Estado *">
                <input
                  required
                  value={domicilio.state}
                  onChange={(e) => setDomicilio({ ...domicilio, state: e.target.value })}
                  className="w-full bg-transparent text-sm text-foreground outline-none"
                />
              </Campo>
              <Campo label="País *">
                <input
                  required
                  maxLength={3}
                  value={domicilio.country}
                  onChange={(e) => setDomicilio({ ...domicilio, country: e.target.value.toUpperCase() })}
                  className="w-full bg-transparent text-sm uppercase text-foreground outline-none"
                />
              </Campo>
            </div>
          </div>
        </div>
      )}

      {/* <div className="flex items-start gap-3 rounded-xl border border-border bg-muted p-4">
        <CreditCard className="mt-0.5 size-4 shrink-0 text-salvia-600" />
        <div>
          <p className="text-sm font-semibold">Pago seguro</p>
          <p className="text-sm text-muted-foreground">
            La llave privada de Synergy Pay vive solo en la Edge Function; tus datos viajan
            cifrados por HTTPS.
          </p>
        </div>
      </div> */}

      {rechazado && (
        <p className="text-sm text-muted-foreground">
          ¿Sigue fallando? Escríbenos por WhatsApp al 33 1284 9077 y apartamos tu lugar manualmente.
        </p>
      )}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onAtras}
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-secondary/60"
        >
          <ArrowLeft className="size-4" />
          Atrás
        </button>
        <button
          type="submit"
          disabled={!sessionId || procesando}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-naranja-600 disabled:opacity-60"
        >
          Pagar ${total.toLocaleString('es-MX')} MXN
        </button>
      </div>

      {pendienteOtp && (
        <OtpModal otpData={pendienteOtp.otpData} onResultado={alTerminarOtp} onCancelar={() => setPendienteOtp(null)} />
      )}
    </form>
  )
}

function OtpModal({
  otpData,
  onResultado,
  onCancelar,
}: {
  otpData: SinergyPayOtpData
  onResultado: () => void
  onCancelar: () => void
}) {
  const contenedorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const contenedor = contenedorRef.current
    if (!contenedor) return
    contenedor.innerHTML = ''
    montarVerificacionSinergyPay3ds(otpData, contenedor, onResultado)
    return () => {
      contenedor.innerHTML = ''
    }
  }, [otpData, onResultado])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-tinta-900/60 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Verificación de tu banco</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Tu banco requiere un paso adicional para confirmar el pago. Sigue las instrucciones.
        </p>
        <div ref={contenedorRef} className="mt-4 min-h-[240px]" />
        <button
          type="button"
          onClick={onCancelar}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-secondary/60"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

function ExitoStep({
  evento,
  datos,
  ultimosDigitos,
  folio,
}: {
  evento: Evento
  datos: Datos
  ultimosDigitos: string
  folio: string
}) {
  const navigate = useNavigate()
  const total = evento.precio * datos.asistentes
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [agregandoWallet, setAgregandoWallet] = useState(false)
  const [errorWallet, setErrorWallet] = useState<string | null>(null)

  useEffect(() => {
    generarQrDataUrl(folio).then(setQrDataUrl)
  }, [folio])

  function verBoleto() {
    // La forma de este state es `BoletoRecuperado`: es el mismo contrato que devuelve la RPC
    // cuando el boleto se recupera en frío, para que /boleto/:folio pinte igual por los dos
    // caminos. Recién pagado siempre es 'pagada' / 'sin usar' — crear_reservacion lo garantiza.
    navigate(`/boleto/${folio}`, {
      state: {
        evento,
        datos,
        folio,
        total,
        ultimosDigitos,
        fechaCompra: new Date().toISOString(),
        estadoPago: 'pagada',
        estadoBoleto: 'sin usar',
      } satisfies BoletoRecuperado,
    })
  }

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

  return (
    <div className="mt-8 flex flex-col items-center gap-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-salvia-100 text-salvia-700">
          <Check className="size-7" />
        </span>
        <h1 className="text-2xl font-bold">¡Pago confirmado!</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Tu lugar quedó apartado. Enviamos el boleto con código QR a {datos.email || 'tu correo'} —
          preséntalo en la entrada el día del evento.
        </p>
        <span className="rounded-full bg-secondary px-3 py-1 font-mono text-xs font-semibold">
          FOLIO {folio}
        </span>
      </div>

      <div className="grid w-full max-w-2xl gap-0 overflow-hidden rounded-2xl border border-border bg-card sm:grid-cols-[1fr_180px]">
        <div className="flex flex-col gap-2 p-6">
          <span className="w-fit rounded-full bg-salvia-100 px-2.5 py-1 text-xs font-semibold text-salvia-700">
            PAGADA
          </span>
          <h2 className="text-lg font-semibold">{evento.titulo}</h2>
          <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <BoletoDato etiqueta="Fecha" valor={evento.fechaLarga} />
            <BoletoDato etiqueta="Hora" valor={evento.horario} />
            <BoletoDato etiqueta="Asistente" valor={datos.nombre || '—'} />
            <BoletoDato etiqueta="Personas" valor={String(datos.asistentes)} />
          </dl>
        </div>
        <div className="flex flex-col items-center justify-center gap-2 border-t border-border bg-tinta-900 p-6 sm:border-l sm:border-t-0">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt={`Código QR del boleto ${folio}`} className="size-24 rounded-lg bg-crema-50 p-2" />
          ) : (
            <div className="flex size-24 items-center justify-center rounded-lg bg-crema-50 p-2 text-center font-mono text-[10px] font-bold leading-tight text-tinta-900">
              {folio}
            </div>
          )}
          <span className="text-center text-[11px] text-crema-100">Escanea en la entrada</span>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={verBoleto}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-naranja-600"
        >
          Descargar boleto en PDF
        </button>
        <button
          type="button"
          onClick={agregarAGoogleWallet}
          disabled={agregandoWallet}
          className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-secondary/60 disabled:opacity-60"
        >
          {agregandoWallet ? 'Agregando…' : 'Agregar a Google Wallet'}
        </button>
        <Link
          to="/eventos"
          className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-secondary/60"
        >
          Ver más eventos
        </Link>
      </div>
      {errorWallet && <p className="max-w-sm text-center text-sm text-naranja-700">{errorWallet}</p>}

      <div className="flex w-full max-w-2xl items-center justify-between gap-4 rounded-2xl border border-border bg-muted p-5">
        <div>
          <p className="text-sm font-semibold">¿Deseas facturar esta compra?</p>
          <p className="text-sm text-muted-foreground">Emitimos tu CFDI 4.0 con tus datos ya prellenados.</p>
        </div>
        <Link
          to="/facturar"
          className="shrink-0 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-secondary/60"
        >
          Facturar ahora
        </Link>
      </div>
      <p className="text-xs text-muted-foreground">Total pagado: ${total.toLocaleString('es-MX')} MXN</p>
    </div>
  )
}

function BoletoDato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {etiqueta}
      </dt>
      <dd className="text-foreground">{valor}</dd>
    </div>
  )
}

function ResumenCard({
  evento,
  asistentes,
  total,
}: {
  evento: Evento
  asistentes: number
  total: number
}) {
  return (
    <div className="flex h-fit flex-col gap-4 rounded-2xl border border-border bg-card p-5">
      <h2 className="font-semibold">Resumen de tu reservación</h2>
      <div>
        <p className="font-medium">{evento.titulo}</p>
        <p className="text-sm text-muted-foreground">
          {evento.fechaBadge} · {evento.lugar}
        </p>
      </div>
      <hr className="border-border" />
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Boletos ({asistentes} × ${evento.precio.toLocaleString('es-MX')})
        </span>
        <span>${total.toLocaleString('es-MX')}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Cargo por servicio</span>
        <span>$0.00</span>
      </div>
      <hr className="border-border" />
      <div className="flex items-center justify-between font-semibold">
        <span>Total</span>
        <span>${total.toLocaleString('es-MX')} MXN</span>
      </div>
      <p className="text-xs text-muted-foreground">
        El cobro se procesa con Synergy Pay usando verificación 3D Secure. Amena no almacena los
        datos de tu tarjeta.
      </p>
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
          <span className="rounded-lg bg-secondary/80 px-2.5 py-1.5 text-sm font-medium text-foreground">
            Eventos
          </span>
          <Link
            to="/facturar"
            className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Facturar
          </Link>
        </nav>
      </div>
    </header>
  )
}
