import { DurableObject } from "cloudflare:workers";

import { and, eq, ne } from "drizzle-orm";

import {
  type AuctionLeader,
  type AuctionServerMsg,
  type AuctionState,
  BID_WINDOW_MS,
  MAX_BID_INCREMENT_RATE,
  MIN_BID_INCREMENT_RATE,
} from "@subaspedia/types";
import { createDb } from "@/api/db";
import { attendees, auctionRecords, auctions, bids } from "@/api/db/schema";
import type { Env } from "@/api/index";
import { sendAuctionWinEmail } from "@/api/lib/email";
import { SHIPPING_COST } from "@/api/lib/shipping";

type Category = "common" | "special" | "silver" | "gold" | "platinum";

// Resultado de un intento de puja. Discriminado para que el router lo mapee a
// un ORPCError sin acoplarse a los códigos HTTP.
type BidResult =
  | { ok: true; state: AuctionState }
  | {
      ok: false;
      code: "NOT_FOUND" | "FORBIDDEN" | "BAD_REQUEST";
      message: string;
    };

// Snapshot persistido en el storage del DO. Es lo que sobrevive a la
// hibernación (la memoria del objeto se pierde entre mensajes del WebSocket).
// La DB (D1) sigue siendo el sistema de registro; este snapshot es el estado
// "caliente" de la sala para no ir a buscar todo a la DB en cada puja.
type Snapshot = {
  auctionId: number;
  itemId: number;
  status: "open" | "closed";
  currency: "ARS" | "USD";
  category: Category;
  basePrice: number;
  currentBid: number;
  leader: AuctionLeader | null;
  deadline: number | null;
  // Garantía (tope de compra) por cliente, cacheada desde la DB la primera vez
  // que el cliente puja. Infinity (serializado como null) = sin tope monetario.
  caps: Record<number, number | null>;
  // Monto que cada cliente tiene comprometido en su puja ganadora actual. Se
  // resta de su garantía: cuando lo superan, se libera. Modela el "ir restando
  // del saldo en memoria" sin volver a la DB.
  reserved: Record<number, number>;
};

/**
 * Una instancia por subasta (idFromName `auction:<id>`). Concentra TODA la
 * lógica de la subasta dinámica ascendente: validación de pujas, saldos en
 * memoria, tiempo límite y difusión en tiempo real por WebSocket. Es la única
 * fuente de verdad: las pujas entran exclusivamente por el WebSocket (no hay
 * endpoint RPC que le pegue al backend).
 */
export class AuctionRoom extends DurableObject<Env> {
  private snap: Snapshot | null = null;

  // ---- Carga / persistencia del estado caliente ----------------------------

  private async ensureLoaded(auctionId?: number): Promise<Snapshot | null> {
    if (this.snap) return this.snap;

    const stored = await this.ctx.storage.get<Snapshot>("snap");
    if (stored) {
      this.snap = stored;
      return this.snap;
    }

    if (!auctionId) return null;
    return this.loadFromDb(auctionId);
  }

  private async loadFromDb(auctionId: number): Promise<Snapshot | null> {
    const db = createDb(this.env.DB);

    const auction = await db.query.auctions.findFirst({
      where: { id: auctionId },
      columns: { id: true, status: true, category: true },
      with: { currencyRow: { columns: { currency: true } } },
    });
    if (!auction) return null;

    // Modelo simplificado (consistente con el resto de la app): se subasta el
    // primer ítem del primer catálogo de la subasta.
    const catalog = await db.query.catalogs.findFirst({
      where: { auctionId },
      columns: { id: true },
    });
    const item = catalog
      ? await db.query.catalogItems.findFirst({
          where: { catalogId: catalog.id },
          columns: { id: true, basePrice: true },
        })
      : undefined;
    if (!item) return null;

    // Mejor puja existente (para reanudar una subasta ya empezada).
    const top = await db.query.bids.findFirst({
      where: { itemId: item.id },
      orderBy: (t, { desc }) => desc(t.amount),
      columns: { amount: true },
      with: {
        attendee: {
          columns: { clientId: true, bidderNumber: true },
          with: {
            client: {
              columns: {},
              with: { person: { columns: { name: true } } },
            },
          },
        },
      },
    });

    const leader: AuctionLeader | null = top?.attendee
      ? {
          clientId: top.attendee.clientId,
          bidderNumber: top.attendee.bidderNumber,
          name: top.attendee.client?.person?.name ?? "Postor",
        }
      : null;

    this.snap = {
      auctionId,
      itemId: item.id,
      status: (auction.status ?? "open") as "open" | "closed",
      currency: auction.currencyRow?.currency ?? "ARS",
      category: (auction.category ?? "common") as Category,
      basePrice: item.basePrice,
      currentBid: top?.amount ?? 0,
      leader,
      // No reanudamos el contador de una subasta preexistente: arranca con la
      // primera puja nueva. Evita cerrarla apenas se carga.
      deadline: null,
      caps: {},
      reserved: leader ? { [leader.clientId]: top?.amount ?? 0 } : {},
    };
    await this.persist();
    return this.snap;
  }

