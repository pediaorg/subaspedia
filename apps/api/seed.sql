-- ============================================================================
-- seed.sql — Datos de prueba del dominio Subaspedia (DB local de D1)
--
-- Correr desde la raíz del repo:
--   pnpm wrangler d1 execute subaspedia-db --local --file apps/api/seed.sql
-- o desde apps/api:
--   pnpm wrangler d1 execute subaspedia-db --local --file ./seed.sql
--
-- Re-ejecutable: borra todo y reinserta (idempotente).
--
-- NOTA (refactor nombres ES): las tablas y columnas físicas de la DB están en
-- español (estructura original, ver EstructuraActual.sql). Los nombres lógicos
-- del código TS siguen en inglés; el mapeo vive en src/db/schema.ts.
--
-- Escenario armado:
--   * María Pérez (empleada / verificadora / revisora / jefa de sector)
--   * Carlos Gómez (subastador)
--   * Juan Casablanca (cliente GOLD, es el usuario logueable)
--   * Ana López (cliente común, segunda postora)
--   * Lucía Fernández (dueña de los bienes)
--   * 1 subasta GOLD futura con catálogo de productos
--   * 2 postores con pujas; Juan gana el reloj -> queda en registroDeSubasta
--   * 1 medio de pago verificado para Juan (habilita pujar / claim del JWT)
--   * 1 usuario logueable: juancasablanca@jamon.com / password123
--   * Juan también es OWNER: 4 productos propios (productos 3-6) que cubren los
--     estados de "Mis productos" sin propuesta (under_review/approved/rejected/
--     auctioned). Sirven para GET /products del perfil.
--
-- NOTA (refactor 2026-06-01): ya no existe la tabla `users`. Las credenciales
-- (email + hashContrasenia) viven en `personas`. El usuario logueable ES la
-- persona Juan (personas.identificador = 3). El check chk_credentials exige que
-- email y hashContrasenia estén ambos seteados o ambos NULL.
-- ============================================================================

PRAGMA foreign_keys = OFF;

-- ---- Limpieza (orden inverso a las dependencias FK) ------------------------
DELETE FROM registroDeSubasta;
DELETE FROM pujos;
DELETE FROM asistentes;
DELETE FROM itemsCatalogo;
DELETE FROM catalogos;
DELETE FROM fotos;
DELETE FROM productos;
DELETE FROM monedasSubasta;
DELETE FROM subastas;
DELETE FROM subastadores;
DELETE FROM duenios;
DELETE FROM mediosDePago;
DELETE FROM clientes;
DELETE FROM seguros;
DELETE FROM sectores;
DELETE FROM empleados;
DELETE FROM personas;
DELETE FROM paises;
DELETE FROM verificacionesEmail;

-- ---- paises (countries) ----------------------------------------------------
INSERT INTO paises (numero, nombre, nombreCorto, capital, nacionalidad, idiomas) VALUES
  (1, 'Argentina',      'AR', 'Buenos Aires',    'argentina',      'es'),
  (2, 'Brasil',         'BR', 'Brasilia',        'brasileña',      'pt'),
  (3, 'Estados Unidos', 'US', 'Washington D.C.', 'estadounidense', 'en');

-- ---- personas (people; su identificador se reutiliza como PK en empleados/clientes/duenios/subastadores)
-- Solo Juan (id 3) tiene credenciales -> es el único logueable. El resto va
-- con email/hashContrasenia en NULL (lo exige el check chk_credentials).
-- Hash de 'password123': PBKDF2 (mismo esquema que src/lib/auth/index.ts).
-- nombre y apellido van separados (la columna apellido se agregó para el perfil).
INSERT INTO personas (identificador, documento, nombre, apellido, direccion, estado, email, hashContrasenia) VALUES
  (1, '20111222', 'María',  'Pérez',     'Av. Corrientes 1234', 'active', NULL, NULL),
  (2, '20333444', 'Carlos', 'Gómez',     'Calle Falsa 123',     'active', NULL, NULL),
  (3, '12345678', 'Juan',   'Casablanca','Lima 970',            'active',
     'juancasablanca@jamon.com',
     'pbkdf2$100000$cbd1d69840c1790f0188bca9cae16cce$761bb62aa9686ce177dcd80e4dfbbec761ed08dc295cdab01221f3dedb2cc9d3'),
  (4, '27888999', 'Lucía',  'Fernández', 'San Martín 456',      'active', NULL, NULL),
  (5, '30555666', 'Ana',    'López',     'Belgrano 789',        'active', NULL, NULL);

