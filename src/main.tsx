import './theme.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PresentacionPage } from './PresentacionPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PresentacionPage />
  </StrictMode>,
)
