import { AlertCircle, BadgeCheck, Trash2 } from "lucide-react-native";
// Colores tailwind hardcodeados: el wrapper Icon mapea `text-*` a `style.color`
// pero los íconos de Lucide leen el color por la prop `color`, no por style.
// Si no se pasa explícitamente quedan con el stroke transparente/negro.
const VERIFIED_COLOR = "#15803d"; // green-700
const UNVERIFIED_COLOR = "#d97706"; // amber-600
const TRASH_COLOR = "#4b5563"; // gray-600
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
      {method.verified ? (
        <BadgeCheck size={28} color={VERIFIED_COLOR} />
      ) : (
        <AlertCircle size={28} color={UNVERIFIED_COLOR} />
      )}
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
            <Trash2 size={20} color={TRASH_COLOR} />
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
