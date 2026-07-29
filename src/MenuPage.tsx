import { useEffect, useState } from 'react'
import { cn } from './lib/utils'
import { LogotipoAmena } from './components/logotipo-amena'

/* ============================================================
   Datos del menú de Amena.
   Fuente: carta oficial del restaurante (validada). Cada platillo:
   nombre, descripción, precio y (en algunas cartas) sugerencia de maridaje.
   Los grupos "compactos" (Adicionales / Side) se muestran como lista breve.
   ============================================================ */

type Item = { n: string; d?: string; p?: string; s?: string }
type Grupo = { t?: string; nota?: string; compacto?: boolean; items: Item[] }
type Bloque = {
  id: string
  t: string
  horario: string
  intro?: string
  precio?: string
  grupos: Grupo[]
}

const MENU: Bloque[] = [
  {
    id: 'desayuno',
    t: 'Desayuno',
    horario: 'Diario · 8:00 AM – 1:00 PM',
    grupos: [
      {
        t: 'Panadería',
        items: [
          { n: 'Croissants', d: 'Natural, chocolate o almendrado.', p: '$68' },
          { n: 'Conchas', d: 'Vainilla o chocolate.', p: '$68' },
          { n: 'Panqué de Plátano', d: 'Con nueces y chocolate.', p: '$75' },
          { n: 'Pan de Elote', d: 'Con cajeta y semillas de calabaza.', p: '$75' },
        ],
      },
      {
        t: 'Para empezar',
        items: [
          { n: 'Fruta con Yogurt', d: 'Fruta fresca de la estación, yogurt griego con menta, granola, miel y gelatina cítrica.', p: '$125' },
          { n: 'Chía en Coco', d: 'Chía en leche de coco, mango, fresas, coco tostado y piña asada con chile dulce.', p: '$120' },
          { n: 'Hotcakes', d: 'Suaves, con ricotta al limón, acompañados de tocino crujiente y mantequilla.', p: '$160' },
          { n: 'Pan Francés', d: 'Pan brioche dorado a la plancha, terminado con azúcar glass, frutos rojos y maple.', p: '$155' },
          { n: 'Tres Leches de Matcha', d: 'Brioche preparado con tres leches, crema de matcha, salsa de mango, trozos de durazno, galleta quebrada de nuez y chocolate amargo.', p: '$157' },
        ],
      },
      {
        t: 'Clásicos',
        items: [
          { n: 'Chilaquiles', d: 'Verdes, rojos o mixtos con crema, queso, cebolla y frijoles.', p: '$165' },
          { n: 'Chilaquiles Blancos', d: 'En salsa cremosa de quesos, cebolla, queso fresco y frijoles.', p: '$172' },
          { n: 'Huevos Rancheros', d: 'Sobre tortillas fritas, salsa roja y verde, frijoles y panela asada.', p: '$179' },
          { n: 'Huevos al Gusto', d: 'Estrellados (indicar término), revueltos (mexicana, tocino o chorizo) o en omelette (queso, verduras o jamón). Acompañados de frijoles refritos.', p: '$179' },
          { n: 'Enchiladas Poblanas', d: 'De pollo, salsa poblana, crema, queso, cebolla y rajas poblanas.', p: '$182' },
          { n: 'Gorditas', d: 'Una de queso gratinado, una de pollo y una de carne, con lechuga, crema, queso y cebolla.', p: '$180' },
        ],
      },
      {
        t: 'Especiales',
        items: [
          { n: 'Enchiladas de Carnitas', d: 'En salsa roja tatemada, aguacate, crema, queso y chicharrón troceado.', p: '$189' },
          { n: 'Motuleños con Chorizo', d: 'Huevos sobre tortilla con frijoles y chorizo, salsa roja, jamón, chícharos, queso y plátano asado.', p: '$184' },
          { n: 'Huevos Cuachala', d: 'Salsa suave de chile y pollo deshebrado, crema, queso, cebolla morada y aceite de chiles.', p: '$180' },
          { n: 'Mollete con Costilla', d: 'Pan de masa madre con frijoles y queso gratinado, costilla al horno y salsa mexicana.', p: '$195' },
          { n: 'Lonche de Pork Belly', d: 'Birote con carne de cerdo al tamarindo, verduras encurtidas y pepinillos.', p: '$182' },
          { n: 'Sándwich Roast Beef', d: 'Pan de masa madre, roast beef, queso gratinado, cebolla caramelizada, mayonesa con mostaza y ensalada.', p: '$210' },
          { n: 'Sándwich Pollo Crujiente', d: 'Chapata con pollo crujiente, mayonesa con mostaza, parmesano, huevo estrellado y ensalada.', p: '$205' },
        ],
      },
      {
        t: 'Ligero',
        items: [
          { n: 'Tosta de Aguacate', d: 'Pan de masa madre con ricotta, aguacate, espinacas, huevo al gusto, jitomate cherry y parmesano.', p: '$182' },
          { n: 'Omelette de Claras', d: 'Relleno de espinacas y queso panela con verduras al vapor.', p: '$179' },
          { n: 'Muesli', d: 'Avena a la canela con vainilla, frutos secos, semillas y fruta de temporada.', p: '$132' },
          { n: 'Ensalada Verde', d: 'Mezcla de lechugas con pollo a la plancha, huevo duro, aguacate, panela, jitomate cherry y vinagreta de hierbas.', p: '$185' },
        ],
      },
      {
        t: 'Adicionales',
        compacto: true,
        items: [
          { n: 'Queso', p: '$25' },
          { n: 'Crema', p: '$15' },
          { n: 'Huevo', p: '$15' },
          { n: 'Pollo', p: '$45' },
          { n: 'Jamón, tocino o chorizo', p: '$35' },
          { n: 'Verduras al vapor', p: '$30' },
          { n: 'Ricotta', p: '$35' },
          { n: 'Ensalada verde', p: '$30' },
          { n: 'Yogurt', p: '$25' },
          { n: 'Frijoles', p: '$28' },
          { n: 'Panela asada', p: '$38' },
          { n: 'Carnitas', p: '$55' },
          { n: 'Costilla al horno', p: '$60' },
          { n: 'Pollo crujiente', p: '$55' },
        ],
      },
    ],
  },
  {
    id: 'brunch',
    t: 'Brunch Amena',
    horario: 'Vie – Dom · 12:00 PM – 3:00 PM',
    grupos: [
      {
        t: 'Salado',
        items: [
          { n: 'Cheeseburger', d: 'De res con quesos gratinados y tocino, aderezos y pepinillo.', p: '$165', s: 'Con un Aperol Spritz.' },
          { n: 'Lonche de Pork Belly', d: 'Birote con carne de cerdo al tamarindo, verduras encurtidas y pepinillos.', p: '$182', s: 'Ideal para un New Garibaldi.' },
          { n: 'Burrito de Res', d: 'De costilla al horno con frijoles, arroz, queso, aguacate y salsa roja.', p: '$130', s: 'Acompáñalo con un Carajillo.' },
          { n: 'Dorados de Carnitas', d: 'Tacos crujientes con lechuga, salsa verde, crema, queso y rábano.', p: '$110', s: 'Acompáñalos con una Signature Paloma.' },
          { n: 'Tostada de Atún', d: 'Atún en salsa ponzu sobre tostada wonton con aderezo de aguacate, cebolla encurtida, pepino y ajonjolí tostado.', p: '$95', s: 'Tómate un French 75.' },
          { n: 'Ceviche', d: 'Pescado blanco en leche de tigre, pepino, cebolla, aguacate, cilantro y aceite de chiles.', p: '$115', s: 'Una Lager de Cielito Lindo.' },
          { n: 'César con Pollo Crujiente', d: 'Romana con aderezo, crotones, parmesano y pollo crujiente.', p: '$125', s: 'Va muy bien con una Mimosa.' },
        ],
      },
      {
        t: 'Dulce',
        items: [
          { n: 'Hotcakes', d: 'Suaves, con pollo frito y jarabe de maple.', p: '$165', s: 'Tómate una cerveza Vienna de Cielito Lindo.' },
          { n: 'Tarta Vasca', d: 'Con fresas naturales y nueces.', p: '$98', s: 'Pídete un Lillet Spritz.' },
          { n: 'Texturas de Chocolate', d: 'Pan húmedo, helado, crumble y mousse.', p: '$95', s: 'Pareja ideal, el White Matcha.' },
          { n: 'Pan de Elote', d: 'Con cajeta y semillas de calabaza.', p: '$75', s: 'Marida con un Golden Spritz.' },
        ],
      },
      {
        t: 'Side',
        compacto: true,
        items: [
          { n: 'Papas francesas', p: '$54' },
          { n: 'Chips de jícama', p: '$52' },
          { n: 'Crudités con Ranch', p: '$52' },
          { n: 'Guacamole', p: '$55' },
          { n: 'Carnitas', p: '$55' },
          { n: 'Costilla al horno', p: '$60' },
          { n: 'Pollo crujiente', p: '$55' },
          { n: 'Bastones de queso crujiente', p: '$65' },
        ],
      },
    ],
  },
  {
    id: 'comida',
    t: 'Menú Comida',
    horario: 'Lun – Jue · 1:00 PM – 5:00 PM',
    intro: 'Incluye sopa o ensalada, plato fuerte, postre o café de especialidad y agua fresca.',
    precio: '$195',
    grupos: [
      {
        t: 'Plato fuerte a elegir',
        nota: 'Incluidos en el precio del menú.',
        items: [
          { n: 'Pollo a la parrilla', d: 'En fajitas con pimientos, cebolla, zanahoria y chile poblano, acompañado de arroz.' },
          { n: 'Albóndigas', d: 'En salsa de chipotle con arroz.' },
          { n: 'Cerdo en Salsa Verde', d: 'Guisado con papa, acompañado de frijoles.' },
          { n: 'Platillo del día', d: 'Pregunta por el guisado de hoy.' },
        ],
      },
      {
        t: 'Adicionales',
        compacto: true,
        items: [
          { n: 'Queso', p: '$15' },
          { n: 'Crema', p: '$10' },
          { n: 'Huevo', p: '$15' },
          { n: 'Jamón, tocino o chorizo', p: '$25' },
          { n: 'Verduras al vapor', p: '$20' },
          { n: 'Ensalada verde', p: '$20' },
          { n: 'Frijoles', p: '$20' },
          { n: 'Arroz', p: '$20' },
          { n: 'Papas francesas', p: '$30' },
          { n: 'Guacamole', p: '$35' },
          { n: 'Yogurt', p: '$18' },
          { n: 'Helado', p: '$20' },
        ],
      },
    ],
  },
  {
    id: 'tarde-noche',
    t: 'Tarde Noche',
    horario: 'Diario · 5:00 PM – 11:00 PM',
    grupos: [
      {
        t: 'Al centro',
        items: [
          { n: 'Tostada de Atún', d: 'Atún en salsa ponzu sobre tostada wonton con aderezo de aguacate, cebolla encurtida, pepino y poro crujiente.', p: '$95', s: 'Tómate un French 75.' },
          { n: 'Ceviche', d: 'Pescado blanco en leche de tigre, pepino, cebolla, aguacate, cilantro y aceite de chiles.', p: '$115', s: 'Que te sirvan una Lager de Cielito Lindo.' },
          { n: 'Cheeseburger', d: 'De res con quesos gratinados y tocino, aderezos y pepinillo.', p: '$165', s: 'Acompáñalo con un Aperol Spritz.' },
          { n: 'Tacos de Short Rib', d: 'Carne al horno, con guacamole, cebollas y chiles asados.', p: '$165', s: 'Ideal con un New Garibaldi.' },
          { n: 'César con Pollo Crujiente', d: 'Romana con aderezo, crotones, parmesano y pollo crujiente.', p: '$125', s: 'Con una copa de espumoso.' },
          { n: 'Tacos de Atún', d: 'Sellado, en tortilla de harina con aderezo de chipotle, aguacate y ensalada de col con zanahoria y pepino.', p: '$147', s: 'Acompáñalos con una Signature Paloma.' },
          { n: 'Empanadas (pieza)', d: 'Carne o humita.', p: '$52', s: 'Con una Margarita.' },
          { n: 'Pasta con Pescado', d: 'En salsa de jitomate con alcaparras, aceitunas, chiles güeros y pescado a la mantequilla.', p: '$175', s: 'Con una copa de vino rosado.' },
          { n: 'Ravioles', d: 'Rellenos de flor de calabaza y ricotta, en salsa de queso.', p: '$135', s: 'Tómate un Dry Martini.' },
          { n: 'Pambazo con Pork Belly', d: 'Cerdo agridulce al tamarindo, con verduras encurtidas y cilantro.', p: '$149', s: 'Pídete un Negroni.' },
        ],
      },
      {
        t: 'Postre',
        items: [
          { n: 'Tarta Vasca', d: 'Con fresas naturales y nueces.', p: '$98', s: 'Pídete un Lillet Spritz.' },
          { n: 'Texturas de Chocolate', d: 'Pan húmedo, helado, crumble y mousse.', p: '$95', s: 'Pareja ideal, el White Matcha.' },
          { n: 'Pan de Elote', d: 'Con cajeta y semillas de calabaza.', p: '$75', s: 'Marida con un Golden Spritz.' },
        ],
      },
      {
        t: 'Side',
        compacto: true,
        items: [
          { n: 'Papas francesas', p: '$54' },
          { n: 'Chips de jícama', p: '$52' },
          { n: 'Crudités con Ranch', p: '$52' },
          { n: 'Guacamole', p: '$55' },
          { n: 'Carnitas', p: '$55' },
          { n: 'Costilla al horno', p: '$60' },
          { n: 'Pollo crujiente', p: '$55' },
          { n: 'Bastones de queso crujiente', p: '$65' },
        ],
      },
    ],
  },
  {
    id: 'bebidas',
    t: 'Bebidas',
    horario: 'Café de casa, especialidades y coctelería',
    grupos: [
      {
        t: 'Clásicos de café',
        items: [
          { n: 'Espresso', d: 'Corto, intenso y con carácter.', p: '$45' },
          { n: 'Americano', d: 'Suave y ligero, con el perfil del espresso extendido.', p: '$52' },
          { n: 'Cortado', d: 'Espresso balanceado con un toque de leche.', p: '$48' },
          { n: 'Macchiato', d: 'Espresso marcado con una ligera espuma de leche.', p: '$48' },
          { n: 'Flat White', d: 'Cremoso y sedoso, con mayor protagonismo del café.', p: '$62' },
          { n: 'Capuchino', d: 'Equilibrio entre espresso, leche y espuma.', p: '$64' },
          { n: 'Latte', d: 'Suave, cremoso y de perfil lácteo dominante.', p: '$66' },
        ],
      },
      {
        t: 'Métodos de extracción',
        items: [
          { n: 'V60', d: 'Perfil limpio y delicado, resalta acidez y notas aromáticas.', p: '$88' },
          { n: 'Aeropress', d: 'Balance entre cuerpo y claridad, versátil y expresivo.', p: '$88' },
          { n: 'Prensa francesa', d: 'Cuerpo completo y textura robusta.', p: '$92' },
          { n: 'Cold Brew', d: 'Extracción en frío, suave, ligeramente dulce y baja acidez. Se puede servir solo o con soda, agua tónica o jugo de naranja.', p: '$95' },
        ],
      },
      {
        t: 'Especialidades con leche',
        items: [
          { n: 'Chocolate', d: 'Cremoso y reconfortante.', p: '$78' },
          { n: 'Chai Latte', d: 'Especiado, aromático y cálido.', p: '$82' },
          { n: 'Matcha Latte', d: 'Herbal, cremoso y ligeramente vegetal.', p: '$85' },
          { n: 'Taro Latte', d: 'Suave, dulce y con notas terrosas.', p: '$82' },
        ],
      },
      {
        t: 'Especialidades con café',
        items: [
          { n: 'Mocha', d: 'Chocolate y café en una mezcla cremosa y reconfortante.', p: '$82' },
          { n: 'Caramel Macchiato', d: 'Dulce, con notas de caramelo y café balanceado.', p: '$85' },
          { n: 'Vainilla Macchiato', d: 'Aromático y suave, con perfil dulce y elegante.', p: '$85' },
          { n: 'Dirty Matcha', d: 'Matcha ceremonial con espresso, herbal y profundo.', p: '$94' },
          { n: 'Dirty Chai', d: 'Especiado y cálido, con la intensidad del café.', p: '$92' },
          { n: 'Dirty Taro', d: 'Cremoso, ligeramente dulce y con notas terrosas.', p: '$92' },
        ],
      },
      {
        t: 'Infusiones',
        items: [
          { n: 'Té Verde', d: 'Ligero, herbal y refrescante.', p: '$57' },
          { n: 'Té Negro', d: 'Intenso y estructurado.', p: '$57' },
          { n: 'Menta', d: 'Fresca y aromática.', p: '$57' },
          { n: 'Rooibos', d: 'Dulce natural, sin cafeína.', p: '$57' },
          { n: 'Tisana Frutos Rojos', d: 'Frutal, ligeramente ácida y aromática.', p: '$82' },
          { n: 'Tisana Citrus', d: 'Cítrica, brillante y refrescante.', p: '$82' },
        ],
      },
      {
        t: 'Batidos',
        items: [
          { n: 'Smoothie de Mango', d: 'Tropical, dulce y cremoso. Base agua o yogurt.', p: '$75' },
          { n: 'Smoothie de Fresa', d: 'Fresco y frutal, con acidez balanceada. Base agua o yogurt.', p: '$75' },
          { n: 'Malteada de Vainilla', d: 'Clásica, cremosa y con notas dulces y suaves.', p: '$92' },
          { n: 'Malteada de Chocolate', d: 'Intensa y reconfortante, con cuerpo y dulzor equilibrado.', p: '$92' },
        ],
      },
      {
        t: 'Refrescantes',
        items: [
          { n: 'Jugo Verde', d: 'Mezcla fresca de vegetales y fruta, ligera y revitalizante.', p: '$65' },
          { n: 'Jugo de Naranja', d: 'Natural.', p: '$60' },
          { n: 'Agua Alcalina', d: 'Suave y mineral.', p: '$48' },
          { n: 'Topo Chico', d: 'Agua mineral, refrescante y con carácter.', p: '$60' },
          { n: 'Perrier', d: 'Agua mineral elegante, de sabor distintivo.', p: '$69' },
          { n: 'Limonada', d: 'Refrescante y preparada al momento con limón fresco.', p: '$48' },
          { n: 'Limonada con Frutos Rojos', d: 'Equilibrio entre acidez y dulzor, con frutos rojos.', p: '$55' },
          { n: 'Naranjada', d: 'Cítrica y vibrante, hecha con jugo de naranja.', p: '$48' },
          { n: 'Refrescos', d: 'Selección de refrescos clásicos.', p: '$45' },
        ],
      },
      {
        t: 'Mocktails',
        items: [
          { n: 'Velvet Matcha', d: 'Matcha ceremonial, leche de pistache y óleo de frambuesa.', p: '$115' },
          { n: 'Dirty Horchata', d: 'Horchata artesanal con café y especias; cremosa, especiada y con profundidad.', p: '$112' },
          { n: 'Affogato Tonic', d: 'Espresso, sorbete de limón y vainilla con agua tónica. Cítrico, refrescante y ligeramente dulce.', p: '$118' },
          { n: 'Metamorphosis', d: 'Soda de coco, miel de agave y butterfly pea tea. Floral, ligero y tropical.', p: '$115' },
        ],
      },
      {
        t: 'Spritz',
        items: [
          { n: 'Aperol Spritz', d: 'Aperol, vino espumoso y soda. Amargo-dulce y refrescante.', p: '$185' },
          { n: 'Golden Spritz', d: 'Licor 43, vino espumoso y soda con toque cítrico. Suave, aromático y con notas de vainilla.', p: '$175' },
          { n: 'Lillet Spritz', d: 'Lillet, sorbete de frutos rojos, vino espumoso y soda. Elegante, frutal y refrescante.', p: '$187' },
          { n: 'Mimosa', d: 'Jugo de naranja y vino espumoso. Fresca y burbujeante.', p: '$128' },
        ],
      },
      {
        t: 'Coctelería',
        items: [
          { n: 'Signature Paloma', d: 'Tequila blanco, tisana roja, toronja y soda con sal mineral. Refrescante, cítrica y con un fondo herbal.', p: '$169' },
          { n: 'New Garibaldi', d: 'Campari con mezcla aireada de piña y naranja natural. Cremoso, jugoso y de carácter herbal.', p: '$155' },
          { n: 'White Matcha', d: 'Matcha ceremonial, vodka y chocolate blanco. Cremoso, herbal y ligeramente dulce.', p: '$150' },
          { n: 'French 75', d: 'Ginebra, vino espumoso y limón. Seco, elegante y con final cítrico.', p: '$162' },
        ],
      },
      {
        t: 'Cerveza',
        items: [{ n: 'Artesanal Cielito Lindo', d: 'Pregunta por los estilos disponibles.', p: '$72' }],
      },
      {
        t: 'Vinos',
        items: [
          { n: 'Espumoso', d: 'Copa $132 · Botella $675' },
          { n: 'Blanco', d: 'Copa $125 · Botella $510' },
          { n: 'Tinto', d: 'Copa $145 · Botella $572' },
        ],
      },
    ],
  },
]