-- ---- empleados (employees; FK -> personas) ---------------------------------
INSERT INTO empleados (identificador, cargo, sector) VALUES
  (1, 'verificador', 1);

-- ---- sectores (sectors; FK -> empleados) -----------------------------------
INSERT INTO sectores (identificador, nombreSector, codigoSector, responsableSector) VALUES
  (1, 'Verificaciones', 'VER', 1);

-- ---- seguros (insurances; check: importe > 0) ------------------------------
INSERT INTO seguros (nroPoliza, compania, polizaCombinada, importe) VALUES
  ('POL-001', 'La Seguridad Seguros', 0, 180000);

-- ---- clientes (clients; FK -> personas, paises, empleados; check: categoria enum)
INSERT INTO clientes (identificador, numeroPais, admitido, categoria, verificador) VALUES
  (3, 1, 1, 'gold',   1),
  (5, 1, 1, 'common', 1);

-- ---- mediosDePago (payment_methods; FK -> clientes; checks: tipo enum) ------
-- Juan (cliente 3) tiene un medio de pago verificado -> puede pujar y el JWT
-- arranca con hasVerifiedPaymentMethod = true.
INSERT INTO mediosDePago (identificador, cliente, tipo, verificado, detalles) VALUES
  (1, 3, 'credit_card', 1, 'Tarjeta de crédito local (Visa)');

-- ---- duenios (owners; FK -> personas, paises, empleados; check: calificacionRiesgo 1..6)
-- Juan (personas.identificador=3) es cliente GOLD y ADEMÁS dueño: vende bienes
-- por la app. Por eso aparece tanto en `clientes` como en `duenios`.
INSERT INTO duenios (identificador, numeroPais, verificacionFinanciera, verificacionJudicial, calificacionRiesgo, verificador) VALUES
  (3, 1, 1, 1, 2, 1),
  (4, 1, 1, 1, 2, 1);

-- ---- subastadores (auctioneers; FK -> personas) ----------------------------
INSERT INTO subastadores (identificador, matricula, region) VALUES
  (2, 'LIC-001', 'CABA');

-- ---- subastas (auctions; FK -> subastadores) -------------------------------
-- La regla "fecha > hoy + 10 días" ya NO se valida en la DB (sin trigger).
-- Cuando exista POST /auctions, validarla en el zod del input.
INSERT INTO subastas (identificador, fecha, hora, estado, subastador, ubicacion, capacidadAsistentes, tieneDeposito, seguridadPropia, categoria) VALUES
  (1, '2027-03-01', '18:00', 'open', 2, 'Salón Central', 100, 1, 1, 'gold'),
  (2, '2027-04-15', '17:00', 'open', 2, 'Salón Norte',   80,  1, 1, 'common');

-- ---- monedasSubasta (auction_currencies) — tabla satélite de moneda ---------
-- Cada subasta es en ARS o USD (nunca bimonetaria). La lectura usa LEFT JOIN +
-- COALESCE(moneda, 'ARS'), así que una subasta SIN fila acá cae al default ARS.
INSERT INTO monedasSubasta (subasta, moneda) VALUES
  (1, 'ARS'),
  (2, 'USD');

