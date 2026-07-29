import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from './lib/utils'
import { LogotipoAmena } from './components/logotipo-amena'

/* ---------------- Imágenes (public/imagenes) ---------------- */
// Nombradas por orientación: h- horizontal, v- vertical.
const ESPACIOS_H = [
  '/imagenes/h-espacio-3.jpg',
  '/imagenes/h-espacio-1.jpg',
  '/imagenes/h-espacio-5.jpg',
  '/imagenes/h-espacio-2.jpg',
  '/imagenes/h-espacio-4.jpg',
]
const ALIMENTOS_V = [
  '/imagenes/v-alimento-1.jpg',
  '/imagenes/v-alimento-2.jpg',
  '/imagenes/v-alimento-3.jpg',
  '/imagenes/v-alimento-4.jpg',
  '/imagenes/v-alimento-5.jpg',
  '/imagenes/v-alimento-6.jpg',
  '/imagenes/v-alimento-7.jpg',
  '/imagenes/v-alimento-8.jpg',
]

/**
 * Página PÚBLICA que presenta qué es Amena. Redacción para público general. Diseño
 * visual con las fotos del comedor/platillos: hero con carrusel, galería y banners;
 * navbar de vidrio esmerilado. Responsive (móvil / tablet / escritorio). Solo lectura.
 */
export function PresentacionPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <BarraSuperior />
      <Hero />
      <main className="mx-auto w-full max-w-5xl px-5 sm:px-8">
        <QueEs />
        <ParaQue />
      </main>
      <ShowcaseAlimentos />
      <main className="mx-auto w-full max-w-5xl px-5 sm:px-8">
        <Publico />
        <ComoFunciona />
      </main>
      <BannerEspacio />
      <main className="mx-auto w-full max-w-5xl px-5 sm:px-8">
        <Administracion />
        <Confianza />
      </main>
      <Pie />
    </div>
  )
}

/* ---------------- Utilidades de animación ---------------- */

function usePrefiereMenosMovimiento() {
  const [reduce, setReduce] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setReduce(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduce
}

/** Carrusel de fondo con cross-fade automático (respeta prefers-reduced-motion). */
function Carrusel({ imagenes }: { imagenes: string[] }) {
  const [i, setI] = useState(0)
  const reduce = usePrefiereMenosMovimiento()
  useEffect(() => {
    if (reduce || imagenes.length <= 1) return
    const id = setInterval(() => setI((p) => (p + 1) % imagenes.length), 5500)
    return () => clearInterval(id)
  }, [reduce, imagenes.length])
  return (
    <div className="absolute inset-0 overflow-hidden bg-salvia-900" aria-hidden>
      {imagenes.map((src, idx) => (
        <img
          key={src}
          src={src}
          alt=""
          className={cn(
            'absolute inset-0 size-full object-cover transition-opacity duration-1000 ease-out motion-reduce:transition-none',
            idx === i ? 'opacity-100' : 'opacity-0'
          )}
          loading={idx === 0 ? 'eager' : 'lazy'}
        />
      ))}
    </div>
  )
}

/* ---------------- Navbar (liquid glass) ---------------- */

const TABS = [
  { id: 'que-es', label: 'Qué es' },
  { id: 'para-que', label: 'Para qué sirve' },
  { id: 'publico', label: 'Para quién' },
  { id: 'como-funciona', label: 'Cómo funciona' },
  { id: 'administracion', label: 'Cómo se administra' },
]

function BarraSuperior() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/50 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/45">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <LogotipoAmena className="h-5 w-auto text-primary" />
        <NavTabs />
      </div>
    </header>
  )
}

