import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from './lib/utils'
import { LogotipoAmena } from './components/logotipo-amena'

/* ---------------- Imágenes (public/imagenes) ---------------- */
// Organizadas por categoría en carpetas. Prefijo por orientación: h- horizontal, v- vertical.
const ESPACIOS = [
  '/imagenes/espacios/h-espacio-3.jpg',
  '/imagenes/espacios/h-espacio-1.jpg',
  '/imagenes/espacios/h-espacio-5.jpg',
  '/imagenes/espacios/h-espacio-2.jpg',
  '/imagenes/espacios/h-espacio-4.jpg',
]
const ALIMENTOS = [
  '/imagenes/alimentos/v-alimento-1.jpg',
  '/imagenes/alimentos/v-alimento-2.jpg',
  '/imagenes/alimentos/v-alimento-3.jpg',
]
const BEBIDAS = [
  '/imagenes/bebidas/v-bebida-1.jpg',
  '/imagenes/bebidas/v-bebida-2.jpg',
  '/imagenes/bebidas/v-bebida-3.jpg',
  '/imagenes/bebidas/v-bebida-4.jpg',
]
const SOCIAL_KITCHEN = [
  '/imagenes/social-kitchen/v-social-1.jpg',
  '/imagenes/social-kitchen/v-social-2.jpg',
  '/imagenes/social-kitchen/v-social-3.jpg',
  '/imagenes/social-kitchen/v-social-4.jpg',
  '/imagenes/social-kitchen/v-social-5.jpg',
]

/**
 * Landing PÚBLICA de Amena. Tema principal: el RESTAURANTE (carta con desayunos,
 * comidas y cenas, la cocina y el espacio). Más abajo, una sección propia presenta
 * el enfoque Social Kitchen (servicio de comedor para empresas) y su estado actual.
 *
 * Redacción para público general. Diseño con las fotos reales del comedor/platillos:
 * hero con carrusel, galería y banners; navbar de vidrio esmerilado. Responsive
 * (móvil / tablet / escritorio). Solo lectura.
 */
export function PresentacionPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <BarraSuperior />
      <Hero />
      <main className="mx-auto w-full max-w-5xl px-5 sm:px-8">
        <QueEs />
        <LaCarta />
      </main>
      <ShowcaseAlimentos />
      <Bebidas />
      <main className="mx-auto w-full max-w-5xl px-5 sm:px-8">
        <ElEspacio />
      </main>
      <BannerEspacio />
      <main className="mx-auto w-full max-w-5xl px-5 sm:px-8">
        <Visitanos />
      </main>
      <SocialKitchen />
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

/**
 * Video de fondo del hero (reproducción automática, silenciado y en bucle).
 * Muestra un póster mientras carga y, si el usuario prefiere menos movimiento,
 * cae a una imagen fija en lugar de reproducir el video.
 */
function VideoFondo({ poster }: { poster: string }) {
  const reduce = usePrefiereMenosMovimiento()
  return (
    <div className="absolute inset-0 overflow-hidden bg-salvia-900" aria-hidden>
      {reduce ? (
        <img src={poster} alt="" className="absolute inset-0 size-full object-cover" />
      ) : (
        <video
          className="absolute inset-0 size-full object-cover"
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        >
          <source src="/videos/general-amena.mp4" type="video/mp4" />
        </video>
      )}
    </div>
  )
}

/* ---------------- Navbar (liquid glass) ---------------- */

const TABS = [
  { id: 'que-es', label: 'El restaurante' },
  { id: 'la-carta', label: 'La carta' },
  { id: 'el-espacio', label: 'El espacio' },
  { id: 'visitanos', label: 'Visítanos' },
  { id: 'social-kitchen', label: 'Social Kitchen' },
]