  private async persist(): Promise<void> {
    if (this.snap) await this.ctx.storage.put("snap", this.snap);
  }

  // ---- Garantía / saldo en memoria ----------------------------------------

  /** Tope de compra del cliente (suma de medios de pago verificados). */
  private async capFor(clientId: number): Promise<number | null | undefined> {
    const snap = this.snap;
    if (!snap) return undefined;
    // Solo confiamos en topes cacheados positivos (monto) o null (sin tope). Un
    // 0 cacheado (sin medio) nunca se persiste, pero por las dudas se recalcula.
    const cached = snap.caps[clientId];
    if (cached === null || (typeof cached === "number" && cached > 0))
      return cached;

    const methods = await createDb(this.env.DB).query.paymentMethods.findMany({
      where: { clientId, verified: true },
      columns: { amount: true },
    });

    // Sin ningún medio verificado => no puede pujar. NO se cachea: el cliente
    // podría verificar un medio a mitad de subasta y debe poder pujar sin tener
    // que reiniciar la sala.
    if (methods.length === 0) return 0;

    const total = methods.reduce((acc, m) => acc + (m.amount ?? 0), 0);
    // total 0 = tiene medio verificado pero sin garantía monetaria (p. ej. solo
    // tarjeta) => sin tope de compra (null = Infinity). El límite del 20% por
    // puja sigue acotando el monto.
    const cap = total > 0 ? total : null;
    snap.caps[clientId] = cap;
    return cap;
  }

  // ---- Cálculo de límites de puja -----------------------------------------

  private bounds(snap: Snapshot): { min: number; max: number | null } {
    const { basePrice, currentBid, category } = snap;
    const noCap = category === "gold" || category === "platinum";

    // Primera puja: piso = precio base. Siguientes: última + 1% del base.
    const min =
      currentBid > 0
        ? round2(currentBid + basePrice * MIN_BID_INCREMENT_RATE)
        : basePrice;

    // Tope: última oferta (o base, si no hubo) + 20% del base. No aplica a
    // oro/platino.
    const reference = currentBid > 0 ? currentBid : basePrice;
    const max = noCap
      ? null
      : round2(reference + basePrice * MAX_BID_INCREMENT_RATE);

    return { min, max };
  }

  private stateMsg(snap: Snapshot): AuctionState {
    const { min, max } = this.bounds(snap);
    return {
      type: "state",
      auctionId: snap.auctionId,
      status: snap.status,
      currency: snap.currency,
      basePrice: snap.basePrice,
      currentBid: snap.currentBid,
      minBid: min,
      maxBid: max,
      leader: snap.leader,
      deadline: snap.deadline,
    };
  }

  // ---- Puja (autoridad única) ---------------------------------------------

  /** Procesa una puja y, si es válida, difunde el nuevo estado a los conectados. */
  async bid(params: {
    auctionId: number;
    clientId: number;
    amount: number;
  }): Promise<BidResult> {
    const result = await this.placeBid(params);
    // `result.state` ya es el mensaje de estado calculado por placeBid; se
    // difunde tal cual (no re-envolver con stateMsg, que espera un Snapshot).
    if (result.ok) this.broadcast(result.state);
    return result;
  }

