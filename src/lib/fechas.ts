const DIAS_ABREV = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB']
const MESES_ABREV = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']
const DIAS_LARGO = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const MESES_LARGO = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]
const DIAS_CORTO = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MESES_CORTO = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

function parseFecha(fecha: string) {
  const [anio, mes, dia] = fecha.split('-').map(Number)
  return { anio, mes: mes - 1, dia, fechaObj: new Date(anio, mes - 1, dia) }
}

function formatHora(hora: string) {
  return hora.slice(0, 5)
}

export function formatFechaBadge(fecha: string, horaInicio: string) {
  const { dia, mes, fechaObj } = parseFecha(fecha)
  return `${DIAS_ABREV[fechaObj.getDay()]} ${dia} ${MESES_ABREV[mes]} · ${formatHora(horaInicio)}`
}

export function formatFechaLarga(fecha: string) {
  const { anio, mes, dia, fechaObj } = parseFecha(fecha)
  const diaSemana = DIAS_LARGO[fechaObj.getDay()]
  return `${diaSemana[0].toUpperCase()}${diaSemana.slice(1)} ${dia} de ${MESES_LARGO[mes]}, ${anio}`
}

export function formatHorario(horaInicio: string, horaFin: string | null) {
  return horaFin ? `${formatHora(horaInicio)} — ${formatHora(horaFin)} h` : `${formatHora(horaInicio)} h`
}

export function formatPrecioLabel(precio: number) {
  return `$${precio.toLocaleString('es-MX')} / persona`
}

export function formatEventoFecha(fecha: string, horaInicio: string) {
  const { dia, mes, anio, fechaObj } = parseFecha(fecha)
  return `${DIAS_CORTO[fechaObj.getDay()]} ${dia} ${MESES_CORTO[mes]} ${anio} · ${formatHora(horaInicio)} h`
}

export function formatFechaHoraLarga(iso: string) {
  const d = new Date(iso)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${d.getDate()} de ${MESES_LARGO[d.getMonth()]} de ${d.getFullYear()}, ${hh}:${mm} h`
}

export function formatFechaHora(iso: string) {
  const d = new Date(iso)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${d.getDate()} ${MESES_CORTO[d.getMonth()]} ${d.getFullYear()}, ${hh}:${mm} h`
}
