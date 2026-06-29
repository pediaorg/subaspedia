import { useId } from "react";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";

import type { UserCategory } from "@subaspedia/types/user";

import { RANK_GRADIENTS } from "./rank-badge";

type Props = {
  category: UserCategory;
  size?: number;
};

// Path de la estrella de 5 puntas en un viewBox de 24x24 (mismo que Lucide).
const STAR_PATH =
  "M12 2L14.39 8.26L21 9.27L16 14.14L17.18 21L12 17.77L6.82 21L8 14.14L3 9.27L9.61 8.26L12 2Z";

// "common" se muestra como contorno: sin relleno, borde negro (mismo criterio
// que el RankBadge, que para common queda sin gradiente con borde).
const COMMON_STROKE = "#000";

/**
 * Estrella SVG rellena con el mismo gradiente metálico que usa RankBadge para
 * la categoría dada. El viewBox de la estrella es 24x24, pero las coordenadas
 * del gradiente (RANK_GRADIENTS) están definidas en 120x120; las mapeamos con
 * un Svg interno para no duplicar las definiciones de color.
 */
export default function RankStar({ category, size = 20 }: Props) {
  const { fill } = RANK_GRADIENTS[category];
  // useId trae ":" (inválido en ids SVG / url(#...)); lo limpiamos.
  const gradientId = `rankStarGrad${useId().replace(/:/g, "")}`;

  if (!fill) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path
          d={STAR_PATH}
          fill="none"
          stroke={COMMON_STROKE}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Defs>
        {/* Mismas coordenadas del badge (viewBox 120x120). Como acá el viewBox
            es 24x24, usamos gradientUnits="objectBoundingBox" no es opción; en
            cambio reescalamos los puntos del gradiente al rango 0-24. */}
        <LinearGradient
          id={gradientId}
          x1={(fill.x1 / 120) * 24}
          y1={(fill.y1 / 120) * 24}
          x2={(fill.x2 / 120) * 24}
          y2={(fill.y2 / 120) * 24}
          gradientUnits="userSpaceOnUse"
        >
          {fill.stops.map(s => (
            <Stop key={s.offset} offset={s.offset} stopColor={s.color} />
          ))}
        </LinearGradient>
      </Defs>
      <Path
        d={STAR_PATH}
        fill={`url(#${gradientId})`}
        stroke="#000"
        strokeWidth={0.5}
      />
    </Svg>
  );
}
