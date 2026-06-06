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
--   * Juan Casablanca (cliente GOLD, es el usuario logueable — ver users)
--   * Ana López (cliente común, segunda postora)
--   * Lucía Fernández (dueña de los bienes)
--   * 1 subasta GOLD futura con catálogo de 2 productos
--   * 2 postores con pujas; Juan gana el reloj -> queda registrado en auction_records
--   * 1 usuario logueable: juancasablanca@jamon.com / password123
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
DELETE FROM clients;
DELETE FROM insurances;
DELETE FROM sectors;
DELETE FROM employees;
DELETE FROM people;
DELETE FROM countries;
DELETE FROM users;

-- ---- countries -------------------------------------------------------------
INSERT INTO countries (id, name, short_name, capital, nationality, languages) VALUES
  (1, 'Argentina',      'AR', 'Buenos Aires',    'argentina',      'es'),
  (2, 'Brasil',         'BR', 'Brasilia',        'brasileña',      'pt'),
  (3, 'Estados Unidos', 'US', 'Washington D.C.', 'estadounidense', 'en');

-- ---- people (su id se reutiliza como PK en employees/clients/owners/auctioneers)
INSERT INTO people (id, document, name, address, status) VALUES
  (1, '20111222', 'María Pérez',      'Av. Corrientes 1234', 'active'),
  (2, '20333444', 'Carlos Gómez',     'Calle Falsa 123',     'active'),
  (3, '12345678', 'Juan Casablanca',  'Lima 970',            'active'),
  (4, '27888999', 'Lucía Fernández',  'San Martín 456',      'active'),
  (5, '30555666', 'Ana López',        'Belgrano 789',        'active');

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

-- ---- owners (FK -> people, countries, employees; check: risk_rating 1..6) --
INSERT INTO owners (id, country_id, financial_verification, judicial_verification, risk_rating, verifier_id) VALUES
  (4, 1, 1, 1, 2, 1);

-- ---- auctioneers (FK -> people) --------------------------------------------
INSERT INTO auctioneers (id, license, region) VALUES
  (2, 'LIC-001', 'CABA');

-- ---- auctions (FK -> auctioneers; check: date > date('now','+10 days')) -----
-- OJO: si corrés el seed después de esta fecha, el check chk_date va a fallar.
--      Bumpeá la fecha a una futura si hace falta.
INSERT INTO auctions (id, date, time, status, auctioneer_id, location, attendee_capacity, has_warehouse, own_security, category) VALUES
  (1, '2027-03-01', '18:00', 'open', 2, 'Salón Central', 100, 1, 1, 'gold');

-- ---- products (FK -> employees(reviewer), owners, insurances) ---------------
INSERT INTO products (id, date, available, catalog_description, full_description, reviewer_id, owner_id, insurance_policy) VALUES
  (1, '2026-11-01', 1, 'Reloj de bolsillo siglo XIX', 'Reloj de bolsillo de oro, siglo XIX, en excelente estado de conservación.', 1, 4, 'POL-001'),
  (2, '2026-11-05', 1, 'Óleo sobre tela',             'Paisaje al óleo sobre tela, autor anónimo, con marco original.',          1, 4, NULL);

-- ---- photos (FK -> products; photo es BLOB NOT NULL, placeholder PNG header)
INSERT INTO photos (id, product_id, photo) VALUES
  (1, 1, x'89504e470d0a1a0a'),
  (2, 2, x'89504e470d0a1a0a');

-- ---- catalogs (FK -> auctions, employees(manager)) -------------------------
INSERT INTO catalogs (id, description, auction_id, manager_id) VALUES
  (1, 'Catálogo Subasta Marzo 2027', 1, 1);

-- ---- catalog_items (FK -> catalogs, products; checks: base_price/commission > 0.01)
INSERT INTO catalog_items (id, catalog_id, product_id, base_price, commission, auctioned) VALUES
  (1, 1, 1, 180000, 12, 0),
  (2, 1, 2, 90000,  10, 0);

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
  (1, 1, 4, 1, 3, 185000, 12);

-- ---- users (login real) ----------------------------------------------------
-- email: juancasablanca@jamon.com  /  password: password123
-- El hash es PBKDF2 (mismo esquema que apps/api/src/lib/auth/index.ts).
-- Nota: esta tabla NO tiene FK con people/clients todavía (decisión pendiente
-- de cómo unir el login con el dominio). El id 1 acá es independiente del
-- people.id de Juan (que es 3).
INSERT INTO users (id, email, password_hash) VALUES
  (1, 'juancasablanca@jamon.com', 'pbkdf2$100000$cbd1d69840c1790f0188bca9cae16cce$761bb62aa9686ce177dcd80e4dfbbec761ed08dc295cdab01221f3dedb2cc9d3');

PRAGMA foreign_keys = ON;
