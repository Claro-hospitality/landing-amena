-- Integra Facturama real: la factura ya no se genera con un UUID inventado en
-- el cliente, sino con el folio fiscal y el id que devuelve Facturama al timbrar.

alter table facturas add column facturama_id text;

drop function if exists emitir_factura(text, text, text, text, text, text, text, text);

create or replace function emitir_factura(
  p_codigo text,
  p_folio_fiscal text,
  p_facturama_id text,
  p_rfc text,
  p_cp text,
  p_razon_social text,
  p_regimen_fiscal text,
  p_uso_cfdi text,
  p_correo text
) returns facturas
language plpgsql
security definer
set search_path = public
as $$
declare
  v_codigo_id uuid;
  f facturas;
begin
  select id into v_codigo_id from codigos_consumo where codigo = upper(p_codigo);
  if v_codigo_id is null then
    raise exception 'CODIGO_NO_ENCONTRADO';
  end if;

  begin
    insert into facturas (
      folio_fiscal, facturama_id, codigo_consumo_id, rfc, cp, razon_social, regimen_fiscal, uso_cfdi, correo
    ) values (
      p_folio_fiscal, p_facturama_id, v_codigo_id, p_rfc, p_cp, p_razon_social, p_regimen_fiscal, p_uso_cfdi, p_correo
    )
    returning * into f;
  exception
    when unique_violation then
      raise exception 'YA_FACTURADO';
  end;

  return f;
end;
$$;

-- Ahora la emisión real pasa por la Edge Function "facturama" (usa el service
-- role, que ignora estos grants). Ya no debe ser invocable directo con la
-- anon key: eso saltaría el timbrado real ante Facturama.
revoke all on function emitir_factura(text, text, text, text, text, text, text, text, text) from public, anon, authenticated;

-- Mismo razonamiento para crear_reservacion: ahora pasa por la Edge Function
-- "reservar-pago", que cobra primero con Synergy Pay. Bloquear la llamada
-- directa evita crear una reservación "pagada" sin haber cobrado de verdad.
revoke all on function crear_reservacion(uuid, text, text, text, text, int, numeric, text, text) from anon, authenticated;
