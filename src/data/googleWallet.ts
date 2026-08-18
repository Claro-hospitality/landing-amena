import { supabase } from '../lib/supabase'

export async function obtenerLinkGoogleWallet(folio: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('google-wallet-boleto', {
    body: { folio },
  })
  if (error) throw new Error(error.message)
  if (data?.error) throw new Error(data.error)
  return data.saveUrl as string
}