  private async placeBid(params: {
    auctionId: number;
    clientId: number;
    amount: number;
  }): Promise<BidResult> {
    const snap = await this.ensureLoaded(params.auctionId);
    if (!snap)
      return { ok: false, code: "NOT_FOUND", message: "Subasta no encontrada" };

    if (snap.status !== "open")
      return {
        ok: false,
        code: "BAD_REQUEST",
        message: "La subasta está cerrada",
      };

    if (snap.deadline !== null && Date.now() > snap.deadline)
      return {
        ok: false,
        code: "BAD_REQUEST",
        message: "El tiempo de puja venció",
      };

    const cap = await this.capFor(params.clientId);
    if (cap === 0)
      return {
        ok: false,
        code: "FORBIDDEN",
        message: "Necesitás un medio de pago verificado para pujar",
      };

    const amount = round2(params.amount);
    const { min, max } = this.bounds(snap);

    if (amount < min)
      return {
        ok: false,
        code: "BAD_REQUEST",
        message: `La puja debe ser al menos ${min}`,
      };
    if (max !== null && amount > max)
      return {
        ok: false,
        code: "BAD_REQUEST",
        message: `La puja no puede superar ${max}`,
      };
    if (snap.leader?.clientId === params.clientId)
      return {
        ok: false,
        code: "BAD_REQUEST",
        message: "Ya tenés la puja más alta",
      };

    // Saldo en memoria: garantía menos lo ya comprometido en otras pujas
    // ganadoras (acá, modelo de un ítem, es 0). El cliente libera su propia
    // reserva al re-pujar. cap === null => sin tope monetario.
    if (cap !== null && cap !== undefined && amount > cap)
      return {
        ok: false,
        code: "BAD_REQUEST",
        message: `Tu garantía (${cap}) no alcanza para esta puja`,
      };

    // Persistir la puja en D1 (sistema de registro). Garantiza el orden y que
    // quede registrada antes de confirmarle al postor.
    const db = createDb(this.env.DB);

    let attendee = await db.query.attendees.findFirst({
      where: { clientId: params.clientId, auctionId: snap.auctionId },
      columns: { id: true, bidderNumber: true },
    });
    if (!attendee) {
      const maxBidder = await db.query.attendees.findFirst({
        where: { auctionId: snap.auctionId },
        orderBy: (t, { desc }) => desc(t.bidderNumber),
        columns: { bidderNumber: true },
      });
      const [created] = await db
        .insert(attendees)
        .values({
          clientId: params.clientId,
          auctionId: snap.auctionId,
          bidderNumber: (maxBidder?.bidderNumber ?? 0) + 1,
        })
        .returning({ id: attendees.id, bidderNumber: attendees.bidderNumber });
      attendee = created;
    }
    if (!attendee)
      return {
        ok: false,
        code: "BAD_REQUEST",
        message: "No se pudo registrar al postor",
      };

    const [newBid] = await db
      .insert(bids)
      .values({
        attendeeId: attendee.id,
        itemId: snap.itemId,
        amount,
        winner: true,
      })
      .returning({ id: bids.id });

    await db
      .update(bids)
      .set({ winner: false })
      .where(and(eq(bids.itemId, snap.itemId), ne(bids.id, newBid.id)));

    // Nombre del postor para el liderazgo (cache simple por si no estaba).
    const name =
      snap.leader?.clientId === params.clientId
        ? snap.leader.name
        : ((
            await db.query.people.findFirst({
              where: { id: params.clientId },
              columns: { name: true },
            })
          )?.name ?? `Postor #${attendee.bidderNumber}`);

    // Actualizar estado caliente en memoria.
    if (snap.leader) delete snap.reserved[snap.leader.clientId];
    snap.reserved[params.clientId] = amount;
    snap.currentBid = amount;
    snap.leader = {
      clientId: params.clientId,
      bidderNumber: attendee.bidderNumber,
      name,
    };
    // Reiniciar la ventana de tiempo (anti-sniping: cada puja la renueva).
    snap.deadline = Date.now() + BID_WINDOW_MS;
    await this.persist();
    await this.ctx.storage.setAlarm(snap.deadline);

    return { ok: true, state: this.stateMsg(snap) };
  }

  // ---- Tiempo límite ------------------------------------------------------

  async alarm(): Promise<void> {
    const snap = await this.ensureLoaded();
    if (!snap || snap.status !== "open" || snap.deadline === null) return;

    if (Date.now() < snap.deadline) {
      // Reprogramar por si la alarma se adelantó.
      await this.ctx.storage.setAlarm(snap.deadline);
      return;
    }

    // Cierre: el último postor pasa a ser el nuevo dueño (la puja ganadora ya
    // quedó marcada winner=true en D1). Marcamos la subasta como cerrada.
    snap.status = "closed";
    await this.persist();

    const db = createDb(this.env.DB);
    await db
      .update(auctions)
      .set({ status: "closed" })
      .where(eq(auctions.id, snap.auctionId));

    // Registrar la venta y avisar al ganador (con el link a su compra).
    if (snap.leader?.clientId) {
      this.finalizeWin(snap).catch(err => {
        console.error(
          `[auction ${snap.auctionId}] Error registrando la venta / email de ganador:`,
          err,
        );
      });
    }

    this.broadcast({
      type: "closed",
      auctionId: snap.auctionId,
      winner: snap.leader,
      amount: snap.currentBid,
    });
  }

