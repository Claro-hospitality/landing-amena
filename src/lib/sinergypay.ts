export type SinergyPayOtpData = {
  sessionId: string
  nextActionUrl?: string
  accessToken?: string
  stepUpUrl?: string
  stepUpJwt?: string
}

export type ResultadoPago = { status: 'success'; folio: string } | { status: 'otp_required'; otpData: SinergyPayOtpData }

type SinergyPayInitResult = {
  rc: number
  msg?: string
  data?: { session_id: string }
}

declare global {
  // El SDK declara `class Sinergypay3ds` (nótese la "p" minúscula en "pay", distinto
  // de la doc de referencia que usa "SinergyPay3ds") a nivel superior de un script
  // clásico — eso vive en el scope léxico global, NO como propiedad de `window`.
  // Mismo caso que el widget de tokenización anterior: se referencia como
  // identificador global suelto, no `window.Sinergypay3ds`.
  const Sinergypay3ds: {
    init: (opts: {
      sandboxMode: boolean
      apiKey: string
      initCallbackSuccess: (result: SinergyPayInitResult) => void
      initCallbackError: (error: unknown) => void
    }) => void
    verify: (opts: {
      nextActionUrl?: string
      accessToken?: string
      setUpUrl?: string
      setUpJwt?: string
      container: HTMLElement
      callbackResult: () => void
    }) => void
  }
}

let scriptPromise: Promise<void> | null = null

function cargarSinergyPay3dsSdk(): Promise<void> {
  if (typeof Sinergypay3ds !== 'undefined') return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://media.sinergypay.mx/js/cards/sinergypay-3ds.min.js'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('No se pudo cargar el SDK de Synergy Pay'))
    document.body.appendChild(script)
  })
  return scriptPromise
}

export async function iniciarSesionSinergyPay3ds(apiKeyPublica: string): Promise<string> {
  await cargarSinergyPay3dsSdk()
  return new Promise<string>((resolve, reject) => {
    Sinergypay3ds.init({
      sandboxMode: true,
      apiKey: apiKeyPublica,
      initCallbackSuccess: (result) => {
        const sessionId = result?.data?.session_id
        if (!sessionId) {
          reject(new Error('Sinergypay3ds.init no devolvió session_id'))
          return
        }
        resolve(sessionId)
      },
      initCallbackError: reject,
    })
  })
}

export function montarVerificacionSinergyPay3ds(
  otpData: SinergyPayOtpData,
  container: HTMLElement,
  alTerminar: () => void
) {
  Sinergypay3ds.verify({
    nextActionUrl: otpData.nextActionUrl,
    accessToken: otpData.accessToken,
    setUpUrl: otpData.stepUpUrl,
    setUpJwt: otpData.stepUpJwt,
    container,
    callbackResult: alTerminar,
  })
}
