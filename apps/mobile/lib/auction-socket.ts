import { useCallback, useEffect, useRef, useState } from "react";

import type {
  AuctionClosedMsg,
  AuctionServerMsg,
  AuctionState,
} from "@subaspedia/types";
import { authStore } from "@/lib/auth";

// URL del WebSocket derivada de la base de la API (http -> ws). Mismo origen que
// el resto del cliente (ver lib/orpc.ts y lib/photo.ts).
const WS_BASE = (
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8787"
).replace(/^http/, "ws");

type AuctionRoom = {
  /** Último estado difundido por el DO (puja actual, líder, deadline, etc.). */
  state: AuctionState | null;
  /** Mensaje de cierre cuando la subasta termina por tiempo. */
  closed: AuctionClosedMsg | null;
  connected: boolean;
  /** Último error de puja informado por el DO (p. ej. monto inválido). */
  error: string | null;
  /** Envía una puja por el socket. Devuelve false si no hay conexión. */
  sendBid: (amount: number) => boolean;
  /** Limpia el último error (p. ej. al editar el monto). */
  clearError: () => void;
};

/**
 * Conecta a la subasta en vivo por WebSocket. Es el ÚNICO canal de pujas: las
 * ofertas se mandan por acá (`sendBid`) y el Durable Object las valida, confirma
 * contra la DB y difunde el nuevo estado a todos los conectados. Ya no se pega
 * al backend por RPC para pujar.
 *
 * El postor se autentica con `?token=<accessToken>` en la URL (los WebSockets
 * del navegador no pueden mandar headers). Sin token la conexión es de solo
 * lectura (espectador) y `sendBid` recibirá un error del servidor.
 */
export function useAuctionRoom(auctionId: number | null): AuctionRoom {
  const [state, setState] = useState<AuctionState | null>(null);
  const [closed, setClosed] = useState<AuctionClosedMsg | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!auctionId) return;

    setState(null);
    setClosed(null);
    setError(null);

    const token = authStore.getAccessToken();
    const url = `${WS_BASE}/auctions/${auctionId}/ws${
      token ? `?token=${encodeURIComponent(token)}` : ""
    }`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      // Keep-alive: algunos proxies cortan sockets ociosos.
      pingRef.current = setInterval(() => {
        if (ws.readyState === ws.OPEN) ws.send("ping");
      }, 25_000);
    };

    ws.onmessage = event => {
      if (typeof event.data !== "string" || event.data === "pong") return;
      let msg: AuctionServerMsg;
      try {
        msg = JSON.parse(event.data) as AuctionServerMsg;
      } catch {
        return;
      }
      if (msg.type === "state") setState(msg);
      else if (msg.type === "closed") setClosed(msg);
      else if (msg.type === "error") setError(msg.message);
    };

    const stop = () => {
      setConnected(false);
      if (pingRef.current) clearInterval(pingRef.current);
    };
    ws.onclose = stop;
    ws.onerror = stop;

    return () => {
      if (pingRef.current) clearInterval(pingRef.current);
      wsRef.current = null;
      ws.close();
    };
  }, [auctionId]);

  const sendBid = useCallback((amount: number) => {
    setError(null);
    const ws = wsRef.current;
    if (!ws || ws.readyState !== ws.OPEN) {
      setError("Sin conexión con la subasta");
      return false;
    }
    ws.send(JSON.stringify({ type: "bid", amount }));
    return true;
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { state, closed, connected, error, sendBid, clearError };
}

/** Segundos restantes hasta el deadline (0 si no hay o ya venció). */
export function useCountdown(deadline: number | null): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (deadline === null) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [deadline]);

  if (deadline === null) return 0;
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}
