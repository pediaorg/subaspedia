import * as Burnt from "burnt";
import { useEffect } from "react";

let shown = false;

export function RequireRank() {
  useEffect(() => {
    if (shown) return;
    shown = true;
    Burnt.toast({
      title: "Cuenta en revisión",
      message:
        "Estamos verificando tus datos. Por ahora solo podés ver los catálogos públicos. Cuando se te asigne una categoría vas a poder ver los precios base, acceder al streaming y entrar a las subastas de tu nivel.",
      duration: Number.POSITIVE_INFINITY,
    });
    return () => {
      shown = false;
    };
  }, []);

  return null;
}
