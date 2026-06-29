import { Link } from "expo-router";
import { Check, Info, Star, X } from "lucide-react-native";
import { ActivityIndicator, Pressable, View } from "react-native";

import { USER_CATEGORIES, type UserCategory } from "@subaspedia/types/user";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import { api } from "@/lib/api";

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

function CategoryItem({ name, enabled }: { name: string; enabled: boolean }) {
  return (
    <View className="flex flex-row items-center gap-1">
      {enabled ? (
        <Check size={18} color="#16a34a" />
      ) : (
        <X size={18} color="#dc2626" />
      )}
      <Text className="text-base">{name}</Text>
    </View>
  );
}

// Un client puede participar en subastas de su categoría y todas las inferiores.
// USER_CATEGORIES está ordenado de menor a mayor (común -> platino), así que
// habilitamos hasta el índice de su categoría inclusive.
function participableCategories(category: UserCategory | null) {
  const ownIndex = category
    ? USER_CATEGORIES.findIndex(c => c.value === category)
    : -1;
  return USER_CATEGORIES.map((c, i) => ({
    name: c.label,
    enabled: i <= ownIndex,
  }));
}

export function RankSummary() {
  const { data, isLoading, isError } = api.user.rankSummary.useQuery();

  if (isLoading) {
    return (
      <Card className="bg-card drop-shadow-md/40 border-none">
        <CardContent className="items-center py-8">
          <ActivityIndicator />
        </CardContent>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card className="bg-card drop-shadow-md/40 border-none">
        <CardContent className="py-8">
          <Text className="text-center text-destructive">
            No pudimos cargar tu rango. Intentá de nuevo más tarde.
          </Text>
        </CardContent>
      </Card>
    );
  }

  const categoryLabel =
    USER_CATEGORIES.find(c => c.value === data.category)?.label ??
    "Sin asignar";
  const categories = participableCategories(data.category);

  return (
    <Card className="bg-card drop-shadow-md/40 border-none">
      <CardContent className="gap-4 pt-1">
        <View className="gap-1">
          <Text className="text-2xl text-left font-bold">Tu categoría</Text>
          <View className="flex flex-row items-center gap-2">
            <Star size={20} className="text-yellow-400 fill-yellow-400" />
            <Text className="text-lg text-left font-bold uppercase">
              {categoryLabel}
            </Text>
          </View>
        </View>

        <Separator className="bg-border" />

        <View className="gap-2">
          <Text className="text-2xl text-left font-bold">
            Podés participar en
          </Text>
          <View className="flex flex-row flex-wrap items-center gap-x-4 gap-y-2">
            {categories.map(c => (
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
              Medios de pagos registrados: [{data.paymentMethods.count}/
              {data.paymentMethods.max}]
            </Text>
          </View>
          <Link href="/profile/payment-methods" asChild>
            <Pressable className="active:opacity-60">
              <Text className="text-sm text-primary underline text-center mt-1">
                Ver/Agregar medio de pago
              </Text>
            </Pressable>
          </Link>
        </View>

        <View className="gap-1">
          <View className="flex flex-row items-center justify-between">
            <Text className="text-base text-left font-semibold">Actividad</Text>
            <Link href="/profile/stats" asChild>
              <Pressable className="active:opacity-60">
                <Text className="text-sm text-primary underline">
                  Ver historial de subastas
                </Text>
              </Pressable>
            </Link>
          </View>
          <View className="pl-4 gap-0.5">
            <Text className="text-base">
              • {data.activity.participated} Subastas participadas
            </Text>
            <Text className="text-base">• {data.activity.won} Ganadas</Text>
            <Text className="text-base">
              • {currencyFormatter.format(data.activity.totalBid)} ofertados
            </Text>
          </View>
        </View>

        <Separator className="bg-border" />

        <View className="bg-warning flex-row items-center gap-3 rounded-lg p-3">
          <Info size={20} color="#ffffff" />
          <Text className="text-white flex-1 text-sm">
            La empresa actualiza tu categoría según tu actividad y diversidad de
            pagos
          </Text>
        </View>
      </CardContent>
    </Card>
  );
}
