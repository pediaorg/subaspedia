import { z } from "zod";

// Moneda de una subasta (y de lo que deriva de ella: multas, transacciones,
// etc.). La consigna define que cada subasta es en pesos O dólares, nunca
// bimonetaria. Enum transversal: todo lo que herede la moneda de una subasta
// debe reutilizar este enum.
//
// Vive en su propio módulo (sin dependencias) a propósito: el barrel `index.ts`
// y el submódulo `auction/` lo reutilizan, y tenerlo acá evita un ciclo de
// imports (index -> auction -> index) que rompía la inicialización.
export const currency = z.enum(["ARS", "USD"]);

export type Currency = z.infer<typeof currency>;
