import * as Burnt from "burnt";
import { useEffect, useRef } from "react";

import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";

// Polleo cada 30s: cuando aparece una notificación con id mayor al último
// visto, levantamos un toast. El primer fetch fija el "último visto" sin
// disparar nada (para no spamear toasts al abrir la app con notis viejas).
const POLL_MS = 30_000;

export function NotificationToaster() {
  const auth = useAuth();
  const lastSeenId = useRef<number | null>(null);

  const { data } = api.notifications.list.useQuery(undefined, {
    enabled: auth.isAuthed,
    refetchInterval: auth.isAuthed ? POLL_MS : false,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  useEffect(() => {
    if (!auth.isAuthed) {
      lastSeenId.current = null;
      return;
    }
    if (!data) return;

    const maxId = data[0]?.id ?? 0;
    if (lastSeenId.current === null) {
      lastSeenId.current = maxId;
      return;
    }
    if (maxId <= lastSeenId.current) return;

    const fresh = data.filter(n => n.id > (lastSeenId.current ?? 0));
    lastSeenId.current = maxId;

    // Si llegaron varias, mostramos solo la última (más nueva) para no apilar
    // toasts. La pantalla /notifications muestra todo el detalle.
    const latest = fresh[0];
    if (latest)
      Burnt.toast({
        title: latest.title,
        message: latest.body,
        preset: "none",
        duration: 4,
      });
  }, [auth.isAuthed, data]);

  return null;
}
