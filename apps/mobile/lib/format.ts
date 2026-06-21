import type { Currency } from "@subaspedia/types";

// Formato de dinero por moneda (pesos/dólares; la consigna prohíbe bimonetario).
// Único lugar donde se formatea un monto en la app. Lo comparte todo lo que
// herede `currency` de una subasta (detalle de subasta, y a futuro multas /
// transacciones).
const formatters: Record<Currency, Intl.NumberFormat> = {
  ARS: new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }),
  USD: new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }),
};

export function formatMoney(amount: number, currency: Currency): string {
  return formatters[currency].format(amount);
}
