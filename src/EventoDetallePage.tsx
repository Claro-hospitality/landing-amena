import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, CalendarDays, Check, Clock, MapPin, Users } from 'lucide-react'
import { cn } from './lib/utils'
import { LogotipoAmena } from './components/logotipo-amena'
import { getEventoBySlug, type Evento } from './data/eventos'

export function EventoDetallePage() {
  const { slug } = useParams()
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'no-encontrado'>('cargando')
  const [evento, setEvento] = useState<Evento | undefined>(undefined)
  const [asistentes, setAsistentes] = useState(1)

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
          <p className="text-muted-foreground">
            Puede que ya haya pasado o que el enlace esté incompleto.
          </p>
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

  const total = evento.precio * asistentes
  const agotado = evento.cupoDisponible <= 0
  const cupoPct = evento.cupoTotal
    ? Math.round((evento.cupoDisponible / evento.cupoTotal) * 100)
    : undefined

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Header />
      <main className="mx-auto w-full max-w-6xl px-5 pb-28 pt-8 sm:px-8 sm:pb-16">
        <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
          <Link to="/eventos" className="hover:text-foreground">
            Eventos
          </Link>
          <span aria-hidden>/</span>
          <span className="text-foreground">{evento.titulo}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
          <div>
            <img
              src={evento.imagenUrl}
              alt={evento.titulo}
              className="aspect-[16/9] w-full rounded-2xl border border-border object-cover"
            />

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-naranja-100 px-3 py-1 text-xs font-semibold text-naranja-700">
                {evento.categoria}
              </span>
              <span
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
                  agotado ? 'bg-naranja-100 text-naranja-700' : 'bg-salvia-100 text-salvia-700'
                )}
              >
                <Users className="size-3" />
                {agotado
                  ? 'Agotado'
                  : evento.cupoTotal
                    ? `${evento.cupoDisponible} de ${evento.cupoTotal} lugares disponibles`
                    : `${evento.cupoDisponible} lugares disponibles`}
              </span>
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              {evento.titulo}
            </h1>

            <div className="mt-5 flex flex-col gap-2.5">
              <MetaRow icon={CalendarDays}>{evento.fechaLarga}</MetaRow>
              <MetaRow icon={Clock}>{evento.horario}</MetaRow>
              <MetaRow icon={MapPin}>{evento.lugar}</MetaRow>
            </div>

            <hr className="my-6 border-border" />

            <div className="flex flex-col gap-4 text-pretty text-muted-foreground">
              {(evento.descripcionLarga ?? [evento.descripcionCorta]).map((p, i) => (
                <p key={i} className="leading-relaxed">
                  {p}
                </p>
              ))}
            </div>

            {evento.incluye && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold">Qué incluye</h2>
                <ul className="mt-3 flex flex-col gap-2.5">
                  {evento.incluye.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-foreground">
                      <Check className="mt-0.5 size-4 shrink-0 text-salvia-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="hidden lg:block">
            <div className="sticky top-24 flex flex-col gap-4">
              <ReservaCard
                evento={evento}
                asistentes={asistentes}
                onAsistentesChange={setAsistentes}
                total={total}
                cupoPct={cupoPct}
                agotado={agotado}
              />
              <div className="rounded-2xl bg-muted p-4">
                <h3 className="text-sm font-semibold">Política de cancelación</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Sin costo hasta 48 h antes. Después puedes transferir tu lugar a otra persona.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between border-t border-border bg-card px-5 py-4 lg:hidden">
        <div className="flex flex-col leading-tight">
          <span className="text-lg font-bold">{evento.precioLabel.split(' / ')[0]}</span>
          <span className="text-xs text-muted-foreground">MXN / persona</span>
        </div>
        {agotado ? (
          <span className="flex items-center gap-2 rounded-xl bg-secondary px-5 py-3 text-sm font-semibold text-muted-foreground">
            Sin cupo disponible
          </span>
        ) : (
          <Link
            to={`/eventos/${evento.slug}/reservar`}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
          >
            Reservar lugar
            <ArrowRight className="size-4" />
          </Link>
        )}
      </div>
    </div>
  )
}

function MetaRow({ icon: Icon, children }: { icon: typeof CalendarDays; children: string }) {
  return (
    <div className="flex items-center gap-2.5 text-sm text-tinta-700">
      <Icon className="size-4 shrink-0 text-naranja-600" />
      <span>{children}</span>
    </div>
  )
}

function ReservaCard({
  evento,
  asistentes,
  onAsistentesChange,
  total,
  cupoPct,
  agotado,
}: {
  evento: { slug: string; precioLabel: string; cupoDisponible: number; cupoTotal?: number }
  asistentes: number
  onAsistentesChange: (n: number) => void
  total: number
  cupoPct?: number
  agotado: boolean
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-baseline justify-between">
        <span className="text-2xl font-bold">{evento.precioLabel.split(' / ')[0]}</span>
        <span className="text-sm text-muted-foreground">MXN / persona</span>
      </div>

      {cupoPct !== undefined && (
        <div className="mt-4">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-salvia-500" style={{ width: `${100 - cupoPct}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {evento.cupoDisponible} de {evento.cupoTotal} lugares disponibles
          </p>
        </div>
      )}

      {agotado ? (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-naranja-200 bg-naranja-50 p-4">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-naranja-700" />
          <div>
            <p className="text-sm font-semibold text-naranja-700">Sin lugares disponibles</p>
            <p className="text-sm text-naranja-700/90">
              Este evento se agotó. Escríbenos a hola@amena.mx para avisarte si se libera un lugar.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-4 flex items-center justify-between rounded-xl border border-border px-3.5 py-2.5">
            <span className="text-sm font-medium">Número de asistentes</span>
            <input
              type="number"
              min={1}
              max={evento.cupoDisponible}
              value={asistentes}
              onChange={(e) =>
                onAsistentesChange(
                  Math.min(evento.cupoDisponible, Math.max(1, Number(e.target.value) || 1))
                )
              }
              className="w-14 rounded-md border border-border bg-transparent text-right font-mono text-sm font-semibold text-foreground outline-none"
            />
          </div>

          <hr className="my-4 border-border" />

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {evento.precioLabel.split(' / ')[0]} × {asistentes} asistentes
            </span>
            <span className="font-medium">${total.toLocaleString('es-MX')}</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="font-semibold">Total</span>
            <span className="font-semibold">${total.toLocaleString('es-MX')} MXN</span>
          </div>

          <Link
            to={`/eventos/${evento.slug}/reservar`}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-naranja-600"
          >
            Reservar lugar
            <ArrowRight className="size-4" />
          </Link>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Pago seguro con Synergy Pay
          </p>
        </>
      )}
    </div>
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
            to="/menu"
            className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Menú
          </Link>
          <span className={cn('rounded-lg bg-secondary/80 px-2.5 py-1.5 text-sm font-medium text-foreground')}>
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
