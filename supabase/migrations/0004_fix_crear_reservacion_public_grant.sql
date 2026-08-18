-- La revocación en 0003 olvidó el rol PUBLIC: toda función nueva otorga EXECUTE
-- a PUBLIC por defecto, y anon/authenticated heredan de PUBLIC aunque se les
-- revoque el grant explícito a ellos. Mismo problema ya visto con dashboard_stats().
revoke all on function crear_reservacion(uuid, text, text, text, text, int, numeric, text, text) from public;
