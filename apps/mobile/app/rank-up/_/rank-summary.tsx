import { Check, Info, Star, X } from "lucide-react-native";
import { View } from "react-native";

import { Alert, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";

const CATEGORIES = [
  { name: "Común", enabled: true },
  { name: "Especial", enabled: true },
  { name: "Plata", enabled: true },
  { name: "Oro", enabled: true },
  { name: "Platino", enabled: false },
];

function CategoryItem({ name, enabled }: { name: string; enabled: boolean }) {
  return (
    <View className="flex flex-row items-center gap-1">
      {enabled ? (
        <Check size={18} className="text-green-600" />
      ) : (
        <X size={18} className="text-destructive" />
      )}
      <Text className="text-base">{name}</Text>
    </View>
  );
}

export function RankSummary() {
  return (
    <Card className="bg-card drop-shadow-md/40 border-none">
      <CardContent className="gap-4 pt-1">
        <View className="gap-1">
          <Text className="text-2xl text-left font-bold">Tu categoría</Text>
          <View className="flex flex-row items-center gap-2">
            <Star size={20} className="text-yellow-400 fill-yellow-400" />
            <Text className="text-lg text-left font-bold">ORO</Text>
          </View>
        </View>

        <Separator className="bg-border" />

        <View className="gap-2">
          <Text className="text-2xl text-left font-bold">
            Podés participar en
          </Text>
          <View className="flex flex-row flex-wrap items-center gap-x-4 gap-y-2">
            {CATEGORIES.map(c => (
              <CategoryItem key={c.name} name={c.name} enabled={c.enabled} />
            ))}
          </View>
        </View>

        <Separator className="bg-border" />

        <View className="gap-1">
          <Text className="text-2xl text-left font-bold">
            Cómo mejorar tu categoría
          </Text>
          <View className="flex flex-row items-center justify-between">
            <Text className="text-base font-semibold">
              Medios de pagos registrados: [3/5]
            </Text>
          </View>
          <Text className="text-sm text-primary underline text-center mt-1">
            Ver/Agregar medio de pago
          </Text>
        </View>

        <View className="gap-1">
          <View className="flex flex-row items-center justify-between">
            <Text className="text-base text-left font-semibold">Actividad</Text>
            <Text className="text-sm text-primary underline">
              Ver historial de subastas
            </Text>
          </View>
          <View className="pl-4 gap-0.5">
            <Text className="text-base">• 12 Subastas participadas</Text>
            <Text className="text-base">• 3 Ganadas</Text>
            <Text className="text-base">• $ 450.000 ofertados</Text>
          </View>
        </View>

        <Separator className="bg-border" />

        <View className="bg-muted-foreground drop-shadow-md/40 flex-row items-center gap-2 rounded-lg p-1">
          <Alert
            icon={Info}
            iconClassName="text-primary-foreground"
            className="bg-transparent border-none items-center"
          >
            <AlertTitle className="text-primary-foreground">
              La empresa actualiza tu categoría según tu actividad y diversidad
              de pagos
            </AlertTitle>
          </Alert>
        </View>
      </CardContent>
    </Card>
  );
}
