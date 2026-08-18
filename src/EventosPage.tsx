import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronLeft, ChevronRight, Users } from 'lucide-react'
import { cn } from './lib/utils'
import { LogotipoAmena } from './components/logotipo-amena'
import { listEventosPublicados, type Categoria, type Evento } from './data/eventos'

const CHIPS: { label: string; value: Categoria | 'Todos' }[] = [
  { label: 'Todos', value: 'Todos' },
  { label: 'Catas', value: 'Cata' },
  { label: 'Talleres', value: 'Taller' },
  { label: 'Cenas', value: 'Cena' },
]

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]
const DIAS_SEMANA = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM']

export function EventosPage() {
  const [eventos, setEventos] = useState<Evento[] | null>(null)
  const [vista, setVista] = useState<'listado' | 'calendario'>('listado')
  const [categoria, setCategoria] = useState<Categoria | 'Todos'>('Todos')
  const [mesActual, setMesActual] = useState(() => new Date(2026, 7, 1))

  useEffect(() => {
    listEventosPublicados().then(setEventos)
  }, [])

  const eventosFiltrados = useMemo(() => {
    if (!eventos) return []
    return categoria === 'Todos' ? eventos : eventos.filter((e) => e.categoria === categoria)
  }, [eventos, categoria])
  const totalLugares = useMemo(
    () => (eventos ?? []).reduce((sum, e) => sum + e.cupoDisponible, 0),
    [eventos]
  )

  if (!eventos) {
    return (
      <div className="min-h-dvh bg-background text-foreground">
        <Header />
        <main className="mx-auto flex w-full max-w-6xl justify-center px-5 py-24 text-sm text-muted-foreground sm:px-8">
          Cargando eventos…
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Header />
      <main className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <Hero totalEventos={eventos.length} totalLugares={totalLugares} />
        <Toolbar
          vista={vista}
          onVista={setVista}
          categoria={categoria}
          onCategoria={setCategoria}
        />
        {vista === 'listado' ? (
          <Grid eventos={eventosFiltrados} />
        ) : (
          <Calendario eventos={eventosFiltrados} mes={mesActual} onMes={setMesActual} />
        )}
      </main>
      <Pie />
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

function Hero({ totalEventos, totalLugares }: { totalEventos: number; totalLugares: number }) {
  return (
    <section className="flex flex-col gap-8 border-b border-border pb-10 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-xl">
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-naranja-700">
          Eventos
        </span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl lg:text-[44px]">
          Catas, talleres y cenas en la mesa de Amena
        </h1>
        <p className="mt-4 text-pretty text-muted-foreground">
          Un calendario abierto al público: vinos mexicanos, métodos de café, cerveza artesanal
          y menús de temporada. Reserva tu lugar en dos minutos.
        </p>
      </div>
      <div className="flex items-end gap-10">
        <StatBlock valor={totalEventos} etiqueta="eventos próximos" />
        <StatBlock valor={totalLugares} etiqueta="lugares disponibles" />
        {/* <StatBlock valor="4.9" etiqueta="calificación" /> */}
      </div>
    </section>
  )
}

function StatBlock({ valor, etiqueta }: { valor: number | string; etiqueta: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-sans text-3xl font-bold">{valor}</span>
      <span className="text-sm text-muted-foreground">{etiqueta}</span>
    </div>
  )
}

function Toolbar({
  vista,
  onVista,
  categoria,
  onCategoria,
}: {
  vista: 'listado' | 'calendario'
  onVista: (v: 'listado' | 'calendario') => void
  categoria: Categoria | 'Todos'
  onCategoria: (c: Categoria | 'Todos') => void
}) {
  return (
    <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="inline-flex w-fit rounded-lg border border-border bg-card p-1">
        {(['listado', 'calendario'] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onVista(v)}
            className={cn(
              'rounded-md px-3.5 py-1.5 text-sm font-medium capitalize transition-colors',
              vista === v
                ? 'bg-secondary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {v}
          </button>
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CHIPS.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => onCategoria(c.value)}
            className={cn(
              'shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
              categoria === c.value
                ? 'border-primary bg-naranja-50 text-naranja-700'
                : 'border-border text-muted-foreground hover:text-foreground'
            )}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function Grid({ eventos }: { eventos: Evento[] }) {
  if (eventos.length === 0) {
    return (
      <p className="mt-10 text-center text-sm text-muted-foreground">
        No hay eventos en esta categoría por ahora.
      </p>
    )
  }
  return (
    <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {eventos.map((e) => (
        <EventoCard key={e.slug} evento={e} />
      ))}
    </div>
  )
}

function EventoCard({ evento }: { evento: Evento }) {
  return (
    <Link
      to={`/eventos/${evento.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-md"
    >
      <div className="relative h-44 w-full overflow-hidden bg-crema-200">
        <img
          src={evento.imagenUrl}
          alt={evento.titulo}
          loading="lazy"
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <span className="absolute bottom-3 left-3 rounded-full bg-tinta-900/80 px-2.5 py-1.5 font-mono text-[11px] font-medium tracking-wide text-crema-50">
          {evento.fechaBadge}
        </span>
      </div>
      <div className="flex flex-col gap-2 p-4">
        <h3 className="font-sans text-lg font-semibold leading-snug">{evento.titulo}</h3>
        <p className="text-sm text-muted-foreground">{evento.descripcionCorta}</p>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-base font-semibold text-naranja-700">{evento.precioLabel}</span>
          <span className="flex items-center gap-1.5 text-sm font-medium text-salvia-700">
            <Users className="size-3.5" />
            {evento.cupoDisponible} lugares
          </span>
        </div>
      </div>
    </Link>
  )
}

function Calendario({
  eventos,
  mes,
  onMes,
}: {
  eventos: Evento[]
  mes: Date
  onMes: (d: Date) => void
}) {
  const anio = mes.getFullYear()
  const mesIdx = mes.getMonth()

  const eventosDelMes = useMemo(
    () => eventos.filter((e) => e.anio === anio && e.mes === mesIdx),
    [eventos, anio, mesIdx]
  )

  const semanas = useMemo(() => {
    const primerDia = new Date(anio, mesIdx, 1)
    const offset = (primerDia.getDay() + 6) % 7
    const inicio = new Date(anio, mesIdx, 1 - offset)
    const celdas = Array.from({ length: 42 }, (_, i) => {
      const fecha = new Date(inicio)
      fecha.setDate(inicio.getDate() + i)
      const eventosDia = eventos.filter(
        (e) => e.anio === fecha.getFullYear() && e.mes === fecha.getMonth() && e.dia === fecha.getDate()
      )
      return { fecha, eventosDia, delMesActual: fecha.getMonth() === mesIdx }
    })
    return Array.from({ length: 6 }, (_, s) => celdas.slice(s * 7, s * 7 + 7))
  }, [anio, mesIdx, eventos])

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-3.5">
          <h2 className="text-2xl font-bold">
            {MESES[mesIdx][0].toUpperCase() + MESES[mesIdx].slice(1)} {anio}
          </h2>
          <span className="text-sm text-muted-foreground">
            {eventosDelMes.length} evento{eventosDelMes.length === 1 ? '' : 's'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Mes anterior"
            onClick={() => onMes(new Date(anio, mesIdx - 1, 1))}
            className="flex size-9 items-center justify-center rounded-lg border border-border bg-card hover:bg-secondary/60"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Mes siguiente"
            onClick={() => onMes(new Date(anio, mesIdx + 1, 1))}
            className="flex size-9 items-center justify-center rounded-lg border border-border bg-card hover:bg-secondary/60"
          >
            <ChevronRight className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onMes(new Date())}
            className="rounded-lg border border-border bg-card px-3.5 py-2 text-sm font-medium hover:bg-secondary/60"
          >
            Hoy
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-7 gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {DIAS_SEMANA.map((d) => (
          <div key={d} className="px-1 pb-1 text-center">
            {d}
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        {semanas.map((semana, i) => (
          <div key={i} className="grid grid-cols-7 gap-2">
            {semana.map(({ fecha, eventosDia, delMesActual }) => (
              <div
                key={fecha.toISOString()}
                className={cn(
                  'flex min-h-24 flex-col gap-1.5 rounded-lg border border-border p-2 sm:min-h-28',
                  delMesActual ? 'bg-card' : 'bg-muted'
                )}
              >
                <span
                  className={cn(
                    'text-xs font-medium',
                    delMesActual ? 'text-muted-foreground' : 'text-border'
                  )}
                >
                  {fecha.getDate()}
                </span>
                {eventosDia.map((e) => (
                  <Link
                    key={e.slug}
                    to={`/eventos/${e.slug}`}
                    className="truncate rounded-md bg-naranja-100 px-1.5 py-1 text-[11px] font-medium text-naranja-700 hover:bg-naranja-200"
                  >
                    {e.titulo}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function Pie() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <Link to="/" className="flex items-center gap-2 hover:text-foreground" aria-label="Amena — inicio">
          <LogotipoAmena className="h-4 w-auto text-muted-foreground" aria-hidden />
          <span>Restaurante · Sabores reales, momentos reales.</span>
        </Link>
        <Link to="/eventos" className="flex items-center gap-1.5 hover:text-foreground">
          Ver todos los eventos
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </footer>
  )
}