const PORTADA = '/imagenes/menu/portada.jpg'
const CIERRE = '/imagenes/menu/cierre.jpg'

/* ============================================================
   Página del menú
   ============================================================ */

export function MenuPage() {
  useEffect(() => {
    const anterior = document.title
    document.title = 'Menú — Amena Restaurante'
    return () => {
      document.title = anterior
    }
  }, [])

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Encabezado />

      {/* Portada del menú, a pantalla completa. */}
      <section className="flex min-h-svh items-center justify-center bg-crema-100">
        <h1 className="sr-only">Menú — Amena Restaurante</h1>
        <img
          src={PORTADA}
          alt="Menú de Amena — Sabores reales, momentos reales"
          className="h-svh w-full object-cover sm:w-auto sm:max-w-full sm:object-contain"
        />
      </section>

      <main className="mx-auto w-full max-w-5xl px-5 pb-20 pt-12 sm:px-8 sm:pt-16">
        <p className="mb-12 max-w-2xl text-pretty text-muted-foreground sm:mb-16">
          Cocina fresca hecha en casa, a lo largo del día. Los platillos cambian con la temporada,
          así que algunos pueden variar en el restaurante.
        </p>

        <div className="flex flex-col gap-16 sm:gap-20">
          {MENU.map((b) => (
            <SeccionMenu key={b.id} bloque={b} />
          ))}
        </div>

        <p className="mt-16 border-t border-border pt-6 text-sm text-muted-foreground">
          Precios en pesos mexicanos (MXN). El menú puede cambiar según la temporada y la
          disponibilidad.
        </p>
      </main>

      {/* Cierre del menú, a pantalla completa. */}
      <section className="flex min-h-svh items-center justify-center bg-salvia-500">
        <img
          src={CIERRE}
          alt="Gracias por estar aquí — Amena · Calle Justo Sierra 2600, Guadalajara"
          className="h-svh w-full object-cover sm:w-auto sm:max-w-full sm:object-contain"
        />
      </section>

      <Pie />
    </div>
  )
}

