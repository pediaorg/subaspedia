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
-- Escenario armado:
--   * María Pérez (empleada / verificadora / revisora / jefa de sector)
--   * Carlos Gómez (subastador)
--   * Juan Casablanca (cliente GOLD, es el usuario logueable)
--   * Ana López (cliente común, segunda postora)
--   * Lucía Fernández (dueña de los bienes)
--   * 1 subasta GOLD futura con catálogo de productos
--   * 2 postores con pujas; Juan gana el reloj -> queda en auction_records
--   * 1 medio de pago verificado para Juan (habilita pujar / claim del JWT)
--   * 1 usuario logueable: juancasablanca@jamon.com / password123
--   * Juan también es OWNER: 4 productos propios (products 3-6) que cubren los
--     estados de "Mis productos" sin propuesta (under_review/approved/rejected/
--     auctioned). Sirven para GET /products del perfil.
--
-- NOTA (refactor 2026-06-01): ya no existe la tabla `users`. Las credenciales
-- (email + password_hash) viven en `people`. El usuario logueable ES la
-- persona Juan (people.id = 3). El check chk_credentials exige que email y
-- password_hash estén ambos seteados o ambos NULL.
-- ============================================================================

PRAGMA foreign_keys = OFF;

-- ---- Limpieza (orden inverso a las dependencias FK) ------------------------
DELETE FROM auction_records;
DELETE FROM bids;
DELETE FROM attendees;
DELETE FROM catalog_items;
DELETE FROM catalogs;
DELETE FROM photos;
DELETE FROM products;
DELETE FROM auctions;
DELETE FROM auctioneers;
DELETE FROM owners;
DELETE FROM payment_methods;
DELETE FROM clients;
DELETE FROM insurances;
DELETE FROM sectors;
DELETE FROM employees;
DELETE FROM people;
DELETE FROM countries;
DELETE FROM email_verifications;

-- ---- countries -------------------------------------------------------------
INSERT INTO countries (id, name, short_name, capital, nationality, languages) VALUES
  (1, 'Argentina',      'AR', 'Buenos Aires',    'argentina',      'es'),
  (2, 'Brasil',         'BR', 'Brasilia',        'brasileña',      'pt'),
  (3, 'Estados Unidos', 'US', 'Washington D.C.', 'estadounidense', 'en');

-- ---- people (su id se reutiliza como PK en employees/clients/owners/auctioneers)
-- Solo Juan (id 3) tiene credenciales -> es el único logueable. El resto va
-- con email/password_hash en NULL (lo exige el check chk_credentials).
-- Hash de 'password123': PBKDF2 (mismo esquema que src/lib/auth/index.ts).
-- name y last_name van separados (la columna last_name se agregó para el perfil).
INSERT INTO people (id, document, name, last_name, address, status, email, password_hash) VALUES
  (1, '20111222', 'María',  'Pérez',     'Av. Corrientes 1234', 'active', NULL, NULL),
  (2, '20333444', 'Carlos', 'Gómez',     'Calle Falsa 123',     'active', NULL, NULL),
  (3, '12345678', 'Juan',   'Casablanca','Lima 970',            'active',
     'juancasablanca@jamon.com',
     'pbkdf2$100000$cbd1d69840c1790f0188bca9cae16cce$761bb62aa9686ce177dcd80e4dfbbec761ed08dc295cdab01221f3dedb2cc9d3'),
  (4, '27888999', 'Lucía',  'Fernández', 'San Martín 456',      'active', NULL, NULL),
  (5, '30555666', 'Ana',    'López',     'Belgrano 789',        'active', NULL, NULL);

-- ---- employees (FK -> people) ----------------------------------------------
INSERT INTO employees (id, position, sector_id) VALUES
  (1, 'verificador', 1);

-- ---- sectors (FK -> employees) ---------------------------------------------
INSERT INTO sectors (id, sector_name, sector_code, sector_manager_id) VALUES
  (1, 'Verificaciones', 'VER', 1);

-- ---- insurances (check: amount > 0) ----------------------------------------
INSERT INTO insurances (policy_number, company, combined_policy, amount) VALUES
  ('POL-001', 'La Seguridad Seguros', 0, 180000);

-- ---- clients (FK -> people, countries, employees; check: category enum) ----
INSERT INTO clients (id, country_id, admitted, category, verifier_id) VALUES
  (3, 1, 1, 'gold',   1),
  (5, 1, 1, 'common', 1);

-- ---- payment_methods (FK -> clients; checks: type/currency enum) -----------
-- Juan (client 3) tiene un medio de pago verificado -> puede pujar y el JWT
-- arranca con hasVerifiedPaymentMethod = true.
INSERT INTO payment_methods (id, client_id, type, verified, details) VALUES
  (1, 3, 'credit_card', 1, 'Tarjeta de crédito local (Visa)');

-- ---- owners (FK -> people, countries, employees; check: risk_rating 1..6) --
-- Juan (people.id=3) es client GOLD y ADEMÁS owner: vende bienes por la app.
-- Por eso aparece tanto en `clients` como en `owners` (mismo people.id).
INSERT INTO owners (id, country_id, financial_verification, judicial_verification, risk_rating, verifier_id) VALUES
  (3, 1, 1, 1, 2, 1),
  (4, 1, 1, 1, 2, 1);

