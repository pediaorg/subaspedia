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

export const countries = sqliteTable("countries", {
  id: integer().notNull().primaryKey(),
  name: text().notNull(),
  shortName: text("short_name"),
  capital: text().notNull(),
  nationality: text().notNull(),
  languages: text().notNull(),
});

export const people = sqliteTable(
  "people",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    document: text(),
    name: text(),
    lastName: text("last_name"),
    address: text(),
    status: text({ enum: ["active", "inactive"] }),
    photo: blob({ mode: "buffer" }),
    // Credenciales de acceso (antes en la tabla `users`). Nullable: no toda
    // persona necesariamente loguea (p. ej. clientes cargados por un empleado).
    email: text().unique(),
    passwordHash: text("password_hash"),
    createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
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

export const emailVerifications = sqliteTable("email_verifications", {
  id: integer().primaryKey({ autoIncrement: true }),
  email: text().notNull().unique(),
  code: text().notNull(),
  // Snapshot de los datos cargados en la etapa 1.
  name: text().notNull(),
  lastName: text("last_name").notNull(),
  address: text().notNull(),
  country: text(),
  dniFront: text("dni_front"),
  dniBack: text("dni_back"),
  verified: boolean("verified").default(false),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
});

export const employees = sqliteTable("employees", {
  id: integer()
    .notNull()
    .primaryKey()
    .references(() => people.id),
  position: text(),
  sectorId: integer("sector_id"),
});

export const sectors = sqliteTable("sectors", {
  id: integer().primaryKey({ autoIncrement: true }),
  sectorName: text("sector_name").notNull(),
  sectorCode: text("sector_code"),
  sectorManagerId: integer("sector_manager_id").references(() => employees.id),
});

export const insurances = sqliteTable(
  "insurances",
  {
    policyNumber: text("policy_number").notNull().primaryKey(),
    company: text().notNull(),
    combinedPolicy: boolean("combined_policy"),
    amount: real().notNull(),
  },
  t => [check("chk_amount", sql`${t.amount} > 0`)],
);

export const clients = sqliteTable(
  "clients",
  {
    id: integer()
      .notNull()
      .primaryKey()
      .references(() => people.id),
    countryId: integer("country_id").references(() => countries.id),
    admitted: boolean("admitted"),
    category: text({
      enum: ["common", "special", "silver", "gold", "platinum"],
    }),
    verifierId: integer("verifier_id")
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
  "payment_methods",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    clientId: integer("client_id")
      .notNull()
      .references(() => clients.id),
    type: text({
      enum: ["bank_account", "credit_card", "certified_check"],
    }).notNull(),
    verified: boolean("verified").default(false),
    foreign: boolean("foreign"),
    amount: real(),
    currency: text({ enum: ["ARS", "USD"] }),
    details: text(),
  },
  t => [
    check(
      "chk_payment_type",
      sql`${t.type} IN ('bank_account', 'credit_card', 'certified_check')`,
    ),
    check("chk_payment_currency", sql`${t.currency} IN ('ARS', 'USD')`),
  ],
);

export const owners = sqliteTable(
  "owners",
  {
    id: integer()
      .notNull()
      .primaryKey()
      .references(() => people.id),
    countryId: integer("country_id").references(() => countries.id),
    financialVerification: boolean("financial_verification"),
    judicialVerification: boolean("judicial_verification"),
    riskRating: integer("risk_rating"),
    verifierId: integer("verifier_id")
      .notNull()
      .references(() => employees.id),
  },
  t => [check("chk_risk_rating", sql`${t.riskRating} IN (1, 2, 3, 4, 5, 6)`)],
);

export const auctioneers = sqliteTable("auctioneers", {
  id: integer()
    .notNull()
    .primaryKey()
    .references(() => people.id),
  license: text(),
  region: text(),
});

export const auctions = sqliteTable(
  "auctions",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    date: text(),
    time: text().notNull(),
    status: text({ enum: ["open", "closed"] }),
    auctioneerId: integer("auctioneer_id").references(() => auctioneers.id),
    location: text(),
    attendeeCapacity: integer("attendee_capacity"),
    hasWarehouse: boolean("has_warehouse"),
    ownSecurity: boolean("own_security"),
    category: text({
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

export const products = sqliteTable("products", {
  id: integer().primaryKey({ autoIncrement: true }),
  date: text(),
  available: boolean("available"),
  catalogDescription: text("catalog_description").default("None"),
  fullDescription: text("full_description").notNull(),
  reviewerId: integer("reviewer_id")
    .notNull()
    .references(() => employees.id),
  ownerId: integer("owner_id")
    .notNull()
    .references(() => owners.id),
  insurancePolicy: text("insurance_policy").references(
    () => insurances.policyNumber,
  ),
});

export const photos = sqliteTable("photos", {
  id: integer().primaryKey({ autoIncrement: true }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  photo: blob({ mode: "buffer" }).notNull(),
});

export const catalogs = sqliteTable("catalogs", {
  id: integer().primaryKey({ autoIncrement: true }),
  description: text().notNull(),
  auctionId: integer("auction_id").references(() => auctions.id),
  managerId: integer("manager_id")
    .notNull()
    .references(() => employees.id),
});

export const catalogItems = sqliteTable(
  "catalog_items",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    catalogId: integer("catalog_id")
      .notNull()
      .references(() => catalogs.id),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id),
    basePrice: real("base_price").notNull(),
    commission: real().notNull(),
    auctioned: boolean("auctioned"),
  },
  t => [
    check("chk_base_price", sql`${t.basePrice} > 0.01`),
    check("chk_commission", sql`${t.commission} > 0.01`),
  ],
);

export const attendees = sqliteTable("attendees", {
  id: integer().primaryKey({ autoIncrement: true }),
  bidderNumber: integer("bidder_number").notNull(),
  clientId: integer("client_id")
    .notNull()
    .references(() => clients.id),
  auctionId: integer("auction_id")
    .notNull()
    .references(() => auctions.id),
});

export const bids = sqliteTable(
  "bids",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    attendeeId: integer("attendee_id")
      .notNull()
      .references(() => attendees.id),
    itemId: integer("item_id")
      .notNull()
      .references(() => catalogItems.id),
    amount: real().notNull(),
    winner: boolean("winner").default(false),
  },
  t => [check("chk_bid_amount", sql`${t.amount} > 0.01`)],
);

export const auctionRecords = sqliteTable(
  "auction_records",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    auctionId: integer("auction_id")
      .notNull()
      .references(() => auctions.id),
    ownerId: integer("owner_id")
      .notNull()
      .references(() => owners.id),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id),
    clientId: integer("client_id")
      .notNull()
      .references(() => clients.id),
    amount: real().notNull(),
    commission: real().notNull(),
  },
  t => [
    check("chk_record_amount", sql`${t.amount} > 0.01`),
    check("chk_record_commission", sql`${t.commission} > 0.01`),
  ],
);