/* ---------------- Encabezado con navegación (secciones a la derecha) ---------------- */

function Encabezado() {
  const [activo, setActivo] = useState(MENU[0].id)

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]) setActivo(visible[0].target.id)
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: [0, 0.5, 1] }
    )
    for (const b of MENU) {
      const s = document.getElementById(b.id)
      if (s) obs.observe(s)
    }
    return () => obs.disconnect()
  }, [])

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-5 sm:px-8">
        <a href="/" className="shrink-0" aria-label="Amena — inicio">
          <LogotipoAmena className="h-5 w-auto text-salvia-700" />
        </a>
        <nav
          className="ml-auto flex min-w-0 items-center gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Secciones del menú"
        >
          {MENU.map((b) => (
            <a
              key={b.id}
              href={`#${b.id}`}
              aria-current={activo === b.id ? 'true' : undefined}
              className={cn(
                'shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                activo === b.id
                  ? 'bg-salvia-100 text-salvia-800'
                  : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground'
              )}
            >
              {b.t}
            </a>
          ))}
        </nav>
      </div>
    </header>
  )
}

/* ---------------- Bloque de menú (una franja horaria) ---------------- */

function SeccionMenu({ bloque }: { bloque: Bloque }) {
  const normales = bloque.grupos.filter((g) => !g.compacto)
  const compactos = bloque.grupos.filter((g) => g.compacto)

  return (
    <section id={bloque.id} className="scroll-mt-20">
      <div className="mb-6 border-b border-border pb-4">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{bloque.t}</h2>
        <p className="mt-1 font-mono text-xs font-semibold uppercase tracking-wider text-salvia-700">
          {bloque.horario}
        </p>
      </div>

      {/* Menú de precio fijo (comida): banner con lo que incluye. */}
      {bloque.precio && (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-secondary/40 p-5">
          <p className="max-w-xl text-sm text-foreground">{bloque.intro}</p>
          <span className="font-mono text-2xl font-bold text-salvia-700">{bloque.precio}</span>
        </div>
      )}

      <div className="columns-1 gap-x-12 lg:columns-2">
        {normales.map((g, i) => (
          <GrupoMenu key={g.t ?? i} grupo={g} />
        ))}
      </div>

      {compactos.map((g) => (
        <CompactoBox key={g.t} grupo={g} />
      ))}
    </section>
  )
}

