import { sql } from "drizzle-orm";
import {
  blob,
  check,
  integer,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

// Tipo booleano para SQLite: guarda 0/1 en la DB, pero en TS se usa true/false
const boolean = (name?: string) =>
  name ? integer(name, { mode: "boolean" }) : integer({ mode: "boolean" });

// NOTA: los nombres lógicos (variables export y propiedades TS) se mantienen en
// inglés para no tocar la lógica de la app. Lo que cambia es el NOMBRE FÍSICO
// en la DB (primer argumento de sqliteTable y string de cada columna), que sigue
// la estructura original en español (ver EstructuraActual.sql).

export const countries = sqliteTable("paises", {
  id: integer("numero").notNull().primaryKey(),
  name: text("nombre").notNull(),
  shortName: text("nombreCorto"),
  capital: text("capital").notNull(),
  nationality: text("nacionalidad").notNull(),
  languages: text("idiomas").notNull(),
});

export const people = sqliteTable(
  "personas",
  {
    id: integer("identificador").primaryKey({ autoIncrement: true }),
    document: text("documento"),
    name: text("nombre"),
    lastName: text("apellido"),
    address: text("direccion"),
    status: text("estado", { enum: ["active", "inactive"] }),
    photo: blob("foto", { mode: "buffer" }),
    // Credenciales de acceso (antes en la tabla `users`). Nullable: no toda
    // persona necesariamente loguea (p. ej. clientes cargados por un empleado).
    email: text("email").unique(),
    passwordHash: text("hashContrasenia"),
    createdAt: text("creadoEn").notNull().default(sql`(current_timestamp)`),
  },
  t => [
    check("chk_status", sql`${t.status} IN ('active', 'inactive')`),
    // Si hay email, debe haber password (y viceversa).
    check(
      "chk_credentials",
      sql`(${t.email} IS NULL) = (${t.passwordHash} IS NULL)`,
    ),
  ],
);

export const emailVerifications = sqliteTable("verificacionesEmail", {
  id: integer("identificador").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  code: text("codigo").notNull(),
  // Snapshot de los datos cargados en la etapa 1.
  name: text("nombre").notNull(),
  lastName: text("apellido").notNull(),
  address: text("direccion").notNull(),
  country: text("pais"),
  dniFront: text("dniFrente"),
  dniBack: text("dniDorso"),
  verified: boolean("verificado").default(false),
  expiresAt: text("expiraEn").notNull(),
  createdAt: text("creadoEn").notNull().default(sql`(current_timestamp)`),
});

export const employees = sqliteTable("empleados", {
  id: integer("identificador")
    .notNull()
    .primaryKey()
    .references(() => people.id),
  position: text("cargo"),
  sectorId: integer("sector"),
});

export const sectors = sqliteTable("sectores", {
  id: integer("identificador").primaryKey({ autoIncrement: true }),
  sectorName: text("nombreSector").notNull(),
  sectorCode: text("codigoSector"),
  sectorManagerId: integer("responsableSector").references(() => employees.id),
});

export const insurances = sqliteTable(
  "seguros",
  {
    policyNumber: text("nroPoliza").notNull().primaryKey(),
    company: text("compania").notNull(),
    combinedPolicy: boolean("polizaCombinada"),
    amount: real("importe").notNull(),
  },
  t => [check("chk_amount", sql`${t.amount} > 0`)],
);

export const clients = sqliteTable(
  "clientes",
  {
    id: integer("identificador")
      .notNull()
      .primaryKey()
      .references(() => people.id),
    countryId: integer("numeroPais").references(() => countries.id),
    admitted: boolean("admitido"),
    category: text("categoria", {
      enum: ["common", "special", "silver", "gold", "platinum"],
    }),
    verifierId: integer("verificador")
      .notNull()
      .references(() => employees.id),
  },
  t => [
    check(
      "chk_category",
      sql`${t.category} IN ('common', 'special', 'silver', 'gold', 'platinum')`,
    ),
  ],
);

export const paymentMethods = sqliteTable(
  "mediosDePago",
  {
    id: integer("identificador").primaryKey({ autoIncrement: true }),
    clientId: integer("cliente")
      .notNull()
      .references(() => clients.id),
    type: text("tipo", {
      enum: ["bank_account", "credit_card", "certified_check"],
    }).notNull(),
    verified: boolean("verificado").default(false),
    amount: real("importe"),
    // Datos identificatorios del medio que carga el cliente y revisa el
    // backoffice (p. ej. "Banco Galicia, CBU ...", "Visa ****1234").
    details: text("detalles"),
    // Comprobante/foto del medio (data URI base64), opcional.
    photo: text("foto"),
  },
  t => [
    check(
      "chk_payment_type",
      sql`${t.type} IN ('bank_account', 'credit_card', 'certified_check')`,
    ),
  ],
);

export const owners = sqliteTable(
  "duenios",
  {
    id: integer("identificador")
      .notNull()
      .primaryKey()
      .references(() => people.id),
    countryId: integer("numeroPais").references(() => countries.id),
    financialVerification: boolean("verificacionFinanciera"),
    judicialVerification: boolean("verificacionJudicial"),
    riskRating: integer("calificacionRiesgo"),
    verifierId: integer("verificador")
      .notNull()
      .references(() => employees.id),
  },
  t => [check("chk_risk_rating", sql`${t.riskRating} IN (1, 2, 3, 4, 5, 6)`)],
);

export const auctioneers = sqliteTable("subastadores", {
  id: integer("identificador")
    .notNull()
    .primaryKey()
    .references(() => people.id),
  license: text("matricula"),
  region: text("region"),
});

export const auctions = sqliteTable(
  "subastas",
  {
    id: integer("identificador").primaryKey({ autoIncrement: true }),
    date: text("fecha"),
    time: text("hora").notNull(),
    status: text("estado", { enum: ["open", "closed"] }),
    auctioneerId: integer("subastador").references(() => auctioneers.id),
    location: text("ubicacion"),
    attendeeCapacity: integer("capacidadAsistentes"),
    hasWarehouse: boolean("tieneDeposito"),
    ownSecurity: boolean("seguridadPropia"),
    category: text("categoria", {
      enum: ["common", "special", "silver", "gold", "platinum"],
    }),
  },
  t => [
    // La regla "fecha > hoy + 10 días" NO puede ir en un CHECK: SQLite exige
    // que un CHECK sea determinístico y date('now') no lo es. Se aplica como
    // trigger a nivel DB en apps/api/triggers.sql (correr tras cada db push).
    check("chk_auction_status", sql`${t.status} IN ('open', 'closed')`),
    check(
      "chk_auction_category",
      sql`${t.category} IN ('common', 'special', 'silver', 'gold', 'platinum')`,
    ),
  ],
);

// Moneda de cada subasta (ARS/USD). Tabla satélite: extiende `subastas` sin
// modificar la estructura original (intocable). 1:1 con la subasta (PK = subasta).
// La lectura SIEMPRE debe ser LEFT JOIN + COALESCE(moneda, 'ARS'): las subastas
// sin fila (legacy) caen al default y no rompen ningún flujo. El enum va inline
// (igual que el resto del schema, p. ej. `categoria`); su fuente lógica es el
// enum `currency` de @subaspedia/types — mantenerlos alineados.
export const auctionCurrencies = sqliteTable(
  "monedasSubasta",
  {
    auctionId: integer("subasta")
      .primaryKey()
      .references(() => auctions.id),
    currency: text("moneda", { enum: ["ARS", "USD"] }).notNull(),
  },
  t => [check("chk_currency", sql`${t.currency} IN ('ARS', 'USD')`)],
);

export const products = sqliteTable("productos", {
  id: integer("identificador").primaryKey({ autoIncrement: true }),
  date: text("fecha"),
  available: boolean("disponible"),
  catalogDescription: text("descripcionCatalogo").default("None"),
  fullDescription: text("descripcionCompleta").notNull(),
  reviewerId: integer("revisor").references(() => employees.id),
  ownerId: integer("duenio").references(() => owners.id),
  insurancePolicy: text("seguro").references(() => insurances.policyNumber),
  name: text("nombre").notNull(),
});

export const artworkDetails = sqliteTable("detallesObra", {
  productId: integer("producto")
    .primaryKey()
    .references(() => products.id),
  artist: text("artista").notNull(),
  creationDate: text("fechaCreacion"),
  history: text("historia"),
});

export const photos = sqliteTable("fotos", {
  id: integer("identificador").primaryKey({ autoIncrement: true }),
  productId: integer("producto")
    .notNull()
    .references(() => products.id),
  photo: blob("foto", { mode: "buffer" }).notNull(),
});

export const catalogs = sqliteTable("catalogos", {
  id: integer("identificador").primaryKey({ autoIncrement: true }),
  description: text("descripcion").notNull(),
  auctionId: integer("subasta").references(() => auctions.id),
  managerId: integer("responsable")
    .notNull()
    .references(() => employees.id),
});

export const catalogItems = sqliteTable(
  "itemsCatalogo",
  {
    id: integer("identificador").primaryKey({ autoIncrement: true }),
    catalogId: integer("catalogo")
      .notNull()
      .references(() => catalogs.id),
    productId: integer("producto")
      .notNull()
      .references(() => products.id),
    basePrice: real("precioBase").notNull(),
    commission: real("comision").notNull(),
    state: text("estado", {
      enum: ["en revisión", "tasado", "aceptado", "rechazado", "subastado"],
    }),
  },
  t => [
    check("chk_base_price", sql`${t.basePrice} > 0.01`),
    check("chk_commission", sql`${t.commission} > 0.01`),
  ],
);

export const attendees = sqliteTable("asistentes", {
  id: integer("identificador").primaryKey({ autoIncrement: true }),
  bidderNumber: integer("numeroPostor").notNull(),
  clientId: integer("cliente")
    .notNull()
    .references(() => clients.id),
  auctionId: integer("subasta")
    .notNull()
    .references(() => auctions.id),
});

export const bids = sqliteTable(
  "pujos",
  {
    id: integer("identificador").primaryKey({ autoIncrement: true }),
    attendeeId: integer("asistente")
      .notNull()
      .references(() => attendees.id),
    itemId: integer("item")
      .notNull()
      .references(() => catalogItems.id),
    amount: real("importe").notNull(),
    winner: boolean("ganador").default(false),
  },
  t => [check("chk_bid_amount", sql`${t.amount} > 0.01`)],
);

export const auctionRecords = sqliteTable(
  "registroDeSubasta",
  {
    id: integer("identificador").primaryKey({ autoIncrement: true }),
    auctionId: integer("subasta")
      .notNull()
      .references(() => auctions.id),
    ownerId: integer("duenio")
      .notNull()
      .references(() => owners.id),
    productId: integer("producto")
      .notNull()
      .references(() => products.id),
    clientId: integer("cliente")
      .notNull()
      .references(() => clients.id),
    amount: real("importe").notNull(),
    commission: real("comision").notNull(),
  },
  t => [
    check("chk_record_amount", sql`${t.amount} > 0.01`),
    check("chk_record_commission", sql`${t.commission} > 0.01`),
  ],
);
