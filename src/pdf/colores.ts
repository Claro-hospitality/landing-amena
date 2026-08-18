// @react-pdf/renderer no puede leer variables CSS ni oklch() — construye el PDF
// con su propio motor, sin tocar el DOM. Estos valores deben coincidir a mano con
// la escala hex de marca definida en src/theme.css si esa paleta cambia.
export const COLORES = {
  naranja500: '#f68d2e',
  naranja700: '#b95f11',
  salvia100: '#e8eddd',
  salvia700: '#5e6b46',
  crema50: '#fcfaf5',
  tinta900: '#2b2925',
  texto: '#2b2925',
  textoMuted: '#78756c',
  borde: '#e6e0d0',
}