function GrupoMenu({ grupo }: { grupo: Grupo }) {
  return (
    <div className="mb-10 break-inside-avoid">
      {grupo.t && (
        <h3 className="mb-1 font-mono text-xs font-bold uppercase tracking-wider text-salvia-700">
          {grupo.t}
        </h3>
      )}
      {grupo.nota && <p className="mb-1 text-xs text-muted-foreground">{grupo.nota}</p>}
      <div>
        {grupo.items.map((it) => (
          <Fila key={it.n} item={it} />
        ))}
      </div>
    </div>
  )
}

function Fila({ item }: { item: Item }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-dashed border-border py-3">
      <div className="min-w-0">
        <h4 className="font-medium leading-snug">{item.n}</h4>
        {item.d && <p className="mt-0.5 text-sm text-muted-foreground">{item.d}</p>}
        {item.s && (
          <p className="mt-1 text-sm text-salvia-700">
            <span className="font-medium">Sugerencia:</span> {item.s}
          </p>
        )}
      </div>
      {item.p && (
        <span className="shrink-0 font-mono text-sm font-semibold text-salvia-700">{item.p}</span>
      )}
    </div>
  )
}

/** Lista breve para Adicionales / Side: nombre + precio, en línea. */
function CompactoBox({ grupo }: { grupo: Grupo }) {
  return (
    <div className="mt-8 rounded-2xl border border-border bg-card p-5">
      {grupo.t && (
        <h3 className="mb-3 font-mono text-xs font-bold uppercase tracking-wider text-salvia-700">
          {grupo.t}
        </h3>
      )}
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {grupo.items.map((it) => (
          <span key={it.n} className="text-sm text-foreground">
            {it.n} <span className="font-mono font-semibold text-salvia-700">{it.p}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

/* ---------------- Pie ---------------- */

function Pie() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <a href="/" className="flex items-center gap-2 hover:text-foreground" aria-label="Amena — inicio">
          <LogotipoAmena className="h-4 w-auto text-muted-foreground" aria-hidden />
          <span>Restaurante · Sabores reales, momentos reales.</span>
        </a>
        <span>Calle Justo Sierra 2600, Guadalajara, Jal.</span>
      </div>
    </footer>
  )
}