  // Al cerrar la subasta materializa la venta (registroDeSubasta) y le avisa al
  // ganador por mail con el detalle del pago y el link directo a su compra. La
  // venta no existía hasta acá: este es el único punto que la registra en
  // runtime (antes solo la creaba el seed).
  private async finalizeWin(snap: Snapshot): Promise<void> {
    const db = createDb(this.env.DB);

    // Datos del cliente ganador.
    const client = await db.query.clients.findFirst({
      where: { id: snap.leader?.clientId },
      with: {
        person: {
          columns: { email: true, name: true, lastName: true },
        },
      },
    });

    if (!client?.person?.email) return;

    // Producto, dueño (vendedor) y comisión: necesarios para la venta.
    const item = await db.query.catalogItems.findFirst({
      where: { id: snap.itemId },
      columns: { commission: true },
      with: {
        product: {
          columns: { id: true, name: true, ownerId: true },
        },
      },
    });

    // Sin producto, dueño o comisión válida no podemos registrar la venta
    // (FKs + CHECK > 0.01 de registroDeSubasta); sin venta no hay a qué
    // linkear, así que tampoco mandamos el mail. `commission` es un PORCENTAJE.
    const commissionPct = item?.commission ?? 0;
    if (
      !item?.product?.name ||
      item.product.ownerId == null ||
      commissionPct <= 0.01
    )
      return;

    const [record] = await db
      .insert(auctionRecords)
      .values({
        auctionId: snap.auctionId,
        ownerId: item.product.ownerId,
        productId: item.product.id,
        clientId: client.id,
        amount: snap.currentBid,
        commission: commissionPct,
      })
      .returning({ id: auctionRecords.id });

    const winnerName =
      `${client.person.name ?? ""} ${client.person.lastName ?? ""}`.trim();

    // El mail muestra MONTOS: la comisión resuelta sobre la puja y el envío por
    // defecto (la factura recalcula si después elige retiro).
    await sendAuctionWinEmail({
      to: client.person.email,
      winnerName,
      productName: item.product.name,
      bidAmount: snap.currentBid,
      commission: (snap.currentBid * commissionPct) / 100,
      shippingCost: SHIPPING_COST[snap.currency],
      currency: snap.currency,
      recordId: record.id,
    });
  }

  // ---- WebSocket (difusión en vivo + canal de pujas) ----------------------

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade") !== "websocket")
      return new Response("Expected websocket", { status: 426 });

    const auctionId = Number(request.headers.get("X-Auction-Id"));
    const snap = await this.ensureLoaded(
      Number.isInteger(auctionId) && auctionId > 0 ? auctionId : undefined,
    );
    if (!snap) return new Response("Subasta no encontrada", { status: 404 });

    // El worker ya verificó el token y, si era válido, inyectó el id del
    // postor. Sin él la conexión es de solo lectura (espectador).
    const userIdHeader = request.headers.get("X-User-Id");
    const clientId = userIdHeader ? Number(userIdHeader) : null;

    const { 0: client, 1: server } = new WebSocketPair();
    this.ctx.acceptWebSocket(server);
    // La identidad del postor queda atada al socket (sobrevive a la
    // hibernación); nunca se confía en un clientId que mande el cliente.
    server.serializeAttachment({
      clientId:
        Number.isInteger(clientId) && (clientId ?? 0) > 0 ? clientId : null,
    });
    server.send(JSON.stringify(this.stateMsg(snap)));

    return new Response(null, { status: 101, webSocket: client });
  }

  // Canal de pujas: el postor manda `{ type: "bid", amount }` por el socket. El
  // DO valida y confirma contra D1 (autoridad única), difunde el nuevo estado a
  // todos y, si falla, le responde el error solo a ese socket. `ping` mantiene
  // viva la conexión.
  async webSocketMessage(
    ws: WebSocket,
    message: string | ArrayBuffer,
  ): Promise<void> {
    if (typeof message !== "string") return;
    if (message === "ping") {
      ws.send("pong");
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(message);
    } catch {
      return;
    }

    const msg = parsed as { type?: string; amount?: unknown };
    if (msg.type !== "bid") return;

    const attach = ws.deserializeAttachment() as {
      clientId: number | null;
    } | null;
    const clientId = attach?.clientId ?? null;
    if (!clientId) {
      this.sendError(ws, "Iniciá sesión para pujar");
      return;
    }

    const amount = Number(msg.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      this.sendError(ws, "Monto inválido");
      return;
    }

    const snap = await this.ensureLoaded();
    if (!snap) {
      this.sendError(ws, "Subasta no encontrada");
      return;
    }

    const result = await this.bid({
      auctionId: snap.auctionId,
      clientId,
      amount,
    });
    if (!result.ok) this.sendError(ws, result.message);
  }

  private sendError(ws: WebSocket, message: string): void {
    try {
      ws.send(
        JSON.stringify({ type: "error", message } satisfies AuctionServerMsg),
      );
    } catch {
      // socket muerto: lo ignora.
    }
  }

  private broadcast(msg: AuctionServerMsg): void {
    const data = JSON.stringify(msg);
    for (const ws of this.ctx.getWebSockets()) {
      try {
        ws.send(data);
      } catch {
        // socket muerto: lo ignora.
      }
    }
  }
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