-- ---- auctioneers (FK -> people) --------------------------------------------
INSERT INTO auctioneers (id, license, region) VALUES
  (2, 'LIC-001', 'CABA');

-- ---- auctions (FK -> auctioneers) ------------------------------------------
-- La regla "fecha > hoy + 10 días" ya NO se valida en la DB (sin trigger).
-- Cuando exista POST /auctions, validarla en el zod del input.
INSERT INTO auctions (id, date, time, status, auctioneer_id, location, attendee_capacity, has_warehouse, own_security, category) VALUES
  (1, '2027-03-01', '18:00', 'open', 2, 'Salón Central', 100, 1, 1, 'gold');

-- ---- products (FK -> employees(reviewer), owners, insurances) ---------------
-- `name` es NOT NULL en el schema (título corto del bien para el catálogo).
INSERT INTO products (id, date, available, catalog_description, full_description, reviewer_id, owner_id, insurance_policy, name) VALUES
  (1, '2026-11-01', 1, 'Reloj de bolsillo siglo XIX', 'Reloj de bolsillo de oro, siglo XIX, en excelente estado de conservación.', 1, 4, 'POL-001', 'Reloj de bolsillo de oro'),
  (2, '2026-11-05', 1, 'Óleo sobre tela',             'Paisaje al óleo sobre tela, autor anónimo, con marco original.',          1, 4, NULL,      'Óleo sobre tela'),
  -- Productos subidos por Juan (owner 3). Cubren los estados que ve "Mis
  -- productos" sin pasar por la propuesta (no hay ninguno 'tasado'/appraised):
  --   3 -> sin catalog_item       => under_review (recién subido, en tasación)
  --   4 -> catalog_item 'aceptado'  => approved
  --   5 -> catalog_item 'rechazado' => rejected
  --   6 -> catalog_item 'subastado' => auctioned (+ auction_record con la venta)
  (3, '2026-06-06', 0, 'None',                 'Cámara de fotos vintage en su estuche original de cuero.', NULL, 3, NULL, 'Cámara vintage'),
  (4, '2026-06-02', 1, 'Guitarra criolla',     'Guitarra criolla de luthier, caja de cedro macizo.',       1,    3, NULL, 'Guitarra criolla'),
  (5, '2026-05-20', 0, 'None',                 'Cuadro de paisaje al óleo, sin firma identificable.',      1,    3, NULL, 'Cuadro sin firma'),
  (6, '2026-04-10', 1, 'Vajilla de porcelana', 'Vajilla de porcelana Limoges, juego de 12 cubiertos.',     1,    3, NULL, 'Vajilla Limoges');

-- ---- photos (FK -> products; photo es BLOB NOT NULL, placeholder PNG header)
INSERT INTO photos (id, product_id, photo) VALUES
  (1, 1, x'89504e470d0a1a0a'),
  (2, 2, x'89504e470d0a1a0a'),
  (3, 3, x'89504e470d0a1a0a'),
  (4, 4, x'89504e470d0a1a0a'),
  (5, 5, x'89504e470d0a1a0a'),
  (6, 6, x'89504e470d0a1a0a');

-- ---- catalogs (FK -> auctions, employees(manager)) -------------------------
INSERT INTO catalogs (id, description, auction_id, manager_id) VALUES
  (1, 'Catálogo Subasta Marzo 2027', 1, 1);

-- ---- catalog_items (FK -> catalogs, products; checks: base_price/commission > 0.01)
-- `state` (enum) reemplazó a la vieja columna `auctioned`. El reloj (item 1) ya
-- se remató -> 'subastado'; el óleo (item 2) está aceptado y a la espera -> 'aceptado'.
INSERT INTO catalog_items (id, catalog_id, product_id, base_price, commission, state) VALUES
  (1, 1, 1, 180000, 12, 'subastado'),
  (2, 1, 2, 90000,  10, 'aceptado'),
  -- catalog_items de los productos de Juan (le dan su `status` a "Mis productos").
  (3, 1, 4, 50000,  10, 'aceptado'),
  (4, 1, 5, 30000,  10, 'rechazado'),
  (5, 1, 6, 120000, 12, 'subastado');

-- ---- attendees (FK -> clients, auctions) -----------------------------------
INSERT INTO attendees (id, bidder_number, client_id, auction_id) VALUES
  (1, 101, 3, 1),
  (2, 102, 5, 1);

-- ---- bids (FK -> attendees, catalog_items; check: amount > 0.01) -----------
-- Juan (attendee 1) gana el reloj (item 1) con la oferta más alta.
INSERT INTO bids (id, attendee_id, item_id, amount, winner) VALUES
  (1, 1, 1, 185000, 1),
  (2, 2, 1, 182000, 0);

-- ---- auction_records (FK -> auctions, owners, products, clients; checks > 0.01)
-- Venta registrada: el reloj (product 1) de Lucía (owner 4) se lo lleva Juan (client 3).
INSERT INTO auction_records (id, auction_id, owner_id, product_id, client_id, amount, commission) VALUES
  (1, 1, 4, 1, 3, 185000, 12),
  -- La vajilla (product 6) de Juan (owner 3) se la lleva Ana (client 5).
  -- Da salePrice/saleDate a su card "Subastado" (saleDate = auctions.date).
  (2, 1, 3, 6, 5, 135000, 12);

PRAGMA foreign_keys = ON;
