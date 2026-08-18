-- Postgres otorga EXECUTE a PUBLIC por defecto en funciones nuevas; dashboard_stats()
-- expone ingresos y conteos reales y solo debe poder llamarla el admin autenticado.
revoke all on function dashboard_stats() from public;
revoke all on function dashboard_stats() from anon;
grant execute on function dashboard_stats() to authenticated;
