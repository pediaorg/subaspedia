import * as Burnt from "burnt";
import { useEffect } from "react";

let shown = false;

export function RequirePaymentMethod() {
  useEffect(() => {
    if (shown) return;
    shown = true;
    Burnt.toast({
      title: "Medio de pago requerido",
      message:
        "Podés ver los catálogos con precios, entrar a las subastas de tu categoría y seguir el streaming. Para pujar necesitás cargar un medio de pago (tarjeta, cuenta bancaria o cheque certificado) y que lo validemos.",
      duration: Number.POSITIVE_INFINITY,
    });
    return () => {
      shown = false;
    };
  }, []);

  return null;
}
