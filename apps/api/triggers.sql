-- ============================================================================
-- triggers.sql — Reglas de dominio que dependen del tiempo y NO se pueden
-- expresar como CHECK (SQLite exige que un CHECK sea determinístico, y
-- date('now') no lo es).
--
-- IMPORTANTE: drizzle-kit no maneja triggers, y `pnpm db push` reconstruye
-- las tablas (drop + recreate) cuando cambia el schema, lo que DROPEA estos
-- triggers. Por eso hay que reaplicar este archivo DESPUÉS de cada push:
--   pnpm wrangler d1 execute subaspedia-db --local --file ./triggers.sql
-- ============================================================================

-- auctions.date debe ser al menos 10 días posterior a hoy (consigna).
-- date es nullable: si viene NULL no se valida (mismo criterio que el CHECK
-- original, donde NULL > x daba NULL y el CHECK pasaba).

DROP TRIGGER IF EXISTS trg_auctions_date_insert;
CREATE TRIGGER trg_auctions_date_insert
BEFORE INSERT ON auctions
WHEN NEW.date IS NOT NULL AND NEW.date <= date('now', '+10 days')
BEGIN
  SELECT RAISE(ABORT, 'La fecha de la subasta debe ser al menos 10 dias posterior a hoy');
END;

DROP TRIGGER IF EXISTS trg_auctions_date_update;
CREATE TRIGGER trg_auctions_date_update
BEFORE UPDATE OF date ON auctions
WHEN NEW.date IS NOT NULL AND NEW.date <= date('now', '+10 days')
BEGIN
  SELECT RAISE(ABORT, 'La fecha de la subasta debe ser al menos 10 dias posterior a hoy');
END;
