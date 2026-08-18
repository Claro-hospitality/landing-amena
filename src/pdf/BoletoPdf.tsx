import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import type { Evento } from '../data/eventos'
import { COLORES } from './colores'

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, color: COLORES.texto },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORES.borde,
    paddingBottom: 16,
    marginBottom: 20,
  },
  marca: { fontSize: 16, fontWeight: 700, color: COLORES.naranja500 },
  muted: { color: COLORES.textoMuted, fontSize: 9, marginTop: 2 },
  headerRight: { alignItems: 'flex-end' },
  label: { fontSize: 8, textTransform: 'uppercase', color: COLORES.textoMuted, letterSpacing: 1 },
  folio: { fontSize: 11, fontWeight: 700, marginTop: 2 },
  badge: {
    marginTop: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: COLORES.salvia100,
    color: COLORES.salvia700,
    fontSize: 8,
    fontWeight: 700,
  },
  bodyRow: { flexDirection: 'row', gap: 24 },
  categoria: { fontSize: 8, textTransform: 'uppercase', color: COLORES.naranja700, letterSpacing: 1 },
  titulo: { fontSize: 18, fontWeight: 700, marginTop: 4, marginBottom: 14 },
  datosGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dato: { width: '50%', marginBottom: 10 },
  datoEtiqueta: { fontSize: 7, textTransform: 'uppercase', color: COLORES.textoMuted, letterSpacing: 1 },
  datoValor: { fontSize: 10, marginTop: 2 },
  qrBox: {
    width: 140,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: COLORES.tinta900,
  },
  qrImagen: { width: 100, height: 100, backgroundColor: COLORES.crema50, padding: 6, borderRadius: 4 },
  qrCaption: { fontSize: 7, color: COLORES.crema50, textAlign: 'center' },
  seccion: { borderTopWidth: 1, borderTopColor: COLORES.borde, paddingTop: 16, marginTop: 20 },
  seccionTitulo: { fontSize: 8, textTransform: 'uppercase', color: COLORES.textoMuted, letterSpacing: 1, marginBottom: 8 },
  incluyeItem: { width: '50%', fontSize: 10, marginBottom: 4 },
  pagoGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  aviso: { fontSize: 8, color: COLORES.textoMuted, lineHeight: 1.5 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  footerTexto: { fontSize: 8, color: COLORES.textoMuted },
})

export function BoletoPdf({
  evento,
  datos,
  folio,
  total,
  ultimosDigitos,
  fechaCompraFmt,
  qrDataUrl,
}: {
  evento: Evento
  datos: { nombre: string; asistentes: number }
  folio: string
  total: number
  ultimosDigitos: string
  fechaCompraFmt: string
  qrDataUrl: string
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.marca}>amena</Text>
            <Text style={styles.muted}>Restaurante · Mutuo Vive, Guadalajara</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.label}>Boleto de evento</Text>
            <Text style={styles.folio}>{folio}</Text>
            <Text style={styles.badge}>PAGADA</Text>
          </View>
        </View>

        <View style={styles.bodyRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.categoria}>{evento.categoria} · Evento abierto al público</Text>
            <Text style={styles.titulo}>{evento.titulo}</Text>
            <View style={styles.datosGrid}>
              <Dato etiqueta="Fecha" valor={evento.fechaLarga} />
              <Dato etiqueta="Hora" valor={evento.horario} />
              <Dato etiqueta="Asistente" valor={datos.nombre || '—'} />
              <Dato etiqueta="Asistentes" valor={`${datos.asistentes} personas`} />
              <Dato etiqueta="Lugar" valor={evento.lugar} />
              <Dato etiqueta="Folio" valor={folio} />
            </View>
          </View>
          <View style={styles.qrBox}>
            <Image src={qrDataUrl} style={styles.qrImagen} />
            <Text style={styles.qrCaption}>Presenta este código en la entrada</Text>
          </View>
        </View>

        {evento.incluye && (
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>Tu boleto incluye</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {evento.incluye.map((item) => (
                <Text key={item} style={styles.incluyeItem}>
                  · {item}
                </Text>
              ))}
            </View>
          </View>
        )}

        <View style={styles.seccion}>
          <View style={styles.pagoGrid}>
            <Dato etiqueta="Subtotal" valor={`$${total.toLocaleString('es-MX')} MXN`} ancho="25%" />
            <Dato etiqueta="Método de pago" valor={`Tarjeta ···· ${ultimosDigitos} · Synergy Pay`} ancho="25%" />
            <Dato etiqueta="Fecha de compra" valor={fechaCompraFmt} ancho="25%" />
            <Dato etiqueta="Total pagado" valor={`$${total.toLocaleString('es-MX')} MXN`} ancho="25%" />
          </View>
        </View>

        <View style={styles.seccion}>
          <Text style={styles.aviso}>
            Cancelación sin costo hasta 48 h antes del evento. Después de ese plazo el cargo no es
            reembolsable, pero puedes transferir tu lugar a otra persona avisando a hola@amena.mx.
            Este boleto es válido para una sola entrada y admite el número de asistentes indicado
            arriba.
          </Text>
          <View style={styles.footerRow}>
            <Text style={styles.footerTexto}>amena.mx · hola@amena.mx · 33 1284 9077</Text>
            <Text style={styles.footerTexto}>Sabores reales, momentos reales.</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}

function Dato({ etiqueta, valor, ancho }: { etiqueta: string; valor: string; ancho?: string }) {
  return (
    <View style={[styles.dato, { width: ancho ?? '50%' }]}>
      <Text style={styles.datoEtiqueta}>{etiqueta}</Text>
      <Text style={styles.datoValor}>{valor}</Text>
    </View>
  )
}
