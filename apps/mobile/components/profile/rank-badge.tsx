import { useId } from "react";
import { Text, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

import type { UserCategory } from "@subaspedia/types/user";

type BadgeProps = { category: UserCategory };

// Gradiente metálico por rango, en coordenadas del viewBox 0 0 120 120
// (userSpaceOnUse), idénticas a los SVG de diseño. Se renderiza inline (no como
// .svg importado) para poder usar un id de gradiente único por instancia con
// useId: react-native-svg pierde el relleno de gradientes con id fijo al
// desmontar/remontar la pantalla (navegar y volver). "common" no tiene relleno.
type Gradient = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stops: { offset: number; color: string }[];
};

const TIER: Record<UserCategory, { label: string; fill: Gradient | null }> = {
  common: { label: "COMUN", fill: null },
  special: {
    label: "ESPECIAL",
    fill: {
      x1: 19,
      y1: 17,
      x2: 102,
      y2: 120,
      stops: [
        { offset: 0, color: "#B6947E" },
        { offset: 0.2, color: "#8F6959" },
        { offset: 0.475, color: "#F8DAC8" },
        { offset: 0.67, color: "#AC836E" },
        { offset: 0.83, color: "#B6947E" },
        { offset: 1, color: "#F8DCCB" },
      ],
    },
  },
  silver: {
    label: "PLATA",
    fill: {
      x1: 3,
      y1: 2.5,
      x2: 113.5,
      y2: 125,
      stops: [
        { offset: 0, color: "#7A96AC" },
        { offset: 0.18, color: "#EAEFF3" },
        { offset: 0.315, color: "#C2D4E1" },
        { offset: 0.491919, color: "#FFFFFF" },
        { offset: 0.615, color: "#D4DEE5" },
        { offset: 0.785, color: "#ABBDC8" },
        { offset: 0.955, color: "#BCCAD7" },
      ],
    },
  },
  gold: {
    label: "ORO",
    fill: {
      x1: 89.5,
      y1: 0,
      x2: 20,
      y2: 120,
      stops: [
        { offset: 0, color: "#FDE7BB" },
        { offset: 0.2, color: "#9E6D38" },
        { offset: 0.503116, color: "#E9B86E" },
        { offset: 0.66, color: "#9D6933" },
        { offset: 0.83, color: "#FEE9BF" },
        { offset: 1, color: "#683E23" },
      ],
    },
  },
  platinum: {
    label: "PLATINO",
    fill: {
      x1: 96.5,
      y1: 5,
      x2: 5,
      y2: 120,
      stops: [
        { offset: 0, color: "#FDFFFE" },
        { offset: 0.23, color: "#7ABBAC" },
        { offset: 0.39, color: "#B1FFEF" },
        { offset: 0.535, color: "#8AD2C3" },
        { offset: 0.745, color: "#CFFEF4" },
        { offset: 0.915, color: "#6CA196" },
        { offset: 1, color: "#35544E" },
      ],
    },
  },
};

export default function RankBadge({ category }: BadgeProps) {
  const { label, fill } = TIER[category];
  // useId trae ":" (inválido en ids SVG / url(#...)); lo limpiamos.
  const gradientId = `rankGrad${useId().replace(/:/g, "")}`;

  return (
    <View
      className={`self-start relative mt-1.5 h-5 w-24 items-center justify-center overflow-hidden rounded-full ${
        fill ? "" : "border border-black"
      }`}
    >
      {fill && (
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 120 120"
          preserveAspectRatio="none"
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <Defs>
            <LinearGradient
              id={gradientId}
              x1={fill.x1}
              y1={fill.y1}
              x2={fill.x2}
              y2={fill.y2}
              gradientUnits="userSpaceOnUse"
            >
              {fill.stops.map(s => (
                <Stop key={s.offset} offset={s.offset} stopColor={s.color} />
              ))}
            </LinearGradient>
          </Defs>
          <Rect width={120} height={120} fill={`url(#${gradientId})`} />
        </Svg>
      )}
      <Text
        className={`font-bold uppercase text-xs ${fill ? "text-white" : "text-black"}`}
        // Texto blanco con contorno negro para que se lea sobre el gradiente
        // metálico (RN no soporta text-stroke; usamos textShadow). En "common"
        // (sin fondo) va negro y sin sombra.
        style={
          fill
            ? {
                textShadowColor: "#000",
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 2,
              }
            : undefined
        }
      >
        {label}
      </Text>
    </View>
  );
}
