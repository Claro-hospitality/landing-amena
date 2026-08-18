import { PDFDownloadLink } from '@react-pdf/renderer'
import { BoletoPdf } from './BoletoPdf'
import type { Evento } from '../data/eventos'

export function BoletoDescargaPdf({
  className,
  ...props
}: {
  evento: Evento
  datos: { nombre: string; asistentes: number }
  folio: string
  total: number
  ultimosDigitos: string
  fechaCompraFmt: string
  qrDataUrl: string
  className?: string
}) {
  return (
    <PDFDownloadLink document={<BoletoPdf {...props} />} fileName={`boleto-${props.folio}.pdf`} className={className}>
      {({ loading }) => (loading ? 'Preparando PDF…' : 'Descargar boleto en PDF')}
    </PDFDownloadLink>
  )
}
