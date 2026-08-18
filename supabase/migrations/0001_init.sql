-- Amena: schema inicial para Eventos, Reservaciones y Facturación.

create table eventos (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  categoria text not null check (categoria in ('Cata', 'Taller', 'Cena')),
  titulo text not null,
  descripcion_corta text not null,
  descripcion_larga text[],
  incluye text[],
  fecha date not null,
  hora_inicio time not null,
  hora_fin time,
  lugar text not null default 'Amena · Mutuo Vive, Guadalajara',
  precio numeric not null,
  cupo_total int not null,
  cupo_disponible int not null,
  estado text not null default 'Borrador' check (estado in ('Publicado', 'Borrador')),
  imagen_url text not null,
  created_at timestamptz not null default now()
);

create table reservaciones (
  id uuid primary key default gen_random_uuid(),
  folio text unique not null,
  evento_id uuid not null references eventos(id),
  nombre text not null,
  email text not null,
  telefono text,
  personas int not null,
  monto numeric not null,
  estado_pago text not null default 'pendiente' check (estado_pago in ('pagada', 'pendiente', 'cancelada')),
  estado_boleto text not null default 'sin usar' check (estado_boleto in ('validado', 'sin usar', 'cancelado')),
  synergy_pay_id text,
  metodo_pago text,
  reservada_el timestamptz not null default now(),
  validada_el timestamptz
);

create index reservaciones_evento_id_idx on reservaciones(evento_id);

create table codigos_consumo (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  folio_ticket text not null,
  fecha timestamptz not null,
  mesa text,
  descripcion text not null,
  items jsonb not null,
  subtotal numeric not null,
  iva numeric not null,
  total numeric not null
);

create table facturas (
  id uuid primary key default gen_random_uuid(),
  folio_fiscal text unique not null,
  codigo_consumo_id uuid not null unique references codigos_consumo(id),
  rfc text not null,
  cp text not null,
  razon_social text not null,
  regimen_fiscal text not null,
  uso_cfdi text not null,
  correo text not null,
  fecha_timbrado timestamptz not null default now()
);

alter table eventos enable row level security;
alter table reservaciones enable row level security;
alter table codigos_consumo enable row level security;
alter table facturas enable row level security;

-- eventos: público solo ve publicados; admin ve y escribe todo.
create policy "eventos_select_publico" on eventos for select to anon using (estado = 'Publicado');
create policy "eventos_select_admin" on eventos for select to authenticated using (true);
create policy "eventos_insert_admin" on eventos for insert to authenticated with check (true);
create policy "eventos_update_admin" on eventos for update to authenticated using (true) with check (true);

-- reservaciones: solo admin lee/edita. La escritura pública pasa por crear_reservacion()
-- (security definer) para descontar cupo de forma atómica; no hay policy de insert para anon.
create policy "reservaciones_select_admin" on reservaciones for select to authenticated using (true);
create policy "reservaciones_update_admin" on reservaciones for update to authenticated using (true) with check (true);

-- codigos_consumo: solo admin lee la tabla directamente; el público consulta por código
-- exacto vía buscar_codigo_consumo() (security definer), sin poder listar todos los códigos.
create policy "codigos_consumo_select_admin" on codigos_consumo for select to authenticated using (true);

-- facturas: solo admin lee la tabla; la emisión pública pasa por emitir_factura()
-- (security definer), que además garantiza "un código, una factura" vía el unique constraint.
create policy "facturas_select_admin" on facturas for select to authenticated using (true);

create or replace function crear_reservacion(
  p_evento_id uuid,
  p_folio text,
  p_nombre text,
  p_email text,
  p_telefono text,
  p_personas int,
  p_monto numeric,
  p_synergy_pay_id text,
  p_metodo_pago text
) returns reservaciones
language plpgsql
security definer
set search_path = public
as $$
declare
  r reservaciones;
begin
  update eventos set cupo_disponible = cupo_disponible - p_personas
    where id = p_evento_id and cupo_disponible >= p_personas;
  if not found then
    raise exception 'CUPO_INSUFICIENTE';
  end if;

  insert into reservaciones (
    folio, evento_id, nombre, email, telefono, personas, monto,
    estado_pago, estado_boleto, synergy_pay_id, metodo_pago
  ) values (
    p_folio, p_evento_id, p_nombre, p_email, p_telefono, p_personas, p_monto,
    'pagada', 'sin usar', p_synergy_pay_id, p_metodo_pago
  )
  returning * into r;

  return r;
end;
$$;

grant execute on function crear_reservacion(uuid, text, text, text, text, int, numeric, text, text) to anon, authenticated;

create or replace function buscar_codigo_consumo(p_codigo text)
returns table (codigo_consumo codigos_consumo, factura_existente facturas)
language sql
security definer
set search_path = public
as $$
  select c, f
  from codigos_consumo c
  left join facturas f on f.codigo_consumo_id = c.id
  where c.codigo = upper(p_codigo);
$$;

grant execute on function buscar_codigo_consumo(text) to anon, authenticated;

create or replace function emitir_factura(
  p_codigo text,
  p_folio_fiscal text,
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
      folio_fiscal, codigo_consumo_id, rfc, cp, razon_social, regimen_fiscal, uso_cfdi, correo
    ) values (
      p_folio_fiscal, v_codigo_id, p_rfc, p_cp, p_razon_social, p_regimen_fiscal, p_uso_cfdi, p_correo
    )
    returning * into f;
  exception
    when unique_violation then
      raise exception 'YA_FACTURADO';
  end;

  return f;
end;
$$;

grant execute on function emitir_factura(text, text, text, text, text, text, text, text) to anon, authenticated;

create or replace function dashboard_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'eventosProximos', (select count(*) from eventos where estado = 'Publicado' and fecha >= current_date),
    'reservacionesActivas', (select count(*) from reservaciones where estado_pago != 'cancelada'),
    'reservacionesSemana', (select count(*) from reservaciones where reservada_el >= now() - interval '7 days'),
    'ingresosMes', (select coalesce(sum(monto), 0) from reservaciones where estado_pago = 'pagada' and date_trunc('month', reservada_el) = date_trunc('month', now())),
    'boletosValidados', (select count(*) from reservaciones where estado_boleto = 'validado'),
    'boletosTotales', (select count(*) from reservaciones where estado_pago != 'cancelada'),
    'recientes', (
      select coalesce(jsonb_agg(x), '[]'::jsonb) from (
        select r.folio, r.nombre, r.personas, r.monto, r.estado_pago as "estadoPago", e.titulo as "eventoTitulo"
        from reservaciones r
        join eventos e on e.id = r.evento_id
        order by r.reservada_el desc
        limit 5
      ) x
    )
  ) into result;
  return result;
end;
$$;

grant execute on function dashboard_stats() to authenticated;