function BarraSuperior() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/50 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/45">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <a href="#top" className="shrink-0" aria-label="Amena — inicio">
          <LogotipoAmena className="h-5 w-auto text-primary" />
        </a>
        <div className="flex items-center gap-2 sm:gap-3">
          <NavTabs />
          <a
            href="/menu"
            className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition-[background-color,transform] hover:bg-naranja-600 active:scale-95"
          >
            Menú
          </a>
        </div>
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
    <section id="top" className="relative flex min-h-[88svh] items-center overflow-hidden">
      <VideoFondo poster={ESPACIOS[0]} />
      {/* Velo sólido para legibilidad del texto claro sobre las fotos. */}
      <div className="absolute inset-0 bg-tinta-900/55" aria-hidden />
      <div className="relative mx-auto w-full max-w-6xl px-5 py-24 sm:px-8">
        <div className="max-w-2xl">
          <LogotipoAmena className="h-16 w-auto text-primary-foreground sm:h-20" />
          <p className="mt-5 text-xl font-semibold tracking-tight text-primary-foreground text-balance sm:text-3xl">
            Sabores reales, momentos reales.
          </p>
          <p className="mt-4 max-w-xl text-pretty text-sm text-primary-foreground/85 sm:text-base">
            Un restaurante para hacer una pausa y comer bien. Desayunos, comidas y cenas de cocina
            fresca hecha cada día, con un menú que cambia con la temporada, en un espacio pensado
            para disfrutar sin prisa.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a
              href="/menu"
              className="inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-[background-color,transform] hover:bg-naranja-600 active:scale-95"
            >
              Ver el menú
            </a>
            <a
              href="#social-kitchen"
              className="inline-flex items-center rounded-full border border-primary-foreground/30 bg-primary-foreground/10 px-5 py-2.5 text-sm font-semibold text-primary-foreground backdrop-blur-sm transition-[background-color,transform] hover:bg-primary-foreground/20 active:scale-95"
            >
              Conoce Social Kitchen
            </a>
          </div>
          <div className="mt-7 flex flex-wrap gap-2">
            {['Desayunos · Comidas · Cenas', 'Menú de temporada', 'Social Kitchen para empresas'].map(
              (t) => (
                <span
                  key={t}
                  className="rounded-full border border-primary-foreground/25 bg-primary-foreground/10 px-3 py-1.5 text-sm font-medium text-primary-foreground backdrop-blur-sm"
                >
                  {t}
                </span>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------------- Secciones (restaurante) ---------------- */

function QueEs() {
  return (
    <Seccion id="que-es" num="01" titulo="¿Qué es Amena?">
      <div className="grid items-center gap-8 lg:grid-cols-2">
        <div>
          <p className="mb-5 text-muted-foreground">
            Amena es un <strong>restaurante para todo el día</strong>: desayunos, comidas y cenas
            con platillos frescos y de temporada, en un espacio cálido donde vale la pena quedarse.
            Trabajamos con <strong>dos enfoques</strong>, con la misma cocina detrás.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Tarjeta k="El restaurante">
              Abierto al público. Llegas, eliges de la carta y disfrutas: desayunos, comidas y cenas
              de cocina de temporada.
            </Tarjeta>
            <Tarjeta k="Social Kitchen">
              El mismo sabor de Amena llevado a las empresas: un servicio de comedor para equipos, con
              una plataforma que lo organiza. <AnclaVerde href="#social-kitchen">Ver más abajo →</AnclaVerde>
            </Tarjeta>
          </div>
        </div>
        <Foto src="/imagenes/espacios/h-espacio-3.jpg" alto="aspect-[4/3]" />
      </div>
    </Seccion>
  )
}

function LaCarta() {
  const items: { k: string; d: string; img: string }[] = [
    {
      k: 'Desayunos',
      d: 'Para empezar bien el día: huevos al gusto, chilaquiles, pan del día, fruta de temporada y buen café.',
      img: '/imagenes/alimentos/v-alimento-3.jpg',
    },
    {
      k: 'Comidas',
      d: 'El plato fuerte del día. Guisos de cocina mexicana y platos a la carta que cambian con la temporada.',
      img: '/imagenes/alimentos/v-alimento-1.jpg',
    },
    {
      k: 'Cenas',
      d: 'Algo para compartir o una cena ligera, en un ambiente tranquilo para cerrar el día sin prisa.',
      img: '/imagenes/alimentos/v-alimento-2.jpg',
    },
  ]
  return (
    <Seccion id="la-carta" num="02" titulo="La carta">
      <p className="mb-6 max-w-2xl text-muted-foreground">
        Menú del día y carta. Cocinamos con ingredientes de temporada, así que los platillos cambian
        a lo largo del año; siempre frescos y hechos el mismo día.
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        {items.map((it) => (
          <div key={it.k} className="overflow-hidden rounded-2xl border border-border bg-card">
            <img
              src={it.img}
              alt={`Platillo de ${it.k.toLowerCase()} en Amena`}
              loading="lazy"
              className="aspect-[16/11] w-full object-cover"
            />
            <div className="p-5">
              <span className="mb-2 block font-mono text-xs font-bold uppercase tracking-wider text-primary">
                {it.k}
              </span>
              <p className="text-sm text-foreground">{it.d}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <a
          href="/menu"
          className="inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-[background-color,transform] hover:bg-naranja-600 active:scale-95"
        >
          Ver la carta completa →
        </a>
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
    const id = setInterval(() => setI((p) => (p + 1) % ALIMENTOS.length), 4000)
    return () => clearInterval(id)
  }, [reduce])

  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Contexto primero. */}
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-primary">
            Nuestra cocina
          </span>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            Cocina fresca de temporada
          </h2>
          <p className="mt-4 max-w-md text-muted-foreground">
            El menú cambia con la temporada: platillos preparados cada día, con ingredientes de
            calidad. Así se ve un día cualquiera en la cocina.
          </p>
          {/* Puntos de navegación. */}
          <div className="mt-7 flex items-center gap-2">
            {ALIMENTOS.map((_, idx) => (
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
          {ALIMENTOS.map((src, idx) => (
            <img
              key={src}
              src={src}
              alt="Platillo del restaurante Amena"
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

/* ---------------- La barra (bebidas) ---------------- */

function Bebidas() {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <div className="max-w-2xl">
        <span className="text-xs font-bold uppercase tracking-widest text-primary">La barra</span>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          Café y bebidas de especialidad
        </h2>
        <p className="mt-4 text-muted-foreground">
          Tostamos y molemos nuestro propio café. Y para acompañar cualquier momento del día, una
          carta de bebidas de especialidad: de un buen matcha a nuestra coctelería.
        </p>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {BEBIDAS.map((src) => (
          <img
            key={src}
            src={src}
            alt="Bebida de especialidad de Amena"
            loading="lazy"
            className="aspect-[3/4] w-full rounded-2xl border border-border object-cover"
          />
        ))}
      </div>
    </section>
  )
}

/* ---------------- El espacio (galería) ---------------- */

function ElEspacio() {
  return (
    <Seccion id="el-espacio" num="03" titulo="El espacio">
      <p className="mb-6 max-w-2xl text-muted-foreground">
        Luz natural, plantas y mucha madera: un lugar amplio y tranquilo para desayunar con calma,
        comer con quien quieras o trabajar un rato. Pensado para hacer una pausa.
      </p>
      {/* Mosaico responsive con las fotos del comedor. */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <GaleriaFoto src="/imagenes/espacios/h-espacio-3.jpg" className="col-span-2 lg:row-span-2 lg:aspect-auto" />
        <GaleriaFoto src="/imagenes/espacios/h-espacio-1.jpg" />
        <GaleriaFoto src="/imagenes/espacios/h-espacio-5.jpg" />
        <GaleriaFoto src="/imagenes/espacios/h-espacio-2.jpg" />
        <GaleriaFoto src="/imagenes/espacios/h-espacio-4.jpg" />
      </div>
    </Seccion>
  )
}

function GaleriaFoto({ src, className }: { src: string; className?: string }) {
  return (
    <img
      src={src}
      alt="El espacio de Amena"
      loading="lazy"
      className={cn(
        'aspect-[4/3] size-full rounded-2xl border border-border object-cover',
        className
      )}
    />
  )
}

/* ---------------- Visítanos (ubicación, horario, contacto y mapa) ---------------- */
// Datos tomados de la ficha de Google Maps del restaurante.

const MAPS_LINK = 'https://maps.app.goo.gl/Wk5595RKSKKN4fjf8'
// Embed sin API key: centra el mapa en las coordenadas del restaurante.
const MAPS_EMBED =
  'https://www.google.com/maps?q=20.677985,-103.3825017&z=16&hl=es&output=embed'

function Visitanos() {
  return (
    <Seccion id="visitanos" num="04" titulo="Visítanos">
      <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
        {/* Datos de contacto */}
        <div className="flex flex-col rounded-2xl border border-border bg-card p-6">
          <dl className="grid gap-6 sm:grid-cols-2">
            <Dato etiqueta="Dónde estamos">
              Calle Justo Sierra 2600
              <br />
              Ladrón de Guevara, Arcos Vallarta
              <br />
              44650 Guadalajara, Jal.
            </Dato>
            <Dato etiqueta="Horario">
              Todos los días
              <br />
              8:00 – 23:00
            </Dato>
            <Dato etiqueta="Teléfono">
              <a
                href="tel:+523323714297"
                className="text-foreground underline-offset-2 hover:text-primary hover:underline"
              >
                +52 33 2371 4297
              </a>
            </Dato>
            <Dato etiqueta="Cómo llegar">
              <a
                href={MAPS_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline-offset-2 hover:text-primary hover:underline"
              >
                Ver en Google Maps ↗
              </a>
            </Dato>
          </dl>
          <a
            href={MAPS_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex w-fit items-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-[background-color,transform] hover:bg-naranja-600 active:scale-95"
          >
            Cómo llegar
          </a>
        </div>

        {/* Mapa */}
        <div className="overflow-hidden rounded-2xl border border-border bg-salvia-900">
          <iframe
            title="Ubicación de Amena Restaurante en Google Maps"
            src={MAPS_EMBED}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
            className="aspect-[4/3] size-full min-h-64 border-0 lg:aspect-auto"
          />
        </div>
      </div>
    </Seccion>
  )
}

function Dato({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div>
      <dt className="mb-1.5 font-mono text-xs font-bold uppercase tracking-wider text-primary">
        {etiqueta}
      </dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  )
}

/* ---------------- Banner full-bleed ---------------- */

function BannerEspacio() {
  return (
    <section className="relative my-4 h-[42vh] min-h-64 overflow-hidden sm:h-[48vh]">
      <img
        src="/imagenes/espacios/h-espacio-4.jpg"
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

/* ---------------- Social Kitchen (enfoque para empresas) ---------------- */
// Sección propia, diferenciada con el verde salvia de marca. Explica qué es
// Social Kitchen y su estado actual: en funcionamiento hoy.

function SocialKitchen() {
  const pasos: { n: string; t: string; d: ReactNode }[] = [
    { n: '1', t: 'Se reservan las comidas', d: <>Cada semana la empresa indica cuántas comidas quiere para su equipo y en qué días.</> },
    { n: '2', t: 'Se come con el código QR', d: <>La persona muestra su QR desde el celular; el mesero lo escanea y queda registrada su comida.</> },
    { n: '3', t: 'Se suma la semana', d: <>Al cierre, Amena junta todo lo consumido por cada empresa en un resumen claro.</> },
    { n: '4', t: 'Se genera la factura', d: <>Con ese resumen se emite la factura fiscal (CFDI), lista para descargar. Sin papeleo.</> },
  ]
  return (
    <section id="social-kitchen" className="scroll-mt-16 bg-salvia-50">
      <div className="mx-auto w-full max-w-5xl px-5 py-14 sm:px-8 sm:py-20">
        <div className="mb-8 max-w-2xl">
          <span className="font-mono text-sm font-semibold text-salvia-700">Otro enfoque</span>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            Social Kitchen: la cocina de Amena en tu empresa
          </h2>
          <p className="mt-4 text-muted-foreground">
            Además del restaurante, Amena lleva su cocina a las empresas con{' '}
            <strong>Social Kitchen</strong>: un servicio de comedor para equipos, con una plataforma
            que ordena todo el proceso. En lugar de vales, cobros a mano o listas en papel, todo vive
            en un solo lugar.
          </p>
          <div className="mt-6">
            <a
              href="https://portal-empresarial.amena.social/login"
              className="inline-flex items-center rounded-full bg-salvia-600 px-5 py-2.5 text-sm font-semibold text-white transition-[background-color,transform] hover:bg-salvia-700 active:scale-95"
            >
              Iniciar sesión
            </a>
          </div>
        </div>

        {/* Estado actual — en funcionamiento hoy. */}
        <div className="mb-8 flex flex-wrap items-center gap-3 rounded-2xl border border-salvia-200 bg-card p-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-salvia-500 px-3 py-1 text-sm font-semibold text-primary-foreground">
            <span className="size-1.5 rounded-full bg-primary-foreground" aria-hidden />
            En funcionamiento hoy
          </span>
          <p className="text-sm text-muted-foreground">
            Ya opera con dos aplicaciones: el <strong>portal de las empresas</strong> (reservan,
            revisan consumos y descargan facturas) y el <strong>panel de Amena</strong> (arma el menú,
            atiende la fila y factura). Cada empresa ve únicamente su propia información.
          </p>
        </div>

        {/* Fotos del servicio de comedor en las empresas. */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {SOCIAL_KITCHEN.map((src) => (
            <img
              key={src}
              src={src}
              alt="Servicio de comedor Social Kitchen de Amena en una empresa"
              loading="lazy"
              className="aspect-[3/4] w-full rounded-2xl border border-border object-cover"
            />
          ))}
        </div>

        {/* Cómo funciona, en 4 pasos. */}
        <div className="rounded-2xl border border-border bg-card px-5 sm:px-6">
          {pasos.map((p, i) => (
              <div
                key={p.n}
                className={cn(
                  'grid grid-cols-[44px_1fr] gap-4 py-5',
                  i > 0 && 'border-t border-dashed border-border'
                )}
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-salvia-500 font-mono text-base font-bold text-primary-foreground">
                  {p.n}
                </span>
                <div>
                  <h3 className="text-base font-semibold">{p.t}</h3>
                  <p className="mt-1 text-sm text-foreground">{p.d}</p>
                </div>
              </div>
            ))}
        </div>
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

/** Enlace de acento en verde salvia (identidad de Social Kitchen). */
function AnclaVerde({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} className="font-semibold text-salvia-700 underline-offset-2 hover:underline">
      {children}
    </a>
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

function Pie() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex items-center gap-2">
          <LogotipoAmena className="h-4 w-auto text-muted-foreground" aria-hidden />
          <span>Restaurante · Desayunos, comidas y cenas · Social Kitchen para empresas</span>
        </div>
        <span>Sabores reales, momentos reales.</span>
      </div>
    </footer>
  )
}
