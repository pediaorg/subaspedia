import type { Currency } from "@subaspedia/types";

// Formato de dinero por moneda (pesos/dólares; la consigna prohíbe bimonetario).
// Único lugar donde se formatea un monto en la app. Lo comparten multas y
// transacciones (y a futuro cualquier importe que herede `currency`).
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
