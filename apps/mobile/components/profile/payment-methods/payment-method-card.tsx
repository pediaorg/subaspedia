import { AlertCircle, BadgeCheck, Trash2 } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import type { PaymentMethod } from "@subaspedia/types/payment-method";
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

// Deriva título + identificador enmascarado según el tipo. El switch sobre
// `method.type` le da narrowing a TS: dentro de cada case solo existen los
// campos de esa variante (last4 en tarjeta, accountNumber en banco, etc.).
function describe(method: PaymentMethod): { title: string; subtitle: string } {
  switch (method.type) {
    case "bank_account":
      return {
        title:
          method.scope === "local" ? "Cuenta bancaria" : "Cuenta del exterior",
        subtitle: `${method.bankName} · ${maskTail(method.accountNumber)}`,
      };
    case "credit_card":
      return {
        title: method.brand,
        subtitle: `•••• ${method.last4}`,
      };
    case "certified_check":
      return {
        title: "Cheque certificado",
        subtitle: `${method.bankName} · N° ${method.checkNumber}`,
      };
  }
}

// Deja a la vista solo los últimos 4 dígitos de un identificador largo (CBU/IBAN).
function maskTail(value: string): string {
  return `•••• ${value.slice(-4)}`;
}

export default function PaymentMethodCard({
  method,
  onDelete,
}: PaymentMethodCardProps) {
  const { title, subtitle } = describe(method);

  return (
    <Card className="flex-row items-center gap-3 border-0 rounded-2xl bg-[#C9CDD1] px-4 py-3 drop-shadow-2xl/10">
      <Icon
        as={method.verified ? BadgeCheck : AlertCircle}
        size={28}
        className={method.verified ? "text-green-700" : "text-amber-600"}
      />
      <View className="flex-1 flex-col gap-0.5">
        <Text className="font-bold text-sm text-gray-800" numberOfLines={1}>
          {title}
        </Text>
        <Text className="text-xs text-gray-600" numberOfLines={1}>
          {subtitle}
        </Text>
        <Text className="text-xs text-gray-500" numberOfLines={1}>
          {method.holderName}
          {!method.verified && " · sin verificar"}
        </Text>
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
