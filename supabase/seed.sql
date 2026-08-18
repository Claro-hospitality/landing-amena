-- Datos demo: los mismos 6 eventos, 6 reservaciones y 1 código de consumo que hoy
-- están hardcodeados en src/data/*.ts, para que el panel no arranque vacío.

insert into eventos (slug, categoria, titulo, descripcion_corta, descripcion_larga, incluye, fecha, hora_inicio, hora_fin, precio, cupo_total, cupo_disponible, estado, imagen_url) values
('cata-de-vinos-mexicanos', 'Cata', 'Cata de vinos mexicanos',
 'Seis etiquetas de Valle de Guadalupe y Querétaro con tabla de quesos artesanales.',
 array[
   'Una noche para recorrer seis etiquetas mexicanas de Valle de Guadalupe, Querétaro y Coahuila, guiada por nuestro sommelier. Cada vino se acompaña de un bocado diseñado por la cocina de Amena.',
   'No necesitas experiencia previa: empezamos por lo básico y terminamos comparando dos tintos del mismo productor en distintas añadas.'
 ],
 array[
   'Seis copas de vino mexicano servidas por el sommelier',
   'Tabla de quesos y embutidos artesanales para compartir',
   'Guía impresa de cata con notas de cada etiqueta',
   '10% de descuento en botellas para llevar esa noche'
 ],
 date '2026-08-15', time '19:00', time '21:30', 850, 24, 12, 'Publicado',
 'https://images.unsplash.com/photo-1612434644608-cc99f79cd818?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080'),

('metodos-de-cafe-v60-y-chemex', 'Taller', 'Métodos de café: V60 y Chemex',
 'Taller práctico de extracción con café de altura de Chiapas y Veracruz.',
 null, null,
 date '2026-08-23', time '10:00', null, 450, 24, 8, 'Publicado',
 'https://images.unsplash.com/photo-1678275713046-1b92f108c165?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080'),

('cata-de-cervezas-artesanales', 'Cata', 'Cata de cervezas artesanales',
 'Ocho cervezas de cervecerías tapatías acompañadas de botanas de la casa.',
 null, null,
 date '2026-08-28', time '20:00', null, 520, 24, 20, 'Publicado',
 'https://images.unsplash.com/photo-1649798584143-11549c12a7ea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080'),

('cena-maridaje-de-otono', 'Cena', 'Cena maridaje de otoño',
 'Cinco tiempos del chef con maridaje de vino tinto y destilados de agave.',
 null, null,
 date '2026-09-05', time '20:30', null, 1290, 24, 6, 'Borrador',
 'https://images.unsplash.com/photo-1703565426315-4209c2e88eea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080'),

('taller-de-pasta-fresca', 'Taller', 'Taller de pasta fresca',
 'Amasado, laminado y dos salsas clásicas. Te llevas tu pasta a casa.',
 null, null,
 date '2026-09-12', time '12:00', null, 690, 20, 14, 'Publicado',
 'https://images.unsplash.com/photo-1747503251744-eea682c0791a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080'),

('mezcal-y-chocolate', 'Cata', 'Mezcal y chocolate',
 'Cuatro mezcales de Oaxaca con chocolate de origen mexicano.',
 null, null,
 date '2026-09-17', time '19:30', null, 600, 18, 16, 'Publicado',
 'https://images.unsplash.com/photo-1646257101018-8831bdfbef3e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080');

insert into reservaciones (folio, evento_id, nombre, email, telefono, personas, monto, estado_pago, estado_boleto, synergy_pay_id, metodo_pago, reservada_el, validada_el) values
('AMN-EV-2026-00418', (select id from eventos where slug = 'cata-de-vinos-mexicanos'), 'Mariana Robles Estrada', 'mariana.robles@gmail.com', '33 1284 9077', 2, 1700, 'pagada', 'validado', 'sp_tx_9F2C10A4', 'Tarjeta ···· 4242', '2026-08-02 18:42:00-06', '2026-08-15 19:04:00-06'),
('AMN-EV-2026-00417', (select id from eventos where slug = 'cata-de-vinos-mexicanos'), 'Javier Cortés Nuño', 'j.cortes@outlook.com', null, 1, 850, 'pagada', 'sin usar', null, null, '2026-08-01 11:20:00-06', null),
('AMN-EV-2026-00415', (select id from eventos where slug = 'cata-de-vinos-mexicanos'), 'Ana Villaseñor Ríos', 'ana.vr@hey.com', null, 4, 3400, 'pagada', 'validado', null, null, '2026-07-31 20:05:00-06', '2026-08-15 19:02:00-06'),
('AMN-EV-2026-00412', (select id from eventos where slug = 'cata-de-vinos-mexicanos'), 'Luis Tapia Mora', 'luis.tapia@gmail.com', null, 2, 1700, 'pendiente', 'sin usar', null, null, '2026-07-30 09:14:00-06', null),
('AMN-EV-2026-00409', (select id from eventos where slug = 'cata-de-vinos-mexicanos'), 'Sofía Mendoza León', 'sofia.ml@gmail.com', null, 2, 1700, 'pagada', 'sin usar', null, null, '2026-07-28 17:30:00-06', null),
('AMN-EV-2026-00404', (select id from eventos where slug = 'cata-de-vinos-mexicanos'), 'Rodrigo Gámez Ávila', 'rgamez@empresa.mx', null, 1, 850, 'cancelada', 'cancelado', null, null, '2026-07-25 08:52:00-06', null);

insert into codigos_consumo (codigo, folio_ticket, fecha, mesa, descripcion, items, subtotal, iva, total) values
('AMN-4F72-9C10', 'T-2026-08-0412', '2026-08-02 14:32:00-06', '12',
 'Servicio de comedor — 2 comidas corridas, bebidas y postre',
 '[{"descripcion":"2 × Comida corrida","monto":380},{"descripcion":"1 × Agua de jamaica","monto":55},{"descripcion":"1 × Postre del día","monto":95}]'::jsonb,
 530, 84.8, 614.8),
('AMN-7B31-E204', 'T-2026-08-0455', '2026-08-03 13:15:00-06', '5',
 'Comida ejecutiva para 3 personas con bebidas y postre',
 '[{"descripcion":"3 × Comida ejecutiva","monto":630},{"descripcion":"2 × Limonada natural","monto":90},{"descripcion":"1 × Flan napolitano","monto":65}]'::jsonb,
 785, 125.6, 910.6),
('AMN-9C88-1A57', 'T-2026-08-0461', '2026-08-03 09:40:00-06', 'Barra',
 'Desayuno para 2 personas',
 '[{"descripcion":"2 × Chilaquiles verdes","monto":330},{"descripcion":"2 × Café americano","monto":96},{"descripcion":"1 × Jugo de naranja","monto":55}]'::jsonb,
 481, 76.96, 557.96),
('AMN-2E40-B913', 'T-2026-08-0470', '2026-08-02 21:10:00-06', 'Terraza 2',
 'Cena para 4 personas con maridaje',
 '[{"descripcion":"4 × Corte de res a la parrilla","monto":1540},{"descripcion":"4 × Copa de vino tinto","monto":480},{"descripcion":"2 × Postre de temporada","monto":190}]'::jsonb,
 2210, 353.6, 2563.6),
('AMN-D615-77FA', 'T-2026-08-0483', '2026-08-04 14:05:00-06', '8',
 'Comida ligera para 1 persona',
 '[{"descripcion":"1 × Ensalada Amena","monto":175},{"descripcion":"1 × Agua mineral","monto":35}]'::jsonb,
 210, 33.6, 243.6);
