import { AlertCircle, BadgeCheck, Trash2 } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import {
  PAYMENT_METHOD_TYPE_LABELS,
  type PaymentMethod,
} from "@subaspedia/types/payment-method";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";

type PaymentMethodCardProps = {
  method: PaymentMethod;
  onDelete: (id: number) => void;
};

// La DB guarda el detalle ya enmascarado en `details` (no campos por tipo), así
// que la card muestra el label del tipo como título y ese texto como subtítulo.
function typeLabel(type: PaymentMethod["type"]): string {
  return PAYMENT_METHOD_TYPE_LABELS.find(t => t.value === type)?.label ?? type;
}

export default function PaymentMethodCard({
  method,
  onDelete,
}: PaymentMethodCardProps) {
  return (
    <Card className="flex-row items-center gap-3 border-0 rounded-2xl bg-white px-4 py-3 drop-shadow-md/20">
      <Icon
        as={method.verified ? BadgeCheck : AlertCircle}
        size={28}
        className={method.verified ? "text-green-700" : "text-amber-600"}
      />
      <View className="flex-1 flex-col gap-0.5">
        <Text className="font-bold text-sm text-gray-800" numberOfLines={1}>
          {typeLabel(method.type)}
        </Text>
        <Text className="text-xs text-gray-600" numberOfLines={1}>
          {method.details}
        </Text>
        {!method.verified && (
          <Text className="text-xs text-gray-500" numberOfLines={1}>
            sin verificar
          </Text>
        )}
      </View>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Eliminar medio de pago"
            className="active:opacity-60 p-1"
          >
            <Icon as={Trash2} size={20} className="text-gray-600" />
          </Pressable>
        </AlertDialogTrigger>
        <AlertDialogContent
          className="bg-primary-foreground"
          overlayClassName="backdrop-blur-md bg-black/30"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este medio de pago?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Text>Cancelar</Text>
            </AlertDialogCancel>
            <AlertDialogAction onPress={() => onDelete(method.id)}>
              <Text className="font-bold text-white">Eliminar</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
