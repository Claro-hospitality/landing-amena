import './theme.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { PresentacionPage } from './PresentacionPage'
import { MenuPage } from './MenuPage'
import { EventosPage } from './EventosPage'
import { EventoDetallePage } from './EventoDetallePage'
import { ReservaPage } from './ReservaPage'
import { BoletoPage } from './BoletoPage'
import { FacturacionPage } from './FacturacionPage'
import { FacturaPage } from './FacturaPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PresentacionPage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/eventos" element={<EventosPage />} />
        <Route path="/eventos/:slug" element={<EventoDetallePage />} />
        <Route path="/eventos/:slug/reservar" element={<ReservaPage />} />
        <Route path="/boleto/:folio" element={<BoletoPage />} />
        <Route path="/facturar" element={<FacturacionPage />} />
        <Route path="/factura/:folioFiscal" element={<FacturaPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