-- ---- productos (products; FK -> empleados(revisor), duenios, seguros) -------
-- `nombre` es NOT NULL en el schema (título corto del bien para el catálogo).
INSERT INTO productos (identificador, fecha, disponible, descripcionCatalogo, descripcionCompleta, revisor, duenio, seguro, nombre) VALUES
  (1, '2026-11-01', 1, 'Reloj de bolsillo siglo XIX', 'Reloj de bolsillo de oro, siglo XIX, en excelente estado de conservación.', 1, 4, 'POL-001', 'Reloj de bolsillo de oro'),
  (2, '2026-11-05', 1, 'Óleo sobre tela',             'Paisaje al óleo sobre tela, autor anónimo, con marco original.',          1, 4, NULL,      'Óleo sobre tela'),
  -- Productos subidos por Juan (dueño 3). Cubren los estados que ve "Mis
  -- productos" sin pasar por la propuesta (no hay ninguno 'tasado'/appraised):
  --   3 -> sin itemCatalogo        => under_review (recién subido, en tasación)
  --   4 -> itemCatalogo 'aceptado'  => approved
  --   5 -> itemCatalogo 'rechazado' => rejected
  --   6 -> itemCatalogo 'subastado' => auctioned (+ registroDeSubasta con la venta)
  (3, '2026-06-06', 0, 'None',                 'Cámara de fotos vintage en su estuche original de cuero.', NULL, 3, NULL, 'Cámara vintage'),
  (4, '2026-06-02', 1, 'Guitarra criolla',     'Guitarra criolla de luthier, caja de cedro macizo.',       1,    3, NULL, 'Guitarra criolla'),
  (5, '2026-05-20', 0, 'None',                 'Cuadro de paisaje al óleo, sin firma identificable.',      1,    3, NULL, 'Cuadro sin firma'),
  (6, '2026-04-10', 1, 'Vajilla de porcelana', 'Vajilla de porcelana Limoges, juego de 12 cubiertos.',     1,    3, NULL, 'Vajilla Limoges'),
  -- Producto de la subasta 2 (USD): le da contenido al catálogo en dólares.
  (7, '2026-12-01', 1, 'Moneda de colección',  'Moneda de colección estadounidense de plata, edición limitada.', 1, 4, NULL, 'Moneda de colección');

-- ---- fotos (photos; FK -> productos; foto es BLOB NOT NULL, placeholder PNG header)
INSERT INTO fotos (identificador, producto, foto) VALUES
  (1, 1, x'89504e470d0a1a0a'),
  (2, 2, x'89504e470d0a1a0a'),
  (3, 3, x'89504e470d0a1a0a'),
  (4, 4, x'89504e470d0a1a0a'),
  (5, 5, x'89504e470d0a1a0a'),
  (6, 6, x'89504e470d0a1a0a'),
  (7, 7, x'89504e470d0a1a0a');

-- ---- catalogos (catalogs; FK -> subastas, empleados(responsable)) ----------
INSERT INTO catalogos (identificador, descripcion, subasta, responsable) VALUES
  (1, 'Catálogo Subasta Marzo 2027', 1, 1),
  (2, 'Catálogo Subasta Abril 2027 (USD)', 2, 1);

-- ---- itemsCatalogo (catalog_items; FK -> catalogos, productos; checks: precioBase/comision > 0.01)
-- `estado` (enum) reemplazó a la vieja columna `subastado`. El reloj (item 1) ya
-- se remató -> 'subastado'; el óleo (item 2) está aceptado y a la espera -> 'aceptado'.
INSERT INTO itemsCatalogo (identificador, catalogo, producto, precioBase, comision, estado) VALUES
  (1, 1, 1, 180000, 12, 'subastado'),
  (2, 1, 2, 90000,  10, 'aceptado'),
  -- itemsCatalogo de los productos de Juan (le dan su `status` a "Mis productos").
  (3, 1, 4, 50000,  10, 'aceptado'),
  (4, 1, 5, 30000,  10, 'rechazado'),
  (5, 1, 6, 120000, 12, 'subastado'),
  -- Item del catálogo USD (subasta 2): precioBase y comisión en dólares.
  (6, 2, 7, 1500, 5, 'aceptado');

-- ---- asistentes (attendees; FK -> clientes, subastas) ----------------------
INSERT INTO asistentes (identificador, numeroPostor, cliente, subasta) VALUES
  (1, 101, 3, 1),
  (2, 102, 5, 1);

-- ---- pujos (bids; FK -> asistentes, itemsCatalogo; check: importe > 0.01) ---
-- Juan (asistente 1) gana el reloj (item 1) con la oferta más alta.
INSERT INTO pujos (identificador, asistente, item, importe, ganador) VALUES
  (1, 1, 1, 185000, 1),
  (2, 2, 1, 182000, 0);

-- ---- registroDeSubasta (auction_records; FK -> subastas, duenios, productos, clientes; checks > 0.01)
-- Venta registrada: el reloj (producto 1) de Lucía (dueño 4) se lo lleva Juan (cliente 3).
INSERT INTO registroDeSubasta (identificador, subasta, duenio, producto, cliente, importe, comision) VALUES
  (1, 1, 4, 1, 3, 185000, 12),
  -- La vajilla (producto 6) de Juan (dueño 3) se la lleva Ana (cliente 5).
  -- Da salePrice/saleDate a su card "Subastado" (saleDate = subastas.fecha).
  (2, 1, 3, 6, 5, 135000, 12);

PRAGMA foreign_keys = ON;
