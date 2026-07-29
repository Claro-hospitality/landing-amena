import './theme.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PresentacionPage } from './PresentacionPage'
import { MenuPage } from './MenuPage'

// Enrutado mínimo por ruta (sin dependencias): el sitio solo tiene dos páginas.
// Firebase Hosting reescribe cualquier ruta a index.html, así que /menu carga
// esta app y aquí decidimos qué página mostrar.
const ruta = window.location.pathname.replace(/\/+$/, '')
const Pagina = ruta === '/menu' ? MenuPage : PresentacionPage

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Pagina />
  </StrictMode>,
)
