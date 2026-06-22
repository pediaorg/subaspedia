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
    // Token de un solo uso para fijar la contraseña una vez que la empresa
    // aprueba al postor (se manda por mail). Nulo cuando no hay set-password
    // pendiente.
    setPasswordToken: text("tokenContrasenia"),
    setPasswordExpiresAt: text("tokenContraseniaExpira"),
    createdAt: text("creadoEn").notNull().default(sql`(current_timestamp)`),
  },
  t => [
    check("chk_status", sql`${t.status} IN ('active', 'inactive')`),
    // Si hay contraseña, debe haber email. Permite el estado intermedio
    // "email cargado, sin contraseña" mientras la empresa no aprobó la cuenta.
    check(
      "chk_credentials",
      sql`${t.passwordHash} IS NULL OR ${t.email} IS NOT NULL`,
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
  document: text("documento"),
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
    // ¿El item ya se remató? Columna original de EstructuraActual (si/no). El
    // ciclo de vida de la cotización (en revisión/tasado/aceptado/rechazado) NO
    // vive más acá: se movió a la tabla `cotizaciones` (quotes).
    auctioned: boolean("subastado"),
  },
  t => [
    check("chk_base_price", sql`${t.basePrice} > 0.01`),
    check("chk_commission", sql`${t.commission} > 0.01`),
  ],
);

// Cotización que la empresa emite para un bien subido por un usuario. Tabla
// NUEVA (no está en la estructura legacy). 1:1 con el producto (productId
// unique). La fila NACE en estado 'en revisión' cuando el usuario sube el bien
// (sin precio/comisión/mensaje); el backoffice la pasa a 'tasado' (cargando
// precioBase + comision + mensaje) o a 'rechazado' (mensaje = causa del
// rechazo, que la consigna exige mostrar al dueño). Luego el dueño la lleva a
// 'aceptado'/'rechazado'. Que precio/comisión/mensaje sean obligatorios al
// tasar/rechazar es regla de TRANSICIÓN -> vive en la capa de app, por eso las
// columnas son nullable (en 'en revisión' van todas en null). `precioBase` y
// `comision` se copian al `catalogItem` cuando se cotiza.
export const quotes = sqliteTable(
  "cotizaciones",
  {
    id: integer("identificador").primaryKey({ autoIncrement: true }),
    productId: integer("producto")
      .notNull()
      .unique()
      .references(() => products.id),
    basePrice: real("precioBase"),
    commission: real("comision"),
    message: text("mensaje"),
    state: text("estado", {
      enum: ["en revisión", "tasado", "aceptado", "rechazado"],
    }).notNull(),
  },
  t => [
    check(
      "chk_quote_base_price",
      sql`${t.basePrice} IS NULL OR ${t.basePrice} > 0.01`,
    ),
    check(
      "chk_quote_commission",
      sql`${t.commission} IS NULL OR ${t.commission} > 0.01`,
    ),
    check(
      "chk_quote_state",
      sql`${t.state} IN ('en revisión', 'tasado', 'aceptado', 'rechazado')`,
    ),
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

// Envío/entrega de una venta (registroDeSubasta). Tabla satélite 1:1, mismo
// patrón que monedasSubasta: extiende el legacy `registroDeSubasta` sin tocar su
// estructura. La fila SOLO existe cuando el comprador eligió explícitamente; su
// ausencia = default 'shipping' (la lectura va LEFT JOIN + COALESCE en el
// handler). Por eso NO se snapshotea la dirección: en 'shipping' se lee en vivo
// de `personas`, y en 'pickup' se ignora. El costo SÍ se fija acá (snapshot por
// si cambia la constante del back); en 'pickup' es 0. El enum va inline (igual
// que el resto del schema); su fuente lógica es `deliveryMethod` de
// @subaspedia/types — mantenerlos alineados.
export const saleShipments = sqliteTable(
  "enviosVenta",
  {
    recordId: integer("registro")
      .primaryKey()
      .references(() => auctionRecords.id),
    deliveryMethod: text("metodoEntrega", {
      enum: ["shipping", "pickup"],
    }).notNull(),
    shippingCost: real("costoEnvio").notNull(),
  },
  t => [
    check(
      "chk_delivery_method",
      sql`${t.deliveryMethod} IN ('shipping', 'pickup')`,
    ),
  ],
);

// Multas del client (penalties). Tabla NUEVA (no estaba en la estructura
// legacy). Causal única de dominio = falta de pago (10% de lo ofertado, 72hs
// para presentar fondos). La moneda se denormaliza acá (columna propia) porque
// la multa puede no estar atada a una subasta (`subasta` nullable) -> se lee sin
// JOIN; su fuente lógica es el enum `currency` de @subaspedia/types.
// `estado` SOLO persiste 'pending'/'paid': el estado 'overdue' (vencida) es
// DERIVADO al leer (pending && venceEl < hoy), porque depende del tiempo y no
// debe quedar fijo en la fila (regla del proyecto: tiempo en la capa de app).
export const penalties = sqliteTable(
  "multas",
  {
    id: integer("identificador").primaryKey({ autoIncrement: true }),
    clientId: integer("cliente")
      .notNull()
      .references(() => clients.id),
    reason: text("motivo").notNull(),
    amount: real("importe").notNull(),
    currency: text("moneda", { enum: ["ARS", "USD"] }).notNull(),
    status: text("estado", { enum: ["pending", "paid"] }).notNull(),
    issuedAt: text("emitidaEl").notNull(),
    dueDate: text("venceEl").notNull(),
    auctionId: integer("subasta").references(() => auctions.id),
  },
  t => [
    check("chk_penalty_amount", sql`${t.amount} > 0.01`),
    check("chk_penalty_currency", sql`${t.currency} IN ('ARS', 'USD')`),
    check("chk_penalty_status", sql`${t.status} IN ('pending', 'paid')`),
  ],
);

// Notificaciones que recibe el client. `route` define a qué pantalla envía el
// botón del detalle (y qué ícono se pinta en la lista). Es texto libre con
// CHECK para los valores válidos; su fuente lógica es el enum
// `notificationRoute` de @subaspedia/types — mantenerlos alineados.
export const notifications = sqliteTable(
  "notificaciones",
  {
    id: integer("identificador").primaryKey({ autoIncrement: true }),
    clientId: integer("cliente")
      .notNull()
      .references(() => clients.id),
    title: text("titulo").notNull(),
    body: text("cuerpo").notNull(),
    route: text("ruta", {
      enum: ["winProduct", "sanction", "paymentMethod", "proposal", "auction"],
    }).notNull(),
    createdAt: text("creadoEn").notNull().default(sql`(current_timestamp)`),
  },
  t => [
    check(
      "chk_notification_route",
      sql`${t.route} IN ('winProduct', 'sanction', 'paymentMethod', 'proposal', 'auction')`,
    ),
  ],
);