function NavTabs() {
  const [activo, setActivo] = useState(TABS[0].id)
  const refs = useRef<Record<string, HTMLAnchorElement | null>>({})
  const pastillaRef = useRef<HTMLSpanElement>(null)
  const reduce = usePrefiereMenosMovimiento()

  useLayoutEffect(() => {
    const medir = () => {
      const el = refs.current[activo]
      const pill = pastillaRef.current
      if (el && pill) {
        pill.style.left = `${el.offsetLeft}px`
        pill.style.width = `${el.offsetWidth}px`
        pill.style.opacity = '1'
      }
    }
    medir()
    window.addEventListener('resize', medir)
    return () => window.removeEventListener('resize', medir)
  }, [activo])

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]) setActivo(visible[0].target.id)
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: [0, 0.25, 0.5, 1] }
    )
    for (const t of TABS) {
      const s = document.getElementById(t.id)
      if (s) obs.observe(s)
    }
    return () => obs.disconnect()
  }, [])

  function ir(e: React.MouseEvent, id: string) {
    e.preventDefault()
    setActivo(id)
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }

  return (
    <nav className="relative hidden md:flex" aria-label="Secciones">
      <span
        ref={pastillaRef}
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-0 rounded-lg bg-secondary/80 opacity-0 transition-[left,width] duration-300 ease-out motion-reduce:transition-none"
      />
      {TABS.map((t) => (
        <a
          key={t.id}
          ref={(el) => {
            refs.current[t.id] = el
          }}
          href={`#${t.id}`}
          onClick={(e) => ir(e, t.id)}
          aria-current={activo === t.id ? 'true' : undefined}
          className={cn(
            'relative z-10 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-[color,transform] duration-150 active:scale-95',
            activo === t.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {t.label}
        </a>
      ))}
    </nav>
  )
}

/* ---------------- Hero (carrusel de espacios) ---------------- */

function Hero() {
  return (
    <section className="relative flex min-h-[88svh] items-center overflow-hidden">
      <Carrusel imagenes={ESPACIOS_H} />
      {/* Velo sólido para legibilidad del texto claro sobre las fotos. */}
      <div className="absolute inset-0 bg-tinta-900/55" aria-hidden />
      <div className="relative mx-auto w-full max-w-6xl px-5 py-24 sm:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-widest text-primary-foreground/90">
            Social Kitchen
          </p>
          <LogotipoAmena className="mt-5 h-16 w-auto text-primary-foreground sm:h-20" />
          <p className="mt-5 text-xl font-semibold tracking-tight text-primary-foreground text-balance sm:text-3xl">
            Comer en el trabajo, simple y bien organizado.
          </p>
          <p className="mt-4 max-w-xl text-pretty text-sm text-primary-foreground/85 sm:text-base">
            Amena es el servicio de comedor Social Kitchen y la plataforma que lo organiza: las
            empresas reservan las comidas de su equipo, se registran con un código QR y la cuenta
            queda clara para facturar. Sin vales, sin listas en papel y sin filas.
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            {['En funcionamiento', 'Para empresas y su equipo', 'Todo desde el celular'].map((t) => (
              <span
                key={t}
                className="rounded-full border border-primary-foreground/25 bg-primary-foreground/10 px-3 py-1.5 text-sm font-medium text-primary-foreground backdrop-blur-sm"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------------- Secciones ---------------- */

function QueEs() {
  return (
    <Seccion id="que-es" num="01" titulo="¿Qué es Amena?">
      <div className="grid items-center gap-8 lg:grid-cols-2">
        <div>
          <p className="mb-5 text-muted-foreground">
            Amena es, al mismo tiempo, un <strong>restaurante</strong> y una{' '}
            <strong>plataforma digital</strong> que ordena cómo las empresas dan de comer a su
            gente. En lugar de vales, cobros a mano o apuntar nombres en una hoja, todo el proceso
            vive en un solo lugar.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Tarjeta k="Un comedor para las empresas">
              El restaurante donde comen los equipos de las empresas. Cada empresa acuerda con Amena
              un precio por comida y un plan a su medida.
            </Tarjeta>
            <Tarjeta k="Una plataforma que lo ordena">
              Dos aplicaciones sencillas conectan a las empresas con el comedor: reservar, registrar
              consumos y generar las facturas, con todo a la vista y sin errores.
            </Tarjeta>
          </div>
        </div>
        <Foto src="/imagenes/h-espacio-2.jpg" alto="aspect-[4/3]" />
      </div>
    </Seccion>
  )
}

function ParaQue() {
  const items: [string, string][] = [
    [
      'Para las empresas',
      'Dan de comer a su equipo sin complicaciones: reservan la semana, saben cuánto van a gastar y reciben su factura correcta, en orden.',
    ],
    [
      'Para las personas que comen',
      'Comen mostrando un código QR desde el celular. Sin dinero, sin vales y sin filas: llegan, escanean y listo.',
    ],
    [
      'Para el equipo de Amena',
      'Sabe de antemano cuántos van a comer, evita errores y cobros dobles, y factura de forma automática al cierre de la semana.',
    ],
  ]
  return (
    <Seccion id="para-que" num="02" titulo="¿Para qué sirve?">
      <div className="grid gap-4 sm:grid-cols-3">
        {items.map(([k, d]) => (
          <Tarjeta key={k} k={k}>
            {d}
          </Tarjeta>
        ))}
      </div>
    </Seccion>
  )
}

/** Muestra los platillos de a UNO, grande, con cross-fade y contexto al lado (no una grilla). */
function ShowcaseAlimentos() {
  const [i, setI] = useState(0)
  const reduce = usePrefiereMenosMovimiento()
  useEffect(() => {
    if (reduce) return
    const id = setInterval(() => setI((p) => (p + 1) % ALIMENTOS_V.length), 4000)
    return () => clearInterval(id)
  }, [reduce])

  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Contexto primero (lo que faltaba). */}
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-primary">
            El sabor de Amena
          </span>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            Cocina fresca, hecha en casa
          </h2>
          <p className="mt-4 max-w-md text-muted-foreground">
            El menú cambia con la temporada: platillos preparados cada día, con ingredientes de
            calidad. Así se ve un día cualquiera en el comedor.
          </p>
          {/* Puntos de navegación. */}
          <div className="mt-7 flex items-center gap-2">
            {ALIMENTOS_V.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setI(idx)}
                aria-label={`Ver platillo ${idx + 1}`}
                aria-current={idx === i ? 'true' : undefined}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  idx === i ? 'w-7 bg-primary' : 'w-2.5 bg-border hover:bg-muted-foreground'
                )}
              />
            ))}
          </div>
        </div>

        {/* Foto grande que rota (cross-fade). */}
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl border border-border bg-salvia-900 sm:aspect-[5/4] lg:aspect-[4/5]">
          {ALIMENTOS_V.map((src, idx) => (
            <img
              key={src}
              src={src}
              alt="Platillo del comedor Amena"
              loading={idx === 0 ? 'eager' : 'lazy'}
              className={cn(
                'absolute inset-0 size-full object-cover transition-opacity duration-700 ease-out motion-reduce:transition-none',
                idx === i ? 'opacity-100' : 'opacity-0'
              )}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function Publico() {
  const items: [string, string][] = [
    ['Las empresas', 'Compañías que contratan el servicio de comedor Social Kitchen para su gente.'],
    ['Sus colaboradores', 'Las personas de cada empresa que comen en Amena, con su credencial digital.'],
    ['El equipo de Amena', 'El personal del restaurante que opera el comedor: atiende, arma el menú y administra.'],
  ]
  return (
    <Seccion id="publico" num="03" titulo="¿A quién está dirigido?">
      <div className="grid gap-4 sm:grid-cols-3">
        {items.map(([k, d]) => (
          <Tarjeta key={k} k={k}>
            {d}
          </Tarjeta>
        ))}
      </div>
    </Seccion>
  )
}

function ComoFunciona() {
  const pasos: { n: string; alt?: boolean; t: string; d: ReactNode }[] = [
    { n: '1', t: 'Se reservan las comidas', d: <>Cada semana, la empresa indica cuántas comidas quiere para su equipo y en qué días.</> },
    { n: '2', t: 'Se come con el código QR', d: <>La persona muestra su QR desde el celular; el mesero lo escanea y queda registrada su comida.</> },
    { n: '3', t: 'Se suma la semana', d: <>Al cierre, Amena junta todo lo consumido por cada empresa en un resumen claro.</> },
    { n: '4', alt: true, t: 'Se genera la factura', d: <>Con ese resumen se emite la factura fiscal (CFDI), lista para descargar. Sin papeleo.</> },
  ]
  return (
    <Seccion id="como-funciona" num="04" titulo="¿Cómo funciona?">
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
        <div className="rounded-2xl border border-border bg-card px-5">
          {pasos.map((p, i) => (
            <div
              key={p.n}
              className={cn(
                'grid grid-cols-[44px_1fr] gap-4 py-5',
                i > 0 && 'border-t border-dashed border-border'
              )}
            >
              <span
                className={cn(
                  'flex size-10 items-center justify-center rounded-xl font-mono text-base font-bold text-primary-foreground',
                  p.alt ? 'bg-salvia-500' : 'bg-primary'
                )}
              >
                {p.n}
              </span>
              <div>
                <h3 className="text-base font-semibold">{p.t}</h3>
                <p className="mt-1 text-sm text-foreground">{p.d}</p>
              </div>
            </div>
          ))}
        </div>
        <Foto src="/imagenes/v-alimento-6.jpg" alto="aspect-[3/4]" className="hidden lg:block" />
      </div>
    </Seccion>
  )
}

function Administracion() {
  return (
    <Seccion id="administracion" num="05" titulo="¿Cómo se administra?">
      <p className="mb-6 max-w-2xl text-muted-foreground">
        Amena se organiza en <strong>dos espacios</strong> según quién lo usa. Cada persona entra
        solo a lo que le corresponde, y cada empresa ve únicamente su propia información.
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <span className="mb-1 block font-mono text-xs font-bold uppercase tracking-wider text-primary">
            Panel de Amena
          </span>
          <h3 className="text-lg font-semibold">El equipo del restaurante</h3>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Desde aquí Amena administra todo el servicio, con perfiles según lo que hace cada persona:
          </p>
          <TablaRoles
            filas={[
              ['Dirección', 'Administra todo: empresas, menú, precios, cuentas y el equipo interno.'],
              ['Finanzas', 'Revisa los consumos y las cuentas, y emite las facturas.'],
              ['Mesero', 'Atiende la fila: escanea el código QR y registra cada comida.'],
              ['Consulta', 'Ve la información para dar seguimiento, sin hacer cambios.'],
            ]}
          />
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <span className="mb-1 block font-mono text-xs font-bold uppercase tracking-wider text-primary">
            Portal de las empresas
          </span>
          <h3 className="text-lg font-semibold">Cada empresa y su gente</h3>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Cada empresa entra a su propio espacio, con dos tipos de usuario:
          </p>
          <TablaRoles
            filas={[
              [
                'Administrador de la empresa',
                'Gestiona a su equipo, reserva las comidas, revisa consumos y descarga facturas.',
              ],
              ['Colaborador', 'La persona que come. Ve su código QR, el menú y su historial.'],
            ]}
          />
          <p className="mt-4 rounded-xl bg-secondary/50 p-3 text-xs text-muted-foreground">
            Un administrador también puede ser colaborador: además de gestionar, come con su propia
            credencial.
          </p>
        </div>
      </div>
    </Seccion>
  )
}

function Confianza() {
  const items: [string, string][] = [
    ['Cada empresa, lo suyo', 'La información de una empresa nunca se mezcla con la de otra.'],
    ['Desde el celular', 'Las personas usan Amena desde su teléfono, sin instalar nada.'],
    ['Cuentas claras', 'Todo consumo queda registrado con fecha y hora; las facturas siempre cuadran.'],
  ]
  return (
    <Seccion id="confianza" num="06" titulo="Simple, seguro y a la mano">
      <div className="grid gap-4 sm:grid-cols-3">
        {items.map(([k, d]) => (
          <Tarjeta key={k} k={k}>
            {d}
          </Tarjeta>
        ))}
      </div>
    </Seccion>
  )
}

/* ---------------- Banner full-bleed ---------------- */

function BannerEspacio() {
  return (
    <section className="relative my-4 h-[42vh] min-h-64 overflow-hidden sm:h-[48vh]">
      <img
        src="/imagenes/h-espacio-4.jpg"
        alt="El espacio de Amena"
        loading="lazy"
        className="absolute inset-0 size-full object-cover"
      />
      <div className="absolute inset-0 bg-tinta-900/45" aria-hidden />
      <div className="relative mx-auto flex h-full max-w-6xl items-center px-5 sm:px-8">
        <p className="max-w-lg text-2xl font-semibold tracking-tight text-primary-foreground text-balance sm:text-4xl">
          Un espacio pensado para hacer una pausa y disfrutar.
        </p>
      </div>
    </section>
  )
}

/* ---------------- Piezas reutilizables ---------------- */

function Seccion({
  id,
  num,
  titulo,
  children,
}: {
  id: string
  num: string
  titulo: string
  children: ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-20 border-t border-border py-12 sm:py-16">
      <div className="mb-7">
        <span className="font-mono text-sm font-semibold text-primary">{num}</span>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          {titulo}
        </h2>
      </div>
      {children}
    </section>
  )
}

function Tarjeta({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <span className="mb-2 block font-mono text-xs font-bold uppercase tracking-wider text-primary">
        {k}
      </span>
      <p className="text-sm text-foreground">{children}</p>
    </div>
  )
}

function Foto({ src, alto, className }: { src: string; alto: string; className?: string }) {
  return (
    <img
      src={src}
      alt="El comedor de Amena"
      loading="lazy"
      className={cn('w-full rounded-3xl border border-border object-cover', alto, className)}
    />
  )
}

function TablaRoles({ filas }: { filas: string[][] }) {
  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-border">
      <dl className="divide-y divide-border">
        {filas.map(([rol, desc]) => (
          <div key={rol} className="grid gap-1 p-4 sm:grid-cols-[190px_1fr] sm:gap-4">
            <dt className="text-sm font-semibold text-foreground">{rol}</dt>
            <dd className="text-sm text-muted-foreground">{desc}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function Pie() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex items-center gap-2">
          <LogotipoAmena className="h-4 w-auto text-muted-foreground" aria-hidden />
          <span>Social Kitchen · Planes de alimentación para empresas</span>
        </div>
        <span>Comer en el trabajo, simple y bien organizado.</span>
      </div>
    </footer>
  )
}
