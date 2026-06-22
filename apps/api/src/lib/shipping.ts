// Costo de envío fijo por moneda. La consigna no define un cálculo: se fija un
// monto redondo que hereda la moneda de la subasta (las de USD se cobran en
// USD). Source of truth del back, compartido entre el detalle de la transacción
// (user.ts) y el mail de obra ganada (durable-objects/auction.ts): el importe
// informado al ganar ya incluye el envío (default), y la factura lo recalcula
// si después el comprador elige retiro.
export const SHIPPING_COST = { ARS: 23000, USD: 25 } as const;
